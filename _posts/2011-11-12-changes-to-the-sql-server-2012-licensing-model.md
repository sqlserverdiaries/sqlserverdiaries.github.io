---
layout: post
date:   2011-11-12
title:  "Changes to the SQL Server 2012 Licensing Model"
permalink: ./blog/index.php/2011/11/changes-to-the-sql-server-2012-licensing-model/
categories: blog
published: true
tags: [Architecture, Database Administration, Database Documentation, Virtualization, Database Documentation, Database Migration, Microsoft Cluster, SQL Server, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, Upgrade]
comments: false
---
With the upcoming SQL Server 2012 version, Microsoft reduced the number of Editions to three and changed the licensing model. The main Editions that will be available are the Enterprise, Standard and the new Business Intelligence. Features of the Datacenter Edition have been included in the Enterprise Edition making this a more cost-effective Edition with regard to features. The Developer, Express and Compact Editions are also being released for this version however the Workgroup and Small Business Editions have been retired.

The licensing model has been changed from a Processor-based to a Core-based one only for the Enterprise Edition. The Core-based and the Server+CAL licensing model are both available for the Standard Edition, while only Server+CAL licensing can be applied for the Business Intelligence Edition. Most notably, the Core-based licensing model replaces the Processor-based one and should offer cost savings for clients requiring SQL Server implementations. Microsoft released a data sheet and FAQ sheet explaining the benefits and scenarios where these would apply. The documents released in November 2011 can be downloaded using the links at the end of this article.

At the time of writing the licence costs for the three SQL Server 2012 Editions are as shown in the below tables:

SQL Server 2012 Editions | Server + CAL Licensing | Core Based Licensing | License Price | Software Assurance
------------------------ | :--------------------: | :------------------: | ------------: | -----------------:
Enterprise               |                        | X                    | 6,874         | 1,719
Business Intelligence    | X                      |                      | 8,592         | 2,148
Standard                 |                        | X                    | 1,793         | 448
Standard                 | X                      |                      | 898           | 225
CAL                      |                        |                      | 209           | 52

&nbsp;

SQL Server 2008 Editions | Server + CAL Licensing | Processor Based Licensing | License Price | Software Assurance
------------------------ | :--------------------: | :-----------------------: | ------------: | -----------------:
Enterprise               |                        | X                         | 27,495        | 6,874
Enterprise               | X                      |                           | 8,592         | 2,148
Standard                 |                        | X                         | 7,171         | 1,793
Standard                 | X                      |                           | 898           | 225
CAL                      |                        |                           | 164           | 41

&nbsp;

#### Core-Based Model ####

With the new core-based licensing model SQL Server 2012 licences seem cheaper however these can only be cost effective on specific combinations of cores/processor machines. Basically licenses are sold in packs of two. The minimum number of core licences that can be purchased for a machine is four which also means that machines having older single-core or dual-core processors will still require four licences. This also implies that it would not be cost-effective to consider hosting SQL Server instances on older machines since the minimum cost for a single-core or dual-core machine would be US$ 7,132 for the Standard Edition or US$ 27,496 for an Enterprise Edition (see image below).

![Image extracted from the SQL Server 2012 Licensing Datasheet](/assets/article_files/2011/11/sql_server_2012_license_packs.jpg)

At these prices there is no change in license cost for quad-core processor machines. In fact, where previously a six-core or eight-core machine would set you back only (!) US$ 7,132 for the Standard Edition or US$ 27,496 for an Enterprise Edition, with the new SQL Server 2012 core-based model the license costs compared to the previous (2008) version will be as shown in the below tables.

#### SQL Server 2012 Editions #####

Cores per Processor   | 8      | 6      | 4      | 2      | 1
-------------------   | -----: | -----: | -----: | -----: | ------:
Enterprise            | 54,992 | 41,244 | 27,496 | 27,496 | 27,496
Business Intelligence | --     | --     | --     | --     | --
Standard              | 14,344 | 10,758 | 7,172  | 7,172  | 7,172

&nbsp;

#### SQL Server 2008 Editions ####

Cores per Processor   | 8      | 6      | 4      | 2      | 1
-------------------   | -----: | -----: | -----: | -----: | ------:
Enterprise            | 27,495 | 27,495 | 27,495 | 27,495 | 27,495
Standard              | 7,171  | 7,171  | 7,171  | 7,171  | 7,171

&nbsp;

As you can see from the above table, when comparing the cost for a Standard or Enterprise Edition of SQL Server 2008 to SQL Server 2012 the cost remains the same for both versions as long as you're using quad-core processors in your server. The license cost increases for hexa-core processors and practically doubles for octa-core processor machines.

#### Server + CAL Model ####

With the published costs it appears that the Server+CAL licensing model is most appropriate for businesses having (for example) a single SQL Server machine and a small number of users (less than 47 users).

Number of CALs  | 10    | 15    | 25    | 50     | 100    | 200    | 500     | 1,000
--------------- | ----: | ----: | ----: | -----: | -----: | -----: | ------: | ------:
SQL Server 2012 | 2,988 | 4,033 | 6,123 | 11,348 | 21,798 | 42,698 | 105,398 | 209,898
SQL Server 2008 | 2,538 | 3,358 | 4,998 | 9,098  | 17,298 | 33,698 | 82,898  | 164,898

&nbsp;

