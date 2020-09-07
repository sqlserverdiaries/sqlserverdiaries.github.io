---
layout: post
date:   2011-12-24
title:  "Display and Store Maltese (Unicode) Characters"
permalink: ./blog/index.php/2011/12/display-and-store-maltese-unicode-characters/
categories: blog
published: true
tags: [Code Samples, Database Design, T-SQL Programming, Coding Practices, data types, Development, SQL Server, Storage, Testing]
comments: false
---
My national language (Maltese) is described in [Maltese language - Wikipedia](http://en.wikipedia.org/wiki/Maltese_language/) as _"the only Semitic language written in the Latin alphabet in its standard form"_.  I was recently asked whether SQL Server can store Maltese characters, or specifically the characters which deviate from the Latin character set.

The [Maltese alphabet - Wikipedia](http://en.wikipedia.org/wiki/Maltese_alphabet/) basically contains 4 characters which are an extension of the Latin alphabet.  The characters (including their lower-case values) are Ċċ, Ġġ, Ħħ, and Żż.  Words containing these letters can be stored in an SQL Server database only if the character data type can store Unicode characters; i.e. the [nchar and nvarchar (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms186939.aspx) data types.  Of course the consuming application should be able to display the data retrieved - for example when outputting to [HTML](http://www.w3schools.com/tags/tag_meta.asp) or [XML](http://www.w3schools.com/Xml/xml_encoding.asp) the _charset_ and _encoding_ properties respectively have to be set to UTF-8.

Another item to watch out for is the use of functions.  Sometimes when developing an application you'll want to search a character string to find an ASCII value, or conver an ASCII numeric value to a character.  SQL Server has two built-in functions, namely [ASCII (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms177545.aspx) and [CHAR (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms187323.aspx).  These two functions however will work only with either numeric values between 0 and 255 or with the first 256 characters of the Latin character set respectively.  In the case of Unicode characters SQL Server has two other functions which can be used as a replacement.  The function names are [UNICODE (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms180059.aspx) (replaces ASCII) and [NCHAR (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms182673.aspx) (replaces CHAR).

Thus, if for example you want to retrieve the first 200 characters of the extended character set (which includes the Maltese characters) you can use the following sample:

``` sql
DECLARE @i int = 256;
WHILE (@i &lt; 200)
BEGIN
    SET @i += 1;
    PRINT CAST(@i AS nvarchar(10)) + ' ' + NCHAR(@i) + ' (' +
        CAST(UNICODE(NCHAR(@i)) AS nvarchar(10)) + ')';
END;
```

Note that the above code sample will work only with SQL Server 2008 and later versions.  For SQL Server 2000 and 2005 the syntax has to be modified slightly.

The ASCII values for the Maltese characters mentioned above are:

Character | ASCII Value
--------- | -----------
Ċ | 266
ċ | 267
Ġ | 288
ġ | 289
Ħ | 294
ħ | 295
Ż | 379
ż | 380
&nbsp;

When working with Unicode characters we have to bear in mind these little details as well as Collation sequences, fonts used to display text in applications and reports, exported or output files, and more.  But that's another story.
