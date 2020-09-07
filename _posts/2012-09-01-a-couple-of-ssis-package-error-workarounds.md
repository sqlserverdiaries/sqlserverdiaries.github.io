---
layout: post
date:   2012-09-01
title:  "A Couple of SSIS Package Error Workarounds"
permalink: ./blog/index.php/2012/09/a-couple-of-ssis-package-error-workarounds/
categories: blog
published: true
tags: [Development, Database Administration, SQL Tools, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, SQL Server Integration Services, SSIS, Storage]
comments: false
---
The [How to: Import or Export a Package by Using SQL Server Management Studio](http://msdn.microsoft.com/en-us/library/ms141235.aspx "How to: Import or Export a Package by Using SQL Server Management Studio") MSDN article esxplains the steps to save or retrieve an SSIS package from/to SQL Server.  Like most DBAs (or not…?) I try to use the latest version of SSMS to execute queries against the various SQL Server instances and versions I manage.  When attempting to upload my first SSIS package to SQL Server 2005 using SSMS 2008 the following error was encountered:

![/assets/article_files/2012/08/connect_to_server_ssis_error.jpg "connect_to_server_ssis_error"](/assets/article_files/2012/09/connect_to_server_ssis_error.jpg)

This means that the SSMS version has to be the same as the SQL Server instance to where the package is being uploaded.

Once the package was uploaded the next step 2012-09-01-a-couple-of-ssis-package-error-workarounds.md
was to creae a schedule.  When creating an SSIS-type job step, a number of configuration parameters can be changed at that point.  These include but are not limited to the logging destination location and any connection string.  In the case of the latter, I observed that when creating a scheduled job using the SSMS GUI, the “Command line” tab (in the job step configuration details) is different when using the 2005 and 2008 versions.  Screenshots and sample Command line strings are shown below:

**SSMS 2005 version:**

![/assets/article_files/2012/08/job_step_properties_2005.jpg "job_step_properties_2005"](/assets/article_files/2012/09/job_step_properties_2005.jpg)

``` text
/SQL "\ProjectABC\Project A Data Uploads" /SERVER "SRV01\INSTA"
 /MAXCONCURRENT " -1 " /CHECKPOINTING OFF /REPORTING E
```

**SSMS 2008 version:**

![/assets/article_files/2012/08/job_step_properties_2008.jpg?resize=640%2C480 "job_step_properties_2008"](/assets/article_files/2012/09/job_step_properties_2008.jpg)

``` text
/SQL "\ProjectABC\Project A Data Uploads" /SERVER "SRV01\INSTA"
 /CONNECTION "AdventureWorksConn";"\"Data Source=SRV01\INSTA;
User ID=;Initial Catalog=AdventureWorks;Provider=SQLNCLI.1;
Integrated Security=SSPI;\"" /CHECKPOINTING OFF /REPORTING E
```

Not only are the command lines different, you will also notice that the connection string is included in the 2008 version and that the same connection string is setting the Provider parameter value to “SQLNCLI.1?.  Should, for example, your package be designed to extract or load data from an SQL Server 2000 database the package will fail at runtime with connection error.  The only solution is, as for the first error mentioned above, to make sure that the same SSMS version as the target DBMS is being used.  That’s my two cents for the day.
