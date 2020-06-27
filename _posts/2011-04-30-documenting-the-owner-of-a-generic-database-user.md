---
layout: post
date:   2011-04-30
title:  "Documenting the Owner of a Generic Database User"
permalink: ./blog/index.php/2011/04/30/documenting-the-owner-of-a-generic-database-user/
published: true
tags:
    - Database Documentation
    - Database Administration
    - Database Documentation
comments: false
---
A developer asked about whether it was possible to store additional tags to identify the owner of a generic login or generic database user.  The below solution can be used to store this information and also offers further possibilities.

Starting from SQL Server 2000, databases allow for the addition of custom properties (known as Extended Properties) to database objects as shown in the below table.  Unfortunately, extended properties cannot be added to server objects (e.g. logins, linked servers, etc.).

Level 0 | Level 1 | Level 2
------- | ------- | --------
User    | Table   | Column, index, constraint, trigger
.       | View    | Column, INSTEAD OF trigger
.       | Schema-bound view | Column, index, INSTEAD OF trigger
.       | Stored procedure | Parameter
.       | Rule    | N/A
.       | Default | N/A
.       | Function | Column, parameter, constraint,
.       | Schema-bound function | Column, parameter, constraint
User-defined data type | N/A | N/A

Extended properties are managed using three system stored procedures:

* **sp_addextendedproperty**  
Adds a new extended property to a database object.
* **sp_updateextendedproperty**  
Updates the value of an existing extended property.
* **sp_dropextendedproperty**  
Drops an existing extended property.

The values of existing extended properties can be retrieved using the system function **fn_listextendedproperty**.  Besides being available to identify the owner, extended properties allow for a database to be self-documenting since any properties set will remain within the database even if it is moved to another server.  Properties will only be deleted if the object (in this case the user) is erased.

The following script samples can be used to add, query, update and remove the property "_Owner_" to the USER object "_user001_" in database "_db_sample_".

Add an extended property:

``` sql
-- ADD
EXEC [db_sample]..[sp_addextendedproperty]
    @name=N'Owner',
    @value=N'ADDED: Person information and/or Project Team',
    @level0type=N'USER',
    @level0name=N'user001'
```

Query extended properties for an object:

``` sql
-- QUERY
SELECT * FROM [db_sample]..fn_listextendedproperty(
    NULL,   --@name
    'USER', -- @level0type
    NULL,   -- @level0name
    NULL,   -- @level1type
    NULL,   -- @level1name
    NULL,   -- @level2type
    NULL   -- @level2name
    )
```

Update an extended property:

``` sql
-- UPDATE
EXEC [db_sample]..[sp_updateextendedproperty]
    @name=N'Owner',
    @value=N'UPDATED: Person information and/or Project Team',
    @level0type=N'USER',
    @level0name=N'user001'
```

Remove an extended property:

``` sql
-- REMOVE
EXEC [db_sample]..[sp_dropextendedproperty]
    @name=N'Owner',
    @level0type=N'USER',
    @level0name=N'user001'
```

More information about Extended Properties on Database Objects can be found in the SQL Server Books Online article [Using Extended Properties on Database Objects](http://msdn.microsoft.com/en-us/library/ms190243.aspx).
