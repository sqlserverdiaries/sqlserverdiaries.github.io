---
layout: post
date:   2011-04-09
title:  "Using GUIDs as Primary Keys, or not"
permalink: ./blog/index.php/2011/04/using-guids-as-primary-keys-or-not/
published: true
tags: [Storage, T-SQL Programming, SQL Server 2000, Coding Practices, Database Design, SQL Server 2008 R2, Indexes, SQL Server 2008, data types, GUID, SQL Server 2005]
comments: false
---
Also known as **G**lobally **U**nique **Id**entifiers, GUID values consist of a string of alphanumeric values which in principle should be unique across all machines of the network.  GUID values are stored in a database table using the _[uniqueidentifier (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms187942.aspx)_ data type and requires 16 bytes of storage space per row.  Values can be generated using the [NEWID (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms190348.aspx) or the [NEWSEQUENTIALID() (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms189786.aspx) SQL Server functions.  The latter is available in SQL Server 2005 and later versions.

The fact that GUID values have a very high degree of uniqueness makes this data type an attractive candidate for developers.  In fact I have sometimes come across tables where the [PRIMARY KEY Constraints](http://msdn.microsoft.com/en-us/library/ms191236.aspx) is defined as a GUID value.  A number of problems are associated with this approach, some of which are listed below:

### 1. Storage space ###

Storage is cheap, right?  Considering a table of 10 million rows and with 100,000 rows inserted daily we can calculate the storage requirements for the GUID values in this table.

Initial number of rows: 10,000,000
Daily increase: 100,000

Data type | Upper limit  | Size (bytes) | Initial Size (MB) | Daily Size (MB)
--------- | ------------ | -----------: | ----------------: | --------------:
INT       | 2 billion +  | 4            | 39,063            | 391
BIGINT    | 9 trillion + | 8            | 78,125            | 781
GUID      | (unlimited)  | 16           | 156,250           | 1,563

Considering the above requirements and figures, using a _uniqueidentifier_ data type will require over 1.5GB of storage space daily.

### 2. Effect of random values on PRIMARY KEY constraints ###

By default, when defining a PRIMARY KEY constraint, SQL Server will automatically create a UNIQUE CLUSTERED index on the column.  This type of index determines how the actual data is physically stored on disk and in which order (the default is ASCending).  When a new row is inserted in the table, the storage engine will place the row in the proper (ordered) position depending on the key column.

In SQL Server, the NEWID function returns a RANDOM value and being RANDOM this will be inserted in the clustered index pages in its appropriate ordered position not at the end as would an INT or BIGINT with the IDENTITY property set.  This leads to a considerable performance overhead while inserting due to the increased I/O operations as well as a great degree of index fragmentation, leading to a further performance overhead when searching specific records.

Consider the following example which creates a table which has a UNIQUEIDENTIFIER data type column, inserts five records, then retrieves the data sorted by the different data types.

``` sql
CREATE TABLE GUIDSampleTable (
    col1    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    col2    SMALLINT
);

SET NOCOUNT ON;
DECLARE @cnt smallint;
SET @cnt = 1
WHILE (@cnt <= 5)
BEGIN
    INSERT INTO GUIDSampleTable (col2) VALUES (@cnt);
    SET @cnt = @cnt + 1;
END;
```

The results for following query are shown below:

``` sql
SELECT col1, col2 FROM GUIDSampleTable ORDER BY col2 ASC;
```

Results:

col1                                 | col2
------------------------------------ | ------:
6F09CB51-9EDF-4D85-8787-927C3F8330C5 | 1
102536CF-5D8B-4E5E-B853-F84C3AD40A4E | 2
7176197B-4D3B-4E3E-B0D2-C892B66388CF | 3
31716603-5B8B-41C8-897D-259B4E7ABEBC | 4
B3FE4FAF-2821-42B3-9B8A-E9B8EA1C24DF | 5

Retrieving the rows ordered by the GUID values returns the following:

``` sql
SELECT col1, col2 FROM GUIDSampleTable ORDER BY col1 ASC;
```

Results:

col1                                 | col2
------------------------------------ | ------:
31716603-5B8B-41C8-897D-259B4E7ABEBC | 4
6F09CB51-9EDF-4D85-8787-927C3F8330C5 | 1
7176197B-4D3B-4E3E-B0D2-C892B66388CF | 3
B3FE4FAF-2821-42B3-9B8A-E9B8EA1C24DF | 5
102536CF-5D8B-4E5E-B853-F84C3AD40A4E | 2

The above test shows how sorting of GUID values, even for a small table of five records, occurs and also displays to a small degree how table fragmentation would occur.  This problem would be mitigated if the client application or website creates the GUID values in an incremental fashion, or if the NEWSEQUENTIALID database function is used instead of NEWID as explained above.

### 3. Properties of a NONCLUSTERED INDEX ###

One of the properties of NONCLUSTERED indexes is explained in the below extract from the [Nonclustered Index Structures](http://msdn.microsoft.com/en-us/library/ms177484.aspx):

> If the table has a clustered index, or the index is on an indexed view, the row locator is the clustered index key for the row.

This effectively means that for a table with a uniqueidentifier data type defined as a PRIMARY KEY, each NONCLUSTERED index on that table will incur a 16 byte overhead for each row.  You make the math.  Disk is not that cheap after all.

### 4. Effect on query performance ###

When a query is executed, put simply, the DBMS will retrieve the requested rows from the physical disk, unless the data has been cached.  SQL Server data is stored in 8KB pages and read from disk in extents.  An extent consists of eight 8KB pages (imagine blocks), or 64KB.  When designing tables, if more rows are fit on one page less reads are required to retrieve the data.  Excluding any page storage overheads this means that with a uniqueidentifier data type, any overhead would reduce the number of rows that can be fit on a single page.

The above reasons should serve as an introduction to increase the awareness of applying "cost savings" when designing tables.  If you'd like to know further about page structures, indexes, storage and the works I suggest you read the following SQL Server whitepapers and technical articles:

* [SQL Server 2000 I/O Basics](http://technet.microsoft.com/en-us/library/cc966500.aspx) - Published: January 21, 2005
* [SQL Server I/O Basics, Chapter 2](http://technet.microsoft.com/en-us/library/cc917726.aspx) - Published: July 19, 2006
* [Physical Database Storage Design](http://www.microsoft.com/technet/prodtechnol/sql/2005/physdbstor.mspx)
* [Pages and Extents Architecture](http://msdn.microsoft.com/en-us/library/cc280360.aspx)
* [Understanding Pages and Extents](http://msdn.microsoft.com/en-us/library/ms190969.aspx)
* [Table and Index Organization](http://msdn.microsoft.com/en-us/library/ms189051.aspx)
* [Estimating the Size of a Database](http://msdn.microsoft.com/en-us/library/ms187445.aspx)
* [Designing Indexes](http://msdn.microsoft.com/en-us/library/ms190804.aspx)

You might also wish to read the book [Microsoft SQL Server 2008 Internals by Kalen Delaney](http://www.sqlserverinternals.com) by Kalen Delaney (and other authors) available from most leading online bookstores.
