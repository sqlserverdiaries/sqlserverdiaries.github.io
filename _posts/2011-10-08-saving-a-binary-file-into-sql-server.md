---
layout: post
date:   2011-10-08
title:  "Saving a Binary File into SQL Server"
permalink: ./blog/index.php/2011/10/saving-a-binary-file-into-sql-server/
categories: blog
published: true
tags: [Database Administration, Database Design, T-SQL Programming, Architecture, Code Samples, data types, Development, SQL Server, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, Storage]
comments: false
---
Sometimes we have a requirement to store unstructured files such as JPG, PDF, DOC, and even media files such as WAV, MP3, and AVI (to name a few) to an SQL Server database. Examples of such applications include forms (structured) which include photos, scanned images or documents, CV’s, and more. The list is endless and the only limits are the business requirements and the developers’ creativity. The developer has two options when presented with a requirement to store this type of data, namely:

1. Store it in the file system or other repository;
2. Store it in the database;

I have come across a number of debates as to whether to opt for one or the other. In my opinion I’d say “it depends”. It depends on various factors such as the project teams’ interpretation of the business requirements, awareness of the features of the product/s being used to deliver the solution, company standards, etc. In the above-mentioned, when opting to store the unstructured files to the file system or another repository, one has to store the file location (e.g. path) as a character string with the respective record. For the second option the file will be stored in binary format within the database.

Support for storing binary data in SQL Server has improved considerably from the 2005 version and enhanced further from the 2008 versions. Previous versions used the _image_, _text_ and _ntext_ data types and, although still available, these were marked for deprecation from SQL Server 2005. In fact Microsoft have since recommended that any new development work makes use of the _varbinary(max)_, _varchar(max)_ and _nvarchar(max)_ data types instead and that plans are made to replace the usage of the deprecated data types with the new ones. Just for the record, the _varbinary_ data type was available in SQL Server 2000 however this was limited to 8,000 bytes. The limit for the new MAX data types was defined as 2^31-1 bytes (2GB) for each _varbinary(max)_, _varchar(max)_ and _nvarchar(max)_ column in SQL Server 2005 however this upper limit was removed completely from SQL Server 2008 and later versions with the introduction of the FILESTREAM feature. The maximum size is now limited only by the size of the volume storing the data.

Inserting unstructured data into a table can be accomplished using a number of methods but the examples in this article use standard T-SQL. The first step is to create a table that will store the unstructured data.

``` sql
USE [tempdb]
GO

-- table store
CREATE TABLE dbo.tb_imagestore (
    img_pk int IDENTITY(1,1) NOT NULL
    img_data varbinary(max)
);
```

I use the _tempdb_ database to test because it is recreated every time the SQL Server instance is restarted.

With our table store created the next step is loading the files using the OPENROWSET function. It is important to bear in mind that the file “C:\temp\myimage.jpg” used in the below example is the server path.

``` sql
-- insert from server path
INSERT INTO dbo.tb_imagestore(img_data)
    SELECT image_data
    FROM OPENROWSET(
        BULK 'C:\temp\myimage.jpg',
        SINGLE_BLOB) AS ImageSource(image_data);
```

When using the OPENROWSET function with the BULK provider keyword the data file read can be one of three types of objects:

* SINGLE_BLOB: reads the file as varbinary(max)
* SINGLE_CLOB: reads the file as varchar(max)
* SINGLE_NCLOB: reads the file as nvarchar(max)

In the above example, the SELECT part before the OPENROWSET returns a single column of type _varbinary(max)_ which is inserted into the img_data column of our table store. You should also consider changing the database recovery model to BULK_LOGGED when performing multiple inserts since these operations are not minimally-logged.

We can now view the data stored in our application table using:

``` sql
SELECT * FROM dbo.tb_imagestore;
```

Finally we can remove our sample table.

``` sql
DROP TABLE dbo.tb_imagestore;
```

As explained above, there are other options that can be employed to load unstructured data to a database, one of which is writing a custom application using one of the .NET languages or any other programming language you feel comfortable in.

Let your creativity fly!
