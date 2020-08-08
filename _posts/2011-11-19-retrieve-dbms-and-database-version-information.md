---
layout: post
date:   2011-11-19
title:  "Retrieve DBMS and Database Version Information"
permalink: ./blog/index.php/2011/11/retrieve-dbms-and-database-version-information/
categories: blog
published: true
tags: [Database Documentation, Database Administration, Database Migration, SQL Server, Upgrade]
comments: false
---
This week I had to issue a report of all the SQL Server versions and a list of databases hosted in each instance. The report was intended to plan the upgrade of a number of systems to the latest supported version of SQL Server.

SQL Server Management Studio (SSMS) lets you classify instances in various ways - one of the methods I use is by version as shown below.

![registered_servers](/assets/article_files/2011/11/registered_servers.jpg)

Besides making it easier to locate a particular instance, using this metheod I immediately have additional information about the version. But how to report this without having to manually re-type the instance names, etc.

This is where a feature introduced in the 2008 version of the SSMS client tools becomes useful. In SSMS, by right-clicking on the folder _Instances By Version_ in my case I can select the _New Query_ option which opens a query window connected to all instances in the folder and sub-folders!

![registered_servers_new_query](/assets/article_files/2011/11/registered_servers_new_query.jpg)

The query window will display the text [multiple instances].

Now I can query all the registered instances at one go.

The actual report required the instance name, the database name, database version, dbms version and the operating system version. The latter can be obtained using the following T-SQL which calls the [xp_msver (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms187372.aspx) extended stored procedure.

``` sql
USE [tempdb]
GO

CREATE TABLE #MSVER (
    [Index] smallint,
    [Name] nvarchar(128),
    [Internal_Value] int,
    [Character_Value] nvarchar(128)
    );

INSERT INTO #MSVER EXEC [master]..xp_msver 'WindowsVersion';

SELECT CASE
        WHEN Character_Value LIKE '5.0%' THEN 'Windows 2000'
        WHEN Character_Value LIKE '5.2%' THEN 'Windows 2003'
        WHEN Character_Value LIKE '6.0%' THEN 'Windows 2008'
        WHEN Character_Value LIKE '6.1%' THEN 'Windows 2008 R2'
    END AS [Windows Version]
FROM #MSVER;

DROP TABLE #MSVER;
```

The next part would require that we integrate the result obtained from the above query with the rest of the columns required to compile the report.

``` sql
USE [tempdb]
GO

CREATE TABLE #MSVER (
    [Index] smallint,
    [Name] nvarchar(128),
    [Internal_Value] int,
    [Character_Value] nvarchar(128)
    );

INSERT INTO #MSVER EXEC [master]..xp_msver 'WindowsVersion';

SELECT
    [name] AS [Database Name],
    (CASE
        WHEN DATABASEPROPERTYEX([name], 'version') < 599 THEN '2000'
        WHEN DATABASEPROPERTYEX([name], 'version') BETWEEN 600 AND 650 THEN '2005'
        WHEN DATABASEPROPERTYEX([name], 'version') > 650 THEN '2008'
    END) AS [Database Version],
    (CASE
        WHEN DATABASEPROPERTYEX('master', 'version') < 599 THEN '2000'
        WHEN DATABASEPROPERTYEX('master', 'version') BETWEEN 600 AND 650 THEN '2005'
        WHEN DATABASEPROPERTYEX('master', 'version') > 650 THEN '2008'
    END) AS [DBMS Version],
    (SELECT CASE
        WHEN Character_Value LIKE '5.0%' THEN 'Windows 2000'
        WHEN Character_Value LIKE '5.2%' THEN 'Windows 2003'
        WHEN Character_Value LIKE '6.0%' THEN 'Windows 2008'
        WHEN Character_Value LIKE '6.1%' THEN 'Windows 2008 R2'
    END
    FROM #MSVER) AS [Windows Version]
FROM [master]..sysdatabases
WHERE [name] NOT IN ('master', 'model', 'msdb', 'tempdb')
AND [name] NOT LIKE 'Report%';

DROP TABLE #MSVER;
```

As you can see I am using the [DATABASEPROPERTYEX (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms186823.aspx) function instead of [DATABASEPROPERTY (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms176049.aspx).  The SQL Server BOL state the following note, marked as important:

> This feature will be removed in the next version of Microsoft SQL Server. Do not use this feature in new development work, and modify applications that currently use this feature as soon as possible. Use DATABASEPROPERTYEX instead.

The same information can be obtained from the [sys.databases (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms178534.aspx) catalog view or the [sysdatabases](http://msdn.microsoft.com/en-us/library/aa260406(v=sql.80).aspx) Compatibility View however since some of the registered servers are SQL Server 2000 instances, the script had to be as version-independent as possible.

The SSMS interface will show that a connection has been opened with n/N servers (where n is the number of servers connected to and N is the number of servers the connection has been attempted).

The final step was to execute the query and copy the results to a text file or spreadsheet.
