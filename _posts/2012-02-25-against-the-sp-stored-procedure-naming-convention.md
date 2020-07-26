---
layout: post
date:   2012-02-25
title:  "Against the \"sp(underscore)\" Stored Procedure Naming Convention"
permalink: ./blog/index.php/2012/02/against-the-sp-stored-procedure-naming-convention/
categories: blog
published: true
tags: [Code Samples, Database Design, Performance, T-SQL Programming, Coding Practices, Database Migration, Development, SQL Server, Upgrade]
comments: false
---
It has been in the SQL Server Books Online since the 2000 version was published, and a considerable number of articles have been written against the use of the "sp\_" stored procedure naming convention. What I cannot understand is why newly written stored procedures are being pushed for deployment using this convention.

The "sp\_" stored procedure naming convention has special meaning and functionality in Microsoft SQL Server. SQL Server will always look first for a stored procedure with this prefix in the master database. If one is not found, SQL Server will check for the procedure, based on any database name and schema or owner qualifications. If the procedure is not found after that, the _"dbo"_ schema will be checked. In addition, if this stored procedure is executed frequently, this can produce query performance issues.

It is considered a good practice that the "sp\_" prefix is not used when naming user-defined objects. In addition to the possibility of performance issues, the name could ultimately conflict with actual system object names used by Microsoft in future versions of SQL Server.

The recommended resolution is to examine all references to stored procedures that have the "sp\_" naming convention prefix and rename the stored procedures with a new naming convention. If the stored procedures are vendor-written, the recommendation is that the vendor is contacted about this issue and work is coordinated to resolve it. Microsoft also recommends that all identified objects are addressed before upgrading to a new version of SQL Server.

The following articles related to naming conventions for stored procedures may also be used as reference.

* SQL Server Books Online - Creating a Stored Procedure - <http://msdn.microsoft.com/en-us/library/aa214379(SQL.80).aspx>

* SR0016: Avoid using sp\_ as a prefix for stored procedures - <http://msdn.microsoft.com/en-us/library/dd172115.aspx>

* Best Practices, Design and Development guidelines for Microsoft SQL Server - <http://code.msdn.microsoft.com/SQLExamples/Wiki/View.aspx?title=Best%20practices%20%2c%20Design%20and%20Development%20guidelines%20for%20Microsoft%20SQL%20Server&amp;referringTitle=Home>

Also, extracted from article id 263889 - **Description of SQL Server blocking caused by compile locks** at <http://support.microsoft.com/kb/263889>:

> Note: If your stored procedure name begins with the "sp\_" prefix and is not in the master database, you see SP:CacheMiss before the cache hit for each execution even if you owner-qualify the stored procedure. This is because the "sp\_" prefix tells SQL Server that the stored procedure is a system stored procedure, and system stored procedures have different name resolution rules (the "preferred" location is in the master database). The names of user-created stored procedures should not begin with "sp\_".

As a conclusion the way forward should be clear - do not prefix your stored procedures with "sp\_".
