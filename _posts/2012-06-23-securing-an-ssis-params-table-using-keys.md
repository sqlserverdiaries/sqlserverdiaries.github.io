---
layout: post
date:   2012-06-23
title:  "Securing an SSIS Params Table using Keys"
permalink: ./blog/index.php/2012/06/securing-an-ssis-params-table-using-keys/
categories: blog
published: true
tags: [Database Administration, Security, T-SQL Programming, Code Samples, Coding Practices, data types, Development, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, SQL Server Integration Services, Architecture, SSIS, Security]
comments: false
---
SQL Server Integration Services (SSIS) was introduced with the 2005 version to replace the functionality of the SQL Server 2000 Data Transformation Services (DTS).  SSIS provides DBAs and database developers with the tools to create packages with which data can be exported, transformed and imported from/to various data sources such as SQL Server databases (of course…), delimited text files (CSV, TXT, XML, etc.), Microsoft Access databases and Excel spreadsheets, calling Web Service methods which return data structures, other OLE DB providers such as Oracle, databases where a ODBC connection is possible, and many more.  The package can also be used to design SQL Server maintenance plan flows and copy files from/to locations on the file system, network, FTP sites, etc. provided folder/file permissions are set correctly and network access is allowed.  All this and more is possible “simply” using the provided drag-and-drop components, third-party components, or you can even build your own.  The functionality possible using SSIS is only limited by the creativity of the DBA or database developer.

As mentioned above, the main functionality of SSIS packages is to copy data between data stores.  Hard-coding values such as server names, file or folder paths, or even credentials is definitely not a good idea (and I’m sure most of you share my opinion).  These values can be [stored outside the SSIS package](http://msdn.microsoft.com/en-us/library/ms141682.aspx) in an XML file, in Environment variables, as Registry entries, as Parent Package variables, or in an SQL Server table.  Environment variables and Registry entries create a dependency on the host server and can be viewed and modified by any Server Administrator (i.e. not a DBA).  An XML file removes the dependency on the host environment but the file path must exist on [all] target/s.  In the case of XML file, a user with the appropriate permissions can also view or modify the parameter values.  The last and what I think is the best option is storing the values in a table.  The table can be in the same “line-of-business” database, or another database on the same or on an alternate environment.  Configuring which parameter values to store is just a matter of ticking a number of check-boxes.

By default the parameter values will be stored in a table (see structure below) in clear text.  As an added layer of security I prefer storing the values in an encrypted format.

``` sql
CREATE TABLE [dbo].[SSIS Configurations] (
    ConfigurationFilter NVARCHAR(255) NOT NULL,
    ConfiguredValue NVARCHAR(255) NULL,
    PackagePath NVARCHAR(255) NOT NULL,
    ConfiguredValueType NVARCHAR(20) NOT NULL
)
```

SQL Server 2005 and later offer a number of encryption methods, and with every new version the algorithm strength increases.  I will not be going into the encryption methods available but if you want tot know more you can start from the SQL Server Technical Article titled [Cryptography in SQL Server](http://msdn.microsoft.com/en-us/library/cc837966.aspx).

For the example shown in this article I will be encrypting the SSIS parameter values using a database certificate.  The first step is to create a database master-key for your database if you don’t have one.  Of course the password shown here is an example and your password should be a stronger one.

``` sql
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'P@ssw0rd';
```

Next we will create a certificate whose start date is today and expiry date is set to the maximum date possible.

``` sql
CREATE CERTIFICATE MyCertificate AUTHORIZATION [dbo]
WITH SUBJECT = 'Database certificate',
    START_DATE = '2012-06-23 00:00:00.000',
    EXPIRY_DATE = '9999-12-31 23:59:59.997'; -- does not expire
```

The parameter values table structure has been modified slightly for my example.  I created a database schema named “SSIS” and change the table and column names as shown below:

``` sql
CREATE TABLE [SSIS].[tb_ConfigurationsE](
    [sc_config_filter] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [sc_config_value] [varbinary](512) NULL, -- column storing encrypted data
    [sc_package_path] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [sc_config_value_type] [nvarchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL
);
```

The column that will be storing the encrypted values is defined as a varbinary data type.

We will then create a database user **but** which is not associated with any login.  This means that the user cannot authenticate with SQL Server.  You will read later on why this user was created.

``` sql
CREATE USER [certificate-username] WITHOUT LOGIN;
```

The next step is to create a function that will decrypt text encrypted using a named certificate and stored in a varbinary data type.  The function code is shown below:

``` sql
CREATE FUNCTION [dbo].[udf_decryptvaluebycert] (
@encryptedText varbinary(8000),
@certificateName nvarchar(128)
)
RETURNS nvarchar(4000)
WITH EXEC AS 'certificate-username'
BEGIN
DECLARE @DecryptedText AS NVARCHAR(4000)

SET @DecryptedText = CONVERT(NVARCHAR(4000), 
    DECRYPTBYCERT(CERT_ID(@certificateName),@encryptedText))

RETURN (@DecryptedText);
END
```

You will observe that the function is defined to execute as “certificate-username”, or the user without a login that was created earlier.

As one of the final steps we shall be creating a VIEW object which reads the table storing the encrypted SSIS parameter values and returns them in a usable format.

``` sql
CREATE VIEW [SSIS].[vw_ConfigurationsE]
AS
SELECT [sc_config_filter] AS ConfigurationFilter,
    [dbo].[udf_decryptvaluebycert] ([sc_config_value], 'MyCertificate') AS ConfiguredValue,
    [sc_package_path] AS PackagePath,
    [sc_config_value_type] AS ConfiguredValueType
FROM [SSIS].[tb_ConfigurationsE];
```

We also need to implement functionality to convert plain text parameter values to encrypted values.  This functionality is achieved using a TRIGGER on the VIEW which is defined to execute INSTEAD OF INSERT and UPDATE statements.

The penultimate step is to grant CONTROL permissions on the certificate to the database user.  This is necessary to permit that the user can encrypt and decrypt data using the certificate.

The very last step of this solution is to configure the SSIS package to use the VIEW to when storing the parameter values.  That’s it!  A script containing the T-SQL necessary to implement this solution can be [downloaded from here](/assets/article_files/2012/06/securing-an-ssis-params-table-using-keys.zip).

A final thought.  Do not forget to back up the database certificate as part of your maintenance routines.
