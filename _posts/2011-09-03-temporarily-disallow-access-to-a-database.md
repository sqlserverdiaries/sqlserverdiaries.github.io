---
layout: post
date:   2011-09-03
title:  "Temporarily Disallow Access to a Database"
permalink: ./blog/index.php/2011/09/temporarily-disallow-access-to-a-database/
categories: blog
published: true
tags: [Security, Security, Database Administration, Code Samples, Testing]
comments: false
cover-img: /assets/img/path.jpg
---
We were recently applying a number of changes on a test environment and which were due for implementation on the production database once testing was verified. What one of the testers failed to notice was that one of the applications was connecting to the production database instead. Luckily no harm was done because the operator did not have enough priviliges to cause damage. But what if?

A quick way to disallow access to the production database and ensure that the operator is connecting to the correct database is to revoke the CONNECT rights on the database as shown below.

``` sql
USE [MyDatabase]
GO
REVOKE CONNECT TO [UserName];
```

SQL Server might allow an authenticated session (i.e. a successful logon) however access to the database would not be possible. Reinstating the original access would be as easy as executing the below statement.

``` sql
USE [MyDatabase]
GO
GRANT CONNECT TO [UserName];
```

While being simple and effective this metheod does not modify any database object permissions or role membership for the affected user.
