---
layout: post
date:   2011-12-10
title:  "Check (and Fix) SQL Logins for Weak Passwords"
permalink: ./blog/index.php/2011/12/check-and-fix-sql-logins-for-weak-passwords/
categories: blog
published: true
tags: [Code Samples, Database Administration, Security, Connection Strings, SQL Injection, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2]
comments: false
---
As a DBA, maintaining security of your SQL Server instances is one of the main duties to avoid unauthorised access to data. One of the methods used to gain access to data is to impersonate other users. Some of the weakness are due to end-user setting weak passwords.

SQL Server stores passwords in hashed format (so theoretically they cannot be reversed) and when an authentication request is received the password sent as part of the connection string is hashed and this value compared with the one stored in the system tables. The built-in [PWDCOMPARE (Transact-SQL)](http://msdn.microsoft.com/en-us/library/dd822792.aspx) function can be used to identify which logins have, say no password set, or have the password identical to the login, or is equal to the reverse value of the login. This function accepts three parameters; the first being the password in clear text and the second is the hashed password as a varbinary value - the third parameter will be deprecated in a future version. The query used to achieve this is shown below.

``` sql
USE [master]
GO

SET NOCOUNT ON;

SELECT [login_name], [is_Empty], [is_Same], [is_Reversed]
FROM (
    SELECT
        [name] AS [login_name]
        ,PWDCOMPARE('', [password]) AS [is_Empty]
        ,PWDCOMPARE([name], [password]) AS [is_Same]
        ,PWDCOMPARE(REVERSE([name]), [password]) AS [is_Reversed]
    FROM master.dbo.syslogins
) a
WHERE ([is_Empty] + [is_Same] + [is_Reversed]) > 0
ORDER BY [login_name] ASC;
```

As a test I created a login with a weak password using:

``` sql
CREATE LOGIN [login001] WITH PASSWORD='login001', CHECK_POLICY=OFF;
```

When executing the above query the test login was listed in the results.

An additional test using a password set to the reversed login and another with an empty password were performed using:

``` sql
ALTER LOGIN [login001] WITH PASSWORD='100nigol', CHECK_POLICY=OFF;
ALTER LOGIN [login001] WITH PASSWORD='', CHECK_POLICY=OFF;
```

Once the logins with weak passwords are identified the DBA can set the CHECK\_POLICY and CHECK\_EXPIRATION options to ON, then contact the login owner and ask them to reset the password. The options can be set by executing the output of the following script:

``` sql
SELECT 'ALTER LOGIN [' + login_name + '] WITH CHECK_EXPIRATION=OFF, CHECK_POLICY=ON;'
FROM (
    SELECT
        [name] AS [login_name]
        ,PWDCOMPARE('', [password_hash]) AS [is_Empty]
        ,PWDCOMPARE([name], [password_hash]) AS [is_Same]
        ,PWDCOMPARE(REVERSE([name]), [password_hash]) AS [is_Reversed]
    FROM sys.sql_logins
) a
WHERE ([is_Empty] + [is_Same] + [is_Reversed]) > 0
ORDER BY [login_name] ASC;
```

Guidelines to set strong passwords can be found in the [Strong Passwords](http://msdn.microsoft.com/en-us/library/ms161962.aspx) documentation in the SQL Server Books Online.

Finally don't forget to execute:

``` sql
DROP LOGIN [login001];
```
