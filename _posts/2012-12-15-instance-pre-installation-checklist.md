---
layout: post
date:   2012-12-15
title:  "Instance Pre-Installation Checklist"
permalink: ./blog/index.php/2012/12/instance-pre-installation-checklist/
categories: blog
published: true
tags: [Architecture, Database Administration, Virtualization, Backup, Listening Ports, Microsoft Cluster, SQL Server, Windows, Upgrade, Testing]
comments: false
---
You have been requested to provide an SQL Server environment to host the database/s of _Application123_. Once you’ve identified the server onto which the instance will be installed there are a number of checks I would suggest, or at least these are the ones I follow. You will observe that most relate to the operating system environment and might or might not be directly related to SQL Server. I am also _assuming_ that the operating system has been installed by a knowledgeable technical person and the server has been certified for use in a production environment.

* Operating System is Windows 2008 Server R2 or later;
* OS architecture is 64-bit;
* The most recent service pack and required patches have been installed;
* The server is joined to a domain;
* The server name is resolved by the DNS;
* There are no HOSTS file entries;
* Adequate swap/page file size has been allocated;
* Antivirus (not) installed – might depend on company policy;
* Network interfaces have been configured appropriately;
* Local Policy Settings are managed centrally (using GPOs);
* Membership in Local Groups is managed centrally (using GPOs);
* The environment is used for a single purpose only (database server only and no IIS for example);
* Non server software is not installed on the environment;
* No local Users or Groups have been created (e.g. managed through Active Directory);
* Environment has been included in monitoring;
* OS backup has been configured;
* OS configuration has been documented and stored in a repository;
* Domain user/s have been created for the SQL Server services;
* Service account (domain user) has the Local Policy Settings required by SQL Server services set;
* Data partition/s aligned to 64Kb or greater (not necessary for Windows 2008 and later) – see _diskpart.exe;_
* Data partition/s have been formatted using 64Kb allocation units – see _fsutil.exe;_
* SQL Server installation media is available (obvioulsy…);
* Latest SQL Server Service Pack downloaded and available;
* Non-default listening port/s to be used by applications have been identified;
* Network access from the client machines to the server environment is open.

This of course is a non-exhaustive list of checks and you might remove or add items to the list. In any case I guess it is a good starting point. Now where did I store that ISO…?
