---
layout: post
date:   2011-11-05
title:  "Check the Cluster Resource Owner and Notify if Failed-Over"
permalink: ./blog/index.php/2011/11/check-the-cluster-resource-owner-and-notify-if-failed-over/
categories: blog
published: true
tags: [Database Mail, Database Administration, Virtualization, Architecture, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server Agent, Microsoft Cluster]
comments: false
---
In a Microsoft Cluster environment offering High Availability, a failover to the Secondary (or alternate) Node is usually set to automatic (to maintain the HA). The DBA then has to resolve the issues that caused the failover then fail the services back to the Primary Node. Of course the DBA has to be aware that a failover occurred otherwise the environment would not have an HA once the Resource Groups are in a failed state.

Such a notification can be easily implemented using a T-SQL script and an SQL Server Agent Job. The script would not have “any” hard-coding so that it can be implemented on different environment if necessary. The entire script is [available here](/assets/article_files/2011-11-check-the-cluster-resource-owner-and-notify-if-failed-over/check_cluster_resource_owner_and_notify_if_failed-over.zip) however here’s a run-through of what’s going on.

The first step is identifying the name of the host machine also know as the Cluster Node. This can be achieved using the _SERVERPROPERTY('ComputerNamePhysicalNetBIOS')_ function as shown below. We are also going to define the machine name of the primary node or Resource Group owner. This is the only hard-coding present in the script.

``` sql
SET @HostName =
    CAST(SERVERPROPERTY('ComputerNamePhysicalNetBIOS') AS nvarchar(128));
SET @PrimaryNode = 'SQLNODE1'; /* ***** CHANGE THIS ***** */
```

If these two values differ, we can move to the next step which finally sends a notification email. First we will retrieve the full path of the current SQL Server Error Log – I will explain why later. Since the path is written to the SQL Server Error Log, I used some string manipulation function to parse the results and extract the path.

``` sql
INSERT INTO #SQLErrorLogPath
    EXEC sp_readerrorlog 0, 1, 'Logging SQL Server messages in file';
SET @SQLErrorLogPath = (
    SELECT REPLACE(LogText, 'Logging SQL Server messages in file', '')
    FROM #SQLErrorLogPath)
SET @SQLErrorLogPath = REPLACE(LEFT(LTRIM(@SQLErrorLogPath),
    LEN(LTRIM(@SQLErrorLogPath))-1), '''', '');
```

Next we’re going to retrieve the Database Mail Profile Name based on the standard naming convention as described in the [Create a Database Mail profile in 4 Steps (or less)](./blog/index.php/2011/03/create-a-database-mail-profile-in-4-steps-or-less/) post. The name can be built using:

``` sql
SET @InstanceName =
    UPPER(ISNULL(@@SERVERNAME,
        CAST(SERVERPROPERTY('ServerName') AS nvarchar(128))));
SET @DBMailProfileName = 'SQL Server Email Notifications - ' + @InstanceName;
```

Finally we’re going to set the email recipients, message subject, and message body variables and send the email message using the [sp_send_dbmail (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms190307.aspx) stored procedure. You will notice that the message body contains instructions to review the SQL Server Error Log from the path retrieved earlier, the Windows Event Log, and the Cluster Log which is always located at the path shown in the script.

``` sql
EXEC msdb.dbo.sp_send_dbmail
    @profile_name = @DBMailProfileName,
    @recipients = @EmailRecipients,
    @copy_recipients = @EmailCCRecipients,
    @subject = @EmailSubject,
    @body = @EmailBody,
    @body_format = 'TEXT';
```

Once tested, the last step is to create an SQL Server Agent Job which fires every time the SQL Server Agent service is started. You should now be set.

The script, which can be [downloaded from here](/assets/article_files/2011-11-check-the-cluster-resource-owner-and-notify-if-failed-over/check_cluster_resource_owner_and_notify_if_failed-over.zip), has been tested with SQL Server 2005, 2008 and 2008 R2. I am also including a script for SQL Server 2000 which works in a similar way but relies on a different set of functions and stored procedures. The SQL Server 2000 version of the script can be [downloaded here](/assets/article_files/2011-11-check-the-cluster-resource-owner-and-notify-if-failed-over/check_cluster_resource_owner_and_notify_if_failed-over_2000.zip)
