---
layout: post
date:   2012-05-05
title:  "Script to generate CHECK Constraints"
permalink: ./blog/index.php/2012/05/script-to-generate-check-constraints/
categories: blog
published: true
tags: [Code Samples, Database Administration, Database Documentation, T-SQL Programming, Database Documentation, Database Migration, Development, DMV, SQL Server, Upgrade]
comments: false
---
This is another in a series of "scripts that generate scripts"; in this post I will be covering CHECK constraints. A CHECK constraint basically verifies that the value of the column it is checking evaluates to TRUE when the logical statement defining up the constraint is executed.  The definition of the check constraint can for example be a formula that:

* verifies that the value is within a certain range;
  e.g. _(upper([Gender])='F' OR upper([Gender])='M')_
  e.g. _([HireDate]>='1996-07-01' AND [HireDate]<=dateadd(day,(1),getdate()))_
  
* compares the value with the value in another column;
  e.g. _([EndDate]>=[StartDate] OR [EndDate] IS NULL)_ *is slightly more complex;
  e.g. _([ProductAssemblyID] IS NULL AND [BOMLevel]=(0) AND [PerAssemblyQty]=(1.00) OR [ProductAssemblyID] IS NOT NULL AND [BOMLevel]>=(1))_
  
* is the result of a user-defined function;
  e.g. _(dbo.IsActive([EmployeeID]) = 1)_
  
The syntax to create a CHECK constraint is:

``` sql
ALTER TABLE [ database_name . [ schema_name ] . | schema_name . ] table_name
    WITH { CHECK | NOCHECK } ADD CONSTRAINT constraint_name CHECK constraint_definition
[ ; ]
```

The list of existing constraints can be obtained by querying the [sys.check_constraints](http://msdn.microsoft.com/en-us/library/ms187388.aspx) view.  This gives us an easy way to script all contraints using a scripts such as the one below.

``` sql
SET NOCOUNT ON

SELECT 'USE ' + QUOTENAME(DB_NAME(), '[') + '
GO';

SELECT
    'IF EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N''' + QUOTENAME(s.[name], '[') + '.' + cc.[name] + ''') AND parent_object_id = OBJECT_ID(N''' + QUOTENAME(s.[name], '[') + '.' + QUOTENAME(tb.[name], '[') + '''))
    ALTER TABLE ' + QUOTENAME(s.[name], '[') + '.' + QUOTENAME(tb.[name], '[') + ' DROP CONSTRAINT ' + QUOTENAME(cc.[name], '[') + '
GO

ALTER TABLE ' + QUOTENAME(s.[name], '[') + '.' + QUOTENAME(tb.[name], '[') + ' WITH NOCHECK ADD CONSTRAINT ' + QUOTENAME(cc.[name], '[') + ' CHECK (' + cc.[definition] + ')
GO

ALTER TABLE ' + QUOTENAME(s.[name], '[') + '.' + QUOTENAME(tb.[name], '[') + ' CHECK CONSTRAINT ' + QUOTENAME(cc.[name], '[') + '
GO

'
FROM sys.check_constraints cc
    INNER JOIN sys.tables tb ON cc.[parent_object_id] = tb.[object_id]
    INNER JOIN sys.schemas s ON cc.[schema_id] = s.[schema_id]
ORDER BY s.[name], tb.[name], cc.[name]
GO
```

More information about this topic can be found in the [CHECK Constraints](http://msdn.microsoft.com/en-us/library/ms188258.aspx "CHECK Constraints") article of the SQL Server Books Online.
