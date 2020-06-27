---
layout: post
date:   2011-02-05
title:  "Database Upgrade from SQL Server 7"
permalink: ./blog/index.php/2011/02/05/database-upgrade-from-sql-server-7/
published: true
tags: [Upgrade, Database Design, SQL Server 2005]
comments: false
---
When migrating databases from SQL Server 7 or 2000 to SQL Server 2005/2008 the steps can be summarised as follows:

Migrate all logins (including passwords) accessing the database
Disallow all connections to the database by restricting access only to SYSADMIN's
Back up the database and copy the backup file (or files) to the new server
Restore the database to the new server
Perform consistency checks, update page usage and statistics (check for errors)
Allow connections to the database

I encountered a (potential) issue recently where, in databases which had been migrated from SQL Server 7 or 2000, the "Page Verify" option had not been set correctly.  This is used to discover and report incomplete I/O transactions caused by disk I/O errors.  Possible values are "None", "TornPageDetection", and "Checksum".  SQL Server 7 did not have this option; SQL 2000 allowed for "None" or "TornPageDetection".  Definitions of these options are found in the [SQL Server 2005 Books Online - Setting Database Options](http://msdn.microsoft.com/en-us/library/ms190249(SQL.90).aspx) and the [SQL Server Storage Engine - Checksum in SQL2005](http://blogs.msdn.com/sqlserverstorageengine/archive/2006/06/29/Enabling-CHECKSUM-in-SQL2005.aspx).

I noticed that databases upgraded from SQL 7 have this option set to "None", while SQL Server 2000 databases are set to either of "None" or "TornPageDetection".  Setting the option can be done using the following sample syntax:
``` sql
ALTER DATABASE <database_name> SET {TORN_PAGE_DETECTION | CHECKSUM} ON
```

Unfortunately the full benfit of the "Checksum" option can only be seen for newly-created databases.  An SQL Server Program Manager states (see [SQL Server Storage Engine - Checksum in SQL2005](http://blogs.msdn.com/b/sqlserverstorageengine/archive/2006/06/29/enabling-checksum-in-sql2005.aspx) that for databases which did not have the Checksum option set on creation _"there is no benefit of computing the checksum as there is no checksum to verify it against"_.  He also states that _"if the database page is already corrupt, the checksum will be computed based on this corrupt data and there will be no way to detect it"_.

For databases which did not have this set, I enabled the "TornPageDetection" option.  This offers _"a low (CPU) cost mechanism to eliminate a subset of the I/O based page corruptions"_ as recommended.

In order to have a valid checksum on all database pages, one may consider rebuilding the database from scratch (i.e. scripting and migrating data) however any systems that access this database might incur an amount of downtime.
