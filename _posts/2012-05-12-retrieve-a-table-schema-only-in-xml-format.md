---
layout: post
date:   2012-05-12
title:  "Retrieve a Table Schema Only, in XML Format"
permalink: ./blog/index.php/2012/05/retrieve-a-table-schema-only-in-xml-format/
categories: blog
published: true
tags: [Code Samples, T-SQL Programming, data types, Development, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, XML]
comments: false
---
This week I had an interesting question: how to retrieve the structure of a table in XML format.

SQL Server, or to be more exact T-SQL, has provided support for XML since the 2000 version.  The syntax is very simple, just add [FOR XML](http://msdn.microsoft.com/en-us/library/ms178107.aspx) to any SELECT query and you’re done.  Actually you will probably have to add other parts to the clause in order to have the output meet your requirements.

The question was how to retrieve the schema.  This can be achieved by adding “FOR XML AUTO, XMLDATA” when querying SQL Server 2000 databases or “FOR XML AUTO, XMLSCHEMA” when querying SQL Server 2005 and later versions – the XMLDATA clause has been deprecated.  So our query will be similar to:

``` sql
SELECT ...
FROM ...
FOR XML AUTO, XMLSCHEMA
```

The next step is how remove the data from the resultsand return only the schema.  This can be achieved by adding the TOP clause to the SELECT statement as shown below:

``` sql
-- SQL Server 2000
SELECT TOP 0 ...
FROM ...
FOR XML AUTO, XMLSCHEMA
```

And for the more recent versions:

``` sql
-- SQL Server 2005 and later
SELECT TOP (0) ...
FROM ...
FOR XML AUTO, XMLSCHEMA
```

Limiting the results to zero rows returns only the data types.  An interesting trick!
