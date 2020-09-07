---
layout: post
date:   2012-10-27
title:  "One Difference between DBCC DBREINDEC and ALTER INDEX"
permalink: ./blog/index.php/2012/10/one-difference-between-dbcc-dbreindec-and-alter-index/
categories: blog
published: true
tags: [Performance, Code Samples, Coding Practices, Data Maintenance, Indexes, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, Upgrade, Database Administration]
comments: false
---
I was recently discussing with one of my peers the fact that following a periodical reindexing/index rebuild, the overall database performance was better when the old syntax was executed. To put you in the picture, until the SQL Server 2000 version, index fragmentation was handled using the [DBCC DBREINDEX](http://msdn.microsoft.com/en-us/library/ms181671.aspx "DBCC DBREINDEX (Transact-SQL)") and [DBCC INDEXDEFRAG](http://msdn.microsoft.com/en-us/library/ms177571.aspx "DBCC INDEXDEFRAG (Transact-SQL)") commands. Since SQL Server 2005 the new [ALTER INDEX](http://msdn.microsoft.com/en-us/library/ms188388.aspx "ALTER INDEX (Transact-SQL)") syntax was introduced and Microsoft have been notifying all users of the SQL Server Books Online that the old command will be deprecated in a future version; at the same time Microsoft have been recommending that any code containing the old syntax is updated accordingly. Migrating to use the new syntax also involves changes to the code-parts checking which indexes are fragmented. Before SQL Server 2005 this was done by inserting the output of the [DBCC SHOWCONTIG](http://msdn.microsoft.com/en-us/library/ms175008.aspx "DBCC SHOWCONTIG (Transact-SQL)") command into a temporary table, then executing the DBCC DBREINDEX command for those user object indexes whose fragmentation is more than a specific threshold (e.g. 5% or 10%). A sample of such code is shown below:

``` sql
-- Do the showcontig of all indexes of all tables
SET @cmd = 'USE [' + @Database + ']; DBCC SHOWCONTIG WITH FAST, TABLERESULTS, ALL_INDEXES, NO_INFOMSGS';
INSERT INTO #fragmentationinfo
    EXEC (@cmd);

SET @cmd = 'USE ' + QUOTENAME(@Database, '[') + '; ' +
    'SELECT ''' + @Database + ''', ObjectName, ObjectOwner = user_name(so.uid), ObjectId, IndexName, ScanDensity
     FROM #fragmentationinfo f JOIN ' + QUOTENAME(@Database, '[') + '..sysobjects so ON f.ObjectId = so.id
     WHERE ScanDensity <= ' + cast(@fillfactor as varchar(3)) + '
     AND ObjectId > 1000 AND LEN(IndexName) > 0
     AND INDEXPROPERTY(ObjectId, IndexName, ''IndexDepth'') > 0';

-- create table cursor
INSERT INTO #fraglist
    EXEC(@cmd);

SET @curIndexes = CURSOR FOR
    SELECT ObjectName, ObjectOwner, ObjectId, QUOTENAME(IndexName, '['), ScanDensity
    FROM #fraglist

OPEN @curIndexes;
FETCH NEXT FROM @curIndexes INTO @ObjectName, @ObjectOwner, @ObjectId, @IndexName, @ScanDensity;
WHILE (@@FETCH_STATUS = 0)  
BEGIN
    SET @Table = QUOTENAME(@Database, '[') + '.' + QUOTENAME(@ObjectOwner, '[') + '.' + QUOTENAME(@ObjectName, '[');
    RAISERROR('Defragmenting index ''%s'' for object ''%s''', -1, -1, @IndexName, @Table);

    --DBCC DBREINDEX(@Table, @IndexName, @fillfactor);
    SET @cmd = N'DBCC DBREINDEX(''' + @Table + ''', ' + @IndexName + ', ' + cast(@fillfactor as nvarchar(3)) + ');';
    EXEC sp_executesql @cmd;

    FETCH NEXT FROM @curIndexes INTO @ObjectName, @ObjectOwner, @ObjectId, @IndexName, @ScanDensity;
END;  
CLOSE @curIndexes;
```

Code parts similar to the above sample would be executed for each user database. A complete sample script with logic similar to the above can be found with the [DBCC INDEXDEFRAG](http://msdn.microsoft.com/en-us/library/aa258803(v=sql.80).aspx "DBCC INDEXDEFRAG") documentation.

In SQL Server 2005 and later versions, identifying which indexes are fragmented is done by querying the [sys.dm_db_index_physical_stats](http://msdn.microsoft.com/en-us/library/ms188917.aspx "sys.dm_db_index_physical_stats (Transact-SQL)") DMV.

``` sql
SELECT * FROM sys.dm_db_index_physical_stats(
    @dbid, @objectid, @indexid, @partitionnumber, 'LIMITED')
```

In the above example, when the values of the _@dbid_, _@objectid, @indexid_ and _@partitionnumber_ variables are NULL, index information for all objects in all databases will be returned.

Back to the original question: Why is performance better after running [DBCC DBREINDEX](http://msdn.microsoft.com/en-us/library/ms181671.aspx "DBCC DBREINDEX (Transact-SQL)") contrarily to when executing the new [ALTER INDEX](http://msdn.microsoft.com/en-us/library/ms188388.aspx "ALTER INDEX (Transact-SQL)") syntax?

I found the answer is in the [DBCC DBREINDEX](http://msdn.microsoft.com/en-us/library/ms181671.aspx "DBCC DBREINDEX (Transact-SQL)") documentation, a nine-year old Microsoft Whitepaper and finally after reviewing the code being executed.

* The DBCC REINDEX documentation states that _“If index_name is not specified or is specified as ‘ ‘, all indexes for the table are rebuilt”_.
* The Microsoft Whitepaper titled “[Microsoft SQL Server 2000 Index Defragmentation Best Practices](http://technet.microsoft.com/en-us/library/cc966523.aspx#EDAA "Microsoft SQL Server 2000 Index Defragmentation Best Practices")” states that the _“DBCC DBREINDEX completely rebuilds the indexes, so it restores the page density levels to the original fillfactor”_ and _“running DBCC DBREINDEX is very similar to using Transact-SQL statements to drop and re-create the indexes manually”_.
* The code being executed was running DBCC DBREINDEX without passing the _index_name_ parameter.

That solved the puzzle. Having newly created CLUSTERED and NONCLUSTERED indexes on all tables translates in better performance. The only issue is that features such as the [SORT_IN_TEMPDB](http://msdn.microsoft.com/en-us/library/ms188281.aspx "SORT_IN_TEMPDB Option For Indexes") option were not available pre-2005\. This means that if your database is set to the [FULL Recovery Model](http://msdn.microsoft.com/en-us/library/ms189275.aspx "Recovery Models (SQL Server)") the transaction log for the affected database will grow and the process will either fail or might cause disk space issues, depending if [AutoGrow](http://support.microsoft.com/kb/315512/) is enabled or not.
