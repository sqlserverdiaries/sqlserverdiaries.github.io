---
layout: post
date:   2011-03-26
title:  "Create a Database Mail profile in 4 Steps (or less)"
permalink: ./blog/index.php/2011/03/create-a-database-mail-profile-in-4-steps-or-less/
published: true
tags: [SQL Server 2005, T-SQL Programming, SQL Server Agent, Database Mail, Database Administration]
comments: false
---
[Database Mail](http://msdn.microsoft.com/en-us/library/ms175887.aspx) provides functionality to send email using T-SQL and is the successor to SQL Server 2000's [SQL Mail](http://msdn.microsoft.com/en-us/library/ms177418.aspx). Although SQL Mail is still available in SQL Server 2005, it is provided for backward compatibility only and the Books Online reccomend that Database Mail is used instead.

Configuring Database Mail requires that the MSDB database has the ENABLE_BROKER database setting set. Other than that, the [Database Mail Configuration Wizard](http://msdn.microsoft.com/en-us/library/ms175951.aspx) allows an operator to create a Database Mail Profile and Account using a GUI. I prefer implementing functionality using scripts. The main reason is that a script can be easily modified (if necessary) and deployed on multiple SQL Server instances using tools such as SQLCMD.

The first part of my script template declares and sets the variables which will be used to create the Profile and Account.

``` sql
DECLARE @InstanceName NVARCHAR(128);
-- Database Mail Profile variables
DECLARE @DBMailProfileName NVARCHAR(128);
DECLARE @DBMailProfileDesc NVARCHAR(256);
-- Database Mail Account variables
DECLARE @AccountName NVARCHAR(128);
DECLARE @AccountEmail NVARCHAR(128);
DECLARE @MailServer NVARCHAR(128);
-- retrieve the SQL Server instance name (no hard-coding!)
SET @InstanceName = UPPER(ISNULL(@@SERVERNAME, CAST(SERVERPROPERTY('ServerName') AS NVARCHAR(128))));

SET @DBMailProfileName = 'SQL Server Email Notifications - ' + @InstanceName;
SET @DBMailProfileDesc = 'Email notification service for SQL Server ' + @InstanceName;

SET @AccountName = 'YourCompany DBA';
SET @AccountEmail = 'sqldba@yourcompany.com';
SET @MailServer = 'mailserver.yourcompany.com';
```

Once the variables are set the script will create the [Database Mail Profiles](http://msdn.microsoft.com/en-us/library/ms189879.aspx).

``` sql
-- Create a Database Mail profile
EXECUTE msdb.dbo.sysmail_add_profile_sp
    @profile_name = @DBMailProfileName,
    @description = @DBMailProfileDesc;
```

Next we'll create the [Database Mail Accounts](http://msdn.microsoft.com/en-us/library/ms188668.aspx). As you can see, the script is assuming that the port number is "25" (an integer value). Modify accordingly if your environment is different.

``` sql
-- Create a Database Mail account
EXECUTE msdb.dbo.sysmail_add_account_sp
    @account_name = @AccountName,
    @description = @AccountName,
    @email_address = @AccountEmail,
    @replyto_address = @AccountEmail,
    @display_name = @DBMailProfileName,
    @mailserver_name = @MailServer,
    @port = 25;
```

The next step is to link the Account to the Profile as shown below.

``` sql
-- Add the account to the profile
EXECUTE msdb.dbo.sysmail_add_profileaccount_sp
    @profile_name = @DBMailProfileName,
    @account_name = @AccountName,
    @sequence_number =1;
```

Finally, the script will grant permissions for an MSDB database user (or the public role) to use the Database Mail profile just created. This step is not required if the login executing the stored procedure that sends email is a member of the SYSADMIN fixed server role.

``` sql
-- Grant access to the profile to the DBMailUsers role
EXECUTE msdb.dbo.sysmail_add_principalprofile_sp
    @profile_name = @DBMailProfileName,
    @principal_id = 0,
    @is_default = 1;
```

In order to verify that the profile was created successfully we can execute the following queries:

``` sql
SELECT * FROM msdb.dbo.sysmail_profile;
SELECT * FROM msdb.dbo.sysmail_account;
```

As a final test, we can send an email using the "sp_send_dbmail" stored prodcedure and the profile just created:

``` sql
-- send test email notification
EXEC msdb.dbo.sp_send_dbmail
    @profile_name = @DBMailProfileName,
    @recipients = @AccountEmail,
    @subject = 'Testing a Database Mail Profile',
    @body = 'This is a test email sent using Database Mail',
    @body_format = 'TEXT';
```

Send email responsibly.
