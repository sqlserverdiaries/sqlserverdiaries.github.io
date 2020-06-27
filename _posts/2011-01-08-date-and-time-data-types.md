---
layout: post
date:   2011-01-08
title:  "Date and Time data types"
permalink: ./blog/index.php/2011/01/08/date-and-time-data-types/
tags:
    - datetime
    - data types
    - SQL Server 2005
    - Coding Practices
    - T-SQL Programming
    - Database Design
    - Development
    - SQL Server 2000
    - T-SQL Programming
    - Database Migration
comments: false
---
Someone asked me why storing datetime values seem to allow a maximum year of 2079.

The limit mentioned exists for the SQL Server smalldatetime data type. This is because of the values' data range supported, accuracy and data size associated with different data types where:

Data type | Range | Accuracy | Size
--------- | ----- | -------- | ----
datetime | Jan 1, 1753 to Dec 31, 9999 | 3.33 milliseconds | 8 bytes
smalldatetime | Jan 1, 1900 to Jun 6, 2079 | 1 minute | 4 bytes

The SQL Server 2005 documentation titled [Date and Time (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms187819(v=SQL.90).aspx) provides full information about this topic.

SQL Server versions prior and up to 2005 do not allow storing date values earlier than 01/01/1753 in datetime data type columns. If the need arises, one alternative could be to store these values in a character-type column, storing the data in the [ISO 8601 Format](http://msdn.microsoft.com/en-us/library/ms190977(v=SQL.90).aspx).

SQL Server 2008 introduced a number of new date and time data types which give greater flexibility in the storage of such values. More in another blog post though!
