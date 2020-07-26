---
layout: post
date:   2012-03-17
title:  "Grant Priviliges to a Computer/Machine Account - Why?!"
permalink: ./blog/index.php/2012/03/grant-priviliges-to-a-computermachine-account-why/
categories: blog
published: true
tags: [Database Administration, Security, Security, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SCCM, Architecture]
comments: false
---
I was recently involved in the implementation of an SQL Server environment that would host the database for a Microsoft Service Center Configuration Manager (SCCM) deployment.  My expertiese was required to prepare the SQL Server instance and make reccomendations for performance, sizing, and of course security, which I did.  The only issue I was adamant should be changed was the fact that the [SCCM documentation](http://technet.microsoft.com/en-us/library/bb680595.aspx "About the Local System Account/Computer$ in Configuration Manager") suggested that the services are set to start using the _Local System_ account and that the **Machine Account** is granted priviliges on the SQL Server database. _"The Local System account does not have any rights to access the network. When network access is necessary, Local System uses the account Domain\\computername$"_.

The above statements suggest using the Domain\\computername$ account instead however the [CREATE LOGIN](http://msdn.microsoft.com/en-us/library/ms189751.aspx "CREATE LOGIN (Transact-SQL)") documentation in the SQL Server BOL does not explain or give examples how to create a Machine Account. The problem with this configuration is that, since the Machine Account represents the _Local System_ account (whose actual name is _NT AUTHORITY\System_), **any** service on the source machine/s and which is started using the _Local System_ account will have the same privilege level as the SCCM service on the SQL Server database and data. 

The SCCM 2007 documentation at [http://technet.microsoft.com/en-us/library/bb632943.aspx](http://technet.microsoft.com/en-us/library/bb632943.aspx) states the following:

> **Database Connection Accounts**
>
> _The management point, PXE service point, and server locator point can connect to the database using the computer$ account or using a database connection account (Management Point Database Connection account, Server Locator Point connection account, or PXE Service Point Database Connection account). If you use the computer$ account, Configuration Manager 2007 automatically attempts to add the account to the database role. If you use a database connection account, you must manually add the user account to the database role._

It is my understanding that the above implies that the SCCM 2007 service/s can be configured to use an alternate/custom account to connect to the database, however the (application?) roles have to be set manually.  What is not clear is which role/s are required for the service to function. Again, quoting from a Microsoft Technet article titled [How to Install Configuration Manager Using a Remote SQL Server](http://technet.microsoft.com/en-us/library/bb693554.aspx "How to Install Configuration Manager Using a Remote SQL Server") we can observe instruction on the permissions required for this configuration.

> **To install Configuration Manager using a remote SQL Server**
>
> 1. Add the machine account of the primary site server machine to the local **Administrators** group of the remote SQL Server computer. This is required to allow the site server to install and configure settings later.
> 2. ...

Another [Technet article](http://technet.microsoft.com/en-us/library/bb735885.aspx "How to Configure an SPN for SQL Server Site Database Servers") explains that the SCCM SQL Server service should start using a user account instead of the _LocalSystem_ account, however the Service Principal Name (SPN) must be registered for the SQL Server service account. The same article states that: 

> _Running the SQL Server service using the local system account of the SQL Server computer is not a SQL Server best practice. For the most secure operation of SQL Server site database servers, a low rights domain user account should be configured to run the SQL Server service._

This is of course one of the security best practices when installing SQL Server (see [Setting Up Windows Service Accounts](http://msdn.microsoft.com/en-us/library/ms143504.aspx "Setting Up Windows Service Accounts") in MSDN).

After going through a considerable amount of documentation, it seems that the SCCM services have to be set to start using the _Local System_ account.  Consequently the _Machine Account_ has to have access to the SQL Server database.  In my opinion this is a product flaw/ weakness / limitation on Microsoft’s part, especially considering that they (Microsoft) have made such a fuss over SQL Server’s implementation of the SD3+C principles – see section _1.2 Security Development Lifecycle Overview_ in [The Trustworthy Computing Security Development Lifecycle](http://msdn.microsoft.com/en-us/library/ms995349.aspx "The Trustworthy Computing Security Development Lifecycle").  Unless some other configuration document emerges from the vast Technet, the only option would be to have the SCCM database in it's its own environment and within its own VLAN.  On my part, should there be a suggestion to host the database on a shared environment (i.e. server consolidation) I would definitely vote against it.
