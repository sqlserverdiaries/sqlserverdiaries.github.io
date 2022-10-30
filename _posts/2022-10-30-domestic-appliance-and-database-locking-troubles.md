---
layout: post
date:   2022-10-30
title:  "Domestic Appliance and Database Locking Troubles"
permalink: ./blog/index.php/2022/10/domestic-appliance-and-database-locking-troubles/
categories: blog
published: true
tags: [Database Administration, Development, Locking, Blocking, Deadlock]
comments: true
---
A couple of weeks ago, a domestic appliances purchased recently started flashing a light on the display panel, indicating that something was wrong. I checked the manual that came with it, followed the troubleshooting steps, yet the issue persisted.  So I called the Customer Care number and, after a couple of prompts, was put through to a human.

Since it was my first time calling we went through a few questions to set up my account, then started going through the troubleshooting steps.  I explained what I had done, then the operator consulted what I believe was a more detailed manual. The suggestion was to unplug the appliance for 30 seconds, then plug it back in and try again. I had to restrain myself from laughing. Seems like the ["have you tried turning it off and on again?"](https://www.youtube.com/watch?v=nn2FB1P_Mn8) approach used in I.T also applies to domestic appliances.

While trying the latest suggestion something happened and I got disconnected from the Call Centre. When I called back after performing the unplugging operation I was put through to another operator. I tried explaining who was originally assisting me however could not recall their name. So we went through the same motions, my account was located, however when attempting to create what I would call "an incident record" the operator started apologising and saying "that the system was slow and seemed to have frozen".

I immediately suspected what was going on - the first operator was still writing notes related to my call and had not hit the infamous "Save" button. It wouldn't have been the operator's fault; in this case it might have been the code that was not written to handle concurrency properly. My guess was that the record was probably locked by an open transaction, hopefully only locking my record.

The operator kept apologising for another 5 minutes, I replied that it was not a problem, and finally the system "unfroze". We completed the procedure and the domestic appliance was back in action.

I wrote about this because, as a DBA I get reports about blocking on an almost daily basis.  Most times the blocked sessions clear out without intervention and without getting reported back to myself or other support teams (as I assume happened in the above case), however there are times when end users make a fuss about the system being slow or "frozen", especially when they are running time-sensitive processes.  If you're lucky and have monitoring systems in place, capturing these events as they happen and storing the information in a database, then you should be able to pinpoint the queries causing the trouble after the deed.  If not, then you should at the very least use on of the many open source tools such as the [sp_WhoIsActive](http://whoisactive.com/) stored procedure, the [Database Health Monitor](https://databasehealth.com/) tool (free for one connection), or possibly consider writing your own using [Extended Events](https://learn.microsoft.com/en-us/sql/relational-databases/extended-events/extended-events).

And that is just for blocking scenarios; Deadlocks are another matter. In a deadlock escalation SQL Server automatically "promotes" a process to be the victim, so the outcome is slightly different.  With a deadlock there is a high probability of data loss, especially if the victim process was running an INSERT or UPDATE command - SELECT operations are not that much of an issue.  Once again a monitoring system would provide relevant insights into deadlocks happening throughout the day (or night) as these might not get reported. The application code might attempt to re-run the transaction, or the application might crash and the end user would have to insufferably input the information from scratch.

If for whatever reason your company does not have a monitoring system, Deadlock information can be extracted from the [SQL Server ERRORLOG](https://learn.microsoft.com/en-us/sql/tools/configuration-manager/monitoring-the-error-logs) using [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/relational-databases/performance/view-the-sql-server-error-log-sql-server-management-studio) or the [sp_readerrorlog](https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-readerrorlog-transact-sql) stored procedure.  Since the ERRORLOG could potentially contain a considerable number of records, I wrote a TSQL script to filter out the noise - this is available from [Filter Out SQL Server Error Log Messages](https://github.com/reubensultana/DBAScripts/tree/master/ERRORLOG).

If you are rolling out your own monitoring solution, Locks, Blocking, and Deadlocks can also be captured using [SQL Server Profiler](https://learn.microsoft.com/en-us/sql/tools/sql-server-profiler/analyze-deadlocks-with-sql-server-profiler) or [Extended Events](https://learn.microsoft.com/en-us/sql/relational-databases/extended-events/determine-which-queries-are-holding-locks).

Whatever your circumstances, there are a number of tools to help a DBA identify and report back issues related to locking, blocking and deadlocks. And if you struggle with writing [Extended Events](https://dbatools.io/commands/#Traces), maybe the fantastic [dbatools](https://dbatools.io) open source PowerShell modules, written and supported by the DBA community, can help you with that.

&nbsp;

## Further Reading

[Understand and resolve SQL Server blocking problems](https://learn.microsoft.com/en-us/troubleshoot/sql/performance/understand-resolve-blocking)

[Resolve blocking problems caused by lock escalation in SQL Server](https://learn.microsoft.com/en-us/troubleshoot/sql/performance/resolve-blocking-problems-caused-lock-escalation)

[How to reduce lock contention in SQL Server](https://support.microsoft.com/en-us/topic/how-to-reduce-lock-contention-in-sql-server-5dcd6737-2476-d951-bd4e-79556a6d97ff)

[Transaction locking and row versioning guide](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide)

[Monitoring SQL Database Deadlocks](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/monitor-database-deadlocks)

[Detecting and Ending Deadlocks](https://learn.microsoft.com/en-us/previous-versions/sql/sql-server-2008-r2/ms178104(v=sql.105))

[SET DEADLOCK_PRIORITY (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-deadlock-priority-transact-sql)

[Don't Bite Off More than You Can Chew - Take it in Chunks by Erland Sommarskog](https://www.youtube.com/watch?v=fCme4dTgCsc)

[Analyze and prevent deadlocks in Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/analyze-prevent-deadlocks)

[Doing Your Free SQL Server Health Check - Brent Ozar Unlimited](https://www.brentozar.com/contact/doing-your-free-sql-server-health-check/)
