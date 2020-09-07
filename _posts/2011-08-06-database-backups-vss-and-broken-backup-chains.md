---
layout: post
date:   2011-08-06
title:  "Database Backups, VSS and Broken Backup Chains"
permalink: ./blog/index.php/2011/08/database-backups-vss-and-broken-backup-chains/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, Virtualization, SQL Server 2000, SQL Server 2005, SQL Server errors, Windows]
comments: false
---
One of the simplest database backup procedures is to back up the database to disk using a script (or the SQL Server Maintenance Plan GUI). The minimum command necessary to back up a database is:

``` sql
BACKUP DATABASE [DatabaseName] TO DISK='[FilePath]\[FileName].BAK'
```

Using a similar command, backing up the transaction log for a database in FULL or BULK recovery mode is:

``` sql
BACKUP LOG [DatabaseName] TO DISK='[FilePath]\[FileName].LOG'
```

More information about database backups, the architecture and other backup options can be found in the [SQL Server Books Online - BACKUP (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms186865.aspx).

A challenge we had a while ago was caused by the Windows 2003 Server NTBackup application. This has been removed from Windows Server 2008 and subsequent operating systems and has been replaced by Microsoft’s Data Protection Manager (DPM). Alternatively one may use other third-party products (which I won’t mention here) in the backup strategy. The problem was that when NTBackup connects to SQL Server using the Volume Shadow Copy (VSS) Writer service to back up the items marked in the “Selections”, the application performs a full database backup of all database effectively breaking the backup chain. To explain the term "backup chain", consider the following scenario.

A full (F) database backup to disk is taken daily at 18:30 and transaction (T) log backups performed every four hours as shown below. The iteration from the full backup to the subsequent full backup forms a backup chain (sequence 0 to 6). Simplified, a point-in-time recovery is possible at, for example at 08:00 by restoring the full backup taken at 18:30 on the previous day and rolling forward all transaction log backups up to the desired time.


Time | 06:00 | 10:00 | 14:00 | 18:00 | 18:30 | 22:00 | 02:00 | 06:00
---- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---:
Type | T | T | T | T | F | T | T | T
Sequence | 3 | 4 | 5 | 6 | 0 | 1 | 2 | 3

An additional full backup is taken outside the above schedule (say, at 15:00), and the backup file moved or discarded after use. SQL Server records the extra full backup by assigning a range of [Log Sequence Numbers (LSN)](http://msdn.microsoft.com/en-us/library/ms190411.aspx). Should a point-in-time recovery be required, the extra backup has to be available in order to apply the transaction log backups taken after the extra full backup. Because of the gap in the LSNs this also means that a point-in-time recovery is only possible using the transaction log backups taken prior to performing the extra full backup. It would have been kind-of hard to explain to a client who has deleted some data erroneously or encountered database corruption that we wouldn’t have been able to restore to the required time because one of the backup files was unavailable!

A solution we had attempted was to exclude the SQL Server data folders from the NTBackup selections leaving only the files listed below.

#### SQL Server 2000 ####

1. _distmdl.mdf_ &amp; _distmdl.ldf_ - Templates for Distribution database used in Replication

#### SQL Server 2005 ####

1. _distmdl.mdf_ &amp; _distmdl.ldf_ - Templates for Distribution database used in Replication
2. *.cer_ files - SQL Server default certificates
3. _mssqlsystemresource.mdf_ &amp; _mssqlsystemresource.ldf_ - A read-only database that contains all system objects

It is necessary to back up the above using an alternate tool (such as NTBackup) since they cannot be backed up using SQL Server. After implementing this suggestion on a test server we found that VSS backed up the databases anyway. We tried replacing the Service startup account with a local user having "Backup Operator" privileges and a number of "Local Security Policy" settings however this caused the VSS copy to fail.

Meanwhile we found out that this behaviour is present only on Windows 2003 servers due to an enhancement(...?!!) of the NTBackup utility. This problem is more serious than first thought. I tried performing a point-in-time restore of one of the databases hosted on one of the affected servers. Unfortunately this was not possible because the VSS copy to tape did break the backup chain (as described earlier). As a result we had proven that we would not be able to perform a point-in-time restore on the affected SQL Server instances. If you actually manage to go through the documentation in the links below you will see mention of the [SQL Writer Service](http://msdn.microsoft.com/en-us/library/ms175536.aspx) or MSDEWriter. I stopped the SQLWriter service on the test server and set it to start manually. That way it did not back up any of the databases on the test server and the backup chain was not broken. I did not however find a way to control (and stop) the (SQL Server 2000) MSDEWriter since this is not displayed in the machine's Services list. As a workaround the Local Service _"NT AUTHORITY/SYSTEM_" login was revoked access (deleted) to the SQL Server 2000 instance which sorted the problem. It did cause the NTBackup utility to log errors when attempting to back up the SQL Server databases but we informed our Backup Administrators to ignore these messages.

Back to the SQL Server 2005 (and later) problem. Although it was solved by disabling the SQLWriter service, should the service be enabled (for whatever reason) the backup application would break the backup chain. This is also true if a database backup is taken outside of schedule. I sorted this by adding the below code to the backup stored procedures (we do not use the Maintenance Plan GUI) on all managed SQL Server instances. At this point the only problem is that, if the MSDE or VSS Writer services do back up the databases, the routines will create an additional set of (full database) backup files thus requiring additional storage space.

``` sql
-- check if FULL backup for current database exists in MSDB backupset table
SET @is_snapshot = 0;
SET @backup_start_date = NULL;

SELECT TOP 1 @backup_start_date = [backup_start_date], @is_snapshot = [flags]
FROM msdb..backupset
WHERE [type] = 'D'
AND [database_name] = @name
AND [database_backup_lsn] != 0
ORDER BY [backup_start_date] DESC;

IF (@backup_start_date IS NULL) -- Date and time the backup operation started. Can be NULL
OR (@is_snapshot = 2) -- Flag bits: If "2" backup was taken using the WITH SNAPSHOT option
BEGIN
RAISERROR('Cannot perform a transaction log backup for database ''%s'', because 
  a current database backup does not exist. Performing a full database backup for 
  database ''%s''.', 16, 1, @name, @name);
-- trigger full backup
-- the only drawback is that the full backup will be stored in the same folder 
-- as the transaction log backup file

-- START FULL BACKUP
END;
```

The following links might provide some background information about this issue:

* [How do I get ntbackup to stop breaking the LSN backup chain in msdb..backupset](http://www.experts-exchange.com/Storage/Backup_Restore/Q_23900447.html)

* [The Basics of the Volume Shadow Copy Service (VSS)](http://blogs.technet.com/josebda/archive/2007/10/10/the-basics-of-the-volume-shadow-copy-service-vss.aspx)

* [SQL Server records a backup operation in the backupset history table when you use VSS to back up files on a volume](http://support.microsoft.com/kb/951288)

* [The Ntbackup.exe operation may break the differential backup chain of a SQL Server database and may invalidate the differential backups when you perform a snapshot backup of the database](http://support.microsoft.com/kb/903643)

* [Error 800423f4 appears in the backup log file when you back up a volume by using the Volume Shadow Copy service in Windows Server 2003](http://support.microsoft.com/kb/828481)

* [Error message when you use the Volume Shadow Copy Service (VSS) to back up SQL Server 2000 database files or SQL Server 2000 Desktop Engine (MSDE) database files: &quot;'MSDEWriter' has reported an error 0x800423f4&quot;](http://support.microsoft.com/kb/912414)

* [SQL Server 2005 connectivity and Volume Shadow Copy Service (VSS)](http://support.microsoft.com/kb/919023)

* [SQL Writer in SQL Server 2005: A Guide for SQL Server Backup Application Vendor](http://technet.microsoft.com/en-gb/library/cc966520.aspx)
