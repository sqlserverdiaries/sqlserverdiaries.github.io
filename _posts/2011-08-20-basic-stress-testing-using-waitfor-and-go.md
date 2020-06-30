---
layout: post
date:   2011-08-20
title:  "Basic Stress-Testing using WAITFOR and GO"
permalink: ./blog/index.php/2011/08/basic-stress-testing-using-waitfor-and-go/
categories: blog
published: true
tags: [Code Samples, Performance, SQL Tools, T-SQL Programming, Coding Practices, Development, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, Testing]
comments: false
---
When it comes to testing queries I noticed that most developers usually write the query, verify that it returns the required result set then deploy it in the application or report and move on to the next query. While some might see this as one of the rapid development techniques, the problem with this approach is that most queries will only (most of the time) perform efficiently with a limited user-base and a small data set or small tables.

I have to admit that I sometimes do the same when I’m facing tight deadlines, but I cannot believe that this is a common trend for all application/database development. In the ideal world the hardware would be super-efficient, the database objects would be split into the correct FILEGROUP structures, and the database design would be excellent, each query or part of (whether encapsulated in stored procedures or ad-hoc) would be tested using different approaches and with the execution plan analysed for each approach, the correct indexes would be in place to assist the queries, the queries would have been tested using various workloads to simulate data growth and multiple users, etc.

There are many testing tools available on the Net – a quick search will reveal this. Before jumping into evaluating the products to see which one caters for our needs, I prefer using the tools in hand. When testing queries, besides reviewing the execution plan and optimising to improve factors such as I/O, CPU cost, indexing, and more, one of the tests I carry out is simulating multiple executions of the same query or stored procedure. This can be done using SQL Server Management Studio (SSMS) by executing plain TSQL commands such as the WAITFOR and the GO.

Starting with the latter, the GO command is recognised only by interfaces such as SSMS, SQLCMD or the older OSQL. The GO is basically a placeholder, with which TSQL commands are grouped into batches, starting from the last GO command. More information about the GO command can be found in the SQL BOL.

As explained, the GO command is used to execute batches of TSQL statements. A feature introduced since SQL Server 2005 is the ability to execute the same statement multiple times as shown below.

``` sql
SELECT CURRENT_TIMESTAMP;
GO 30
```

The above example will execute the SELECT command 30 times. Of course this example will return the same date and time 30 times, with probably only a small difference in the milliseconds part of the time portion between the first and last result.

The WAITFOR can be used to wait for a specific amount of time or until a specific time has been reached. Examples for both are shown below.

``` sql
-- example 1
WAITFOR DELAY ’00:00:10’

-- example 2
WAITFOR TIME ’11:22:35’
```

In example 1, this command is instructing SQL Server to wait for a delay of 10 seconds before moving to the next statement. On the other hand, example 2 shows how SQL Server can be set to wait until the time 11:22:35AM is reached before executing the next line.

Combining these two commands we can produce a good set of tests to allow us to carry out the simulations.

Let’s take the stored procedure sp_CalculateStockItemPrice which accepts an input parameter of type INT and returns an output of type NUMERIC(10,2).

``` sql
SET NOCOUNT ON;
DECLARE @CurrentItem INT;
DECLARE @ItemPrice NUMERIC(10,2);

SET @CurrentItem = 788;

EXEC sp_CalculateStockItemPrice @StockItem = @CurrentItem, @Price = @ItemPrice OUTPUT;

SELECT @CurrentItem, @ItemPrice;
```

The above example will retrieve the current price of a stock item from the appropriate tables, perform some calculations, possibly audit such request, and return the value in the OUTPUT parameter. By opening multiple SSMS windows and modifying the code sample as shown below we can achieve multiple concurrent “hits” on the data.

``` sql
SET NOCOUNT ON;
WAITFOR TIME ‘09:15:00’
GO

DECLARE @CurrentItem INT;
DECLARE @ItemPrice NUMERIC(10,2);

SET @CurrentItem = 788;

WAITFOR DELAY ‘00:00:01’
EXEC sp_CalculateStockItemPrice @StockItem = @CurrentItem, @Price = @ItemPrice OUTPUT;

SELECT @CurrentItem, @ItemPrice;
GO 100
```

The above assumes that the testing is prepared sometime before 09:15AM, and if not the value of the WAITFOR DELAY command should be changed. The WAITFOR DELAY will cause the execution to stop for 1 second before executing the stored procedure. The GO will send instructions to execute the last batch 100 times.

Of course this example requires some fine-tuning since the same stock item will be queried (788) and the results will probably be retrieved from the buffer cache. For more accurate results the value of the @CurrentItem should be retrieved randomly from the Stock Items table.

As mentioned earlier, there are various tools that can help with your testing needs. One of my favourites is _SQLQueryStress_ written by Adam Machanic and available from [SQLQueryStress - sql server query performance testing tool](http://www.datamanipulation.net/SQLQueryStress). I cannot emphasize the importance of testing queries using different workloads and approaches. If you don’t see to these before launching, the problem will bite you back when the system is in production and would be encountering performance issues. At that point you’d have to act fast and probably under pressure from your manager and end users. If you’re lucky it’ll happen during office hours!
