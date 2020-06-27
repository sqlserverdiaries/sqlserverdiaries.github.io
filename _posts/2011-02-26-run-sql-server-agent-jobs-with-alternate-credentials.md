---
layout: post
date:   2011-02-26
title:  "Run SQL Server Agent Jobs with Alternate Credentials"
permalink: ./blog/index.php/2011/02/26/run-sql-server-agent-jobs-with-alternate-credentials/
published: true
tags: [Database Administration, SQL Server Integration Services, T-SQL Programming, SQL Server Agent, SSIS, SQL Server 2005, Security]
comments: false
---
According to the [Selecting an Account for the SQL Server Agent Service](http://msdn.microsoft.com/en-us/library/ms191543.aspx), the SQL Server Agent service account should be able to authenticate with the instance and also be a memeber of the _sysadmin_ fixed server role.

Agent jobs are usually created by a DBA and by default will execute in the context of the service account.  Implementing the [Principle of Least Privilege](http://en.wikipedia.org/wiki/Principle_of_least_privilege) requires that an alternate account is used to execute each job (or groups of jobs) depending on the functionality required.  A job will definitely execute when using a member of the _sysadmins_ server role however this privilige level might be too high for the task in hand.  This is especially true when the DBA has to schedule say, a stored procedure written by a database developer or third parties.

SQL Server allows that jobs run in an alternate execution context whose permissions are limited only to those required to execute the job.  Creating such a proxy requires the following steps:

1. Create a domain or local user account with a [Strong Password](http://msdn.microsoft.com/en-us/library/ms161962.aspx) - for the sake of this article a domain user account will be used in the examples.

2. Create a Login for the Windows account; create a database USer for the Login, and add the User as a member of a database role.

    ``` sql
    USE [master]
    GO
    CREATE LOGIN [DOMAIN\appuser001] FROM WINDOWS
        WITH DEFAULT_DATABASE=[MyDatabase]
    GO

    USE [MyDatabase]
    GO
    CREATE USER [DOMAIN\appuser001] FOR LOGIN [DOMAIN\appuser001]
    GO
    EXEC sp_addrolemember [CustomDatabaseRole], [DOMAIN\appuser001]
    GO
    ```

3. Create a Credential for the Login as shown.  Note that the WIndows account password is required at this stage.

    ``` sql
    USE [master]
    GO
    IF NOT EXISTS(SELECT * FROM sys.credentials WHERE [name] = 'appuser001')
    CREATE CREDENTIAL [appuser001] WITH
        IDENTITY = N'DOMAIN\appuser001',
        SECRET = N'P@ssw0rd'
    GO
    ```

4. Create an SQL Server Agent Proxy linking it to the Credential.

    ``` sql
    USE [msdb]
    GO
    EXEC msdb.dbo.sp_add_proxy
        @proxy_name=N'appuser001',
        @credential_name=N'appuser001',
        @enabled=1,
        @description=N'SQL Server Agent sample proxy account'
    GO
    ```

5. Finally the Proxy is granted access to a subsystem. More information about subsystems can be found in the [sp_grant_proxy_to_subsystem (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms186760.aspx) documentation.

    ``` sql
    EXEC msdb.dbo.sp_grant_proxy_to_subsystem
        @proxy_name=N'appuser001',
        @subsystem_id=11 -- SSIS package execution
    GO
    ```

    In the above example the Proxy is being granted the privilige to execute SSIS packages.  In addition to this procedure, the Login has to be granted access to the _msdb_ database in order to execute SSIS packages.

    ``` sql
    USE [msdb]
    GO
    CREATE USER [DOMAIN\appuser001] FOR LOGIN [DOMAIN\appuser001]
    GO
    EXEC sys.sp_addrolemember @rolename = 'db_dtsoperator', @membername = [DOMAIN\appuser001];
    GO
    ```

6. The last step is to choose the Proxy account in the RunAs dropdown when createing the SQL Server Agent job step.
