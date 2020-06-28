---
layout: post
date:   2011-06-25
title:  "Correctly handling datetime values"
permalink: ./blog/index.php/2011/06/correctly-handling-datetime-values/
categories: blog
published: true
tags: [Database Design, T-SQL Programming, Coding Practices, data types, Development, SQL Server errors, Code Samples, datetime]
comments: false
---
I was recently asked why, when an application was saving datetime values sometimes the actual value stored is different than the one sent to the database.  After investigating the issue I discovered that the programmers were relying on the local/client machine's Regional Settings to display dates to the end user and were also assuming that the date was saved using the format displayed.

SQL Server assumes that any date values are received in a US English format.  This means that the date May 6, 2011" when sent as "06/05/2011" is saved with a value of June 5, 2011.  Of course this resulted in incorrect data values and was an unacceptable situation.

At first the programmers "blamed" SQL Server because it assumes a US format, said that it was a bug in the product, and other excuses I cand recall at this time.  I'm not a Microsoft employee, or a shareholder, nor do I gain from SQL Server or any other Microsoft product profits, but the excuses were unbearable.

In order to resolve this issue we have to understand how Microsoft SQL Server handles and stores _datetime_ values.  The _datetime_ data type allows applications to store values from January 1, 1753 to December 31, 9999, with an accuracy of one three-hundredth of a second (0.00333 seconds).  This has changed starting from SQL Server 2008 with the introduction of the _datetime2_ data type, but for the sake of this article I will stick to the original _datetime_ data type.   Any data defined as _datetime_ data types is stored internally as two 4-byte integers.  The first 4 bytes store the number of days before or after January 1, 1900.  The second set of 4 bytes store the time of day represented as the number of milliseconds after midnight.   Values for _datetime_ earlier than January 1, 1753, are not allowed for the _datetime_ data type; if you're using SQL Server 2008 or later you can use the _datetime2_ data type whic supports a wider range and greater precision.

In this case, I suspected that the application was sending date values as character strings for comparison to _datetime_ values, which I confirmed by running an SQL Profiler trace and reviewing the captured queries.   Since SQL Server makes an implicit conversion from a _character_ value to a _datetime_ value, the DBMS interprets the character string using the DATEFORMAT setting of the connection/session.  If this is not set, the default "U.S. English" (mdy) will be used.  This setting can be modified by any authenticated user simply by passing, say "SET DATEFORMAT dmy" prior to executing an SQL statement.

Alternatively, if the application will be passing a character string to filter out date and time ranges, I suggested that the developers use either the ODBC canonical or the [ISO8601 (Numeric representation of dates and time)](http://www.iso.org/iso/support/faqs/faqs_widely_used_standards/widely_used_standards_other/date_and_time_format.htm) standard notations (see samples below).

* **ODBC canonical**: yyyy-mm-dd hh:mi:ss.mmm (24h)
* **ISO8601**: yyyy-mm-dd Thh:mm:ss.mmm (no spaces)

The below is an example of an UPDATE statement using this notation:

``` sql
UPDATE dbo.MyTable
SET RecordDate = '2011-05-06 11:55:23'
WHERE RecordID = 34;
```

The above example will set the RecordDate colum to a datetime value of May 6, 2011 using a character type value to pass the required value.

If on the other hand the application had been storing the date and time values as character data types, only the rules for character data types would apply when storing and retrieving the data.  Attempting to convert the values and the filtering parameters to datetime data types at runtime will have a negative impact on the performance of the retrieval and may lead to inconsistent results.

Following this suggestion, the application was (painfully) modified so that all date values sent to the database would be formatted using one of the above-mentioned formats.
