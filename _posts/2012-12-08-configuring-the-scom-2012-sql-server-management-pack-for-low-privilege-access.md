---
layout: post
date:   2012-12-08
title:  "Configuring the SCOM 2012 SQL Server Management Pack for Low-Privilege Access"
permalink: ./blog/index.php/2012/12/configuring-the-scom-2012-sql-server-management-pack-for-low-privilege-access/
categories: blog
published: true
tags: [Architecture, Database Administration, SQL Tools, Virtualization, Security, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, Windows]
comments: false
---
The System Center Operations Manager 2012 is Microsoft’s flagship product to monitor various aspects of the infrastructure.  Specific details about the product can be found in the TechNet at [http://technet.microsoft.com/en-us/library/hh205987.aspx](http://technet.microsoft.com/en-us/library/hh205987.aspx "System Center 2012 - Operations Manager").  Monitoring can be “extended” to SQL Server instances (2005 and later versions only) using the [System Center Monitoring pack for SQL Server](http://www.microsoft.com/en-gb/download/details.aspx?id=10631 "System Center Monitoring pack for SQL Server").  Once the pack is imported into SCOM it can be configured to scan the network (discovery) for SQL Server instances or alternatively they can be be entered manually.  The exact procdure how to do this can be found in the product documentation.  In this post I wanted to explian another aspect.

Pages 29 to 33 of the [SQL Server Management Pack Guide for System Center Operations Manager](http://download.microsoft.com/download/0/7/7/07714012-3B7C-4691-9F2B-7ADE4188E552/SQLServerMPGuide.doc "SQL Server Management Pack Guide for System Center Operations Manager") explain how to implement the principle of least privilige for the SCOM service configuration (and the Management Pack) when accessing SQL Server instances.  The scenario is for an environment where servers are joined to a domain.

For specifics, from this point forward please refer to the document.  The first step is to create domain users and groups which are then granted specific Group Membership and Policy Settings _on each server that will be monitored_.  You might be able to get away with this administrative overhead by using GPOs – this should be discussed with your domain administrators.

The next step is to grant permissions within the SQL Server instances.  Logins have to be created and granted VIEW ANY DEFINITION and VIEW SERVER STATE rights.  The same logins also have to be created _in system database and each user database_ (!!).  In the case of attached or restored databases the DBA has to remember to grant the permissions.  Finally the logins have to be added to a database role in the MSDB.  For those who choose this route a sample script is included.  In my opinion this is a very high administrative overhead, both when deploying and even more after.  Moreover, post-deployment this procedure is prone to failure since there is a dependency on the DBA remebering to create a user in each attached or restored database.  I cannot understand how Microsoft missed this.

Alternatively you can throw the SCOM SQL Server Management Pack Low-Privilige Access document out of the window, have the SCOM service (on each machine) running using the _Local System_ account, and the _Local System_ account created as an SQL Server login which would also be a member of the _sysadmins_ fixed server role.  During testing, the only problem I found with this setup is that if you want to implement a process such as the one explained in the [Automatically Restore a Database to Test Backups](./blog/index.php/2012/07/automatically-restore-a-database-to-test-backups/ "Automatically Restore a Database to Test Backups") post, database connections for sysadmin members are not killed and the Automated Restore will fail.

It’s really up to your company policies and whether an agreement is reached between the Operations and Security team/section/department.  Whichever option you choose, my suggestion is that the number of _sysadmin_ members is limited as much as possible.
