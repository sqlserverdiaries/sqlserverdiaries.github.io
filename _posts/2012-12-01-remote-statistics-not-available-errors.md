---
layout: post
date:   2012-12-01
title:  "Remote Statistics Not Available Errors"
permalink: ./blog/index.php/2012/12/remote-statistics-not-available-errors/
categories: blog
published: true
tags: [Architecture, Database Administration, Database Design, T-SQL Programming, Coding Practices, Development, Linked Servers, SQL Server 2005, SQL Server 2008 R2, SQL Server 2008, SQL Server 2012, Upgrade, Testing]
comments: false
---
Before explaining what the errors were I will first explain the environment configuration.

Third parties required access to company data from various databases in order to build a Reporting Solution however the company security policies prevented the third-parties from accessing the source databases directly.  An obvious solution would have been to copy the source data to a central Data Warehouse at regular intervals using ETL processes.  This however would have required that the ETL processes are monitored, data verified, and the same ETL processes updated/mantained whenever the third-party required additional data sets.  Another very important factor was that the intermediary solution would have to be “low-cost” since the number of SQL Server licences was limited (i.e. we didn’t have any to waste).  The solution would have to use SQL Server Express Edition.

SQL Server Express Edition has a number of limitations which we had to work around in order to keep the cost down, restrict access to the data while providing the required data sets. One of the limitations was the maximum database size of 10GB, which was a problem.   Copying the data, even using ETL was not an option.  And in any case, using an SSIS package would not have been possible either since the SSIS service is only availabe with the paid-for editions.

After a brainstorming session we decided to create a “shell” database, and provide access to the source data using a number of Linked Servers where the account used by the Reporting Solution was mapped to individual accounts created on the target systems.  Read-only permissions were also granted to the individual accounts on the target database objects. A number of Views and Stored Procedures were created in the “shell” database to provide the Reporting Solution with an entry point to the target data via the Linked Servers.  The solution was tested and it worked perfectly.  For a while that is.

After some time we started getting 7359 errors similar to the below:

``` text
Msg 7359, Level 16, State 1, Line 1
The OLE DB provider "SQLNCLI10" for linked server "LINKED-SERVER-01"
reported a change in schema version between compile time ("175964832212545")
and run time ("176012076953654") for table "SourceDB1"."dbo"."SourceTable1"
```

