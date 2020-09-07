---
layout: post
date:   2012-07-07
title:  "Hardening an instance might invalidate the support agreement"
permalink: ./blog/index.php/2012/07/hardening-an-instance-might-invalidate-the-support-agreement/
categories: blog
published: true
tags: [Architecture, Database Administration, Database Design, Security, T-SQL Programming, Coding Practices, Development, Security, SQL Server, Upgrade]
comments: false
---
Security is good.  Or to state that differently, lack of security is very bad.  So in the case of a SQL Server database, security is of the utmost importance.  For this reason DBAs work with security professionals to protect the data hosted on their servers.  The truth is that SQL Server is “secure out-of-the-box” and by following simple rules such as for example using Windows authentication, adopting the principle of least privilege, avoiding dynamic SQL, etc. your data should be quite protected.  Some security experts might even suggest hardening your instance even further, like for example those published by the [Center for Internet Security](http://www.cisecurity.org/).  The benchmark documents which are [downloadable](http://benchmarks.cisecurity.org/en-us/?route=downloads.browse.category.benchmarks.servers.database.mssql) are quite comprehensive and cover the operating system environment, account rights and permissions, configuration settings, auditing, disaster recovery and more.  In my opinion all DBAs should go through the document, at least to be aware of potential weak areas in the environment/s being managed and practices that can (should?) be followed to reduce the unauthorised entry points to your database.

Some of the points covered by the [CIS Benchmark document](http://benchmarks.cisecurity.org/en-us/?route=downloads.browse.category.benchmarks.servers.database.mssql) state that permissions have to be revoked on a number of extended stored procedures.  Caution should be exercised for actions such as this.  While searching for some information in the in the [Microsoft Forums (MSDN)](http://social.msdn.microsoft.com/Forums/en-US/sqlsecurity/thread/17c7569d-85c0-40ca-b921-cd58b31af612), one particular post caught my attention.  Someone wanted to disable access to some extended stored procedures and was notified that the current database had to be the master to be able to do so.  The writer asked whether the logged on user should have special permissions assigned.  The reply from one Forum Moderator (and substantiated by another) indicated that if the extended stored procedures are disabled (by denying execute permissions) the company would lose the support benefit.

> Microsoft will not support a SQL Server instance where you have removed or disabled any system object that ships with the product.  So, while you can do something like this, it is VERY STRONGLY discouraged and 100% unsupported.

And:

> Why are you trying to disable extended stored procedures that ship with SQL Server?  This is not recommended and is not supported.  If you remove or disable anything that ships with SQL Server and you have an issue that requires you to open a support case, PSS will require you to put your instance back into a supported state before dealing with any issue.

Obviously if the company has a support agreement (e.g. Premier Support) with Microsoft or the SQL Server licence was purchased with Software Assurance this benefit cannot be lost.  Retention of Microsoft support should take priority and the risks should be mitigated otherwise.  Adopting security practices and applying them at all layers interfacing with the database is the best approach, and an approach that should have be in place from the design stages of the project.

The original post can be viewed at: [http://social.msdn.microsoft.com/Forums/en-US/sqlsecurity/thread/17c7569d-85c0-40ca-b921-cd58b31af612](http://social.msdn.microsoft.com/Forums/en-US/sqlsecurity/thread/17c7569d-85c0-40ca-b921-cd58b31af612)
