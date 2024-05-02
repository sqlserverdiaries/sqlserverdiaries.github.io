---
layout: post
date:   2011-10-01
title:  "Dynamically load delimited files to a table"
permalink: ./blog/index.php/2011/10/dynamically-load-delimited-files-to-a-table/
categories: blog
published: true
tags: [Code Samples, Database Administration, Database Design, T-SQL Programming, Database Migration, Data Maintenance, Development, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2]
comments: false
---
There are various methods to load delimited files to a database. Some might opt to use SQL Server Integration Services (SSIS), others the BCP command line application, or write a .NET application which used the [SqlBulkCopy Class](http://msdn.microsoft.com/en-us/library/system.data.sqlclient.sqlbulkcopy.aspx), while some might choose one of the many non-Microsoft products available on the market. I feel more comfortable using T-SQL.

The requirement was simple enough – load delimited files to a table. Object names and file paths or names had to be dynamic so our only solution was to use dynamic SQL and a loop (or cursor). The final SQL string would execute the following for every file in a folder:

``` sql
SET @sqlcmd = N'
    BULK INSERT ' + @tablename + '
    FROM ''' + @filename + '''
    WITH (
       FIELDTERMINATOR = ''' + @fielddelimiter + ''',
       FIRSTROW = ' + @FIRSTROW + ',
       KEEPNULLS,
       LASTROW = ' + @MAXROWS + ',
       MAXERRORS = 1,
       ROWTERMINATOR = ''' + @rowdelimiter + ''')';

EXECUTE sp_executesql @sqlcmd;
```

In our scenario, the files were placed on a location on the SQL Server machine however any UNC file path can be used provided there is network access and the SQL Server Service Account has permissions on the share. Alternatively you could set it up using Proxy Accounts, as explained in a previous article.

The file list and full paths were obtained using the [xp_cmdshell (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms175046.aspx) extended stored procedure. Considering the security implications of using this stored procedure, I suggest writing custom code using the .NET CLR language you prefer.

The cursor had to iterate through a list of files, build and execute the above-show [BULK INSERT (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms188365.aspx) command. The file paths are stored in a table variable with the following structure:

``` sql
DECLARE @filesinfolder TABLE (
    [filepk] int identity(1, 1),
    [filename] nvarchar(128));

This table was populated using:

-- execute 'DIR' command to list files...
--   /B     : in bare format
--   /A-D   : do not show folders
--   /OD    : order by date
--   /TC    : use creation time for sorting
SET @cmdstring = 'DIR /B /A-D /OD /TC ' + @sourcefolder;
INSERT INTO @filesinfolder
    EXEC xp_cmdshell @cmdstring;
```

As part of SQL Server’s defence in depth implementation, the [xp_cmdshell (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms175046.aspx) extended stored procedure is disabled by default. Enabling it is a matter of executing the following:

``` sql
EXEC sp_configure 'show advanced options', 1; -- To allow advanced options to be changed
RECONFIGURE; -- Update the currently configured value for advanced options
GO
EXEC sp_configure 'xp_cmdshell', 1; -- Enable the feature
RECONFIGURE -- Update the currently configured value for this feature
GO
```

The entire script for this stored procedure can be [downloaded here](/assets/article_files/2011-10-dynamically-load-delimited-files-to-a-table/dynamically-load-delimited-files-to-a-table.zip). As a final suggestion, I’d say you go through the code and modify parts of it according to your security procedures before implementing it in a production environment.
