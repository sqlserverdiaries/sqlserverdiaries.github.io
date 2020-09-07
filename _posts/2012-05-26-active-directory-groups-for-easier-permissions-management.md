---
layout: post
date:   2012-05-26
title:  "Active Directory Groups for Easier Permissions Management"
permalink: ./blog/index.php/2012/05/active-directory-groups-for-easier-permissions-management/
categories: blog
published: true
tags: [Architecture, Database Administration, Security, Audit, Security, SQL Server, Windows, Testing]
comments: false
---
SQL Server supports two authentication mechanisms, namely Windows and Mixed Mode. In Windows Authentication only accounts created on the local machine or domain accounts (users, groups, etc.) can be granted access to the SQL Server instance. This is the preferred and recommended (by Microsoft and most DBAs) implementation since the Windows token is passed from the client machine to the database server. The token is then validated with the domain controller and, if successful, authentication is allowed. On the other hand, for Mixed Authentication the support is for both Windows accounts and SQL accounts. As explained previously, for Windows Authentication the authenticator is the domain controller. In the case of SQL Authentication, the authenticator is the SQL Server instance where the connection is attempted. This mechanism requires that the login and password are sent [in clear text over the network] as part of the connection string. Precautions may be taken (such as encrypting the connection) to ensure that the traffic cannot be read, however in most cases the recommendation is that SQL Authentication is avoided.

In an enterprise environment where all servers are joined to a domain, a DBA can benefit from Active Directory management to control access to [windows] authenticated logins. Using AD Groups to grant access to network folders and files is common practice (hopefully…!). Similar concepts can be applied in the case of SQL Server instances, databases and database objects. An AD Group can be granted access to an SQL Server instance (i.e. allowed to authenticate) using syntax identical to when creating a Windows User account:

``` sql
-- Domain User
CREATE LOGIN [DOMAIN\MyDomainLogin] FROM WINDOWS;

-- Domain Group
CREATE LOGIN [DOMAIN\MyDomainGroup] FROM WINDOWS;
```

Once the AD Group has been allowed authentication to the SQL Server instance, access has to be granted to the databases using:

``` sql
CREATE USER [DOMAIN\MyDomainGroup] FOR LOGIN [DOMAIN\MyDomainGroup];
```

From then on the AD Group can be assigned permissions as a “regular” database user. The user can be added to one or more database roles through which it will inherit object permissions granted to that role. The end result is that the domain users which are members of that domain group will be granted permissions on the database objects defined by the database role membership.  This also means that in a way, access to database objects can somewhat be delegated to Active Directory administrators, lessening the burden on DBAs and giving the same DBAs further time to work on more important tasks.