We found that the scenario where a view acesses another view on another server through a Linked Server raised errors similar to the one described in [KB2498818](http://support.microsoft.com/kb/2498818 "Error 7359 when you run a query against a user-defined function or a view that uses a synonym on a linked server in SQL Server 2005, SQL Server 2008 or SQL Server 2008 R2").  The KB describes the cause as:

> This issue occurs because the existing execution plan is not cleared correctly. This causes the schema version to change, because the user-defined function or the view is recompiled when the second query is run. Therefore, the error occurs.

The KB provides a resolution which, since at the time we were using SQL Server 2008 R2, was to install [Cumulative Update package 7 for SQL Server 2008 R2](http://support.microsoft.com/kb/2507770 "Cumulative Update package 7 for SQL Server 2008 R2").  As a rule I do not really “like” to install CU patches and prefer to stick to Service Packs.

I suspected that the error was due to reindexing and/or update statistics on the source database that was creating differences between the execution plans stored on the Reporting instance and the instance hosting the source database, and possibly also due to the version difference between the two DBMS instances – at least that was my theory. I also re-checked out the information for the [KB2498818](http://support.microsoft.com/kb/2498818 "Error 7359 when you run a query against a user-defined function or a view that uses a synonym on a linked server in SQL Server 2005, SQL Server 2008 or SQL Server 2008 R2") and [KB2544793](http://support.microsoft.com/kb/2544793 "Cumulative update package 1 for SQL Server 2008 R2 Service Pack 1").  As a temporary fix I suggested using the OPTION(RECOMPILE) table hint as shown below.

``` sql
SELECT col1, col2, col3
FROM source1.vw_sourcedata
GROUP BY col1, col2, col3
OPTION(RECOMPILE);
```

The attempted solution did not work.

After putting more time into research I also found a bug report in the Microsoft Connect website titled [Synonym in local view to remote table causes schema version error](http://connect.microsoft.com/SQLServer/feedback/details/378549/synonym-in-local-view-to-remote-table-causes-schema-version-error "Synonym in local view to remote table causes schema version error"). What is interesting is that the bug report is closed and seems to be fixed. Microsoft’s feedback in relation this this bug report was the following:

> Posted by Microsoft on 06/11/2008 at 23:02
> Dear Jasper,
>
> Thanks for reporting the schema version error when using synonyms in
> combination with local views and remote table access in linked servers.
> The behaviour is indeed incorrect and we will consider fixing this bug
> in the next release.
>
> Best reagrds and thanks again for your feedback.
>
> Joachim Hammer  
> Program Manager  
> SQL Server

…and later:

> Posted by Microsoft on 08/06/2010 at 20:54
> Jasper and others,
>
> We fixed the bug related to the schema version error when using synonyms
> in a local view to reference a remote table. The fix will be in the first
> CTP (CTP0) of the coming release (SQL Server 11 Codename Denali). We are
> currently also considering backporting it to earlier versions but the
> decision has not been made yet.
>
> Thanks for your patience.
>
> Regards,
>
> Joachim Hammer  
> Program Manager  
> SQL Server

At that point It seemed that in order to resolve this issue we would have had to upgrade to SQL Server 2012 when released, unless the fix is implemented in a patch or service pack. Alternatively, we could use the accepted workaround to the bug report which suggests executing the [sp_refreshview](http://msdn.microsoft.com/en-us/library/ms187821.aspx "sp_refreshview (Transact-SQL)") stored procedure as a scheduled job. The procedure documentation describes it’s functionality as follows:

> Updates the metadata for the specified non-schema-bound view. Persistent metadata for a view can become outdated because of changes to the underlying objects upon which the view depends.
>
> If a view is not created with schemabinding, sp_refreshview should be run when changes are made to the objects underlying the view that affect the definition of the view. Otherwise, the view might produce unexpected results when it is queried.

We decided to create a scheduled job that executes the sp_refreshview stored procedure for each VIEW object.  Unfortunately this didn’t work either.  The last options were to either install SQL Server 2008 R2 CU7 or port everything to SQL Server 2012.  We decided to “risk it” and install the CU7.

I requested the patch from Microsoft, making sure to download the correct architecture and language version, and scheduled the installation.

Following to the installation of CU7 a number of queries were executed to test each Linked Server – all executed without any issues.  Also, the build number of the SQL Server instance (in this case obtained using the [@@VERSION](http://msdn.microsoft.com/en-us/library/ms177512.aspx "@@VERSION (Transact-SQL)") variable) was changed to 10.50.2796.0.  The installation was successful.

I recently found out that this “bug” has actually been fixed in SQL Server 2012 as shown in the [What’s New in SQL Server 2012](http://msdn.microsoft.com/en-gb/library/bb500435(v=sql.110).aspx "What's New in SQL Server 2012") article which states:

> **DBCC SHOW_STATISTICS works with SELECT permission**
>
> In earlier releases of SQL Server, customers need administrative or ownership permissions to run DBCC SHOW_STATISTICS. This restriction impacted the Distributed Query functionality in SQL Server because, in many cases, customers running distributed queries did not have administrative or ownership permissions against remote tables to be able to gather statistics as part of the compilation of the distributed query. While such scenarios still execute, it often results in sub-optimal query plan choices that negatively impact performance. SQL Server 2012 SP1 modifies the permission restrictions and allows users with SELECT permission to use this command. Note that the following requirements exist for SELECT permissions to be sufficient to run the command:
>
> * Users must have permissions on all columns in the statistics
> * Users must have permission on all columns in a filter condition (if one exists)
>
> Customers using Distributed Query should notice that statistics can now be used when compiling queries from remote SQL Server data sources where they have only SELECT permissions. Trace flag 9485 exists to revert the new permission check to SQL Server 2012 RTM behavior in case of regression in customer scenarios.

Another reason to upgrade to the latest version.
