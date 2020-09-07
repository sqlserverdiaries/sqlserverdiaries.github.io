---
layout: post
date:   2012-08-25
title:  "Delegate Password Management to Unpriviliged Database Users"
permalink: ./blog/index.php/2012/08/delegate-password-management-to-unpriviliged-database-users/
categories: blog
published: true
tags: [Architecture, Database Administration, Security, T-SQL Programming, Code Samples, Coding Practices, Database Mail, Development, Security, SQL Injection, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, Testing]
comments: false
---
When an application used SQL Authentication credentials for each login have to be created and delivered [securely] to the end user.  Alternatively a developer can opt to develop his/her own authentication mechanism where an application uses a single login to connect to the database and each end-user is created as a record in a Users table.  In that case the onus of password changes and delivery fall on the application.  In the first example however, the DBA has to carry out the password management.

One of the more tedious tasks a DBA can have is password resets.  With a small number of users this might not be much of a time-waster, but with hundreds of end-users, the probability that a number of users requesting a password reset (because they forgot the pasword) increases.  So when the DBA starts receiving five or more requests for password resets on a daily basis he or she will have to find an alternative, such as delegating to some poor Junior DBA – but then the Junior DBA wouldn’t learn anything right?

Another laternative is to add a specific login (i.e.  a knowledgeable user) membership in the _securityadmin_ fixed server role.  This will allow the role member to change the password of **any** SQL login.  But this poses another problem, one of security.  What if you only want to allow password changes for a single database?  The solution is in the script attached to this post.

Changing a password requires that the login is a member of the _sysadmin_ or _securityadmin_ fixed server roles.  The command shown below has to be executed in order to change the password for login “login001?.

``` sql
ALTER LOGIN [login001] WITH PASSWORD = 'P@ssw0rd', CHECK_POLICY = ON;
```

Since a normal database user will not be granted membership in the above-mentioned roles the elevation of priviliges can be achieved using the [EXECUTE AS](http://msdn.microsoft.com/en-us/library/ms188354.aspx "EXECUTE AS Clause (Transact-SQL)") clause.  To cut a long story short, the functionality hass been encapsulated into a stored procedure (attached) which has the WITH EXECUTE AS OWNER clause to elevate the permissions to the database owner.  There are a number of requirements though:

* The database owner has to be set to “sa”
* The database has to have the [TRUSTWORTHY](http://msdn.microsoft.com/en-us/library/ms187861.aspx "TRUSTWORTHY Database Property") option set to ON
* The database role “db_passwordmanager” should be created in the database

NOTE: The attached script checks and sets these options, so please execute with caution.

A number of validation checks are performed, including:

* check if a login was passed
* login has to be 8 character long
* check if login has a valid format
* check if the login is a valid database user
* check if the [db_passwordmanager] role exists
* check if the currently logged on user is a member of the allowed role/s
* check if password is empty
* check minimum password length
* compare password to login
* other custom validations

If all these validations pass a dynamic SQL statment is constructed with the [ALTER LOGIN](http://msdn.microsoft.com/en-us/library/ms189828.aspx "ALTER LOGIN (Transact-SQL)") command and stored in the _@cmd_ variable.  The varaiable is then executed using the [_sp_executesql_](http://msdn.microsoft.com/en-us/library/ms188001.aspx "sp_executesql (Transact-SQL)") stored procedure, which is enclsed in a [TRY…CATCH](http://msdn.microsoft.com/en-us/library/ms175976.aspx "TRY...CATCH (Transact-SQL)") statement.  Additional custom code can also be added at this point; one example of this could be an email notification to the end-user using [Database Mail](./blog/index.php/2011/03/create-a-database-mail-profile-in-4-steps-or-less/ "Create a Database Mail profile in 4 Steps (or less)") and which would contain the new password.  Another example of custom code could be storing the password change events in an audit table.  Since the stored procedure will be created only in the database where this functionality s required, each database can have it’s own customisations.  Basically it’s up to you.

A copy of the script containing the stored procedure can be downloaded from here: [usp_alterloginpassword](/assets/article_files/2012/08/delegate-password-management-to-unpriviliged-database-users.zip).
