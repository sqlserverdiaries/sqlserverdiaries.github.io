---
layout: post
date:   2011-09-24
title:  "Quick Full Backup Script Sample"
permalink: ./blog/index.php/2011/09/quick-full-backup-script-sample/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, Database Migration, SQL Server, T-SQL Programming, Storage]
comments: false
---
This week I’m going to share a handy full database backup script which I find useful when I have to create an out-of-schedule full database backup. All I do is change the database name, the folder where the backup will be stored and execute. Of course this script does not perform and checks such as:

* that the current user is a member of the _sysadmin_, _db\_owner_ or a _db\_backupoperator_ fixed server and database roles respectively;
* that the database exists;
* that the destination folder is a valid path;
* that the database is not the _“tempdb”_;
* that the database is not in one of _Read-Only_, _Offline_, _Suspect_, or other invalid states;
* any other necessary checks.

``` sql
USE [master]
GO

SET NOCOUNT ON;

DECLARE @databasename nvarchar(128),    -- database name
        @destfolder nvarchar(256),      -- destination folder to store the backup file
        @fileName nvarchar(256),        -- backup file filename
        @fileDate nvarchar(20),         -- date formatted and used for file name
        @fileTime nvarchar(20),         -- time formatted and used for file name
        @backupsetdescription nvarchar(256); -- backup set identifier

SET @databasename = N'AdventureWorks';
SET @destfolder = N'D:\TEMP\';
SET @backupsetdescription = N'AD-Hoc Database Backup';

-- set date and description
SET @fileDate = CONVERT(VARCHAR(20),CURRENT_TIMESTAMP,112);
SET @backupsetdescription = @backupsetdescription + ' ' +
    CONVERT(VARCHAR(20),CURRENT_TIMESTAMP,120);

-- set time
SET @fileTime = CONVERT(VARCHAR(20),CURRENT_TIMESTAMP,108);
SET @fileTime = REPLACE(@fileTime, ':', '');

-- backup!
SET @fileName = @destfolder + @databasename + '_' + @fileDate + @fileTime + '.BAK';
BACKUP DATABASE @databasename
TO DISK = @fileName
WITH
    NAME = @backupsetdescription,
    INIT, STATS = 25, COPY_ONLY;
GO
```

As you can see the script is quite simple. The backup command used the [COPY_ONLY](http://msdn.microsoft.com/en-us/library/ms191495.aspx) option so that we won’t break the backup chain – note that this option is available in SQL Server 2005 and later only. The script will create a BAK file in the destination folder defined and whose file name will be in the following format:

> [DatabaseName]_[DateTime].BAK

The script can also be [downloaded from here](/assets/article_files/2011/09/quick_full_backup_script_sample.zip).
