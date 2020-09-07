---
layout: post
date:   2011-06-04
title:  "Disk Drive 64KB Allocation Units and SQL Server"
permalink: ./blog/index.php/2011/06/disk-drive-64kb-allocation-units-and-sql-server/
categories: blog
published: true
tags: [Architecture, Database Administration, Performance, command-line utilities, SQL Server, Storage, Upgrade, Database Migration]
comments: false
---
This week's article involves about another command line utility however before mentioning the utility I will skim a few particles off the surface of SQL Server storage.

Without going too deep on SQL Server storage, a number of excellent articles have been written on SQL Server storage. Event more information can be obtained by reading the articles or white papers indicated by the below links. Moreover, the SQL Server Books Online (which can be [accessed on the web](http://msdn.microsoft.com/en-us/library/ms130214.aspx) or [downloaded](http://www.microsoft.com/downloads/en/results.aspx?freetext=SQL+Server+Books+Online) and installed on your development/test machine) is another excellent resource for anyone using the SQL Server RDBMS.

* [SQL Server 2000 I/O Basics - Published: January 21, 2005](http://technet.microsoft.com/en-us/library/cc966500.aspx)
* [SQL Server I/O Basics, Chapter 2 - Published: July 19, 2006](http://technet.microsoft.com/en-us/library/cc917726.aspx)
&nbsp;

#### Pages and Extents ####

The basic on-disk storage unit in SQL Server is a page. Each database page is numbered starting from zero and incrementing by one for each FILEGROUP. The page size is 8KB and is filled with system information (see _Understanding Pages and Extents_ link below) and the actual user data. Only the data files (.MDF or .NDF) store data in pages; the log file (.LDF) stores data as sequential log records.

SQL Server reads from data files in extents. An extent is a set of 8 contiguous pages; thus the size of an extent is 64KB.


> **Note**: It is recommended that data files are stored on aligned partitions formatted using an allocation units of 64KB. For more details please refer to the below articles:

* [Disk Alignment Best Practices for SQL Server](http://msdn.microsoft.com/en-us/library/dd758814.aspx)
* [Pre-deployment I/O Best Practices (SQL Server Best Practices Article)](http://www.microsoft.com/technet/prodtechnol/sql/bestpractice/pdpliobp.mspx)
* [Physical Database Storage Design](http://www.microsoft.com/technet/prodtechnol/sql/2005/physdbstor.mspx)

This implies that if the data required by a retrieval operation is physically located within the same extent or in contiguous extents, the database engine will require less reads from disk resulting in quicker data retrieval.  It is important that a DBA bears in mind that there are other factors that lead to better system performance (such as page caching) besides this.  Please refer to the below articles for further information.

* [Pages and Extents Architecture](http://msdn.microsoft.com/en-us/library/cc280360.aspx)
* [Understanding Pages and Extents](http://msdn.microsoft.com/en-us/library/ms190969.aspx)
&nbsp;

#### "So What?" ####

So what does a command-line utility have to do with this?

You can set the allocation unit when formatting the partition (using the _FORMAT_ command or the GUI).  But what if you want to check the allocation unit for an already existing environment?  This is where _FSUTIL_ comes in.

The _FSUTIL_ utility is present in Windows XP, 2003, 7 and 2008.  This [Windows XP documentation for FSUTIL](http://www.microsoft.com/resources/documentation/windows/xp/all/proddocs/en-us/fsutil.mspx) gives more than enough information about the functionality.  As explained, a practical use is to use this utility to discover the allocation unit set.  Running the below in a command prompt window will give the results beneath.

``` text
fsutil fsinfo ntfsinfo D:
```

NOTE: “D:” is the drive being checked

``` text
NTFS Volume Serial Number :       0x825cb4f65cb4e5d7
Version :                         3.1
Number Sectors :                  0x0000000017bd13d7
Total Clusters :                  0x0000000002f7a27a
Free Clusters  :                  0x00000000009b639b
Total Reserved :                  0x0000000000000580
Bytes Per Sector  :               512
Bytes Per Cluster :               4096
Bytes Per FileRecord Segment    : 1024
Clusters Per FileRecord Segment : 0
Mft Valid Data Length :           0x0000000006eb8000
Mft Start Lcn  :                  0x00000000000c0000
Mft2 Start Lcn :                  0x00000000017bd13d
Mft Zone Start :                  0x00000000000c6ea0
Mft Zone End   :                  0x0000000000190740
```

The value of the _Bytes Per Cluster_ will show the allocation unit that was set when formatting the partition. Unfortunately should you need to change the allocation unit in order to, say set it to 64KB, the only way of doing this is to re-format the partition.  So unless you have a maintenance window coming up your environment will require a downtime period to modify this.  One metheod to **reduce** this downtime is to prepare an identical storage partition, stop the SQL Server service and migrate all the database files to this new partition.  As a final step all you'd have to do is switch the partition letters.  Of course not everyone might have the luxury of having extra hardware available to carry out this operation.  Something that makes this easier to implement is if the server is virtualised. Once released the allocated storage space can then be reused for other virtual machines.

I hope you find this article interesting and that it gave you better insight into the topic presented.  Feel free to drop me a line if you need further information.
