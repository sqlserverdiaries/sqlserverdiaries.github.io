---
layout: post
date:   2011-12-31
title:  "Generate BCP Export and BCP or BULK INSERT Import Code"
permalink: ./blog/index.php/2011/12/generate-bcp-export-and-bcp-or-bulk-insert-import-code/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, SQL Tools, T-SQL Programming, command-line utilities, Database Migration, data types, Upgrade, SSIS, SQL Server Integration Services]
comments: false
---
As the final post of 2011, and considering that most DBAs might start considering upgrading to the latest version of SQL Server when it is [launched at the end of March 2012](http://devconnections.com/shows/sp2012/default.aspx?s=185) (?), I am publishing a script which I found very helpful for upgrades and database migrations.

Of course a [database migration](http://msdn.microsoft.com/en-us/library/ms189624.aspx) can for example be as simple as detaching and re-attaching the database, or taking a full backup and restoring it to the new instance however, for reasons such as the one explained in the post titled [Database Upgrade from SQL Server 7](/blog/index.php/2011/02/database-upgrade-from-sql-server-7/), my personal preference is to export and import the data.  This can be achieved using either BCP for both the export and import, or BCP for the export and BULK INSERT commands for the import part.  There are other methods one may opt for, such as [using the Export and Import Wizard application to generate a basic SISS package](http://msdn.microsoft.com/en-us/library/ms141209.aspx).

The attached script has a number of "configuration parameters" which, once set will provide a set of [BCP commands](http://msdn.microsoft.com/en-us/library/aa337544.aspx) and/or T-SQL [BULK INSERT (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms188365.aspx) scripts to use for the migration.  The parameters are:

``` text
@DestinationSQLServer:  The destination SQL Server instance name
@BulkLoadPath:          The path which will store the exported files
@rowterminator:         The data row terminator
@colterminator:         The data column terminator
@BCPorBULK:             Generate import scripts as BCP or BULK INSERT commands
@CheckData:             Check the data for instances of the @colterminator
@ExcludedTables:        Tables to exclude from the import/export
@BCPParams:             BCP parameters
```

One the above-listed parameters are set, when the script is run against a database it will generate the respective [BCP commands](http://msdn.microsoft.com/en-us/library/ms162802.aspx).  If the _@CheckData_ parameter is set to 1 (default), all character-type columns will be checked for instances of the _@colterminator_ parameter.  Although this is time-consuming, it is essential to avoid having columns being swapped and data import errors.  The output will contain:

* Commands to create the folder structure at the path defined in the _@BulkLoadPath_ variable;
* BCP commands to create [Non-XML Format Files](http://msdn.microsoft.com/en-us/library/ms191479.aspx) for all the selected tables;
* BCP commands for all seleted tables to export the data to delimited files;
* Command-line BCP or T-SQL BULK INSERT commands to import the data into the target database.

The script which has been tested for migrations from SQL Server 2000 to 2005 and 2008 can be [downloaded from here](/assets/article_files/2011-12-generate-bcp-export-and-bcp-or-bulk-insert-import-code/generate-bcp-export-and-bcp-or-bulk-insert-import-code.zip).
