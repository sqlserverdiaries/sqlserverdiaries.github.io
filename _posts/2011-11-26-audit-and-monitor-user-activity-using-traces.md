---
layout: post
date:   2011-11-26
title:  "Audit and Monitor User Activity using Traces"
permalink: ./blog/index.php/2011/11/audit-and-monitor-user-activity-using-traces/
categories: blog
published: true
tags: [Architecture, Database Administration, Security, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2]
comments: false
---
Organisations depend on data. Internationally, news agencies have reported innumerable times about data theft (one that hit the news recently lead to the closure of a newspaper), data loss, corruption caused by crafted bots using one of the various SQL Injection techniques, and many more. The amount of data generated on a daily basis by all organisations (government and private) is increasing exponentially. Unless this information is protected, when this data is lost or corrupted the organisation suffers.

A feature that has existed in SQL Server since the 2000 (or earlier?) version is the [C2 Audit Mode](http://msdn.microsoft.com/en-us/library/ms187634.aspx) option. Enabling this feature is as simple as ticking a check-box or executing the [sp_configure (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms188787.aspx) stored procedure with the appropriate parameters. In my opinion, the drawback of the C2 Audit Mode is that it is too resource intensive especially with regards to storage space. Unless you bear in mind this fact when implementing, your instance can shut down causing unscheduled downtime. This is also documented in the same MSDN documentation.

Another option to audit and monitor activity is to use a [SQL Trace](http://msdn.microsoft.com/en-us/library/ms191006.aspx). A common metheod to view trace output is to use [SQL Server Profiler](http://msdn.microsoft.com/en-us/library/ms181091.aspx). This application, which is part of the client components, generates a trace and displays the output in a graphical format. SQL Server Profiler can also be used to view trace files offline - i.e. captured in an earlier session. An SQL Trace will basically store the trace output as a TRC file on the disks presented to the SQL Server host machine.

A trace can be created quickly enough using SQL Server Profiler and saving the trace definition as an SQL file. I used this method the firt time round, then "refined" the T-SQL and customised it as you'll see by the end of this article. After launching SQL Server Profiler, connecting to an SQL Server instance and selecting a few Events and Columns, I started the trace then stopped it immediately. In order to generate the T-SQL code you have to go to _File > Export > Script Trace Definition_ and choose your target version.

As I mentioned earlier, I tweaked a script output by SQL Server Profiler making more mantainable. The first thing I did was identify the events that would be captured. The following table shows the events and their respective descriptions obtained from the [SQL Server Event Class Reference](http://msdn.microsoft.com/en-us/library/ms175481.aspx).

Event | Event name | Description
----- | ---------- | -------------
10 | RPC:Completed | Occurs when a remote procedure call (RPC) has completed.
12 | SQL:BatchCompleted | Occurs when a Transact-SQL batch has completed.
14 | Audit Login | Occurs when a user successfully logs in to SQL Server.
15 | Audit Logout | Occurs when a user logs out of SQL Server.
17 | ExistingConnection | Detects all activity by users connected to SQL Server before the trace started.
104 | Audit AddLogin Event | Occurs when a SQL Server login is added or removed; for sp_addlogin and sp_droplogin.
105 | Audit Login GDR Event | Occurs when a Windows login right is added or removed; for sp_grantlogin, sp_revokelogin, and sp_denylogin.
106 | Audit Login Change Property Event | Occurs when a property of a login, except passwords, is modified; for sp_defaultdb and sp_defaultlanguage.
107 | Audit Login Change Password Event | Occurs when a SQL Server login password is changed. Passwords are not recorded.
108 | Audit Add Login to Server Role Event | Occurs when a login is added or removed from a fixed server role; for sp_addsrvrolemember, and sp_dropsrvrolemember.
109 | Audit Add DB User Event | Occurs when a login is added or removed as a database user (Windows or SQL Server) to a database; for sp_grantdbaccess, sp_revokedbaccess, sp_adduser, and sp_dropuser.
110 | Audit Add Member to DB Role Event | Occurs when a login is added or removed as a database user (fixed or user-defined) to a database; for sp_addrolemember, sp_droprolemember, and sp_changegroup.
111 | Audit Add Role Event | Occurs when a login is added or removed as a database user to a database; for sp_addrole and sp_droprole.
&nbsp;

One word or caution. Events 10 (RPC:Completed) and 12 (SQL:BatchCompleted) might generate a considerable amount of information since they capture every T-SQL command executed against the monitored instance, database and/or databases. We also noticed that events 14 (Audit Login) and 15 (Audit Logout) may also contribute to the number of trace data rows captured when applications are (poorly...?)designed to connent and disconnect for every T-SQL command (!!). Only a subset of the available columns are being captured since there were most relevant to the requirements.

The events numbers are stored in a CURSOR object and the stored procedure [sp_trace_setevent (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms186265.aspx) called with every iteration and for every column captured.

``` sql
SET @curEventIDs = CURSOR FOR
    SELECT a.[EventID] FROM (
        SELECT 10 AS [EventID] UNION ALL
        SELECT 12 UNION ALL
        SELECT 14 UNION ALL
        ..........
        SELECT 109 UNION ALL
        SELECT 110 UNION ALL
        SELECT 111 ) a;
```

At the end of the script I am adding filters using [sp_trace_setfilter (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms174404.aspx) to avoid capturing data from applications having "SQL Profiler" or "SQL Server Profiler" in the Application Name column.

Since this trace will be used for auditing purposes it is being created in the _master_ database and set to start automatically using the [sp_procoption (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms181720.aspx) stored procedure.

I am including three versions of the script, one for each of SQL Server 2000, 2005 and 2008. The latter two are identical but I opted to keep separate versions while the 2008 script will also work on the R2 version.

The scripts for the traces can be downloaded using the below links:

* [SQL Server 2000 version](/assets/article_files/2011/11/usp_trace_audit_2000.zip)
* [SQL Server 2005 version](/assets/article_files/2011/11/usp_trace_audit_2005.zip)
* [SQL Server 2008 version](/assets/article_files/2011/11/usp_trace_audit_2008.zip)
