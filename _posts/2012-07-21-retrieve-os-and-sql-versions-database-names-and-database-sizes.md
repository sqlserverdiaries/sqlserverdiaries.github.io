---
layout: post
date:   2012-07-21
title:  "Retrieve OS and SQL versions, database names and database sizes"
permalink: ./blog/index.php/2012/07/retrieve-os-and-sql-versions-database-names-and-database-sizes/
categories: blog
published: true
tags: [T-SQL Programming, Database Administration, Database Documentation, SQL Server, DMV, Development, Database Documentation, Code Samples]
comments: false
---
We are planning a migration of our older SQL Server databases to one of the latest versions or possibly decommission them.  To have a better idea of the environments, our management requested a report containing the operating system versions, the SQL Server versions, the database names and the database sizes on all instances.

To start off, the OS version was obtained by executing the xp_msver stored procedure, storing the results in a temporary table, then querying the table and storing the result in a variable as shown below:

``` sql
INSERT INTO #XPMSVER EXEC xp_msver 'WindowsVersion';

SELECT @WindowsVersion = CASE
        WHEN [Character_Value] LIKE '5.0%' THEN '2000'
        WHEN [Character_Value] LIKE '5.2%' THEN '2003'
        WHEN [Character_Value] LIKE '6.0%' THEN '2008'
        WHEN [Character_Value] LIKE '6.1%' THEN '2008 R2'
    END
FROM #XPMSVER;
```

The SQL Server version was retrieved by executing the SERVERPROPERTY('ProductVersion') command.  The database names together with the OS and DBMS versions were then stored in the _#databaselist_ temporary table.

The final details required were the database sizes.  This was a bit more tricky since I had to loop through all the databases and retrieve the information from the dbo.sysfiles table.  I used the sysfiles because the query had to be compatible with SQL Server versions from 2000 to 2008 R2.  The database size was saved to the _#databaselist_ temporary table, updating the current record in the loop using the _WHERE CURRENT OF_ syntax of the _CURSOR_.

Finally the script was executed against all SQL Server instances using the Multi-Server query functionality of SSMS 2008 and the result copied to a spreadsheet.

The complete script can be [downloaded from here](/assets/article_files/2012/07/retrieve-os-and-sql-versions-database-names-and-database-sizes.zip).
