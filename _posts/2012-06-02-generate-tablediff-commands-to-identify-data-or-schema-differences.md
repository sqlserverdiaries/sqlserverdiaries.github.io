---
layout: post
date:   2012-06-02
title:  "Generate TABLEDIFF Commands to Identify Data or Schema Differences"
permalink: ./blog/index.php/2012/06/generate-tablediff-commands-to-identify-data-or-schema-differences/
categories: blog
published: true
tags: [Code Samples, Database Administration, SQL Tools, T-SQL Programming, command-line utilities, Database Migration, Development, SQL Server, Testing, Upgrade]
comments: false
---
A while back I wrote [a short post about the tablediff.exe command-line application](./blog/index.php/2011/04/compare-the-contents-data-of-two-tables/). As a quick reminder, the tablediff.exe utilty can be used to compare table schema and/or data and generate a T-SQL script which can be used to bring the two in sync.

I wrote a short query that can be used to geenrate the tablediff.exe commands that can be used to compare the table structure and contents. The query uses the ANSI-compatible [INFORMATION_SCHEMA.TABLES](http://msdn.microsoft.com/en-us/library/ms186224.aspx) view. The script can be reviewed below.

``` sql
SET NOCOUNT ON;

DECLARE @sourceserver nvarchar(128);
DECLARE @sourcedatabase nvarchar(128);
DECLARE @sourceschema nvarchar(128);
DECLARE @sourcetable nvarchar(128);

DECLARE @destinationserver nvarchar(128);
DECLARE @destinationdatabase nvarchar(128);

DECLARE @compareschema bit;

SET @sourceserver = 'SRVSQL1\INST2';
SET @sourcedatabase = 'AdventureWorks';
--SET @sourceschema = 'HumanResources'; -- comment line for all
--SET @sourcetable = 'Department'; -- comment line for all

SET @destinationserver = 'SRVSQL1\INST2';
SET @destinationdatabase = 'AdventureWorks';

SET @compareschema = 0;

SELECT N'tablediff -sourceserver "' + @sourceserver + '" -sourcedatabase "' + @sourcedatabase +
'" -sourceschema "' + TABLE_SCHEMA + '" -sourcetable "' + TABLE_NAME +
'" -destinationserver "' + @destinationserver + '" -destinationdatabase "' + @destinationdatabase +
'" -destinationschema "' + TABLE_SCHEMA + '" -destinationtable "' + TABLE_NAME +
'" -destinationlocked -c ' + CASE @compareschema WHEN 1 THEN '-strict ' ELSE '' END +
'-f -o "./log/' + TABLE_SCHEMA + '.' + TABLE_NAME + '.log"'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
AND TABLE_SCHEMA = ISNULL(@sourceschema, TABLE_SCHEMA)
AND TABLE_NAME = ISNULL(@sourcetable, TABLE_NAME)
ORDER BY TABLE_SCHEMA ASC, TABLE_NAME ASC
```

The output will be similar to the below:

``` text
tablediff -sourceserver "SRVSQL1\INST2" -sourcedatabase "AdventureWorks"
    -sourceschema "HumanResources" -sourcetable "Department"
    -destinationserver "SRVSQL1\INST2" -destinationdatabase "AdventureWorks"
    -destinationschema "HumanResources" -destinationtable "Department"
    -destinationlocked -c -f -o "./log/HumanResources.Department.log"
```

After testing the tablediff.exe commands a T-SQL file is generated and which, with some creativity, can be included in a batch file together with the [FORFILES](./blog/index.php/2011/04/use-the-forfiles-utility-to-delete-old-database-backup-files/) and [SQLCMD](./blog/index.php/2012/02/execute-multiple-script-files-in-one-batch/) utilities. But that’s another part of the solution…
