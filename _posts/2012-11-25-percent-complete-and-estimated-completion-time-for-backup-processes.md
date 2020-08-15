---
layout: post
date:   2012-11-25
title:  "Percent Complete and Estimated Completion Time for Backup Processes"
permalink: ./blog/index.php/2012/11/percent-complete-and-estimated-completion-time-for-backup-processes/
categories: blog
published: true
tags: [DMV, Backup and Recovery, Database Administration, Performance, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, Indexes, Backup]
comments: false
---
The more I learn about SQL Server the more I realise how little I know.  While delving in the output of some DMVs I noticed that the [sys.dm_exec_requests](http://msdn.microsoft.com/en-us/library/ms177648.aspx "sys.dm\_exec\_requests (Transact-SQL)") can be used to find the percentage completed for a backup operation, as well as the estimated time of completion.

The [sys.dm_exec_requests](http://msdn.microsoft.com/en-us/library/ms177648.aspx "sys.dm\_exec\_requests (Transact-SQL)") DMV _“information about each request that is executing within SQL Server”_ such as the Session ID, Start Time, SQL Handle (which can be used to retrieve the actual statement being executed), Database ID, whether the request is being Blocked or is Blocking, and much more.  As explained earlier, the DMV can be used to find how long a backup has been running, at what stage it is, and at what time SQL Server estimates that the process will complete.  The latter is not documented but can be calculated as shown in the below query.

``` sql
SELECT
    session_id, start_time, DB_NAME(database_id) as [database_name],
    status, command, blocking_session_id, wait_type, wait_time,
    CONVERT(numeric(5,2), percent_complete) As [percent_complete],
    DATEADD(ms, estimated_completion_time, CURRENT_TIMESTAMP) AS [estimated_completion_time]
FROM sys.dm_exec_requests
WHERE command = 'BACKUP DATABASE';
```

The query uses the [DB_NAME](http://msdn.microsoft.com/en-us/library/ms189753.aspx "DB\_NAME (Transact-SQL)") function to obtain resolve the database name (if you want other database information your best bet is to JOIN with the [sys.databases](http://msdn.microsoft.com/en-us/library/ms178534.aspx "sys.databases (Transact-SQL)") DMV) and the  [DATEADD](http://msdn.microsoft.com/en-us/library/ms186819.aspx "DATEADD (Transact-SQL)") function to calculate the estimated completion time by adding the value in the original column which, although not documented, corresponds to the number of milliseconds from now.

The above query can be executed against multiple SQL Server instance using SSMS using the method explained in the [Retrieve DBMS and Database Version Information](./blog/index.php/2011/11/retrieve-dbms-and-database-version-information/ "Retrieve DBMS and Database Version Information") article, giving you a holistic view of the processes on your environment.  Alternatively you could embed the query in an application or web page which refresh automatically.

The _percent\_complete_ column of the sys.dm\_exec\_requests DMV can also be used to monitor activities other than backups.  At the time of writing, these include the following:

* ALTER INDEX REORGANIZE
* AUTO_SHRINK option with ALTER DATABASE
* BACKUP DATABASE
* DBCC CHECKDB
* DBCC CHECKFILEGROUP
* DBCC CHECKTABLE
* DBCC INDEXDEFRAG
* DBCC SHRINKDATABASE
* DBCC SHRINKFILE
* RECOVERY
* RESTORE DATABASE
* ROLLBACK
* TDE ENCRYPTION

All you have to do is filter the results to include the above values for the _command_ column.
