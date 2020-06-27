---
layout: post
date:   2011-04-23
title:  "Compare the Contents (data) of Two Tables"
permalink: ./blog/index.php/2011/04/23/compare-the-contents-data-of-two-tables/
published: true
tags:
    - SQL Tools
    - Database Administration
    - Data Maintenance
comments: false
---
An application developer asked me if there was an option in SQL Server to compare the contents/data of two tables without having to create a custom application.  There are various third party tools that can achieve this target however SQL Server comes with an out-of-the-box solution.

The [SQL Server Replication Diff Tool](http://msdn.microsoft.com/en-us/library/ms162843.aspx) (or _tablediff Utility_) is intended to be used in a replicated environment however it can be invoked from the command line to compare the contents of two tables and it will also generate a script to bring the destination in sync with the source.

The executable can be found in the _"<INSTALL\_DIR>\90\COM"_ folder for SQL Server 2005 or the _"<INSTALL\_DIR>\100\COM"_ folder in the case of SQL Server 2008.  Executing _tablediff/?_ in a command prompt will display the information shown below:

``` text
Microsoft (R) SQL Server Replication Diff Tool
Copyright (c) 2008 Microsoft Corporation

User-specified agent parameter values:
/?

 Replication Diff Tool Command Line Options

        usage: tablediff

          -- Source Options --
 -sourceserver          Source Host
 -sourcedatabase        Source Database
 -sourceschema          Source Schema Name
 -sourcetable           Source Table or View
 -sourceuser            Source Login
 -sourcepassword        Source Password
 -sourcelocked          Lock the source table/view durring tablediff

          -- Destination Options --
 -destinationserver     Destination Host
 -destinationdatabase   Destination Database
 -destinationschema     Destination Schema Name
 -destinationtable      Destination Table or View
 -destinationuser       Destination Login
 -destinationpassword   Destination Password
 -destinationlocked     Lock the destination table/view durring tablediff

          -- Misc Options --
 -t             Timeout
 -c             Column Level Diff
 -f             Generate Fix SQL (You may also specify a file name and path)
 -q             Quick Row Count
 -et            Specify a table to put the errors into
 -dt            Drop the error table if it exists
 -o             Output file
 -b             Number of bytes to read for blob data types
 -strict        Strict compare of source and destination schema
 -rc            Number of retries
 -ri            Retry interval
 ```
