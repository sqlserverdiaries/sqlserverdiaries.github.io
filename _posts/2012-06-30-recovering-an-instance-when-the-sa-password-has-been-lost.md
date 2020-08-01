---
layout: post
date:   2012-06-30
title:  "Recovering an instance when the sa password has been lost"
permalink: ./blog/index.php/2012/06/recovering-an-instance-when-the-sa-password-has-been-lost/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, Security, Database Documentation, Database Migration, Security, SQL Server 2000, SQL Server, Upgrade]
comments: false
---
Or, how to recover and regain control of an SQL Server 2000 instance.

Now that SQL Server 2000 is fast approaching the [product end of support lifecycle date](http://support.microsoft.com/lifecycle/search/?sort=PN&alpha=sql+server+2000) (10 months to go.) companies should take a more active approach to upgrading database and application code to a more recent version, or at least those who haven’t started.

In large organisations sometimes DBAs might find that an SQL Server instance was installed by an ex-employee and no handover took place. Or that an SQL Server instance that was commisioned for development or test purposes was somehow being used for a production system.  By some kind of “miracle” the SQL Server instance had been working for a number of years (!), probably without being backed up and no maintenance.  Once the instance had been “discovered”, management decide that it will now be administered by the “official” DBA team, with the direction being that the instance has to be upgraded too.  The DBAs cheer and shout “Fantastic! Bring it on!”.

Of course, since the instance was unknown and the previous DBA managed to make the SQL Server instance so secure that all administrative access had been lost we somehow have to find a way to gain access.  Short of fully reinstalling the instance and losing all the configuration changes, the steps explained below might assist in recovering the instance to a working state.

It is imperative to note that an amount of downtime is required during the recovery of the instance.  You will also require access to another SQL Server 2000 instance installed to the same service pack level as the original.  To find out the exact SQL Server version number you can open the ERRORLOG file (located in the LOG folder) using a text editor.  Once you have the version number you can use the excellent [SQL Server version database at SQLSecurity.com](http://www.sqlsecurity.com/faqs-1/sql-server-versions).

The steps explained below have been tested on non-production SQL Server 2000 instances and its success or otherwise cannot be guaranteed unless the steps are followed accurately.

1. Log on using a Windows account having Administrative privileges.

2. Check the configuration of the SQL Server Service account and make sure that the account has the following Local Policy Settings enabled:
   * Act as part of the operating system
   * Bypass traverse checking
   * Lock pages in memory
   * Log on as a service
   * Replace a process level token
   * Generate security audits
   * Perform volume maintenance tasks

3. Stop the SQL Server service.

4. Copy the _master.mdf_ and _mastlog.ldf_ from the server to **another** SQL Server 2000 instance where _sysadmin_ access is available.

5. Attach the files as a user database **with another name** besides _master_.  In the below examples I used “BAD\_master”.

6. Execute the following commands to allow updates to the system catalogs on the instance where the “bad” _master_ database was restored as a user database:

   ``` sql
   EXEC sp_configure 'allow updates' , 1;
   GO
   RECONFIGURE WITH OVERRIDE;
   GO
   ```

7. Use the [previously undocumented] [_PWDENCRYPT()_](http://msdn.microsoft.com/en-us/library/dd822791.aspx "PWDENCRYPT (Transact-SQL)") function to convert the word “PASSWORD” (or any other word to be used as the new temporary password) to binary. Once converted use this to update the password column in the _sysxlogins_ table in the “bad” _master_ database. The following script can be used:

   ``` sql
   SELECT PWDENCRYPT('PASSWORD');
   -- OUPUT: 0x010097...224D6B2

   UPDATE BAD_master..sysxlogins
   SET password = 0x010097...224D6B2
   WHERE sid=0x01
   AND name='sa';
   GO
   ```

8. Execute the following commands to revert the configuration settings and deny updates to system catalogs:

   ``` sql
   EXEC sp_configure 'allow updates' , 0;
   GO
   RECONFIGURE WITH OVERRIDE;
   GO
   ```

9. Detach the “bad” _master_ database and copy it back to the original server.

10. Back up the original _master.mdf_ and _mastlog.ldf_ files and replaced them with the files from the database where the _sysxlogins_ table was updated (as explained in step 5).

11. Restart the SQL Server instance and log on using the new SA credentials.

12. Change the SA password to a more secure that complies with your company’s password policies and store it in a secure location.

This process works only for SQL Server 2000 and will not work for any other version.