As shown in the datasheet, I am not considering another important variable. The CAL is purchased for a user and, from a licensing perspective, allows the user to connect to any number of SQL Server machines. Small business might make considerable savings when adopting the Server+CAL based licensing. On the other hand, in an scenario where a business has (for example) 40 servers or more and a large number of users (say, over 1,200) it might be more feasible to consider a purely core-based approach. In reality most large businesses will have a mix of both environments accessed by a defined number of users (such as in client-server application implementations), and environments where the number of users will not be known (internet facing).

#### Licensing Virtualised Environments ####

Two licensing options are available for virtualised environments. Businesses can license each virtual processor allocated to individual virtual servers residing on a (physical) host server or server farm, or license all the processor cores for the host server or server farm. Each has its advantages and disadvantages.

When licensing virtual processors for individual virtual servers, the Core-Based or Server+CAL licensing models can be utilised. In this case the same rules mentioned earlier apply however, in my opinion the Core-Based model might not be cost effective when the number of virtual processors are equal to or exceed the number of cores on the host server.

The reason is that, as mentioned earlier, another option is to license all the cores of the host server or server farm using Enterprise Edition licenses and Software Assurance (SA). Licensing using this model provides for an unlimited number of virtual servers within the Enterprise (hosted on the licensed host server or server farm). More information and benefits of Software Assurance can be obtained from the [Microsoft Software Assurance website](http://www.microsoft.com/licensing/software-assurance/default.aspx).

#### The Verdict ####

As mentioned earlier, smaller businesses should review carefully their requirements in order to avoid incurring additional costs which can be vital for an organisation. A business might also find that the features and limitations of the Express Edition will suffice for most scenarios. Without going into too much detail, some of the most important the limitations of the Express Edition are that the instance is limited to use 1GB RAM, 1 CPU, and the 10GB size limit per database (this does not include data stored in FILESTREAM). Another limitation is the lack of the SQL Server Agent service however this can be replaced using the Windows Task Scheduler, and SQLCMD or Powershell commands, or one of the many third-party products to name a few.

Virtualisation might prove to be more cost-effective in larger deploments if the enterprise implements an SQL Server farm.

Last but not least we should not forget that both SQL Server Standard Edition and Enterprise Editions support the multiple instances per machine providing the business with the facility to host a considerable number of databases. For example, you may install up to 16 instances with the Standard Edition (or 50 instances with the Enterprise Edition) and each instance can host over 32,000 databases per instance!

The below tables are sample calculations showing the price of two scenarios, one with a number of Physical Servers (or individually licences Virtual Servers) and another with a Server Farm of 5 dual socket quad-core servers hosting an unlimited number of Virtual Servers (limited only by memory, storage and network resources).

#### Example 1 (Licensing Costs per Edition) ####

Physical Servers                        |       | CPU Cores | Standard Core-based | Standard Server+CAL | Enterprise Core-based
----------------                        | ----: | --------: | ------------------: | ------------------: | ---------------------:
Number of Users                         | 1,200 | -         | -                   | 250,800             | -
Number of SQL Servers: |  |  |  |  |
4 Cores or Less                         | 40    | 160       | 286,880             | 35,920              | 1,099,840
6 Cores                                 | 6     | 36        | 64,548              | 5,388               | 247,464
8 Cores                                 | 2     | 16        | 28,688              | 1,796               | 109,984
12 Cores                                | -     | -         | -                   | -                   | -
16 Cores                                | -     | -         | -                   | -                   | -
 |  |  |  |  |
Software Assurance (Annual Estimate)    |       | 212       | 95,029              | 47,594              | 364,322
Total (USD)                             |       |           | 475,145             | 341,498             | 1,821,610
Total (EUR)                             |       |           | 349,854             | 251,448             | 1,341,270

#### Example 2 (Licensing Costs per Edition) ####

Virtual Servers (Server Farm)         |       | CPU Cores | Standard Core-based | Standard Server+CAL | Enterprise Core-based
------------------------------------- | ----: | --------: | ------------------: | ------------------: | ---------------------:
Server Hosts                          | 5     | 40        | -                   | -                   | 274,960
 |  |  |  |  |
Software Assurance (Annual Estimate)  | -     | 40        | -                   | -                   | 68,740
Total (USD)                           |       |           | -                   | -                   | 343,700
Total (EUR)                           |       |           | -                   | -                   | 253,069

&nbsp;

**NOTE:** All prices are in USD and were obtained from the [Microsoft website](http://www.microsoft.com/sqlserver/en/us/get-sql-server/how-to-buy.aspx). Where the price is shown in Euro, the curency was converted using a rate of US$ 1 = EUR 0.73631 from [XE.com](http://www.xe.com) as at 10 November 2011.

* [Frequently Asked Questions about SQL Server 2012 Editions and Licensing](http://download.microsoft.com/download/9/0/9/909CCF95-9FAF-45AC-8106-9C3AD6567C6B/SQLServer2012_EditionsLicensing_FAQ_Nov2011.pdf)

* [SQL Server 2012 Licensing Datasheet](http://download.microsoft.com/download/2/3/8/2386E6B8-8F6C-461D-B0FF-61EE05DAD511/Licensing%20datasheet%20FINAL%20-%20USA.pdf)

You can download an Excel spreadsheet used containing the above tables [from here](/assets/article_files/2011/11/sql_server_2012_edition_prices.zip).

---

#### UPDATE - 20 February 2012 ####

The costs for Software Assurance (SA) mentioned in this article are incurred **annually**.  More information about SA packages, benefits, etc. can be obtained from the [Software Assurance section of the Microsoft Volumne Licensing](http://www.microsoft.com/licensing/software-assurance/default.aspx) website.
