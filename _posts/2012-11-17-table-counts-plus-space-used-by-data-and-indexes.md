---
layout: post
date:   2012-11-17
title:  "Table Counts plus Space Used by Data and Indexes"
permalink: ./blog/index.php/2012/11/table-counts-plus-space-used-by-data-and-indexes/
categories: blog
published: true
tags: [Database Documentation, Backup and Recovery, Database Administration, Database Documentation, Virtualization, Database Migration, Data Maintenance, Development, DMV, Indexes, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, Storage, Upgrade]
comments: false
---
I was recently reviewing some of the [Dynamic Management Views (DMVs)](http://msdn.microsoft.com/en-us/library/ms188754.aspx "Dynamic Management Views and Functions (Transact-SQL)") available since SQL Server 2005 and came across the interesting and useful [sys.dm_db_partition_stats](http://msdn.microsoft.com/en-us/library/ms187737.aspx "sys.dm\_db\_partition\_stats (Transact-SQL)") DMV.  The documentation states that this DMV will return _“page and row-count information for every partition in the current database”_.  In the [Space Used by Filegroup and Log Space Used](./blog/index.php/2011/10/space-used-by-filegroup-and-log-space-used/ "Space Used by Filegroup and Log Space Used") post I had already mentioned how using the [sys.allocation_units](http://msdn.microsoft.com/en-us/library/ms189792.aspx "sys.allocation\_units (Transact-SQL)") and [sys.data\_spaces](http://msdn.microsoft.com/en-us/library/ms190289.aspx "sys.data_spaces (Transact-SQL)") DMVs and the [DBCC SQLPERF(LOGSPACE)](http://msdn.microsoft.com/en-us/library/ms189768.aspx "DBCC SQLPERF (Transact-SQL)") command you can obtain some very useful information.  Using the [sys.dm_db_partition_stats](http://msdn.microsoft.com/en-us/library/ms187737.aspx "sys.dm\_db\_partition_stats (Transact-SQL)") DMV you can capture the same information, but for each table and index structure.

The query shown below will return information about user objects (object\_id > 100), limiting this information to tables only (i.e. [Heap](http://msdn.microsoft.com/en-us/library/ms188270.aspx "Heap Structures") and [Clustered Indexes](msdn.microsoft.com/en-us/library/ms177443.aspx "Clustered Index Structures")).  The actual object name is retrieved by creating INNER JOINs with the [sys.tables](http://msdn.microsoft.com/en-us/library/ms187406.aspx "sys.tables (Transact-SQL)") and [sys.indexes](http://msdn.microsoft.com/en-us/library/ms173760.aspx "sys.indexes (Transact-SQL)") DMVs.  You will observe that in the case of a Heap the value of the _name_ column (i.e. where _index\_id = 0_) is NULL, which in the result set is replaced by an empty string.  On the other hand, when the result set includes a row for _index_id = 1_ this means that the table contains a Clustered index.  But you can read more about the topic in the MSDN article [Table and Index Organization](http://msdn.microsoft.com/en-us/library/ms189051.aspx "Table and Index Organization").

``` sql
SELECT
    t.name as table_name, ISNULL(i.name, '') as index_name,
    i.index_id, i.type_desc, ps.row_count, ps.used_page_count,
    ps.in_row_used_page_count, ps.lob_used_page_count,
    ps.row_overflow_used_page_count
FROM sys.dm_db_partition_stats ps
    INNER JOIN sys.tables t ON t.object_id = ps.object_id
    INNER JOIN sys.indexes i ON i.object_id = ps.object_id
        AND i.index_id = ps.index_id
WHERE ps.object_id > 100
AND i.type_desc IN ('CLUSTERED', 'HEAP')
ORDER BY t.name, i.index_id;
```

If you want to return information about [NonClustered Indexes](http://msdn.microsoft.com/en-us/library/ms177484.aspx "Nonclustered Index Structures") just replace the filter with the one below:

``` sql
AND i.type_desc = 'NONCLUSTERED'
```

The values returned by the _used\_page\_count_, _in\_row\_used\_page\_count_, _lob\_used\_page\_count_, _row\_overflow\_used\_page\_count_ columns indicate the number of pages.  A quick reminder; [the size for each page in SQL Server is 8KB](http://msdn.microsoft.com/en-us/library/cc280360.aspx "Pages and Extents Architecture") so in order to obtain the actual sizes you’d have to modify the query as shown in the next sample.

``` sql
SELECT
    t.name as table_name, ISNULL(i.name, '') as index_name,
    i.index_id, i.type_desc, ps.row_count,
    ((ps.used_page_count* 8)/1024) AS [used_page_count_MB],
    ((ps.in_row_used_page_count * 8)/1024) AS [in_row_used_page_count_MB],
    ((ps.lob_used_page_count * 8)/1024) AS [lob_used_page_count_MB],
    ((ps.row_overflow_used_page_count * 8)/1024) AS [row_overflow_used_page_count_MB]
FROM sys.dm_db_partition_stats ps
    INNER JOIN sys.tables t ON t.object_id = ps.object_id
    INNER JOIN sys.indexes i ON i.object_id = ps.object_id
        AND i.index_id = ps.index_id
WHERE ps.object_id > 100
AND i.type_desc IN ('CLUSTERED', 'HEAP')
ORDER BY t.name, i.index_id;
```

As you can see, this information can provide an insight into how much data is being stored by each use table structure and the respective indexes.  This, if included in a data collection solution which stores the results in a _DBA Data Warehouse_ (let’s call it that…), over time can show patterns of data growth.  Such information can then be plotted into graphs and, for example, can be use to forecast storage requirements.  A little thing that can help reduce the strain on a DBAs life!
