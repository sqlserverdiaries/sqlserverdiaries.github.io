---
layout: post
date:   2011-09-17
title:  "Persist Index Usage Statistics"
permalink: ./blog/index.php/2011/09/persist-index-usage-statistics/
categories: blog
published: true
tags: [Audit, Database Administration, Database Documentation, Performance, Code Samples, Data Maintenance, Indexes, SQL Injection, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server Agent]
comments: false
---
During a database/application performance investigation we wanted to check which indexes were being used. The database had almost 1,200 indexes (!!) most of which we believed were redundant or partly causing a performance overhead. A quick review of the indexes showed that most were created on one column and only a few covered more than two columns. Moreover, the implementation was not making use of the new indexing features of SQL Server 2005 and later, namely the [Index with Included Columns](http://msdn.microsoft.com/en-us/library/ms190806.aspx).

Back to out requirement which was to know which indexes were being used (and which were not). I remembered reading an article in the MSSQLTips website titled [Retaining historical index usage statistics for SQL Server](http://www.mssqltips.com/tip.asp?tip=1749) and which I thought was going to be a copy &amp; paste implementation – unfortunately it was not but it was an excellent starting point for my solution.

The article [Retaining historical index usage statistics for SQL Server](http://www.mssqltips.com/tip.asp?tip=1749) is made up of three parts but all I needed was part one. We already had an Administrative Database which holds various database objects forming our DBA Toolbox, so all we had to start with was create a new table to persist results from the [sys.dm_db_index_usage_stats (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms188755.aspx) DMV. Unlike the scripts in the article in our solution we renamed the columns as well as reducing the number of columns being persisted. Like the script examples our persisted table would be extended to hold results from the Last Poll.

The first thing we did was create a SCHEMA as an object container.

``` sql
CREATE SCHEMA [SQLMONITOR];
```

The table schema for the persisted results is shown below:

``` sql
CREATE TABLE [SQLMONITOR].[tb_indexusagestats] (
    [ius_DatabaseID] smallint NOT NULL
    ,[ius_DatabaseName] nvarchar(128) NOT NULL
    ,[ius_ObjectID] int NOT NULL
    ,[ius_ObjectName] nvarchar(128) NOT NULL
    ,[ius_IndexID] int NOT NULL
    ,[ius_IndexName] nvarchar(128) NULL
    ,[ius_IndexType] nvarchar(60) NOT NULL
    ,[ius_UserSeeks] bigint NOT NULL DEFAULT (0)
    ,[ius_UserScans] bigint NOT NULL DEFAULT (0)
    ,[ius_UserBookmarkLookups] bigint NOT NULL DEFAULT (0)
    ,[ius_UserUpdates] bigint NULL DEFAULT (0)
    ,[ius_LastUserSeek] datetime NULL
    ,[ius_LastUserScan] datetime NULL
    ,[ius_LastUserBookmarkLookup] datetime NULL
    ,[ius_LastUserUpdate] datetime NULL
    ,[ius_LastPollUserSeeks] bigint NOT NULL DEFAULT (0)
    ,[ius_LastPollUserScans] bigint NOT NULL DEFAULT (0)
    ,[ius_LastPollUserBookmarkLookups] bigint NOT NULL DEFAULT (0)
    ,[ius_LastPollUserUpdates] bigint NULL DEFAULT (0)
    ,[ius_LastPollDate] datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    ,[ius_DateCreated] datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    ,[ius_DateDeleted] datetime NULL
);
```

Like the code example provided by the MSSQLTips website, we created a stored procedure which we planned would be executed on a regular basis using an SQL Agent Scheduled Job. But that would be the final step of this implementation.

What the MSSQLTips article does not cater for are what we consider three very important actions:

1. Situations where the table is dropped and recreated using the same object name and index names;
2. Indexes created since the last polling date/time;
3. Indexes deleted since the last polling date/time.

What we identified as another shortcoming of the MSSQLTips solution was that it captures usage statistics for all indexes in all databases. We wanted that the monitoring to be as flexible so we included a _@databasename_ input parameter to our stored procedure.

``` sql
CREATE PROCEDURE [SQLMONITOR].usp_persist_index_usage_stats
    @databasename nvarchar(128)
AS
SET NOCOUNT ON
```

To cater for the three points mentioned above we had to find a way to obtain the object ID’s and also resolve the object names for the database being monitored. This was only possible by querying the monitored database, which would either entail hard-coding the name of the monitored database and having a code version for each database, or else using dynamic SQL. I am one and against using dynamic SQL unless the necessary precautions have been taken. In our case the stored procedure would not be accessed by interfaces other than an SQL Agent Job, and where security was relatively tight. In any case, the first step was to check that the database did exist in the instance and, if not, raise an error and stop execution.

``` sql
IF NOT EXISTS (SELECT [name] FROM sys.databases WHERE [name] = @databasename)
BEGIN
    RAISERROR('Could not locate entry in sysdatabases for database ''%s''.
        No entry found with that name. Make sure that the name is entered correctly.',
        16, 1, @databasename);
    RETURN -1
END
```

The next step was to update index ID’s for situations where a table was dropped and recreated with the same name and indexes since the last polling time but SQL Server assigned a different object_id.

``` sql
SET @cmd = 'UPDATE ius
SET ius.[ius_ObjectID] = i.[object_id],
    ius.[ius_IndexID] = i.[index_id],
    ius.[ius_DateDeleted] = NULL
FROM [' + @databasename + '].sys.indexes i
    INNER JOIN [' + @databasename + '].sys.objects o ON o.[object_id] = i.[object_id]
    INNER JOIN [SQLMONITOR].[tb_indexusagestats] ius ON (ius.[ius_ObjectName] = o.[name]
        AND ISNULL(ius.[ius_IndexName], ius.[ius_ObjectName]) = ISNULL(i.[name], o.[name]))
        AND ius.[ius_ObjectID] != i.[object_id]
WHERE ius.[ius_DatabaseID] = DB_ID(''' + @databasename + ''')
AND i.[object_id] &gt; 100 AND o.[type] = ''U'';';
EXEC sp_executesql @cmd;```
Next we checked for indexes created since the last polling time.
``` sqlSET @cmd = 'SELECT
    DB_ID(''' + @databasename + ''')
    ,N''' + @databasename + '''
    ,i.[object_id]
    ,o.[name]
    ,i.[index_id]
    ,i.[name]
    ,i.[type_desc]
    ,0, 0, 0, 0
    ,NULL,NULL,NULL,NULL
    ,0, 0, 0, 0
    ,(SELECT [create_date]-1 FROM sys.databases WHERE [name] = ''tempdb'') -- set the initial date to one day before the tempdb was created
    ,CURRENT_TIMESTAMP,NULL
FROM [' + @databasename + '].sys.indexes i
    INNER JOIN [' + @databasename + '].sys.objects o ON o.[object_id] = i.[object_id]
    LEFT OUTER JOIN [SQLMONITOR].[tb_indexusagestats] ius ON ius.[ius_ObjectID] = i.[object_id]
        AND ius.[ius_IndexID] = i.[index_id]
WHERE i.[object_id] &gt; 100 AND o.[type] = ''U''
AND ius.[ius_ObjectID] IS NULL AND ius.[ius_IndexID] IS NULL
ORDER BY i.[object_id], i.[index_id];';

INSERT INTO [SQLMONITOR].[tb_indexusagestats] (
[ius_DatabaseID], [ius_DatabaseName], [ius_ObjectID], [ius_ObjectName], [ius_IndexID], [ius_IndexName], [ius_IndexType]
,[ius_UserSeeks], [ius_UserScans], [ius_UserBookmarkLookups], [ius_UserUpdates]
,[ius_LastUserSeek], [ius_LastUserScan], [ius_LastUserBookmarkLookup], [ius_LastUserUpdate]
,[ius_LastPollUserSeeks], [ius_LastPollUserScans], [ius_LastPollUserBookmarkLookups], [ius_LastPollUserUpdates]
,[ius_LastPollDate]
,[ius_DateCreated], [ius_DateDeleted]
)
EXEC sp_executesql @cmd;```
Finally we had to handle indexes deleted since the last polling time.
``` sqlSET @cmd = 'UPDATE ius
SET ius.[ius_DateDeleted] = CURRENT_TIMESTAMP
FROM [' + @databasename + '].sys.indexes i
    INNER JOIN [' + @databasename + '].sys.objects o ON o.[object_id] = i.[object_id]
    RIGHT JOIN [SQLMONITOR].[tb_indexusagestats] ius ON (ius.[ius_ObjectName] = o.[name]
        AND ISNULL(ius.[ius_IndexName], ius.[ius_ObjectName]) = ISNULL(i.[name], o.[name]))
        AND ius.[ius_ObjectID] = i.[object_id]
WHERE ius.[ius_DatabaseID] = DB_ID(''' + @databasename + ''')
AND i.[object_id] IS NULL;';
EXEC sp_executesql @cmd;
```

The rest of the stored procedure is very similar to the one downloaded from MSSQLTips. As explained earlier, the stored procedure would be called from an SQL Agent Job on a regular schedule to avoid losing the results from the DMV. The job contained a single stored procedure call as shown below:

``` sql
EXEC [SQLMONITOR].usp_persist_index_usage_stats
    @databasename = N'AdventureWorks';
```

Like the author of the MSSQLTips article, I also encourage you to test this stored procedure with different schedules. In our environment, for the database being monitored we set it to run every two hours which allows for an “acceptable loss” of usage statistics.

The entire script can be [downloaded from here](/assets/article_files/2011/09/persist-index-usage-statistics.zip).
