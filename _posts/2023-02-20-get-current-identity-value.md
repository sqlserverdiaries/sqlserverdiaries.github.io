---
layout: post
date:   2023-02-20
title:  "Get the latest IDENTITY value for all tables in the current database"
permalink: ./blog/index.php/2023/02/get-current-identity-value/
categories: blog
published: true
tags: [Database Administration, Development, Code Samples, CTE, data types]
comments: true
---
An interesting scenario, which prompted me to write the script being shared.

WHen defining numeric data types such as `int` and adding the `IDENTITY` property, you would define the start of the range and the increment value, as below:

``` sql
CREATE TABLE dbo.SampleTable (
    [ID] [int] IDENTITY (1,1) NOT NULL,
    [Description] [varchar] (50) NOT NULL,
    ...
    ...
)
```

In the above example the "ID" values will start from 1 and increment by 1, which is what would seem logical.

This however means that you would only be using half of the range supported by the `int` data type, or rather, you'd be wasting half of the possible values.

The `int` data type allows for whole numbers ranging from -2,147,483,648 to 2,147,483,647, giving more than 4.2 billion possible values.

The scenario which prompted an investigation and this script was that the table/column ran out of integer values - watch out for a future article to explain the root cause.

Once the issue was fixed by changing the data type from `int` to `bigint`, hence increasing the range to 9.2 trillion positive values, we needed to identify if any other tables were approaching the upper limit. Which is what this script does by executing the `IDENT_CURRENT` function for each table retrieved using the CTE.

The script can be downloaded from here: [GetCurrent-IdentityValue.sql](https://github.com/reubensultana/DBAScripts/blob/master/Databases/GetCurrent-IdentityValue.sql)

To read more about SQL Server data types, see this: [int, bigint, smallint, and tinyint (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/data-types/int-bigint-smallint-and-tinyint-transact-sql)

More information about the `IDENT_CURRENT` function is available here: [IDENT_CURRENT (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/functions/ident-current-transact-sql)
