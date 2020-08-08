---
layout: post
date:   2012-08-11
title:  "Deploying what in my opinion is messy code"
permalink: ./blog/index.php/2012/08/deploying-what-in-my-opinion-is-messy-code/
categories: blog
published: true
tags: [Architecture, Database Administration, Database Design, Performance, Security, T-SQL Programming, Coding Practices, Development, Testing]
comments: false
---
Some background. In organisation I work at there are clear delineations between DBA and Database Development duties. The DBA is more of a DBMS-A with some working knowledge of the application and basically “what it does” (or should). On the other hand, most of the time the Database Developer is the same person who designs and delivers the Business Rules’ and GUI. DBAs and Developers usually interact mostly at the start of the project and toward the implementation date. Whether this is the right approach or not is debatable. I tend to prefer an approach where the DBA is involved at all or most stages of the project so that when an operational issue occurs the DBA will be knowledgeable enough to solve the problem there and then.

Unfortunately there are instances when the Developer/s do not discuss projects or project phases with the DBA. The DBA is sometimes faced with a deployment of a fully tested application or module and which has a tight deadline. In a recent deployment I was provided with a number of scripts to execute. All I knew was that the scripts had to be deployed by the end-of-business. Being treated like an “F5-Ape” is quite offensive but I understood that there must have been a reason for the urgency and lack of communication.

As a rule I **ALWAYS** review scripts provided by developers, be they a few lines or even 50,000 lines of code (it happened…). In this case I was provided with six scripts which created a couple of stored procedures, a couple of tables and others that performed some data inserts/updates. In other words nothing “fancy” such as CLR objects, Service Broker or Encryption methods for example.

The first problem when opening the scripts was that the USE DATABASE was missing so I had to guess against which database to execute the scripts. Before continuing I would like to point out that I sometimes tend to be “a bit” of a perfectionist but I like the final version of my scripts to be as bullet-proof as possible. One of the table creation scripts was created using a scripting tool (name withheld purposely) while it was obvious that for the other table the SSMS GUI was used to modify an existing table. I don’t see anything wrong with using the GUI, but the least one can do is review the output and remove the following:

``` sql
/* To prevent any potential data loss issues, you should review this script
in detail before running it outside the context of the database designer.*
```

I also noticed that one of the tables contained a column created using the text data type. The [SQL Server documentation](http://msdn.microsoft.com/en-us/library/ms187993(v=sql.90).aspx) has (since the release of SQL Server 2005) has been stating that the _“ntext, text, and image data types will be removed in a future version of Microsoft SQL Server. Avoid using these data types in new development work, and plan to modify applications that currently use them. Use nvarchar(max), varchar(max), and varbinary(max) instead.”_; but maybe not all developers are aware of this…

Another deficiency was that the scripts did not check for the existence of the objects or data before creating or altering them. While this might not seem like much of an issue, should the DBA execute the same script twice (everyone errs) the script could have consequences resulting in extra work. For example, if the scripts contain INSERT statements, if executed twice the data would also be inserted twice. A simple IF NOT EXISTS check before inserting would prevent this.

Next were the stored procedures. The immediate problem was the use of the “sp_” prefix in the procedure names. Microsoft have been recommending against this practice since the release of the [SQL Server 2000 Books Online](http://msdn.microsoft.com/en-us/library/aa214379(v=sql.80).aspx), or for the last 12 years!. I recently wrote about this in the post [Against the sp\_ Stored Procedure Naming Convention](./blog/index.php/2012/02/against-the-sp-stored-procedure-naming-convention/).

The next obvious defect following a quick review of the stored procedure code showed that database objects were not being referenced using the two-part names. This will lead to a performance overhead when SQL Server is resolving the object names. As a rule, two-part names should always be used.  
The stored procedure also contained the dreaded CURSOR object. I will not be explaining what the functionality was but I quickly demonstrated to my colleagues how the 20 or so lines of code used to build the CURSOR could be very easily be replaced by a couple of lines, and which would execute more efficiently. Wherever possible usage of the CURSOR object should be avoided and more efficient set-based logic should be implemented. An interesting article titled [RBAR: ‘Row By Agonizing Row’](http://www.simple-talk.com/sql/t-sql-programming/rbar--row-by-agonizing-row/) written by Remi Gregoire in 2007 explains how row-based logic can be replaced by the set-based one if the mindset is correct from the start.

Even more of what I thought were deficiencies were present, especially in the stored procedure logic and control flow. After reviewing these couple of hundred lines of code I really can’t help thinking about the code in the other layers of the solution! As I mentioned earlier, in this case the deployment could not be stopped or delayed to apply the suggested fixes. Of course I brought these to the attention of the Developer and hopefully, I will soon be provided with a set of updates. I am also hopeful that subsequent T-SQL code this Developer works on will be of a better quality than this iteration.
