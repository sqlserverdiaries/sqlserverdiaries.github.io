---
layout: post
date:   2011-10-29
title:  "Persist Missing Index Information and Usage Statistics"
permalink: ./blog/index.php/2011/10/persist-missing-index-information-and-usage-statistics/
categories: blog
published: true
tags: [Code Samples, Database Administration, Database Design, Architecture, Database Documentation, Development, DMV, Indexes, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2]
comments: false
cover-img: /assets/img/path.jpg
---
In an earlier post I explained how we identified which indexes were being used, and the number of times used over a period of time. We had a good indication of a similar solution in a [MSSQLTips article](http://www.mssqltips.com/sqlservertip/1789/retaining-historical-index-usage-statistics-for-sql-server-part-3-of-3/).

Similarly to the [Persist Index Usage Statistics](./blog/index.php/2011/09/persist-index-usage-statistics/) post we achieved this by using the Dynamic Management Views (DMV) listed in the [SQL Server Books Online - About the Missing Indexes Feature](http://msdn.microsoft.com/en-us/library/ms345524.aspx). The views are:

Dynamic management object | Information returned
------------------------- | ---------------------------
sys.dm_db_missing_index_group_stats | Returns summary information about missing index groups, for example, the performance improvements that could be gained by implementing a specific group of missing indexes.
sys.dm_db_missing_index_groups | Returns information about a specific group of missing indexes, such as the group identifier and the identifiers of all missing indexes that are contained in that group.
sys.dm_db_missing_index_details | Returns detailed information about a missing index; for example, it returns the name and identifier of the table where the index is missing, and the columns and column types that should make up the missing index.
sys.dm_db_missing_index_columns | Returns information about the database table columns that are missing an index.
&nbsp;

Also like the solution implemented in the [Persist Index Usage Statistics](./blog/index.php/2011/09/persist-index-usage-statistics/) article, we had to create a table to store the statistics since the information returned by the DMV’s is cleared every time the SQL Server instance is restarted.  The first step was to identify the columns that we would be capturing and storing, and create a table structure.  Since we were building on the previous solution, the objects were created in the SQLMONITOR schema.

``` sql
CREATE TABLE [SQLMONITOR].[tb_missingindexstats] (
    [mis_DatabaseID] smallint NOT NULL
    ,[mis_DatabaseName] nvarchar(128) NOT NULL
    ,[mis_ObjectID] int NOT NULL
    ,[mis_ObjectName] nvarchar(128) NOT NULL
    ,[mis_EqualityColumns] nvarchar(4000) NULL
    ,[mis_InEqualityColumns] nvarchar(4000) NULL
    ,[mis_IncludedColumns] nvarchar(4000) NULL
    ,[mis_UniqueCompiles] bigint NOT NULL DEFAULT (0)
    ,[mis_UserSeeks] bigint NOT NULL DEFAULT (0)
    ,[mis_UserScans] bigint NOT NULL DEFAULT (0)
    ,[mis_LastUserSeek] datetime NULL
    ,[mis_LastUserScan] datetime NULL
    ,[mis_AvgTotalUserCost] float NOT NULL
    ,[mis_AvgUserImpact] float NOT NULL
    ,[mis_LastPollUniqueCompiles] bigint NOT NULL DEFAULT (0)
    ,[mis_LastPollUserSeeks] bigint NOT NULL DEFAULT (0)
    ,[mis_LastPollUserScans] bigint NOT NULL DEFAULT (0)
    ,[mis_LastPollDate] datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    ,[mis_DateCreated] datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    ,[mis_RecordChecksum] int NOT NULL
);
```

The entire script was encapsulated in a stored procedure which accepts the database name as a single input parameter as shown below.

``` sql
CREATE PROCEDURE [SQLMONITOR].usp_persist_missing_index_stats
    @databasename nvarchar(128)
AS
SET NOCOUNT ON
```

The first basic check was to verify that the database did exist in the instance and if not, raise an error and stop.

``` sql
IF NOT EXISTS (SELECT [name] FROM sys.databases WHERE [name] = @databasename)
BEGIN
    RAISERROR('Could not locate entry in sysdatabases for database ''%s''.
        No entry found with that name. Make sure that the name is entered
        correctly.', 16, 1, @databasename);
    RETURN -1
END
```

The next step was to update index ID’s for situations where a table was dropped and recreated with the same name and indexes since the last polling time but SQL Server assigned a different object_id.

``` sql
SET @cmd = 'UPDATE ius
    SET ius.[mis_ObjectID] = o.[object_id]
FROM [' + @databasename + '].sys.objects o
    INNER JOIN [SQLMONITOR].[tb_missingindexstats] ius
    ON ius.[mis_ObjectName] = o.[name] AND ius.[mis_ObjectID] != o.[object_id]
WHERE ius.[mis_DatabaseID] = DB_ID(''' + @databasename + ''')
AND o.[type] = ''U'';';
EXEC sp_executesql @cmd;
```

The next step is to check whether any missing indexes were identified since the last polling date. Since unlike the Persist Index Usage Statistics article we do not have a value for the index_id (because the index has not been created) we had to find a way to identify records without having to perform string comparisons. Our solution uses the built-in [CHECKSUM (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms189788.aspx) function to store a value in the mis_RecordChecksum column and compare the value stored with the checksum for the new values. For more information about the CHECKSUM function please refer to the SQL Server Books Online. Reading the online help you will find that SQL Server has other built-in function such as the [HASHBYTES (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms174415.aspx) function however the CHECKSUM function satisfied our requirements perfectly and with little overhead.

``` sql
SET @cmd = '
SELECT d.[database_id]
    ,''' + @databasename + '''
    ,d.[object_id]
    ,OBJECT_NAME(d.[object_id], d.[database_id])
    ,d.[equality_columns]
    ,d.[inequality_columns]
    ,d.[included_columns]
    ,s.[unique_compiles]
    ,s.[user_seeks]
    ,s.[user_scans]
    ,s.[last_user_seek]
    ,s.[last_user_scan]
    ,s.[avg_total_user_cost]
    ,s.[avg_user_impact]
    ,s.[unique_compiles]
    ,s.[user_seeks]
    ,s.[user_scans]
    ,CURRENT_TIMESTAMP
    ,CURRENT_TIMESTAMP
    ,CHECKSUM(OBJECT_NAME(d.[object_id], d.[database_id])
        ,d.[equality_columns]
        ,d.[inequality_columns]
        ,d.[included_columns]
        )
FROM sys.dm_db_missing_index_groups g
    INNER JOIN sys.dm_db_missing_index_details d
        ON d.index_handle = g.index_handle
    INNER JOIN sys.dm_db_missing_index_group_stats s
        ON s.group_handle = g.index_group_handle
    LEFT OUTER JOIN [SQLMONITOR].[tb_missingindexstats] ius
        ON [mis_RecordChecksum] =
        CHECKSUM(OBJECT_NAME(d.[object_id], d.[database_id])
            ,d.[equality_columns]
            ,d.[inequality_columns]
            ,d.[included_columns]
        )
WHERE d.database_id = DB_ID(''' + @databasename + ''')
AND ius.[mis_DatabaseID] IS NULL;';

INSERT INTO [SQLMONITOR].[tb_missingindexstats] (
    [mis_DatabaseID],[mis_DatabaseName],[mis_ObjectID],[mis_ObjectName],
    [mis_EqualityColumns],[mis_InEqualityColumns],[mis_IncludedColumns],
    [mis_UniqueCompiles],[mis_UserSeeks],[mis_UserScans],[mis_LastUserSeek],
    [mis_LastUserScan],[mis_AvgTotalUserCost],[mis_AvgUserImpact],
    [mis_LastPollUniqueCompiles],[mis_LastPollUserSeeks],[mis_LastPollUserScans],
    [mis_LastPollDate],[mis_DateCreated],[mis_RecordChecksum]
    )
EXEC sp_executesql @cmd;
```

Checking for indexes which were deleted was not necessary since at this point, the information gathered is for indexes that are being suggested by the SQL Server query optimiser.

The rest of the script compares the last polling date with the date when the SQL Server instance was started and updates the base table accordingly.

The stored procedure created for this solution can be called at regular intervals from an SQL Agent scheduled job to persist the results of the DMV. The job will contain (at least) one step to execute the following T-SQL query:

``` sql
EXEC [SQLMONITOR].usp_persist_missing_index_stats
    @databasename = N'AdventureWorks';
```

I encourage you to test this stored procedure with different schedules. In our environment, for the database being monitored we set it to run every two hours which allows for an “acceptable loss” of missing index and usage statistics. Once enough data is captured you can test the effect of the missing indexes on your database and application(s).

The information in the following article should be taken into consideration when reviewing the results of this data capture: [Limitations of the Missing Indexes Feature](http://msdn.microsoft.com/en-us/library/ms345485.aspx).

The entire script can be [downloaded here](\assets/article_files/2011-10-persist-missing-index-information-and-usage-statistics/persist-missing-index-information-and-usage-statistics.zip).
