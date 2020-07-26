---
layout: post
date:   2012-03-03
title:  "Script to Drop and Create Indexes"
permalink: ./blog/index.php/2012/03/script-to-drop-and-create-indexes/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, Database Design, Database Migration, Indexes, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, tempdb]
comments: false
---
In previous posts I described techniques how to extract [TRIGGER](/blog/index.php/2011/07/script-to-generate-trigger-definitions/) and [DEFAULT](/blog/index.php/2012/02/script-to-generate-default-constraint-definitions/) constraint definitions using T-SQL scripting.  Today I will explain how I used database system objects to generate CREATE INDEX statements for my database.

The SQL Server Books Online provides extensive information on how to create an index.  This can be found in the MSDN article titled [CREATE INDEX](http://msdn.microsoft.com/en-us/library/ms188783.aspx).  Reproducing one of the examples from this article, the syntax to create an index is as simple as:

``` sql
USE AdventureWorks2008R2;
GO
CREATE INDEX IX_ProductVendor_VendorID
    ON Purchasing.ProductVendor (BusinessEntityID);
GO
```

In SQL Server 2005 and later versions, information about indexes is exposed mainly using two system catalog views, namely the [sys.indexes](http://msdn.microsoft.com/en-us/library/ms173760.aspx) and [sys.tables](http://msdn.microsoft.com/en-us/library/ms187406.aspx).  Other objects which I used in the latest version of the script are the [sys.columns](http://msdn.microsoft.com/en-us/library/ms176106.aspx), [sys.index\_columns](http://msdn.microsoft.com/en-us/library/ms175105.aspx), and [sys.data\_spaces](http://msdn.microsoft.com/en-us/library/ms190289.aspx) catalog views.

The first part creates INNER JOINs between the _sys.indexes_, _sys.tables_ and _sys.data\_spaces_ views to retrieve the index name, the table on which it has been created, the FILEGROUP storing the index pages, the index type (CLUSTERED or NONCLUSTERED) and other index properties.  The _sys.columns_ and _sys.index\_columns_ are used to retrieve the indexed columns as well as any included columns.

The script is composed of two parts, three actually; the variable declarations and assignment, a query to generate CLUSTERED indexes, and the final query to generate NONCLUSTERED indexes.  The _@NonClusteredIndexFileGroup_ variable is used to define the FILEGROUP which will store NONCLUSTERED index - if not set it will default to the FILEGROUP where the "parent" table is stored.

Scripts for SQL Server 2005 and 2008 can be obtained by using the links below.

* [SQL Server 2005 version](/assets/article_files/2012-03-script-to-drop-and-create-indexes/script-to-drop-and-create-indexes_2005.zip)

* [SQL Server 2008 version](/assets/article_files/2012-03-script-to-drop-and-create-indexes/script-to-drop-and-create-indexes_2008.zip)
