---
layout: post
date:   2011-07-23
title:  "Script to generate Trigger definitions"
permalink: ./blog/index.php/2011/07/script-to-generate-trigger-definitions/
categories: blog
published: true
tags: [Code Samples, Database Administration, Database Documentation, T-SQL Programming, Database Migration, Development, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, Upgrade]
comments: false
---
Last week we implemented a database for which the developer didn’t have the CREATE TRIGGER scripts.  Unfortunately this is quite a frequent occurance and happens when database code (and objects) are implemented directly into a database and an assumption is made that the code is safely stored in the database/ backup.  True that we could have generated a schema using the SSMS Generate Scripts feature but that would have returned the base table too as part of the output.  What we needed was a single script containing just the trigger definitions.

The [sys.sql_modules (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms175081.aspx) catalog view _“returns a row for each object that is an SQL language-defined module”_ and provided us with a solution to our problem.  The code used to generate the CREATE TRIGGER scripts is shown below with the “TR” filter limiting the result set to just the triggers.

``` sql
SET NOCOUNT ON

SELECT 'USE ' + QUOTENAME(DB_NAME(), '[') + '
GO';

SELECT
    '-- [' + s.[name] + '].[' + tb.[name] + ']: ' +
    tr.[name] + CHAR(13) +
    m.[definition] + 'GO' + CHAR(13)
    AS [TriggerBody]
FROM sys.triggers tr
    INNER JOIN sys.all_sql_modules m ON m.[object_id] = tr.[object_id]
    INNER JOIN sys.tables tb ON tb.[object_id] = tr.[parent_id]
    INNER JOIN sys.schemas s ON tb.[schema_id] = s.[schema_id]
ORDER BY s.[name], tb.[name]
```

Knowledge of this catalog view also helped us script other SQL object types such as stored procedures, views, functions, and more.  I am a great fan of writing code that generates code to automate tedious tasks.  Scripts to extract SQL code for other object types will be posted in future articles.
