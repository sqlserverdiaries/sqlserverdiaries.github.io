---
layout: post
date:   2012-08-04
title:  "Reindexing fails with 'ERROR 2727 Cannot find index' for a SCOM 2012 database"
permalink: ./blog/index.php/2012/08/reindexing-fails-with-error-2727-cannot-find-index-for-a-scom-2012-database/
categories: blog
published: true
tags: [Code Samples, Database Administration, Database Design, Data Maintenance, Development, DMV, Indexes, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, SQL Server errors, SQL Server Agent, Testing]
comments: false
---
[System Center Operations Manager 2012](http://technet.microsoft.com/en-us/library/hh205987.aspx) is, to say the least, an interesting product.  I will not be delving into the product features or functionality, but just a particular error I came across and the obvious fix.

A standard set of routines to carry out various functions are deployed on all SQL Server instances.  The routines’ code-base is kept in synch across all instances so that one version of the code exists on production environment at any point in time.  One of these routines handles index rebuilds and reindexing operations.  The logic iterates through all databases and determines dynamically which objects have to be rebuilt or reindexed based on a predefined set of parameters.  The code then builds dynamic T-SQL statements and executes these in sequence.

The stored procedure was deployed on the SQL Server instance hosting a SCOM 2012 database and scheduled using an Agent job.  The job failed with the following error:

> Msg 50000, Sev 11, State 1, Line 440  
> ERROR 2727 Cannot find index ‘PK__Performa__AFAD0EB457AFA40D’.

The T-SQL command being executed (and which failed) was:

```sql
USE [OperationsManagerDW];
ALTER INDEX [PK__Performa__AFAD0EB457AFA40D] ON [Perf].[PerformanceStage]
REBUILD WITH (
    SORT_IN_TEMPDB=ON, ALLOW_ROW_LOCKS=ON, ALLOW_PAGE_LOCKS=ON
);
```

The first step was to verify if the index actually existed.  I found that there was an index but the name was different.  I then checked whether any of my colleagues deleted the index, which they did not.  Somehow I decided to re-query the sys.indexes DMV and I realised that the index name had changed again!  That was when I realised that SCOM 2012 drops and creates the clustered index on the Perf.PerformanceStage table.  Since the index maintenance routines use the index name when executing a REINDEX or an index REBUILD command, due to the frequent changes of the index name the procedure would fail.

The fix to this issue was to check for the existence of the index before executing the ALTER INDEX statement.  In brief the dynamically built code was similar to the below:

```sql
/*
added check for existence of the index before executing ALTER;
to solve issue with SCOM 2012 which drops and creates clustered
index on Perf.PerformanceStage
*/
SET @exec_stmt_head = @exec_stmt_head + N'IF EXISTS(SELECT 1 FROM ' +
    @DatabaseName + '.sys.indexes WHERE [object_id] = OBJECT_ID(''' +
    @SchemaName + N'.' + @TableName + ''') AND [name] = ''' +
    @IndexName + ''')
ALTER INDEX ' + @IndexName + N' ON ' + @SchemaName + N'.' + @TableName + N' '
```

Looking back at my code, the check should have been there from the beginning but for some reason I “assumed” that the indexes would not change.  Someone once told me “never a dull moment” – how right that is!
