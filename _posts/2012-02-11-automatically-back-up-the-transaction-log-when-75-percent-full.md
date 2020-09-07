---
layout: post
date:   2012-02-11
title:  "Automatically Back Up the Transaction Log when 75 Percent Full"
permalink: ./blog/index.php/2012/02/automatically-back-up-the-transaction-log-when-75-percent-full/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, Data Maintenance, SQL Server Agent, Storage]
comments: false
---
Once your databases are live and your production SQL Server instance is functioning to it's best, a user might decide to transfer large amounts of data into a database using SSIS, BCP, or some other custom application.  When such data transfers occur SQL Server logs activity in the transaction log.  Under "normal" circumstances this is handled by your full/transaction log backup procedures but when activity as in this example is unplanned for, the transaction log might fill up very quickly and unless autogrowth is enabled, the database/application will not allow insert, update and delete statements from being executed.  An alternative solution to autogrowth (which I personally do not reccomend) is to back up the trasaction log more frequently.  The problem is having it set up to fire automatically when a threshold is reached - behaviour that is similar to a database trigger.

A solution I built uses SQL Server Agent Alerts, Operators (optional) and an SQL Server Agent Job.  I will first start explaining what the job does.  The job is made up of a single step which executes the below T-SQL.

``` sql
SET NOCOUNT ON;
DECLARE @DatabaseName nvarchar(128);

CREATE TABLE #logspace (
    database_name sysname,
    log_size_mb NUMERIC(15,8),
    log_space_percent NUMERIC(15,8),
    status SMALLINT );
INSERT INTO #logspace EXECUTE('DBCC SQLPERF(LOGSPACE)');

IF EXISTS(
    SELECT 1 FROM #logspace
    WHERE (database_name NOT IN ('master', 'model', 'msdb', 'tempdb')
        AND database_name NOT LIKE 'ReportServer$%')
    AND log_space_percent &gt; 75
    AND DATABASEPROPERTYEX(database_name, 'Recovery') IN ('BULK_LOGGED', 'FULL'))
BEGIN
    PRINT 'Backing up databases having the transaction log &gt; 75% full';
    PRINT '************************************************************';
    DECLARE curDatabases CURSOR READ_ONLY FOR
        SELECT database_name FROM #logspace
        WHERE (database_name NOT IN ('master', 'model', 'msdb', 'tempdb')
            AND database_name NOT LIKE 'ReportServer$%')
        AND log_space_percent &gt; 75
        AND DATABASEPROPERTYEX(database_name, 'Recovery') IN ('BULK_LOGGED', 'FULL')
        ORDER BY log_space_percent DESC, database_name ASC;

    OPEN curDatabases;
    FETCH NEXT FROM curDatabases INTO @DatabaseName;
    WHILE (@@FETCH_STATUS = 0)
    BEGIN
        PRINT 'Backing up the log for database: ' + @DatabaseName;
        PRINT '------------------------------------------------------------';
        -- BACKUP LOG @DatabaseName TO DISK='D:\MSSQL\BACKUP'...

        FETCH NEXT FROM curDatabases INTO @DatabaseName;
    END
    CLOSE curDatabases;
    DEALLOCATE curDatabases;
END;
DROP TABLE #logspace;
```

The database whose transaction log is over the 75% threshold (can be customised to your requirements) is identified from the result set obtained by executing [DBCC SQLPERF (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms189768.aspx), filtering the result set and iterating using a CURSOR (this is one of the few instances where a CURSOR can be used...).  The BACKUP LOG command is then executed for each of the databases identified.

**NOTE:** The BACKUP LOG command in the above script sample is unfinished and commented out.  The script can be customised using the samples provided in the [Quick Full Backup Script Sample](/blog/index.php/2011/09/quick-full-backup-script-sample/) article.  In the environments I manage this functionality has been encapsulated into a set of stored procedures.

Next we have to set up the Alerts and if necessary, the Operators.  An SQL Server Agent Alert is triggered when an event or a performance condition occurs in SQL Server.  In our case we wanted the Alert to fire when the Log Space for a database reached the 75% threshold.  Unfortunately there isn't a way to implement a single Alert for all databases however all Alerts can be configured to start the same SQL Server Agent job (created as explained above - more information below).

``` sql
EXEC msdb.dbo.sp_add_alert
    @name=N'Transaction Log 75% Full for Database ''AdventureWorks''',
    @message_id=0,
    @severity=0,
    @enabled=1,
    @delay_between_responses=0,
    @include_event_description_in=0,
    @category_name=N'[Uncategorized]',
    @performance_condition=N'MSSQL$InstA:Databases|Percent Log Used|AdventureWorks|&gt;|75',
    @job_name=N'Transaction Log Backup when 75 Percent Full';
```

Once the Alert is fired, it will call the job which will locate the database name and back up it's log accordingly.  As you can see, hard-coding has been kept to a minimum in both examples.

In addition to Job being executed, the Alert can be configured to send a notification such as an email, to a specific address (or addresses) by creating an Operator and linking this Operator to the Alert as in the below samples:

``` sql
EXEC msdb.dbo.sp_add_operator
    @name=N'DBA Team',
    @enabled=1,
    @weekday_pager_start_time=90000,
    @weekday_pager_end_time=180000,
    @saturday_pager_start_time=90000,
    @saturday_pager_end_time=180000,
    @sunday_pager_start_time=90000,
    @sunday_pager_end_time=180000,
    @pager_days=0,
    @email_address=N'dbateam@mydomain.com;sqlserveradmins@mydomain.com;',
    @category_name=N'[Uncategorized]';

EXEC msdb.dbo.sp_add_notification
    @alert_name = N'Transaction Log 75% Full for Database ''AdventureWorks''',
    @operator_name = N'DBA Team',
    @notification_method = 1; /* 1: email; 2: Pager; 3: net send */
```

Of course, in order to have SQL Server send emails, Database Mail has to be configured.  An example of how to configure Database Mail can be found in the [Create a Database Mail profile in 4 Steps (or less)](/blog/index.php/2011/03/create-a-database-mail-profile-in-4-steps-or-less/) article.

Further information about how SQL Server Agent can be configured to handle events can be found in the [Monitoring and Responding to Events](http://msdn.microsoft.com/en-us/library/ms191508.aspx) article in MSDN.
