---
layout: post
date:   2011-05-07
title:  "Estimating the Size of an SQL Server Database"
permalink: ./blog/index.php/2011/05/07/estimating-the-size-of-an-sql-server-database/
categories: blog
published: true
tags: [SQL Server 2005, Database Design, Database Documentation, Coding Practices, SQL Server 2008]
comments: false
---
I managed to put together into a Microsoft Excel spreadsheet the formulas to calculate how to estimate the size of a database.  The formulas are based on information found in the SQL Server Books Online at [Estimating the Size of a Database](http://msdn.microsoft.com/en-us/library/ms187445.aspx).  The formulas might differ in other editions.

The files listed below should allow you to get a pretty close idea of the disk space required for tables, clustered indexes and nonclustered indexes.  I did not include space required for storage of Large Object (LOB) data types.  Quoting from the SQL Server Books Online: _"the algorithm to determine exactly how much space will be used to store the LOB data types varchar(max), varbinary(max), nvarchar(max), text, ntext, xml, and image values is complex. It is sufficient to just add the average size of the LOB values that are expected and add that to the total heap size"_.  This also applies for LOB data type columns being used in clustered and nonclustered indexes.

All you have to do is fill in the values in the separate worksheets where the cells are NOT shaded.  If the SQL Server database you are planning requires more than fifty objects per worksheet just copy the last row, making sure to include the formulas, formats, etc.

* [Estimating the Size of an SQL Server 2005 Database](/assets/article_files/2011-05-07-estimating-the-size-of-an-sql-server-database/SQL-Server-2005-Estimating-the-Size-of-a-Database.xls)
* [Estimating the Size of an SQL Server 2008 Database](/assets/article_files/2011-05-07-estimating-the-size-of-an-sql-server-database/SQL-Server-2008-Estimating-the-Size-of-a-Database.xls)
