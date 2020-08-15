---
layout: post
date:   2012-09-22
title:  "Why I avoid using User-Defined Data Types"
permalink: ./blog/index.php/2012/09/why-i-avoid-using-user-defined-data-types/
categories: blog
published: true
tags: [Architecture, Database Administration, Database Design, T-SQL Programming, Code Samples, Coding Practices, data types, Development, SQL Server, Storage, Testing]
comments: false
---
User-defined data types (UDT) were introduced with SQL Server 2000.  UDTs provide Database Designers, Developers, and DBAs functionality with which a custom data type can be created and which is based on one of the SQL Server system data types.  If you think of this as an approach to standardise on similar-function columns and ensure that these columns have exactly the same data type, length, and NULLability across the entire database.  From a designer and developer perspective this is a fantastic database feature.  But like all T-SQL practices, this is best explained with examples.  The below are based on the AdventureWorks sample database.

First we shall identify a number of columns in different tables which should have similar attributes.  For this example I reverse-engineered parts of the design of the AdventureWorks database.  So let’s assume that we are designing the following tables:

* HumanResources.Department
* Person.AddressType
* Person.Contact
* Person.ContactType
* Person.CountryRegion
* Production.Culture
* Sales.Currency
* Production.Location
* Production.Product

The above tables will have one specific column which will describe the Department Name, the Address Type, the Contact Name, and so forth.  Let’s assume that the colum will be called “Name” – if you review the database schema you will see the final result.  This descriptor column will require a maximum of 50 characters of the _nvarchar_ data type.  So the Database Designer creates a UDT based on a _NULL_-able _nvarchar(50)_ using the following syntax:

``` sql
CREATE TYPE [dbo].[Name] FROM [nvarchar](50) NULL;
```

The UDT is then used in the CREATE TABLE definitions and assigned to each column as shown in the next code snippet:

``` sql
CREATE TABLE [HumanResources].[Department](
    [DepartmentID] [smallint] IDENTITY(1,1) NOT NULL,
    [Name] [dbo].[Name] NOT NULL,
    [GroupName] [dbo].[Name] NOT NULL,
    [ModifiedDate] [datetime] NOT NULL,
);
```

You will observe that in the above example the UDT is used twice.  Columns in other tables are then implemeted in a simlar fashion.

Once the database has been implemented you create other UDTs and have a consistent column properties across the entire schema.  Isn’t that great!?  Maybe not…

A few months down the line, possible once the database is in production mode, your end-users state that they want to input Unicode character data longer than the alowed 50 characters.  So you think that all you have to do is execute something similar to the below and the change will be reflected across all dependent columns.

``` sql
ALTER TYPE [dbo].[Name] SET [nvarchar](60) NULL;
```

Wrong!  Changing the properties of a UTD is not that simple.  Actually it’s so much of a hassle that you  will wonder why you ever decided to use them in the first place!

To change the properties of a UDT you have to:

1. Modify the data type of all dependent columns to _nvarchar(60)_ (using the above example as a base);
2. Drop the UDT;
3. Create the UDT with the new properties;
4. Modify the data type of all dependent columns to the new UDT;

You will see that although you achieved consistency across similar columns, maintenance is quite laborious.  This is why I don’t like to use UDTs.
