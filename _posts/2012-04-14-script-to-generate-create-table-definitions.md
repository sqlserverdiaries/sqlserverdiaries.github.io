---
layout: post
date:   2012-04-14
title:  "Script to Generate CREATE TABLE Definitions"
permalink: ./blog/index.php/2012/04/script-to-generate-create-table-definitions/
categories: blog
published: true
tags: [Code Samples, Database Administration, Database Documentation, T-SQL Programming, Coding Practices, Database Migration, data types, Development, SQL Server, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, CTE, SQL Server 2012]
comments: false
---
Once the target environment is installed and configured, a database migration cannot commence before the database and the table structures that will hold the new data are in place.  Creating table definitions can be performed using various methods, a couple of which are tools provided with SQL Server, and third-party tools.  Another method is to recreate the tables from the scripts in the projects' code library, if available that is. The approach I used was to generate the [CREATE TABLE](http://msdn.microsoft.com/en-us/library/ms174979.aspx) statements using T-SQL.  Due to the use of the _nvarchar(max)_ data type, the script will only work with SQL Server 2005 and later.  In order to migrate database from earlier versions, what I did was restore a recent backup to an SQL Server 2005 instance, then execute this script to extract the object definitions. The script is quite self-explanatory.  The [Information Schema Views](http://msdn.microsoft.com/en-us/library/ms186778.aspx) [TABLES](http://msdn.microsoft.com/en-us/library/ms186224.aspx) and [COLUMNS](http://msdn.microsoft.com/en-us/library/ms188348.aspx) views are being used to retrieve the main object structure, while the [sys.identity_columns](http://msdn.microsoft.com/en-us/library/ms187334.aspx), [sys.indexes](http://msdn.microsoft.com/en-us/library/ms173760.aspx), [sys.data_spaces](http://msdn.microsoft.com/en-us/library/ms190289.aspx) system views are used to retrieve which columns have the [IDENTITY](http://msdn.microsoft.com/en-US/library/ms186775.aspx) property set, and on which the [FILEGROUP](http://msdn.microsoft.com/en-us/library/ms179316.aspx) table is created.  You will also notice that a [Common Table Expression (CTE)](http://msdn.microsoft.com/en-us/library/ms190766.aspx) was used to avoid iterating (or using a [CURSOR](http://msdn.microsoft.com/en-us/library/ms180169.aspx)) to retrieve information for the tables, columns, etc. When executed against a database the output will show something similar to the below sample extracted from the [AdventureWorks](http://msftdbprodsamples.codeplex.com/) database:

``` sql
--------------------------------------------------
USE [AdventureWorks]
GO

--------------------------------------------------
CREATE TABLE [dbo].[AWBuildVersion] (
    [SystemInformationID] [tinyint] IDENTITY (1,1) NOT NULL,
    [Database Version] [nvarchar](25) COLLATE Latin1_General_CI_AS NOT NULL,
    [VersionDate] [datetime] NOT NULL,
    [ModifiedDate] [datetime] NOT NULL
) ON [PRIMARY];

CREATE TABLE [dbo].[DatabaseLog] (
    [DatabaseLogID] [int] IDENTITY (1,1) NOT NULL,
    [PostTime] [datetime] NOT NULL,
    [DatabaseUser] [nvarchar](128) COLLATE Latin1_General_CI_AS NOT NULL,
    [Event] [nvarchar](128) COLLATE Latin1_General_CI_AS NOT NULL,
    [Schema] [nvarchar](128) COLLATE Latin1_General_CI_AS NULL,
    [Object] [nvarchar](128) COLLATE Latin1_General_CI_AS NULL,
    [TSQL] [nvarchar](MAX) COLLATE Latin1_General_CI_AS NOT NULL,
    [XmlEvent] [xml] NOT NULL
) ON [PRIMARY];

CREATE TABLE [dbo].[ErrorLog] (
    [ErrorLogID] [int] IDENTITY (1,1) NOT NULL,
    [ErrorTime] [datetime] NOT NULL,
    [UserName] [nvarchar](128) COLLATE Latin1_General_CI_AS NOT NULL,
    [ErrorNumber] [int] NOT NULL,
    [ErrorSeverity] [int] NULL,
    [ErrorState] [int] NULL,
    [ErrorProcedure] [nvarchar](126) COLLATE Latin1_General_CI_AS NULL,
    [ErrorLine] [int] NULL,
    [ErrorMessage] [nvarchar](4000) COLLATE Latin1_General_CI_AS NOT NULL
) ON [PRIMARY];

CREATE TABLE [dbo].[Usernames] (
    [ServerName] [varchar](10) COLLATE Latin1_General_CI_AS NULL,
    [Username] [varchar](10) COLLATE Latin1_General_CI_AS NULL,
    [Password] [varbinary](max) NULL
) ON [PRIMARY];

CREATE TABLE [HumanResources].[Department] (
    [DepartmentID] [smallint] IDENTITY (1,1) NOT NULL,
    [Name] [nvarchar](50) COLLATE Latin1_General_CI_AS NOT NULL,
    [GroupName] [nvarchar](50) COLLATE Latin1_General_CI_AS NOT NULL,
    [ModifiedDate] [datetime] NOT NULL
) ON [PRIMARY];
```

When executing this script using SQL Server Management Studio you'll have to set the output to redirect to test, and also change the option to display the maximum of 8192 characters. A copy of the script can be [downloaded here](/assets/article_files/2012-04-script-to-generate-create-table-definitions/script-to-generate-create-table-definitions.zip).
