---
layout: post
date:   2012-07-14
title:  "Fatal error while reading the input stream from the network"
permalink: ./blog/index.php/2012/07/fatal-error-while-reading-the-input-stream-from-the-network/
categories: blog
published: true
tags: [Code Samples, Database Administration, T-SQL Programming, Coding Practices, Database Mail, Development, Audit, SQL Server errors, SQL Server Agent, Testing]
comments: false
---
One of the [SQL Server Alerts](http://msdn.microsoft.com/en-us/library/ms189531.aspx) implemented on all instances checkd for errors with a severity level of 20 and which is described as “Fatal Error in current process”. A similar alert can be created by Right-Clicking on the “Alerts” folder under SQL Server Agent, selecting “New Alert” and filling in the GUI fields or using the below script sample:

``` sql
EXEC msdb.dbo.sp_add_alert
    @name=N'Severity 20 - Fatal Error in current process',
    @message_id=0,
    @severity=20,
    @enabled=1,
    @delay_between_responses=0,
    @include_event_description_in=7,
    @category_name=N'[Uncategorized]',
    @job_id=N'00000000-0000-0000-0000-000000000000';
```

Once the Alert is created it can be set to send an email to one or more [Operators](http://msdn.microsoft.com/en-us/library/ms186747.aspx) but before that both Database Mail and the Operators have to be created. An Operator can also be created using the intuitive GUI but I personally prefer scripting since it allows implementing the same objects on all SQL Server instances I manage. Database Mail can be set up and configured as described in the [Create a Database Mail profile in 4 Steps (or less)](./blog/index.php/2011/03/create-a-database-mail-profile-in-4-steps-or-less/) post. Creating an Operator is as simple as executing the following:

``` sql
EXEC msdb.dbo.sp_add_operator
    @name=N'DBA Team',
    @enabled=1,
    @weekday_pager_start_time=90000,
    @weekday_pager_end_time=180000,
    @saturday_pager_start_time=90000,
    @saturday_pager_end_time=180000,
    @sunday_pager_start_time=90000,
    @sunday_pager_end_time=180000,
    @pager_days=0,
    @email_address=N'dba.team@mycompany.com',
    @category_name=N'[Uncategorized]';
```

We recently received an email triggered by this Alert and whose message was:

> A fatal error occurred while reading the input stream from the network. The session will be terminated.

At first glance the error is not really helpful and no other information was provided. Having a slight knowledge of the functionality of applications which accessed databases hosted on that environment I had an thought. The error makes reference to an “input stream” and this reminded me of binary data. I knew that one of the databases stored images as binary objects in a table. After enquiring with the developers, who in turn checked the application audit records and also contacted the end users who were logged on at the time of the error, one user mentioned that the application had actually crashed but he restarted it and uploaded the scanned image.

Actually this example shows a few things:

1. The DBA should have an idea of the basic usage of an application;
2. Results can be obtained when the DBA and Development teams work together;
3. End users should inform someone when application errors occurr or when the system crashes;
4. Error handling in applications is a definitive **must**!

Maybe I’m wishing for too much, but I keep hoping!
