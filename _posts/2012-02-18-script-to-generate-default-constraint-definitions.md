---
layout: post
date:   2012-02-18
title:  "Script to generate DEFAULT Constraint definitions"
permalink: ./blog/index.php/2012/02/script-to-generate-default-constraint-definitions/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, Database Documentation, Database Documentation, DMV, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, Upgrade, Database Migration]
comments: false
---
A few posts ago I published a [Script to generate Trigger definitions](/blog/index.php/2011/07/script-to-generate-trigger-definitions/). This week's topic covers another automation script to generate scripts, this time related to DEFAULT Constraints.  Simplistically put, whenever a DEFAULT constraint is definied on a table column, if the column is set to disallow NULL values and no value is defined for that column when the row is _created_, the default value (or derived default value) is used instead. Creating a DEFAULT constraint is achieved using the following syntax:

``` sql
ALTER TABLE [ database_name . [ schema_name ] . | schema_name . ] table_name
ADD CONSTRAINT constraint_name
DEFAULT constraint_definition FOR column_name;
```

Once the constraints have been created, the defintions can be reviewed using the [sys.default_constraints (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms173758.aspx) DMV.  In the below script I used this DMS as well as others (see below) to generate the DEFAULT constraint definitions for a database migration.

``` sql
SET NOCOUNT ON;

SELECT 'USE ' + QUOTENAME(DB_NAME(), '[') + '
GO';

SELECT
    'ALTER TABLE ' + QUOTENAME(s.[name], '[') + '.' + QUOTENAME(tb.[name], '[') + '
    ADD CONSTRAINT ' + QUOTENAME(df.[name], '[') + ' DEFAULT ' + df.[definition] +
' FOR ' + QUOTENAME(c.[name], '[') + '
GO
'
FROM sys.default_constraints df
    INNER JOIN sys.tables tb ON df.[parent_object_id] = tb.[object_id]
    INNER JOIN sys.schemas s ON df.[schema_id] = s.[schema_id]
    INNER JOIN sys.columns c ON df.[parent_column_id] = c.[column_id]
        AND tb.[object_id] = c.[object_id]
ORDER BY s.[name], tb.[name], df.[name];
```

The output could then be stored for documentation purposes or say, extracted from a development environment and relased on a test or production one.  Whatever your choice, I am quite sure this will shave a few minutes off your database migration projects.
