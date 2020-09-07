---
layout: post
date:   2012-11-10
title:  "Migrate Databases Using Backup-Restore"
permalink: ./blog/index.php/2012/11/migrate-databases-using-backup-restore/
categories: blog
published: true
tags: [command-line utilities, Backup and Recovery, Database Administration, Virtualization, Connection Strings, Database Migration, DNS, Linked Servers, SQL Server, SQL Server Integration Services, SSIS, Testing, Upgrade]
comments: false
---
Migrating a database can be a major headache, especially due to the downtime or outage incurred by all systems accessing the database.  This is exacerbated when the data files which have to be moved are considerably large.  Obtaining approval for a suitable and longish downtime might not always be possible either.

An effective method to tackle such situations is to migrate the database (or databases) using full, differential and transaction log backups.  But before starting, the dependent object must be identified.  To start off, my suggestion is that application connection strings are reviewed and changed to use a DNS as explained in the article [SQL Server Connection Strings, Unique Application DNS and Listening Ports](http://sqlserverdiaries.com/blog/index.php/2011/04/sql-server-connection-strings-unique-application-dns-and-listening-ports/ "SQL Server Connection Strings, Unique Application DNS and Listening Ports").

Once all applications are using the DNS instead of the actual SQL Server host/instance name the next step is identifying which server objects are required.  These include but are not limited to Windows and/or SQL Logins, Linked Server, Server Triggers, Traces, SSIS packages, SQL Agent jobs, etc.  If you are using Windows Authentication (recommended) you can generate CREATE LOGIN statements from scratch.  If however you are [also] using SQL Authentication then the logins will have to be migrated to retain both the same password and also the same SID.  This procedure together with the necessary scripts is explained in the [Script Logins from Database Users](http://sqlserverdiaries.com/blog/index.php/2011/03/script-logins-from-database-users/ "Script Logins from Database Users") article.  My recommendation is that SQL logins are migrated as close as possible to the final migration to make sure that you have the latest passwords.

In the case of Linked Servers, there isn’t a way that passwords used to map to remote logins can be extracted.  You will either have to obtain the passwords from the original scripts, your password safe, or as a final resort, change the passwords and update the Linked Server/s.

When all the dependencies have been migrated it is time to start moving the database or databases.  The first thing to do is to reduce the TTL (time to live) of the DNS entry to 5 minutes.  Although this will increase the load slightly on your DNS servers, it is a necessary step to ensure that all applications will point to the correct environment.  The TTL change should be carried out around 24 hours before (or as defined in the TTL value) to ensure that all applications are refreshing the value more frequently.

Let us, for example, start with the most recent full backup from 18:00 yesterday evening.  The file can be copied using [robocopy.exe](http://technet.microsoft.com/en-us/library/cc733145.aspx "Robocopy") – the basic syntax to copy a file is:

``` text
robocopy <source_folder> <destination_folder> <file_name>
```

There are other parameters which can be passed to the robocopy.exe command.  I suggest you review the online documentation for an explanation of each option.

Back to the initial database backup.  When restoring the database you have to make sure that the NORECOVERY option is included.  Thus the syntax would look similar to the below:

``` sql
RESTORE DATABASE [AdventureWorks]
FROM DISK='D:\TEMP\AdventureWorks.BAK'
WITH FILE=1, RESTRICTED_USER, NORECOVERY, STATS=10,
MOVE...
```

Once the restore is complete SSMS will show that the database is in a “Restoring” state.  The next step requires that a differential backup is taken as close as possible to the actual migration.  By using a differential backup we will avoid having to restore all the transaction log backups taken following the initial backup.  The syntax to take a differential backup is:

``` sql
BACKUP DATABASE [AdventureWorks]
TO DISK='D:\TEMP\AdventureWorks.DIF'
WITH STATS=10, DIFFERENTIAL;
```

The DIF file is then copied to the target environment and restored using a command similar to the previous one.  It is imperative that the NORECOVERY option is once again included.

The final step of the migration involves stopping your applications, restricting access to the original database, taking a transaction log backup (also known as tail-log backup), and restoring this on the destination.  The T-SQL commands used for these steps are shown below:

``` sql
ALTER DATABASE [AdventureWorks] SET RESTRICTED_USER;
GO

BACKUP LOG [AdventureWorks]
TO DISK='D:\TEMP\AdventureWorks.TRN'
WITH STATS=10;
```

Then:

``` sql
RESTORE LOG [AdventureWorks]
FROM DISK='D:\TEMP\AdventureWorks.TRN'
WITH STATS=10, NORECOVERY;
```

Finally the target database can be “recovered” and access allowed.

``` sql
RESTORE DATABASE [AdventureWorks] WITH RECOVERY;
```

Once the database has been recovered you should change the database owner since when restoring it is the logged on user who will “own” the database.  In the below example the owner is set to the “sa” login.

``` sql
ALTER AUTHORIZATION ON DATABASE::[AdventureWorks] TO [sa];
```

I also make it a point to run DBCC CHECKDB and DBCC UPDATEUSAGE on the new database to ensure that nothing is amiss.  Finally, if the database is still in RESTRICTED_USER mode, you can allow access using the following:

``` sql
ALTER DATABASE [AdventureWorks] SET MULTI_USER;
```

At this point you can modify the DNS entry and reset the TTL to a more appropriate setting (e.g. 24 hours).  Also make sure that the new database is included in the backup strategy.  That’s it.  Now you can start your applications and verify that connections are successful.
