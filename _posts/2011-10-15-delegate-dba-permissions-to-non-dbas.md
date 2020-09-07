---
layout: post
date:   2011-10-15
title:  "Delegate DBA Permissions to non-DBAs"
permalink: ./blog/index.php/2011/10/delegate-dba-permissions-to-non-dbas/
categories: blog
published: true
tags: [Database Administration, Security, Development, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, Code Samples]
comments: false
---
In an organisation where Development, Test and Production environments are segregated and managed by a central team of DBAs sometimes developers or testers require a higher degree of privileges to specific users or groups of users in order to implement schema changes, creation of roles, etc.

In SQL Server 2000, when this type of permission is required a quick solution is to add the user as a member of the _db\_datareader, db\_datawriter, db\_securityadmin, db\_ddladmin_ fixed database roles.  This also applies to later versions of SQL Server however, since the 2005 release, Microsoft have added a higher degree of granularity to the permissions.  More details about the fixed database roles can be found at [Permissions of Fixed Database Roles (Database Engine)](http://msdn.microsoft.com/en-us/library/ms189612.aspx).

The full list of Database permissions granted or denied can be obtained using the following query:

``` sql
SELECT [state_desc], [permission_name]
FROM [sys].[database_permissions]
WHERE [class] = 0
```

Note that the above query will only work for permissions that have been set.

The following list explains what each Database permission means:

* ALTER  
  Grants or denies the ability to alter the existing database.

* ALTER ANY APPLICATION ROLE  
  Grants or denies the ability to create, drop, or alter application roles. The db_securityadmin fixed database role has this permission implicitly.

* ALTER ANY ASSEMBLY  
  Grants or denies the ability to create, drop, or alter CLR assemblies. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY ASYMMETRIC KEY  
  Grants or denies the ability to create, drop, or alter asymmetric keys for encryption. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY CERTIFICATE  
  Grants or denies the ability to create, drop, or alter certificates for encryption. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY CONTRACT  
  Grants or denies the ability to create and drop contracts for service broker. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY DATABASE DDL TRIGGER  
  Grants or denies the ability to create, drop, or alter DDL triggers at the database level (not the server level). The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY DATABASE EVENT NOTIFICATION  
  Grants or denies the ability to create and drop database event notifications for service broker. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY DATASPACE  
  Grants or denies the ability to create a partition schema within the database. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY FULLTEXT CATALOG  
  Grants or denies the ability to create, alter, or drop fulltext catalogs within the database. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY MESSAGE TYPE  
  Grants or denies the ability to create, alter, or drop message types for service broker. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY REMOTE SERVICE BINDING  
  Grants or denies the ability to create, alter, or drop remote service bindings for service broker. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY ROLE  
  Grants or denies the ability to create or drop user-defined database roles. The db_securityadmin fixed database role has this permission implicitly.

* ALTER ANY ROUTE  
  Grants or denies the ability to create, alter, or drop routes for service broker. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY SCHEMA  
  Grants or denies the ability to create, alter, or drop schema within the database. The db_accessadmin, db_ddladmin, and db_securityadmin fixed database roles have this permission implicitly.

* ALTER ANY SERVICE  
  Grants or denies the ability to create or drop services for service broker. The user also must have REFERENCES permissions for all queues and contracts specified for the service. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY SYMMETRIC KEY  
  Grants or denies the ability to create, drop, or alter symmetric keys for encryption. The db_ddladmin fixed database role has this permission implicitly.

* ALTER ANY USER  
  Grants or denies the ability to create, alter, or drop users within the database. The db_accessadmin fixed database role has this permission implicitly.

* AUTHENTICATE  
  Grants or denies the ability to extend impersonation across databases even though explicit access isn"t normally permitted.

* BACKUP DATABASE  
  Grants or denies the ability to backup the database. The db_backupoperator fixed database role has this permission implicitly.

* BACKUP LOG  
  Grants or denies the ability to backup the transaction log of the database. The db_backupoperator fixed database role has this permission implicitly.

* CHECKPOINT  
  Grants or denies the ability to issue a CHECKPOINT statement against the database. The db_backupoperator fixed database role has this permission implicitly.

* CONNECT  
  Grants or denies the ability to enter the database. When a new user is created, it is granted by default.

* CONNECT REPLICATION  
  Grants or denies the ability to connect to the database as a subscriber for the purpose of retrieving a publication via replication.

* CONTROL  
  Grants the equivalent to ownership over the database. The db_owner fixed database role has this permission implicitly.

* CREATE AGGREGATE  
  Grants or denies the ability to create a user-defined aggregate function defined by an assembly. The REFERENCES permission on the assembly must also be possessed.

* CREATE ASSEMBLY  
  Grants or denies the ability to create or drop an assembly within a SQL Server database. If the assembly permission set requires EXTERNAL_ACCESS, the login must also have EXTERNAL ACCESS ASSEMBLY permissions. If the permission set requires UNSAFE, the login must be a member of the sysadmin fixed server role. Unlike ALTER ANY ASSEMBLY, the user must own or have CONTROL permissions on the assembly in order to drop it.

* CREATE ASYMMETRIC KEY  
  Grants or denies the ability to create or drop an asymmetric key. Unlike ALTER ANY ASYMMETRIC KEY, the user must own or have CONTROL permissions on the asymmetric key in order to drop it.

* CREATE CERTIFICATE  
  Grants or denies the ability to create or drop a certificate. Unlike ALTER ANY CERTIFICATE, the user must own or have CONTROL permissions on the certificate in order to drop it.

* CREATE CONTRACT  
  Grants or denies the ability to create a contract for service broker. Unlike ALTER ANY CONTRACT, the user must own or have CONTROL permissions on the contract in order to drop it.

* CREATE DATABASE DDL EVENT NOTIFICATION  
  Grants or denies the ability to create and drop database event notifications for service broker. Unlike ALTER ANY DATABASE DDL EVENT NOTIFICATION, the user must own the database DDL event notification in order to drop it.

* CREATE DEFAULT  
  Grants or denies the ability to create a default. This permission is granted implicitly to the db_ddladmin and db_owner fixed database roles. In SQL Server 2005 or higher compatibility mode, the user will still need ALTER SCHEMA rights to create one in a particular schema.

* CREATE FULLTEXT CATALOG  
  Grants or denies the ability to create and drop fulltext catalogs within the database. Unlike ALTER ANY FULLTEXT CATALOG, the user must own the fulltext catalog in order to drop it.

* CREATE FUNCTION  
  Grants or denies the ability to create a function. This permission is granted implicitly to the db_ddladmin and db_owner fixed database roles. In SQL Server 2005 or higher compatibility mode, the user will still need ALTER SCHEMA rights to create one in a particular schema.

* CREATE MESSAGE TYPE  
  Grants or denies the ability to create a message type for service broker. Unlike ALTER ANY MESSAGE TYPE, the user must own the message type in order to drop it.

* CREATE PROCEDURE  
  Grants or denies the ability to create a stored procedure. This permission is granted implicitly to the db_ddladmin and db_owner fixed database roles. In SQL Server 2005 or higher compatibility mode, the user will still need ALTER SCHEMA rights to create one in a particular schema.

* CREATE QUEUE  
  Grants or denies the ability to create, alter, or drop a queue for service broker. The user must own the queue in order to drop it.

* CREATE REMOTE SERVICE BINDING  
  Grants or denies the ability to create, alter, or drop remote service bindings for service broker. Unlike ALTER ANY REMOTE SERVICE BINDING, the user must own the remote service binding in order to drop it.

* CREATE ROLE  
  Grants or denies the ability to create or drop user-defined database roles. Unlike ALTER ANY ROLE, the user must own or have CONTROL permission over the role to drop it.

* CREATE ROUTE  
  Grants or denies the ability to create, alter, or drop routes for service broker. Unlike ALTER ANY ROUTE, the user must own the route in order to drop it.

* CREATE RULE  
  Grants or denies the ability to create a rule. This permission is granted implicitly to the db_ddladmin and db_owner fixed database roles. In SQL Server 2005 or higher compatibility mode, the user will still need ALTER SCHEMA rights to create one in a particular schema.

* CREATE SCHEMA  
  Grants or denies the ability to create schema in the database. Unlike ALTER ANY SCHEMA, a user with this permission can only drop a schema it owns it or has CONTROL permission over it.

* CREATE SERVICE  
  Grants or denies the ability to create or drop services for service broker. The user also must have REFERENCES permissions for all queues and contracts specified for the service. Unlike ALTER ANY SERVICE, the user must own the service in order to drop it.

* CREATE SYMMETRIC KEY  
  Grants or denies the ability to create or drop a symmetric key. Unlike ALTER ANY SYMMETRIC KEY, the user must own or have CONTROL permissions on the symmetric key in order to drop it.

* CREATE SYNONYM  
  Grants or denies the ability to create a synonym. This permission is granted implicitly to the db_ddladmin and db_owner fixed database roles. In SQL Server 2005 or higher compatibility mode, the user will still need ALTER SCHEMA rights to create one in a particular schema.

* CREATE TABLE  
  Grants or denies the ability to create a table. This permission is granted implicitly to the db_ddladmin and db_owner fixed database roles. In SQL Server 2005 or higher compatibility mode, the user will still need ALTER SCHEMA rights to create one in a particular schema.

* CREATE TYPE  
  Grants or denies the ability to create a type. This permission is granted implicitly to the db_ddladmin and db_owner fixed database roles. In SQL Server 2005 or higher compatibility mode, the user will still need ALTER SCHEMA rights to create one in a particular schema.

* CREATE VIEW  
  Grants or denies the ability to create a view. This permission is granted implicitly to the db_ddladmin and db_owner fixed database roles. In SQL Server 2005 or higher compatibility mode, the user will still need ALTER SCHEMA rights to create one in a particular schema.

* CREATE XML SCHEMA COLLECTION  
  Grants or denies the ability to create an XML schema collection. This permission is granted implicitly to the db_ddladmin and db_owner fixed database roles. In SQL Server 2005 or higher compatibility mode, the user will still need ALTER SCHEMA rights to create one in a particular schema.

* DELETE  
  Grants or denies the ability to issue the DELETE command against all applicable objects within the database. Best practices say not to use this at the database level, but rather at the schema level.

* EXECUTE  
  Grants or denies the ability to issue the EXECUTE command against all applicable objects within the database. Best practices say not to use this at the database level, but rather at the schema level.

* INSERT  
  Grants or denies the ability to issue the INSERT command against all applicable objects within the database. Best practices say not to use this at the database level, but rather at the schema level.

* REFERENCES  
  Grants or denies the ability to create relationships between objects such as foreign keys on tables referencing other tables or the use of SCHEMABINDING by views and functions. The permission is granted implicitly to the db_ddladmin fixed database role.

* SELECT  
  Grants or denies the ability to issue the command against all applicable objects within the database. Best practices say not to use this at the database level, but rather at the schema level.

* SHOWPLAN  
  Grants or denies the ability to see execution plans for queries executing within the database.

* SUBSCRIBE QUERY NOTIFICATIONS  
  Grants or denies the ability to create a subscription to a query notification for when the results of a particular query would change.

* TAKE OWNERSHIP  
  Grants or denies the ability to transfer ownership of an XML schema from one user to another.

* UPDATE  
  Grants or denies the ability to issue the UPDATE command against all applicable objects within the database. Best practices say not to use this at the database level, but rather at the schema level.

* VIEW DATABASE STATE  
  Grants or denies the ability to view conditions about the current database via the database-level dynamic management views or functions.

* VIEW DEFINITION  
  Grants or denies the ability to view the underlying T-SQL or metadata on objects within the database. The db_securityadmin database fixed server role has this permission implicitly.

A summary of the syntax to assign these permissions is:

``` sql
USE [DatabaseName]
GO
GRANT [permission] TO [principal_name]
```

More details can be found in the SQL Server Books Online topic [GRANT Database Permissions (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms178569.aspx).

These permissions can also be set using the SSMS interface but you’ll have to tick a few check boxes.
