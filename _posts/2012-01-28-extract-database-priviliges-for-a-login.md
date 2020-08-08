---
layout: post
date:   2012-01-28
title:  "Extract Database Priviliges for a Login"
permalink: ./blog/index.php/2012/01/extract-database-priviliges-for-a-login/
categories: blog
published: true
tags: [Code Samples, Database Administration, Database Documentation, Security, Database Migration, Security, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, Upgrade]
comments: false
---
A common post-implementation requirement is the checking or verification of database privileges granted to logins.  This is usually triggered by an audit, a security breach, or (preferably) a proactive approach to security.  In SQL Server 2000 permissions were quite simple.  A login had access to a database or not.  The database user could be granted SELECT, INSERT, UPDATE, DELETE, or EXECUTE on database objects (depending on the type) or added to a database role inheriting the privileges granted to that role.  Permissions could be retrieved using the [sp_helprotect (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms190310.aspx) stored procedure passing the user or role name as a named parameter.

SQL Server 2005 saw the introduction of a more granular security model as well as additional database object types such as ASSEMBLY, CERTIFICATE, QUEUE, and SCHEMA to name a few.  A full list of database permissions can be obtained using the below query.

``` sql
SELECT [state_desc], [permission_name]
FROM [sys].[database_permissions]
WHERE [class] = 0;
```

Obtaining the permissions granted to a user can be obtained using the following query which retrieves this information from the sys.database_principals DMV.

``` sql
SELECT
    [prin].[name] [database_principal],
    [sec].[state_desc] + '' '' + [sec].[permission_name] [permission_name]
FROM [sys].[database_permissions] [sec]
  INNER JOIN [sys].[database_principals] [prin]
      ON [sec].[grantee_principal_id] = [prin].[principal_id]
WHERE [prin].[name] = 'login001'
AND [sec].[class] = 0
ORDER BY [database_principal], [permission_name];
```

Similarly, obtaining the membership in database roles can be obtained using:

``` sql
SELECT
    [u].[name] [member_name],
    [g].[name] [database_role]
FROM [sys].[database_role_members] [m]
    INNER JOIN [sys].[database_principals] [u]
        ON [u].[principal_id] = [m].[member_principal_id]
    INNER JOIN [sys].[database_principals] [g]
        ON [g].[principal_id] = [m].[role_principal_id]
WHERE [u].[name] = 'login001'
ORDER BY [member_name], [database_role];
```

The above queries can be modified slightly and encapsulated into a stored procedure to retrieve login permissions for a specific database, or for all logins in a database.

The first change is a modification to the WHERE clause of both queries replacing the login name with a variable as shown below:

### Query 1 ###

``` sql
WHERE [prin].[name] LIKE ISNULL(@loginname, '%')
```

### Query 2 ###

``` sql
WHERE [u].[name] LIKE ISNULL(@loginname, '%')
```

The next phase would be to execute the stored procedure for any given database.  This can be achieved using dynamic SQL techniques.  For brevity the entire script can be [downloaded from here](/assets/article_files/2012/01/extract-database-priviliges-for-a-login.zip).  You will notice that the @1 string in the stored procedure is being replaced by the database name (if verified).  For this to work the stored procedure has to be executed by a member fo the _sysadmin_ or _securityadmin_ fixed server roles.
