---
layout: post
date:   2011-07-30
title:  "Tormented by an ORDERed VIEW"
permalink: ./blog/index.php/2011/07/tormented-by-an-ordered-view/
categories: blog
published: true
tags: [Code Samples, Database Administration, T-SQL Programming, Coding Practices, Database Migration, Development, SQL Server 2000, SQL Server errors, Upgrade]
comments: false
---
We have been migrating and upgrading SQL Server 2000 databases to SQL Server 2005 for a while and the momentum increased soon after [Microsoft stopped Mainstream Support in April 2008 (Microsoft Product Lifecycle)](http://support.microsoft.com/lifecycle/search/default.aspx?alpha=SQL+Server+2000). During the course of the upgrades we have occasionally been told that certain VIEWs did not return the result sets as before the migration. On reviewing the VIEW definition we noticed that it was similar to:

``` sql
CREATE VIEW MyTableView AS
SELECT TOP 100 PERCENT col1, col2, col3
FROM MyTable
WHERE col2=5
ORDER BY col1 ASC;
```

The problem with this type of syntax in a VIEW is that, by definition a VIEW is supposed to behave like a table and is therefore not ordered. This is why ORDER BY by itself is not allowed in a view definition. It is allowed to have ORDER BY if you also have TOP, but in such case ORDER BY clause is allowed to make sure that the correct rows are returned (such as in retrieving the five most common Products, for example), not in a particular order.

At some point, the "workaround" to have TOP 100 PERCENT started to be used in applications connecting to SQL Server 2000 databases. Database developers realised that this would allow them to have an ORDER BY in a VIEW, which returns "sorted" results; it doesn't though. SQL Server 2000's optimizer wasn't as advanced as the SQL Server 2005 optimizer, so for small result sets developers often found that the data was returned according to the ORDER BY clause definition. The SQL Server 2005 optimizer was rewritten to be smarter, and if it finds both TOP 100 PERCENT and ORDER BY clauses it “knows” that both these operations don’t affect “which” rows to return, so both operations are removed from the execution plan. Remember that, as explained above, a VIEW is by definition not sorted.

Some developers had relied on the SQL Server 2000 behaviour (bug?) to create "sorted views". This behaviour was never documented, just a side effect of the execution plan, and was never guaranteed.

Support for this functionality was then [changed (fixed...) in SQL Server 2005](http://msdn.microsoft.com/en-us/library/ms188385(v=SQL.90).aspx) where the documentation specifically states that:

> “When ORDER BY is used in the definition of a view, inline function, derived table, or subquery, the clause is used only to determine the rows returned by the TOP clause. The ORDER BY clause does not guarantee ordered results when these constructs are queried, unless ORDER BY is also specified in the query itself.”

This also means that, using the above as an example, results should be sorted by the calling query:

``` sql
SELECT * FROM MyTableView ORDER BY col1 ASC;
```

The only feasible solution in such cases is to modify the code calling the VIEW as shown in the above example. We also tried setting the database compatibility level to 80 (using [sp_dbcmptlevel (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms178653.aspx)) however the behavior was unchanged.

Going through the Microsoft Knowledge base articles we found an article titled [FIX: When you query through a view that uses the ORDER BY clause in SQL Server 2008, the result is still returned in random order](http://support.microsoft.com/kb/926292). The suggested fix states that trace flag 168 is enabled either temporarily (until the next SQL Server restart) or permanently (by adding it to the service startup parameters and that cumulative update 2 is installed onto an SQL Server 2005 SP2 instance. Since the destination environment was at SP3 or SP4 level this hotfix had already been installed (service packs are cumulative). This effectively means that by enabling trace flag 168 the database can be migrated and will behave as on an SQL Server 2000 instance. Although this solution might seem the most feasible, the article also states that:

> “However, this hotfix is only a temporary resolution. After you migrate the application, you must update the application to work correctly with the new behavior in SQL Server 2005.”

The actual trace flag 168 is not documented anywhere other than in this KB. Undocumented features such as this trace flag might introduce unwanted behaviour in the DBMS and other databases hosted on the same environment. I personally do not feel comfortable using undocumented features in a production environment unless it is either an extreme case or the solution is temporary (i.e. a few days).

If you, like me are not willing to risk enabling this trace flag, this means that unless the calling application code is modified to ORDER the result sets as explained above, you will either have to live with your database existing on an SQL Server 2000 instance or accept the fact that result sets might not be ordered. If you opt for the retaining the SQL Server 2000 instance, bear in mind that Microsoft will cease Extended Support for the product in April 2013, that is in less than 20 months.
