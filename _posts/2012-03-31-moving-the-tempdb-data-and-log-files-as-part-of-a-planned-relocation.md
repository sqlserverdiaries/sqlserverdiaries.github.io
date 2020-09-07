---
layout: post
date:   2012-03-31
title:  "Moving the tempdb Data and Log Files as Part of a Planned Relocation"
permalink: ./blog/index.php/2012/03/moving-the-tempdb-data-and-log-files-as-part-of-a-planned-relocation/
categories: blog
published: true
tags: [Code Samples, Database Administration, Database Migration, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, tempdb, Windows, Storage]
comments: false
---
A colleague recently told me that an SQL Server instance _tempdb_ was installed to the _Program Files_ folder of the _C:_ drive and that occasionally the server was complaining of low disk space.  The only way this could be solved was by restarting the server. The _tempdb_ is a system database which stores intermediary objects used by queries (e.g. temporary tables and data for table variables), and index pages for indexes created with the [SORT_IN_TEMPDB](http://msdn.microsoft.com/en-us/library/ms188281.aspx "SORT_IN_TEMPDB Option For Indexes") option to name a few. The _tempdb_ can be moved in three steps as shown below. The first step is to determine the logical file names of the _tempdb_ database and their current location on the disk.

``` sql
-- SQL Server 2000
USE [tempdb]
GO
SELECT [name], [filename]
FROM dbo.sysfiles;

-- SQL Server 2005 and later
USE [tempdb]
GO
SELECT [name], [physical_name]
FROM sys.database_files;
```

The next step is to change the location of each file by using the ALTER DATABASE command.

``` sql
USE [master]
GO
ALTER DATABASE [tempdb]
MODIFY FILE (NAME = N'tempdev', FILENAME = N'D:\MSSQL\Data\tempdb.mdf');
GO
ALTER DATABASE [tempdb]
MODIFY FILE (NAME = N'templog', FILENAME = N'E:\MSSQL\Data\templog.ldf');
GO
```

The above will return the following results:

``` text
-- SQL Server 2000
File 'tempdev' modified in sysaltfiles. Delete old file after restarting SQL Server.
File 'templog' modified in sysaltfiles. Delete old file after restarting SQL Server.

-- SQL Server 2005 and later
The file "tempdev" has been modified in the system catalog. The new path will be used the next time the database is started.
The file "templog" has been modified in the system catalog. The new path will be used the next time the database is started.
``` text

The third step is to stop and restart the SQL Server instance. Because _tempdb_ is re-created each time the instance of SQL Server is started, you do not have to physically move the data and log files. The files are created in the new location when the service is restarted.  Until the service is restarted, _tempdb_ continues to use the data and log files in the original location. Finally you can (should) verify that the new location is being used by executing the queries for the first step.  You will also have to delete the old files manually.
