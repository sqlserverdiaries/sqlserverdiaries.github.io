---
layout: post
date:   2021-05-17
title:  "Obtain Access to SQL Server using PowerShell"
permalink: ./blog/index.php/2021/05/obtain-accesss-using-powershell/
categories: blog
published: true
tags: [PowerShell, Security]
comments: true
---
A few times, more than I would have wanted, I've been asked to support a SQL Server instance which was "discovered" to have been installed by "someone else". This could have been anyone: a previous DBA, a Developer, an Ops person, a Vendor, or other. Any DBA working in an Operational role would have come across these situations.

Short of reinstalling the instance and moving the databases - there is a production system linked to it - my approach has been to do the following:

1. Create a Windows Scheduled Task;
2. Add two Actions (steps) to the Task;
   - The first will be to create a login;
   - The second action will be to add the new login to the `sysadmin` fixed server role
3. Set the Task to run under the `NT AUTHORITY\SYSTEM` account and using the highest privileges;
4. Test the connection; and finally;
5. Delete the Scheduled Task (we don't need it anymore once we have access).

Here is the PowerShell script in it's entirety: [GetAccessToSQL.ps1](https://github.com/reubensultana/DBAScripts/blob/master/Audit+Security/GetAccessToSQL.ps1)
