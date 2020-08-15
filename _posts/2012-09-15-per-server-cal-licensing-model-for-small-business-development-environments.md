---
layout: post
date:   2012-09-15
title:  "Per Server + CAL Licensing Model For Small Business' Development Environments"
permalink: ./blog/index.php/2012/09/per-server-cal-licensing-model-for-small-business-development-environments/
categories: blog
published: true
tags: [Architecture, Database Administration, Virtualization, Database Migration, Development, Testing, Upgrade]
comments: false
---
Whenever a new SQL Server version is released, unless an organisation is forking out the [slightly steep annual cost of] Software Assurance, a DBA has to build a business case to upgrade to the latest database platform.  This because, at the end of the day the licence cost has to be deducted from the Company profits or claimed as an expense.  At the end of the day it boils down to less income. and your bosses might not approve the extra expenditure.  But what if they do?  The business case would have to make provisions for a development environment, unless you are the only DBA/Database Develeper in the Company.  But that’s another argument.  In the latter case, a Developer Edition licence will suffice, the cost in not that steep, however the software can only be installed on a single machine (or a machine per licence) and the installation cannot be used for production purposes.  The [Microsoft SQL Server 2008 R2 Developer Edition EULA](http://www.microsoft.com/en-us/download/details.aspx?id=2803 "Microsoft SQL Server 2008 R2 End User License Agreements") states, among other things, that:

> **OVERVIEW.**
>
> 1. Software. The software includes development tools, software programs and documentation.
> 2. License Model. The software is licensed on a per user basis.
>
> **INSTALLATION AND USE RIGHTS.**
>
> 1. General. One user may install and use copies of the software to design, develop, test and demonstrate your programs. You may not use the software in a production environment.
> 2. User Testing. Your end users may access the software to perform acceptance tests on your programs.
> 3. Demonstration. Any person that has access to your internal network may install and use copies of the software to demonstrate use of your programs with the software. Those copies may not be used for any other purpose.
> 4. Included Microsoft Programs. These license terms apply to all Microsoft programs included with the software. If the license terms with any of those programs give you other rights that do not expressly conflict with these license terms, you also have those rights.
&nbsp;

The SQL Server 2012 EULA for all sub-components/products can be found at the [Microsoft Download Center](http://www.microsoft.com/en-us/download/details.aspx?id=29067 "Microsoft SQL Server 2012 Privacy Statement and End User License Agreements").

Other alternatives to using the Developer Edition would be to either purchase a licence identical to the production one, where the costs might be quite high (and you’d need to justify them with whoever authorises the purchase), or procure a Server Licence and separate Client Access Licences (CALs) for each end-user.  This latter option might prove to be much cheaper, though I have to admit that I couldn’t obtain an exact figure.  After using the [Microsoft License Advisor](http://mla.microsoft.com/default.aspx "Microsoft License Advisor") and setting the form with the options shown below I obtained a quote of USD 705.00 for a single Server Licence. I’m still to be convinced it’s the correct one though…

&nbsp;                      | &nbsp;
--------------------------- | ------------------
Select a licensing program  | Microsoft Select
Select organization type    | Corporate
Select a pricing level      | D
Select product              | SQL Server 2012 Standard
Select product type         | License Only
Enter quantity              | 1
&nbsp;

For further details you may refer to the [Microsoft Volume Licensing website](http://www.microsoft.com/licensing/ "Microsoft Volume Licensing") and contact a local reseller.  Microsoft have also published a 79-page (!!) [Volume Licensing Reference Guide](http://www.microsoft.com/en-us/download/details.aspx?id=11091 "Microsoft Volume Licensing Reference Guide") to provide _“comprehensive guidance to help you select the best options for the size, type, and business needs of your organization”_.

As you can see, licensing is very complex and you can spend a good deal of time trying to figure out the most cost-effective option for your business requirements.  Back to the subject.  I deviated slightly from explaining how a business can benefit from a different licensing configuration.  As explained previously, the _Server + CAL_ model is a much cheaper alternative than the _Per Processor_ licence model.  This however is true for “smaller” businesses however, with a cost of USD 205.00 for every CAL, the difference between the licensing models has to be evaluated with an increased number of CALs.

A final and *free* option for development environment is the use of one of the Express Editions.  The [SQL Server Express Edition feature limitations](./blog/index.php/2011/05/sql-server-r2-express-edition-features/ "SQL Server R2 Express Edition features") should suffice for “smaller” databases (up to 10GB) especially for development purposes.  Testing with a copy of the production data is another story.
