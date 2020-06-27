---
layout: post
date: 2011-01-22
title: "SSIS error: 'buffer manager cannot create a temporary storage file on any path in the BufferTempStoragePath property'"
permalink: ./blog/index.php/2010/12/30/ssis-buffertempstoragepath-error/
published: true
tags: [SQL Server 2005, BufferTempStoragePath, runas, BLOBTempStoragePath, SSIS, Backup and Recovery, Database Administration, SQL Tools, SQL Server Integration Services]
comments: false
---
An ETL SSIS package implemented on a test environment was failing occasionally with the error:

*The buffer manager cannot create a temporary storage file on any path in the BufferTempStoragePath property. There is an incorrect file name or no permission.*

The package was failing on various occasions when copying binary files using one of the BLOB data types (DT_TEXT, DT_NTEXT or DT_IMAGE).  The same package also logged the following messageswhen logging was configured to return all messages.

*The buffer manager detected that the system was low on virtual memory, but was unable to swap out any buffers. 4 buffers were considered and 4 were locked. Either not enough memory is available to the pipeline because not enough is installed, other processes are using it, or too many buffers are locked.*

*The buffer manager cannot create a temporary storage file on any path in the BufferTempStoragePath property. There is an incorrect file name or no permission.*

According to an SQL Server forum thread [SSIS Job Failure](http://social.msdn.microsoft.com/Forums/en-US/sqlintegrationservices/thread/912ee1eb-8d95-4cc6-9844-cb7f56d36515) the error appears to be related to memory pressure or permissions on the temporary folder used during the package execution.  Since the issue occurred intermittently the actual cause couldn't be identified.  The page file was already set to be "System Managed".  Memory was monitored for a period of time using Performance Monitor (perfmon) however the server did not report any memory pressure.

An [SQL Server 2005 Integration Services - BufferTempStoragePath](http://www.sqlservercentral.com/Forums/Topic611028-148-1.aspx) forum thread seemed to point us to check the memory pressure and security settings.

According to James Beresford's article (BI Monkey) [BLOBTempStoragePath and BufferTempStoragePath](http://www.bimonkey.com/2008/04/blobtempstoragepath-and-buffertempstoragepath/) each data flow in every package should have the BLOBTempStoragePath and BufferTempStoragePath values set.  As described by the author, a BI developer can set these values globally in a package and store the values together with other configuration items (to avoid hard-coding).

The package was stored in the *msdb* database and the SQL Agent job was configured to execute as a proxy account.  Since the package execution context and the service account were different we suspected that the problem was a permissions issue (but of course we had to prove that...!).  We also confirmed that profile for the proxy account login did not exist on server and consequently the login's temporary folder is missing.

The [Microsoft Support article 972365](http://support.microsoft.com/kb/972365) indicated that Cumulative Update 5 for SQL Server 2005 Service Pack 3 would fix this issue.  Since we usually apply CUs to fix security issues only we did not see this as a resolution.

Since the profile for the login used as a proxy account did not exist on the server we executed the following:
1. Open a command prompt window on the server
2. Execute *"runas /user:DOMAIN\proxy_account_login notepad.exe"* and enter the password when requested
3. Close Notepad

This effectively created the profile and corresponding set of folders, including the profile temporary folders.

The package execution was monitored for a period of one month during which it did not fail.  Success!
