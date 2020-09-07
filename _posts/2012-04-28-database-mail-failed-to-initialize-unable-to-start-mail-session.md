---
layout: post
date:   2012-04-28
title:  "Database Mail failed to initialize - Unable to start mail session"
permalink: ./blog/index.php/2012/04/database-mail-failed-to-initialize-unable-to-start-mail-session/
categories: blog
published: true
tags: [Architecture, Database Administration, Security, Database Mail, command-line utilities, DNS, Listening Ports, Security, Microsoft Cluster, SQL Server 2008 R2, SQL Server Agent, SQL Server errors]
comments: false
---
After configuring Database Mail on a clustered SQL Server 2008 R2 instance using a script based on the [Create a Database Mail profile in 4 Steps (or less)](/blog/index.php/2011/03/create-a-database-mail-profile-in-4-steps-or-less/) article, the test email was not delivered.  Some investigation showed that the email was actually not sent.  I also checked the Database Mail profile, the account settings and other configurations.  The queries I used to retrieve this information are shown below.

``` sql
USE [msdb]
GO

-- configuration settings
SELECT * FROM dbo.sysmail_profile;
SELECT * FROM dbo.sysmail_account;
SELECT * FROM dbo.sysmail_server;
SELECT * FROM dbo.sysmail_servertype;
SELECT * FROM dbo.sysmail_configuration;
GO

-- queued email status
SELECT * FROM dbo.sysmail_allitems;
SELECT * FROM dbo.sysmail_sentitems;
SELECT * FROM dbo.sysmail_unsentitems;
SELECT * FROM dbo.sysmail_faileditems;
GO
```

The SQL Server Agent log showed the following entries:

> [260] Unable to start mail session (reason: Microsoft.SqlServer.Management.SqlIMail.Server.Common.BaseException: There was an error on the connection. Reason: A network-related or instance-specific error occurred while establishing a connection to SQL Server. The server was not found or was not accessible. Verify that the instance name is correct and that SQL Server is configured to allow remote connections. (provider: SQL Network Interfaces, error: 26 - Error Locating Server/Instance Specified), connection parameters: Server Name: SQLSrv01\INST1,)
>
> [355] The mail system failed to initialize; check configuration settings
>
> [264] An attempt was made to send an email when no email session has been established

The first thing I checked was whether network access from the database server to the mail server on port 25 was open.

``` text
telnet [mailserver-fqdn] 25
```

The mail server responded so network access was present.  This also confirmed that there wasn't a firewall in the way either.  I also verified with the Email Administrators that the mail server accepted Anonymous Requests, which it did. I went back to the original error messages, namely the one containing the text:

> A network-related or instance-specific error occurred while establishing a connection to SQL Server. The server was not found or was not accessible. Verify that the instance name is correct and that SQL Server is configured to allow remote connections.

This reminded me of connection failures from client machines when attempting to open a connection to an SQL Server instance which is listening on a non-default port (i.e. not 1433).  In those cases the SQL Server Browser was off as the [security hardening](http://www.sqlmag.com/projectplans/migratingtosqlserver2008r2/detail/tabid/4568/catpath/sql-server/topic/Hardening%20SQL%20Server-135858), as it was in this case.  The solution in such cases was to set the _Server_ or _Data Source_ parameter in the [connection string](http://connectionstrings.com/) of the client application to include the actual listening port number.  Since there is no way to set the Database Mail server (or I don't know about it...) I thought of createing an Alias using [SQL Server Configuration Manager](http://msdn.microsoft.com/en-us/library/ms174212.aspx).  Since the entries are written to the registry of the local machine, in a clustered environment the process has to be repeated on each node of the cluster. Once the Alias was created I restarted the SQL Server Agent service and sent a test email, which was delivered to my mailbox. You might also find the following articles useful in identifying issues with Database Mail:

* [Troubleshooting Database Mail](http://msdn.microsoft.com/en-us/library/ms188663.aspx)
* [John Paul Cook - Troubleshooting Database Mail on Windows Server 2008 and 2008 R2](http://sqlblog.com/blogs/john_paul_cook/archive/2010/07/04/troubleshooting-database-mail-on-windows-server-2008-and-2008-r2.aspx)
* [Troubleshooting Database Mail on MSSQL](http://www.sqlhacks.com/Administration/Database-Mail-Troubleshooting)
* [Databasemail error in clustered environment](http://social.msdn.microsoft.com/Forums/en/sqldatabaseengine/thread/298ac093-9b9a-4048-b7ce-47aed89e8f33)
