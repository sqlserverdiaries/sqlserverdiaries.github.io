---
layout: post
date:   2012-07-28
title:  "Automatically Restore a Database to Test Backups"
permalink: ./blog/index.php/2012/07/automatically-restore-a-database-to-test-backups/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, Database Migration, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, SQL Server Agent, Storage, Testing, Upgrade]
comments: false
---
All environments (hopefully…) have a proper backup strategy in place.  To tell the truth I’ve seen databases which were being backed up and the client asked me: _“Why is it that the backup for an 80GB database is only 4GB?”_.  In this particular case I discovered that the database recovery model was set to FULL and only full backups were being carried out.  Of course the transaction log kept increasing in size from the start of the business and was never backed up to free up the space used by committed (and checkpointed) transactions.  But that’s another story.

So the DBA got the backup strategy polished and working to the business requirements.  The backups are stored off-site and all the best practices know of or found on the Net are being followed.  The only problem is that testing the validity of the backups will take a hefty slice of the DBAs time so, up to that point a DBA is working with the _assumption_ that the backups are valid.  In [another post](./blog/index.php/2012/05/generate-restore-database-command-from-an-existing-backup/) I showed how a RESTORE DATABASE command can be generated from an existing backup file.  I expanded and built on this functionality to create a parametized stored procedure with which database restores can be scheduled and carried out automatically.  A copy of the stored procedure can be downloaded from the link at the end of this post.

I named the stored procedure _usp\_restore\_and\_replace_.  Values for the _@DatabaseName_, _@RestorePath_, _@DataFileLocation_ and _@LogFileLocation_ variables are required.  You will probably notice that only one location for the DATA files and another for the LOG can be passed.  Since this stored procedure will mostly be used to do a test restore, and the database will probably be dropped once the process is complete I didn’t add the extra complexity.  This means that if the database being restored has multiple filegroups and/or files, all the data files will be restored to the same drive and the same applies to [all] the log files.

The other variables are optional and have defaults set. Depending on the values of the optional _@DebugMode_ variable the stored procedure can output a log.  One can start with level zero which will do nothing and will only show what will happen.  Options 1 to 3 will show increasing detail levels with 3 being the highest and the most detailed.

The stored procedure also handles multiple backups within the same backup file, as well as multiple backup files in the same folder where the latest file is being used for the restore.  To identify the latest file I am using the _xp\_cmdshell_ stored procedure which is enabled at the beginning of the process and disabled when the process is complete.  The source folder can also be a UNC path, but restoring from a remote file will increase the load on your network resources. The stored procedure has been tested with both compressed and uncompressed databases ranging in size from a few MB to 100GB and hosted on SQL Server 2005, 2008 and 2008 R2 Editions.  The only difference is that for the 2008 R2 version the _#BackupFileList_ temporary table should have the extra column _TDEThumbprint_ defined as varbinary(32) due to a difference in the output from the RESTORE FILELISTONLY command.

The stored procedure will also execute DBCC UPDATEUSAGE, DBCC CHECKDB commands and ALTER INDEX ALL on all tables in the restored database.

Of course the stored procedure can also be used to “replicate” a database to an alternate location for reporting purposes for example.  Although this is quite simple it will entail a full restore every time the stored procedure is executed.  Alternatives to “replicating” a database are Log Shipping, Database Replication, Database Mirroring with Snapshots, and the new AlwaysOn technology (SQL Server 2012) all of which will not load the network resources as much as a full restore will do.

The stored procedure can be called manually using SSMS or implemented in an SQL Server Agent Job using the below sample code:

``` sql
EXEC dbo.usp_restore_and_replace
    @DatabaseName = 'AdventureWorks',
    @RestorePath = 'D:\TEMP',
    @DataFileLocation = 'D:\MSSQL\DATA\',
    @LogFileLocation = 'E:\MSSQL\DATA\',
    @FileNumber = 1,
    @ReplaceExisting = 1,
    @RestrictAccess = 0,
    @StatsValue = 5,
    @DebugMode = 3;
```

A copy of the usp_restore_and_replace stored procedure can be [downloaded from here](/assets/article_files/2012/07/automatically-restore-a-database-to-test-backups.zip).
