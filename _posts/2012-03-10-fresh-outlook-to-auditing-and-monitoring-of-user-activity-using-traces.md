---
layout: post
date:   2010-12-30
title:  "The First Record"
permalink: ./blog/index.php/2010/12/the-first-record/
categories: blog
published: true
tags: [Uncategorized]
comments: false
---
I recently wrote about [auditing SQL Server instances using Traces](/blog/index.php/2011/11/audit-and-monitor-user-activity-using-traces/ "Audit and Monitor User Activity using Traces"), and after reviewing the solution with a "fresh" mindset I saw features that were missed during the research which led to a previous article.  Today's post shows how to limit the auditing to UPDATE, INSERT and DELETE events (see note/insert below) using the [Audit Schema Object Access Event Class](http://technet.microsoft.com/en-us/library/ms175846.aspx "Audit Schema Object Access Event Class") by setting appropriate filters on the _Permissions_ column.  This functionality is available in SQL Server 2000 and later versions.  Information for SQL Server 2000 versions can be found by looking up the text _Audit Object Permission Event_ (which "records the successful or unsuccessful use of object permissions") at [http://msdn.microsoft.com/en-us/library/aa173905(v=sql.80).aspx](http://msdn.microsoft.com/en-us/library/aa173905(v=sql.80).aspx).

* * *

**Audit Schema Object Access Event Class - "Permissions" column**

_Integer value representing the type of permissions checked._

1=SELECT ALL

2=UPDATE ALL

4=REFERENCES ALL

8=INSERT

16=DELETE

32=EXECUTE (procedures only)

* * *

A technical limitation exists for auditing SQL Server 2000 environments - the limitation being that the maximum amount of audit logs cannot be managed without adding complexity to the implementation. The auditing implementation will:

* Omit the Audit Login (14), Audit Logout (15) and Existing Connection (17) events from the capture since the considerable information from these events might mask information that would otherwise be relevant for an audit investigation.  The login executing an audited statement can in any case be identified since this information is captured and logged with every audit row.
* Not record the actual SQL statement being executed.  One of the columns being recorded contains the name of the affected database object, the login executing the statement can be identified and, the statement captured does not contain the values being passed by the end user application.

In the case of SQL Server 2000, the complexity mentioned above is handled as follows:

* Affect files where the extension is TRC;
* The latest 200 files (customisable) will be retained - all other TRC files will be deleted;
* The solution uses standard T-SQL, with the allowance of calling DOS commands through the _xp_cmdshell_ stored procedure;
* The only hard-coding in the solution is the root folder path where the TRC files are stored;
* The script is implemented as an SQL Server Agent job which executes hourly/daily/weekly/monthly, depending on the activity in your environment;

Summarising, the SQL Server 2000 version of the script uses the _DIR_ command with the specified parameters, and a T-SQL cursor to execute the _DEL_ command in quiet mode for each file to be deleted. All scripts can be downloaded using the below links.

* [SQL Server 2000 version](/assets/article_files/2012-03-fresh-outlook-to-auditing-and-monitoring-of-user-activity-using-traces/usp_trace_audit_2000.zip)
* [SQL Server 2005 version](/assets/article_files/2012-03-fresh-outlook-to-auditing-and-monitoring-of-user-activity-using-traces/usp_trace_audit_2005.zip)
* [SQL Server 2008 version](/assets/article_files/2012-03-fresh-outlook-to-auditing-and-monitoring-of-user-activity-using-traces/usp_trace_audit_2008.zip)
