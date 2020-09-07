---
layout: post
date:   2011-10-22
title:  "Space Used by Filegroup and Log Space Used"
permalink: ./blog/index.php/2011/10/space-used-by-filegroup-and-log-space-used/
categories: blog
published: true
tags: [Architecture, Database Administration, Database Design, Database Documentation, Storage, SQL Server, Code Samples, DMV]
comments: false
---
A couple of scripts I use occasionally help me report the space used by FILEGROUP and the Log Space used are shown below in this article.

This first script queries the [sys.allocation_units (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms189792.aspx) and [sys.data_spaces (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms190289.aspx) dynamic management views (DMV) which contain a row for each allocation unit and filegroups (or data spaces) respectively.   Allocation units and database storage concepts are explained in detail in the SQL Server Books Online in the following articles:

* [Files and Filegroups Architecture](http://msdn.microsoft.com/en-us/library/ms179316.aspx)
* [Understanding Pages and Extents](http://msdn.microsoft.com/en-us/library/ms190969.aspx)
* [Table and Index Organization](http://msdn.microsoft.com/en-us/library/ms189051.aspx)

``` sql
-- space used by filegroup
SELECT
    ds.[data_space_id] AS [FileGroupID]
    ,ds.[name] AS [FileGroup]
    ,(SUM(au.[total_pages])*8)/1024 AS [Reserved (MB)]
    ,(SUM(au.[used_pages])*8)/1024 AS [Used (MB)]
FROM sys.allocation_units au
    INNER JOIN sys.data_spaces ds ON au.[data_space_id] = ds.[data_space_id]
WHERE au.[type] &gt; 0 -- (0 = Dropped)
GROUP BY ds.[data_space_id], ds.[name]
ORDER BY ds.[data_space_id]
```

The next script uses the [DBCC SQLPERF (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms189768.aspx) command to report the transaction log space, then filters the output to limit the results to the current database.

``` sql
-- log file space used
SET NOCOUNT ON;
CREATE TABLE #logspace (
    database_name sysname,
    log_size_mb NUMERIC(15,8),
    log_space_percent NUMERIC(15,8),
    status SMALLINT );
INSERT INTO #logspace EXECUTE('dbcc sqlperf(logspace)');
SELECT * FROM #logspace WHERE database_name = 'AdventureWorks';
DROP TABLE #logspace;
```

I hope you find them useful.
