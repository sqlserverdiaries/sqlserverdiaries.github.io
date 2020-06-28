---
layout: post
date:   2011-07-02
title:  "Add files to TEMPDB for optimal performance"
permalink: ./blog/index.php/2011/07/add-files-to-tempdb-for-optimal-performance/
categories: blog
published: true
tags: [Architecture, Database Administration, Performance, Code Samples, SQL Server, Storage, tempdb]
comments: false
---
This is somewhat of a reminder for SQL Server installations.  In a Technet article titled [Storage Top 10 Best Practices](http://technet.microsoft.com/en-us/library/cc966534.aspx) (published in 2006), Microsoft recomend that, in the case of the TEMPBD database, the number of files is equivalent to the number of CPU's.  The below script is an example of how a file can be added.

``` sql
ALTER DATABASE [tempdb]
    ADD FILE (
        NAME = N'tempdev_1',
        FILENAME = N'D:\MSSQL\DATA\tempdb_1.ndf' ,
        SIZE = 25MB ,
        FILEGROWTH = 10MB )
GO
```

The script will return the following message:

> Extending database by 25.00 MB on disk 'tempdev_1'.

Since the  TEMPDB database is created every time the SQL Server service is started, the changes will come into effect at this point.

In my sample script above a 25MB file with a 10MB filegrowth was added to the TEMPDB.  The actual values depend on the workload on the instance.  Another point to remember is that, since SQL Server grows files in a round-robin fashion, the files should be of the same initial size.  You may refer to the [Optimizing tempdb Performance](http://msdn.microsoft.com/en-us/library/ms175527.aspx) article for more information on how to optimize the TEMPDB performance.
