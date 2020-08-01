---
layout: post
date:   2012-06-09
title:  "A Low-Cost Solution to Track Database Code Changes"
permalink: ./blog/index.php/2012/06/a-low-cost-solution-to-track-database-code-changes/
categories: blog
published: true
tags: [Audit, Backup and Recovery, Database Administration, Database Documentation, T-SQL Programming, Code Samples, Database Documentation, Database Migration, Development, DMV, Security, SQL Server 2008, SQL Server 2005, SQL Server 2008 R2, SQL Server 2012, Testing]
comments: false
---
When developing application code it is always recommended that all source code is backed up, preferably using a version control application to allow for code sharing and providing a change rollback. Using a tool such as SQL Server Management Studio, a developer can store database code developed with SSMS in a code repository. Using SSMS one can create a Project and configure it to interact with a supported source-control application. The only problem is that if the database object code is modified outside the project (or directly within the database) the changes will not be reflected in the source code repository. One might argue that the source control package they are using can reverse engineer an existing database and synchronise the schema with the source code repository. A post published earlier this year and titled [Automated Database Scripting to Preserve Intellectual Property](./blog/index.php/2012/03/automated-database-scripting-to-preserve-intellectual-property/) explains how to back up a database schema using the Database Publishing Wizard. Another low-cost alternative is to use a DDL trigger as explained below.

DDL triggers were introduced with SQL Server 2005 and can be created at either server-level or as database-level triggers. Similarly to DML triggers, a DDL trigger fires when one of the events defined in the trigger object code occurs. A full list of events supported/available can be seen in the MSDN article [DDL Events](http://msdn.microsoft.com/en-us/library/bb522542.aspx).

The attached script (download link at the end of this article) first creates a sample database. The next part of the script creates a table that will store the database changes.

``` sql
CREATE TABLE dbo.tb_databaselog (
    log_pk          int IDENTITY(1,1) NOT NULL,
    log_eventtype   nvarchar(128),
    log_eventtime   datetime NOT NULL,
    log_dbuser      nvarchar(128),
    log_hostname    nvarchar(128),
    log_ipaddress   varchar(48),
    log_application nvarchar(128),
    log_schema      nvarchar(128),
    log_object      nvarchar(128),
    log_tsql        nvarchar(max),
    log_xmlevent    xml NOT NULL,
CONSTRAINT pk_databaselog_logid PRIMARY KEY CLUSTERED ( log_pk ASC )
    WITH (IGNORE_DUP_KEY = OFF)
)
```

The next and final part of the solution is the actual trigger itself. You will observe that the trigger has been set to fire for DDL_DATABASE_LEVEL_EVENTS. Using the [EVENTDATA() function](http://msdn.microsoft.com/en-us/library/ms187909) which returns an XML structure, the script splits specific information into searchable separate parts. The script also uses the [sys.dm_exec_sessions](http://msdn.microsoft.com/en-us/library/ms176013) and [sys.dm_exec_connections](http://msdn.microsoft.com/en-us/library/ms181509) to retrieve and store the application name, host name, and IP address executing the T-SQL statement. The data is finally stored in the table created in the first step.

One drawback of this solution is that the table and DDL trigger have to be implemented in each database for which you want to track changes to the object code. Another item to look out for is that obtaining the IP address requires the VIEW SERVER STATE permission on the server. If you are using Active Directory group permissions as mentioned in the [Active Directory Groups for Easier Permissions Management](./blog/index.php/2012/05/active-directory-groups-for-easier-permissions-management/) post this shouldn’t be much of a problem. If not you will have to execute the below for every database developer.

``` sql
GRANT VIEW SERVER STATE TO [LoginName]
```

The script can be [downloaded from here](/assets/article_files/2012-06-a-low-cost-solution-to-track-database-code-changes/a-low-cost-solution-to-track-database-code-changes.zip).  Of course feel free to modify the code according to your requirements.
