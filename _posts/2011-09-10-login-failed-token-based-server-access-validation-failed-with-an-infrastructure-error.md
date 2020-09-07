---
layout: post
date:   2011-09-10
title:  "Login failed: Token-based server access validation failed with an infrastructure error"
permalink: ./blog/index.php/2011/09/login-failed-token-based-server-access-validation-failed-with-an-infrastructure-error/
categories: blog
published: true
tags: [Database Migration, Database Administration, Security, SQL Server errors, Windows]
comments: false
---
This week we implemented a database onto a production environment.  The implementation had been tested a number of times to prepare and verify the final set of scripts.  On D-Day we started the implementation according to the previously tested steps and I'm proud to say that all went fine.  We were slightly off with the timings but that wasn't much of an issue.  When I informed the website administrators that they could start testing the website they came back to me with the following error:

> Login failed for user 'XXXX\xxxxxxxxxx'. Reason: Token-based server access validation failed with an infrastructure error. Check for previous errors.

We were dumbstruck.   We hadn't encountered this error during the previous tests.  A _token-based server access_ error was probably related to the Active Directory account.  I asked the developers if they had chnaged the domain account password that day, which they hadn't.  We checked the account in the domain and all appeared to be fine.

A quick Google search revealed a number of articles with similar symptoms, but no actual cause for this error.  One article titled [SQL Server oddities](http://www.cleverworkarounds.com/2010/08/01/sql-server-oddities/) written by [Paul Culmsee](http://www.cleverworkarounds.com/about/) in his CleverWorkarounds blog revealed identical symptoms.  Paul had been in a hurry to implement and his solution was to drop the login and recreate it.  Since we were a bit late with our implementation timings, we tried it and it worked!  The only thing we had to add were the Linked Server mappings, but that was specific to our implementation.

Once the problem was solved I decided to investigate this issue further - after all I didn't know whether it was an initial configuration issue or whether it would happen again.  Part of the error captured in the application stack trace is shown below:

``` text
==================================

Cannot connect to SQLSRVR\Instance.

===================================

Login failed for user 'XXXX\xxxxxxxxxx'. (.Net SqlClient Data Provider)

------------------------------
For help, click: http://go.microsoft.com/fwlink?ProdName=Microsoft+SQL+Server&amp;EvtSrc=MSSQLServer&amp;EvtID=18456&amp;LinkId=20476

------------------------------
Server Name: SQLSRVR\Instance
Error Number: 18456
Severity: 14
State: 1
Line Number: 65536
```

The link to the Microsoft Events and Error Message Center did not provide any relevant information.  Searching for _"token-based server access validation failed"_ in the [MSDN Blogs](http://blogs.msdn.com/search/) yielded one result.  The article [Troubleshooting specific Login Failed error messages](http://blogs.msdn.com/b/sqlserverfaq/archive/2010/10/27/troubleshooting-specific-login-failed-error-messages.aspx) by _AmruthaVarshiniJ_ gives a brief explanation of how Ring Buffers entries can be used to identify login failures and links to the article [How It Works: SQL Server 2005 SP2 Security Ring Buffer - RING_BUFFER_SECURITY_ERROR](http://blogs.msdn.com/b/psssql/archive/2008/03/24/how-it-works-sql-server-2005-sp2-security-ring-buffer-ring-buffer-security-error.aspx) but which didn't provide any useful information for this scenario.  A useful query from the article by _AmruthaVarshiniJ_ is shown below:

``` sql
-- Extract Ring Buffer Information for SQL Server 2008 instances and above
SELECT
    CONVERT (varchar(30), GETDATE(), 121) as runtime,
    dateadd (ms, (a.[Record Time] - sys.ms_ticks), GETDATE()) as [Notification_Time],
    a.* , sys.ms_ticks AS [Current Time]
FROM
    (SELECT
        x.value('(//Record/Error/ErrorCode)[1]', 'varchar(30)') AS [ErrorCode],
        x.value('(//Record/Error/CallingAPIName)[1]', 'varchar(255)') AS [CallingAPIName],
        x.value('(//Record/Error/APIName)[1]', 'varchar(255)') AS [APIName],
        x.value('(//Record/Error/SPID)[1]', 'int') AS [SPID],
        x.value('(//Record/@id)[1]', 'bigint') AS [Record Id],
        x.value('(//Record/@type)[1]', 'varchar(30)') AS [Type],
        x.value('(//Record/@time)[1]', 'bigint') AS [Record Time]
    FROM (
        SELECT CAST (record as xml) FROM sys.dm_os_ring_buffers
        WHERE ring_buffer_type = 'RING_BUFFER_SECURITY_ERROR'
        ) AS R(x)
    ) a
    CROSS JOIN sys.dm_os_sys_info sys
ORDER BY a.[Record Time] ASC
```

This resultset contained a number of the following (summarised) items:

ErrorCode: **0x534**
CallingAPIName: **LookupAccountSidInternal**
APIName: **LookupAccountSid**

The API failures indicated a failure when attempting to resolve the SID stored by SQL Server to the Active Directory SID.  The error code 0x534 is the hexadecimal value for 1332.  The message for error number was obtained using **_net helpmsg 1332_** at the command prompt and which returned the following message:

> No mapping between account names and security IDs was done.

This message provided (yet) another search term which directed me to the [SQLMonster formum thread](http://www.sqlmonster.com/Uwe/Forum.aspx/sql-server-setup/9534/no-mapping-between-account-names-and-security-ids-was) and which hinted at a [SYSPREP](http://technet.microsoft.com/en-us/library/cc721940%28WS.10%29.aspx) setting when creating Virtual Servers.  Since the environment was actually a Virtual Server I decided to investigate this route.  The [Sysprep Command-Line Syntax](http://technet.microsoft.com/en-us/library/cc721973%28WS.10%29.aspx) for the **/generalize** parameter states that _"If this option is specified, all unique system information is removed from the Windows installation. The security ID (SID) resets, any system restore points are cleared, and event logs are deleted."_ An identical scenario is explained by [Mark Macrae](http://macraem.wordpress.com/about/) in the blog post [No Mapping Between Account Names and Security IDs – SQL Server Install and SysPrep Generalize](http://macraem.wordpress.com/2010/02/25/no-mapping-between-account-names-and-security-ids-sql-server-install-and-sysprep-generalize/).  This theory was however abandoned after confirming that the installation was carried out from scratch and not from a SYSPREP image.

Further research led me nowhere so I deceided to dedicate my efforts elsewhere, though I have a mental note to investigate this error further.  If I do find out anything useful you'll find it here.  Meanwhile, a big THANK YOU to Paul!

---

#### UPDATE - 27 April 2012 ####

Further research into this matter showed that the operating system on the client machine had UAC turned on (Win Vista and later), thus the domain group membership was not being passed and authentication was not allowed.  The user was asked to either turn off UAC (not recommended) or launch the application using the _“Run as administrator”_ option.  Another point is that domain groups should not be nested.

This article helped me solve this issue: [Token-based server access validation failed with an infrastructure error - MS SQL Server 2008 on Windows 2008 Server](http://www.sqldbops.com/2010/05/token-based-server-access-validation.html).
