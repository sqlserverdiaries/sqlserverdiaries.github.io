---
layout: post
date:   2011-05-21
title:  "SQL Server R2 Express Edition features"
permalink: ./blog/index.php/2011/05/sql-server-r2-express-edition-features/
categories: blog
published: true
tags: [Database Administration, Database Design, Database Documentation, Virtualization, Database Migration, Development, SQL Server, SQL Server 2008 R2, SQL Server Agent, Storage, Upgrade, Architecture]
comments: false
---
An often overlooked and underestimated edition of SQL Server, the Express Edition superceded the SQL Server 2000 MSDE (Microsoft Data Engine) edition.  Introduced with the SQL Server 2005 lineup, this edition allowed applications requiring a small data store to be distrubuted without incurring the cost of a higher-end SQL Server licence.  At the time of writing, an SQL Server 2008 R2 Standard Edition licence costs $2,607 (€1,840) for a server and 10 user cal or $7,525 (€5,313) for a single processor (with unlimited users) licence.  This cost might cause quite a dent in an organisations's initial budget.

_NOTE: Prices mentioned above have been obtained from the [Microsoft Store Online](http://www.microsoftstore.com/)._

The MSDE and SQL Server 2005 versions of this DBMS had certain limitations which, in a highly used system, could be easily reached.  The major limitations are on the CPU, Memory and Database size resources as shown in the below table.

### SQL Server 2005 and 2008 Express Edition ###

Resource | Limit
-------- | ------:
Memory | 1 GB
CPU    | 1
Maximum Database Size | 4 GB

In SQL Server 2008 R2 the maximum database size limit for the Express Edition was increased to 10 GB.  This might seem like a heft increase in alowable storage space however this limit can be reached quite quickly if the database design allows for "waste".  This subject will be covered in a future post, but as an introduction consider this.  In a table which will store person names, surnames, date of birth, date of death, a unique idetifier (not GUID), and a unique key, consider the following comparison.

#### Scenario 1 ####

Column | Data Type | Storage Space (bytes)
------ | --------- | --------------------:
Unique Key | int | 4
Name | varchar(100) | 102
Surname | varchar(100) | 102
Date of Birth | datetime | 8
Date of Death | datetime | 8
Unique Identifier | varchar(10) | 12
Row size |  | 236
&nbsp;

#### Scenario 2 ####

Column | Data Type | Storage Space (bytes)
------ | --------- | --------------------:
Unique Key | int | 4
Name | varchar(100) | 102
Surname | varchar(100) | 102
Date of Birth | date | 3
Date of Death | date | 3
Unique Identifier | char(10) | 10
Row size |  | 224

Although the above difference might not appear "that" large, in a table with millions of rows a difference of 12 bytes on every row will make a difference on storage space, performance to name a few.  One might argue that storage space is cheap, and that with the advent of solid state disks performance won't be an issue.  In that case I urge you to read an excellent article by Solomon Rutzky titled [Disk Is Cheap! ORLY?](http://www.sqlservercentral.com/articles/data-modeling/71725/).  You might also want to read through my earlier posts titled [Estimating the Size of an SQL Server Database](/blog/index.php/2011/05/estimating-the-size-of-an-sql-server-database/) and [Using GUIDs as Primary Keys, or not](/blog/index.php/2011/04/using-guids-as-primary-keys-or-not/).

Back to the SQL Server 2008 R2 Express Edition topic.  The 10 GB database limit will be consumed pretty quickly if the application stores binary data such as JPGs, PDFs, etc. in the database structure.  This is where the [FILESTREAM Storage in SQL Server 2008](http://msdn.microsoft.com/en-us/library/cc949109(v=sql.100).aspx) feature comes in handy in such cases.  Without going too deeply into the architecture and configuration fo this feature, it is basically used to store unstructured (binary) data as mentioned above.  One of the benefits of this feature is that although the unstructured data is stored outside the database files, it offers the identical ACID properties as other database transactions.  Another benefit is that the files can be stored on compressed disk volumes, which translates into further space savings.  There are other benefits such as that implementing this feature allows applications to take advantage of the streaming capabilities of NT File System, or that the maximum file size stored into a FILESTREAM data storage is limited by the size of the disk volume, but I won't go any further.

What relation does this have to this post about SQL Server 2008 R2 Express Edition?  The FILESTREAM feature is available with this Edition too.  I mentioned earlier that the maximum storage size has been upped to 10 GB per database.  This limitation however does not apply to the FILESTREAM data stored in an SQL Server Express database!

Considering that the maximum number of dataabses that an SQL Server instance can host is 32,767 (see [Maximum Capacity Specifications for SQL Server](http://msdn.microsoft.com/en-us/library/ms143432.aspx)) a database developer or DBA can with some ingenuity make organise the application's data into separate databases.

A downside of an Express Edition is that the SQL Server Agent Service is missing, however this functionality can be (creatively) replaced using Windows Scheduled Tasks and scripting using SQLCMD commands, Powershell, or SMO.

Once the organisation's requirements exceed the limitations of the Express Edition, this can be upgraded easily to one of the higher editions.

For a full comparison of the SQL Server 2008 R2 Editions please visit the [Microsoft SQL Server Database Management System](http://www.microsoft.com/sqlserver).
