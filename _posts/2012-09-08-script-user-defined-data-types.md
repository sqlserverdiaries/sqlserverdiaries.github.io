---
layout: post
date:   2012-09-08
title:  "Script User-Defined Data Types"
permalink: ./blog/index.php/2012/09/script-user-defined-data-types/
categories: blog
published: true
tags: [Code Samples, Database Administration, Database Documentation, Database Documentation, Database Migration, data types, Development, SQL Server 2005, SQL Server 2008, SQL Server 2012, SQL Server, T-SQL Programming, Upgrade, Testing, Storage]
comments: false
---
Continuing with the _“database migration using scripting”_ series, this week I am publishing a script that’ll script user-defined data types. The script reads columns from the [sys.types](http://msdn.microsoft.com/en-us/library/ms188021.aspx "sys.types (Transact-SQL)") and [sys.schemas](http://msdn.microsoft.com/en-us/library/ms176011.aspx "sys.schemas (Transact-SQL)") DMVs to build the [DROP TYPE](http://msdn.microsoft.com/en-us/library/ms174407.aspx "DROP TYPE (Transact-SQL)") and [CREATE TYPE](http://msdn.microsoft.com/en-us/library/ms175007.aspx "CREATE TYPE (Transact-SQL)") statements. Special attention is given to UDTs based on _character_, _decimal_, _numeric_, and _varbinary_ data types since these data types require additional properties which define the maximum data size allowed.

The script is based losely on the following query:

``` sql
SELECT ss.[name] AS [Schema], st.[name] AS [Name], bs.[name] AS [Type]
FROM sys.types st
    INNER JOIN sys.schemas ss ON st.[schema_id] = ss.[schema_id]
    INNER JOIN sys.types bs ON bs.[user_type_id] = st.[system_type_id]
WHERE st.[is_user_defined] = 1 -- exclude system types
ORDER BY st.[name], ss.[name]
```

The complete script works with SQL Server 2005 and later versions and can be downloaded from here: [script-user-defined-data-types.sql](/assets/article_files/2012/09/script-user-defined-data-types.zip).
