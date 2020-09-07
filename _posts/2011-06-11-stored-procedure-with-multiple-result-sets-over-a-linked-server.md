---
layout: post
date:   2011-06-11
title:  "Stored Procedure with Multiple Result Sets over a Linked Server"
permalink: ./blog/index.php/2011/06/stored-procedure-with-multiple-result-sets-over-a-linked-server/
categories: blog
published: true
tags: [Architecture, Database Administration, Security, T-SQL Programming, Coding Practices, Code Samples, Development, SQL Server, Linked Servers, SQL Injection]
comments: false
---
When accessing database objects, such as stored procedures, over a Linked Server the stored procedure output will be returned to the calling application.  There are occasions where we have to insert the results of the stored procedure into a temporary table to be used further on in our stored procedure.  When the stored procedure returns only one result set this is quite plain sailing.  An example using the _AdventureWorks_ database is shown below.

``` sql
SET NOCOUNT ON;

CREATE TABLE #BillOfMaterials(
    ProductAssemblyID INT NULL,
    ComponentID INT NULL,
    ComponentDesc NVARCHAR(50) NULL,
    TotalQuantity decima(38,2) NULL,
    StandardCost money,
    ListPrice money,
    BOMLevel smallint NULL,
    RecursionLevel INT NULL
);

DECLARE @ProductID INT;
DECLARE @StartDate DATETIME;

SET @ProductID = 515;
SET @StartDate = '2008-05-11';

INSERT INTO #BillOfMaterials
    EXEC [AdventureWorksLS].AdventureWorks.dbo.uspGetBillOfMaterials @ProductID, @StartDate;

SELECT * FROM #BillOfMaterials;
```

But what if the remote stored procedure returns more than one result set, cannot be changed and we're interested only in the first result set?  The answer is to use the [OPENQUERY (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms188427.aspx) syntax and a dynamic SQL string as shown below.

``` sql
SET NOCOUNT ON;

CREATE TABLE #BillOfMaterials(
    ProductAssemblyID INT NULL,
    ComponentID INT NULL,
    ComponentDesc NVARCHAR(50) NULL,
    TotalQuantity decima(38,2) NULL,
    StandardCost money,
    ListPrice money,
    BOMLevel smallint NULL,
    RecursionLevel INT NULL
);

DECLARE @ProductID INT;
DECLARE @StartDate DATETIME;
DECLARE @sqlcmd NVARCHAR(2000);

SET @ProductID = 515;
SET @StartDate = '2008-05-11';

SET @sqlcmd = N'SELECT * FROM OPENQUERY ([AdventureWorksLS],
    ''EXEC AdventureWorks.dbo.uspGetBillOfMaterials ' +
        CAST(@ProductID AS NVARCHAR(10)) + ',"' +
        CONVERT(VARCHAR(10), @StartDate, 120) + '"'')';

INSERT INTO #BillOfMaterials
    EXEC sp_executesql @sqlcmd;

SELECT * FROM #BillOfMaterials;
```

The difficult part is getting the number of quote symbols right when passing date or character values.  In the above example I used the double quotation mark (") to enclose the value of the _@StartDate_ variable.

Since we are using dynamic SQL, additional checks should be implemented to avoid introducing SQL Injection vulnerabilities.  Another limitation of this technique is that only the first result set is obtained from the remote stored procedure.  Overall though, with the necessary precautions and considering the benefits it is a workable solution.
