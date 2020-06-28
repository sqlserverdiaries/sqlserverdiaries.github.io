---
layout: post
date:   2011-05-28
title:  "Exporting SQL Server 2000 binary data using textcopy.exe"
permalink: ./blog/index.php/2011/05/exporting-sql-server-2000-binary-data-using-textcopy-exe/
categories: blog
published: true
tags: [Database Migration, Database Administration, SQL Tools, Development, SQL Server, SQL Server 2000, Windows, command-line utilities]
comments: false
---
I was recently involved in a database migration project where the requirement was that the data in an SQL Server 2000 database is exported to separate files for archiving or uploading into another (unknown) database/DBMS.  No problem there.  Using the BCP command-line utility the data was exported easily.  One of the tables stored JPG scanned images as BLOB data in a column of image data type.  The data owner requested that the data is extracted as separate JPG files using the unique identifier as the file name.

The table structure was as follows:

``` sql
CREATE TABLE [dbo].[ScannedImages](
   [UniqueKey] [int] IDENTITY(1,1) NOT NULL,
   [RecordDate] [datetime] NOT NULL,
   [BlobData] [image] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
```

The first task was to generate the image file name, eliminating records which did not have an image.

``` sql
SELECT TOP 5 [UniqueKey], [BlobData]
FROM ScannedImages
WHERE [BlobData] IS NOT NULL
```

After carying out some tests with the first five records as shown above, the following results were obtained:

``` sql
SELECT TOP 5
    [UniqueKey],
    RIGHT(REPLICATE('0', 5) + CONVERT(VARCHAR(5), [UniqueKey]),5) + '.JPG' AS [FileName],
    [BlobData]
FROM ScannedImages
WHERE [BlobData] IS NOT NULL
```

UniqueKey | FileName | BlobData
--------- | -------- | ----------
1  | 00001.JPG | 0xFFD8FFE000104A464...2FEE71E995
5  | 00005.JPG | 0xFFD8FFE000104A464...2FEE71E995
7  | 00007.JPG | 0xFFD8FFE000104A464...2FEE71E995
9  | 00009.JPG | 0xFFD8FFE000104A464...2FEE71E995
11 | 00011.JPG | 0xFFD8FFE000104A464...2FEE71E995

The next step is to extract the BLOB data to the a specific folder using the file name generated as shown as the output file name.  Ths can be achieved using the SQL Server 2000 textcopy.exe command-line utility.  This utility is installed with an SQL Server 2000 instance and can be found in the following locations:

* Default Instances: C:\Program Files\Microsoft SQL Server\MSSQL\Binn
* Named Instances: C:\Program Files\Microsoft SQL Server\MSSQL\Binn

The arguments for this utility can be obtained by running **textcopy.exe/?** in a command prompt window.  The output can be seen below.

``` text
TEXTCOPY Version 1.0
DB-Library version 8.00.2039

Copies a single text or image value into or out of SQL Server. The value
is a specified text or image 'column' of a single row (specified by the
"where clause") of the specified 'table'.

If the direction is IN (/I) then the data from the specified 'file' is
copied into SQL Server, replacing the existing text or image value. If the
direction is OUT (/O) then the text or image value is copied from
SQL Server into the specified 'file', replacing any existing file.

TEXTCOPY [/S [sqlserver]] [/U [login]] [/P [password]]
[/D [database]] [/T table] [/C column] [/W"where clause"]
[/F file] [{/I | /O}] [/K chunksize] [/Z] [/?]

/S sqlserver       The SQL Server to connect to. If 'sqlserver' is not
                   specified, the local SQL Server is used.
/U login           The login to connect with. If 'login' is not specified,
                   a trusted connection will be used.
/P password        The password for 'login'. If 'password' is not
                   specified, a NULL password will be used.
/D database        The database that contains the table with the text or
                   image data. If 'database' is not specified, the default
                   database of 'login' is used.
/T table           The table that contains the text or image value.
/C column          The text or image column of 'table'.
/W "where clause"  A complete where clause (including the WHERE keyword)
                   that specifies a single row of 'table'.
/F file            The file name.
/I                 Copy text or image value into SQL Server from 'file'.
/O                 Copy text or image value out of SQL Server into 'file'.
/K chunksize       Size of the data transfer buffer in bytes. Minimum
                   value is 1024 bytes, default value is 4096 bytes.
/Z                 Display debug information while running.
/?                 Display this usage information and exit.

You will be prompted for any required options you did not specify.
```

Using the original source table, we can use T-SQL to generate the command line that will be used to export the BLOB data as explained.  The syntax to export a single image is:

> textcopy /S SQLServerName /U MyLogin /P StrongPassword /D "MyDatabase" /T "dbo.ScannedImages" /C "BlobData" /W "WHERE UniqueKey=1" /F C:\TEMP\00001.JPG /O

The following output was displayed:

``` text
TEXTCOPY Version 1.0
DB-Library version 8.00.2039
Data copied out of SQL Server image column into file 'C:\TEMP\00001.JPG'.
```

Since our source table contained more than 5,000 records and we required the same amount of command-line syntax with variations of the above example, I used T-SQL string concatenation techniques to generate the command.

``` sql
SELECT TOP 5
'textcopy /S SQLServerName /U MyLogin /P StrongPassword /D "MyDatabase" /T "dbo.ScannedImages" /C "BlobData" /W "WHERE UniqueKey=' + CAST([UniqueKey] AS VARCHAR(5)) + '" /F C:\TEMP\' + RIGHT(REPLICATE('0', 5) + CONVERT(VARCHAR(5), [UniqueKey]),5) + '.JPG /O'
FROM ScannedImages
WHERE [BlobData] IS NOT NULL
```

By executing the above T-SQL command (replacing the SQLServer name and other parameters) and selecting the "Output to Text" option (Ctrl+T) in Query Analyser or SSSMS, the required command are generated.  The final step is to copy the text, paste it to a command prompt window and collect the filed from the output folder.
