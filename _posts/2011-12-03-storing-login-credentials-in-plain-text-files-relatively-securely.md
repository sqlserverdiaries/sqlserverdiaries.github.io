---
layout: post
date:   2011-12-03
title:  "Storing Login Credentials in Plain Text Files (Relatively) Securely"
permalink: ./blog/index.php/2011/12/storing-login-credentials-in-plain-text-files-relatively-securely/
categories: blog
published: true
tags: [Code Samples, Database Administration, Security, T-SQL Programming, Coding Practices, Database Migration, Development, SQL Injection, SQL Server]
comments: false
---
When creating logins on different environments, such as on development, test and production instances, where SQL Logins are used these are sometimes created using the same password on all environments. The credentials are usually transferred from the Developer's machine to the DBA's in a text file using the following syntax:

``` sql
CREATE LOGIN [MyAppLogin] WITH
    PASSWORD='P@ssw0rd',
    CHECK_EXPIRATION=ON, CHECK_POLICY=ON,
    DEFAULT_DATABASE=[AdventureWorks],
    DEFAULT_LANGUAGE=[us_english];
```

The problem here is that the password is in plain text. When creating logins as shown above, the [CREATE LOGIN (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms189751.aspx) syntax requires that the password is sent as a string. Of course this issue is mitigated when using domain or Windows accounts.

One metheod to store and transfer passwords for SQL logins in text files is to store it as SQL Server would, in hashed format. As a sideline, when connecting and using SQL Authentication, the authentication mechanism will compare a hashed value of the password sent by the end-user with the hashed value stored in the system table. To obtain the encrypted password as SQL Server will store it you can use the [PWDENCRYPT (Transact-SQL)](http://msdn.microsoft.com/en-us/library/dd822791.aspx) undocumented function as shown below.

``` sql
SELECT PWDENCRYPT('P@ssw0rd');
```

The result for this would be a Base-64 encoded hexadecimal value such as 0x01003B4....1712EE.

The original script can be modified as shown below:

``` sql
CREATE LOGIN [MyAppLogin] WITH
    PASSWORD=0x01003B4....1712EE HASHED,
    CHECK_EXPIRATION=ON, CHECK_POLICY=ON,
    DEFAULT_DATABASE=[AdventureWorks],
    DEFAULT_LANGUAGE=[us_english];
```

The script can now be stored on your machine, in a central repository or sent by email with less worry that the password will be disclosed. Of course a potential attacker could brute force password combinations but if the password is strong enough (see [Strong Passwords](http://msdn.microsoft.com/en-us/library/ms161962.aspx) article in SQL Server BOL) the attacker might require considerable computing power to decode.

You might also want to read an earlier post titled [Script Logins from Database Users](/blog/index.php/2011/03/script-logins-from-database-users/) which explains how to export the logins for all users in a database.
