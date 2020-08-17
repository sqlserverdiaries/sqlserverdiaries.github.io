---
layout: post
date:   2012-12-22
title:  "T-SQL to Transfer Data based on Periodic Date Ranges"
permalink: ./blog/index.php/2012/12/t-sql-to-transfer-data-based-on-periodic-date-ranges/
categories: blog
published: true
tags: [Code Samples, Database Administration, T-SQL Programming, Coding Practices, command-line utilities, Database Migration, Development, data types, datetime, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, Testing]
comments: false
---
I don’t think I’d be wrong in stating that almost all transactional and analytical systems store or make use of date, time, or parts of to achieve the respective functional targets.  A task I had to complete once was to find a way to retrieve data based on the period the date value.

There are times when you want to transfer large amounts of data selectively, and the data transfer has to be carried out using T-SQL because the end-user who will be performing the transfer will do this at “odd” times during the day.  Had this process been managed the end-user could have used BCP to export and import the data out and back in respectively.  The BCP could also have been made more efficient by changing the database Recovery Model to BULK_LOGGED.  In this fictional scenario I would have had to ensure that the backup chain would not have been broken by backing up the tail-log before changing the Recovery Model to BULK_LOGGED, then backing up again right after changing it back to FULL.  But that was not possible.  What was possible was to split the INSERT INTO…SELECT…FROM… statements into smaller batches.

The original INSERT…SELECT query was attempting to transfer more than 15 million records in a single batch.  With the Recovery Model of the destination database set to SIMPLE, that was generating a considerable number of Transaction Log entries since the execution was handled as a single transaction.  Not to mention the locks generated on the source table while the data was read.

The first requirement was to identify a date-type column with which the source data could be “split”, then verify the amount of records within each period to ensure that the batches are small enough to be handled.  The first part consisted of a simple COUNT clause together with a GROUP BY the date-type column.  You will also observe that I am using the WITH (NOLOCK) table hint.  This is effectively a dirty-read and even UNCOMMITTED transaction will be read.  For this particular exercise the source data was not changing but if you’re reading data sets which are actively changing I’d suggest you test with a different approach.

``` sql
SET NOCOUNT ON;
DECLARE @StartDate datetime;
DECLARE @EndDate datetime;

-- set date range here
SET @StartDate = CONVERT(datetime, '2012-11-01', 102);
SET @EndDate   = CONVERT(datetime, '2012-12-01', 102);

-- get daily itemcount within range
-- SQL Server 2005 version
SELECT
    CONVERT(datetime, CONVERT(varchar(10), [DateColumn], 120)) AS [ItemDate],
    COUNT(*) AS [ItemCount]
FROM [SourceDatabase].[dbo].[SourceTable] WITH (NOLOCK)
WHERE [DateColumn] BETWEEN @StartDate AND @EndDate
GROUP BY CONVERT(datetime, CONVERT(varchar(10), [DateColumn], 120));

-- SQL Server 2008 and later version
SELECT
    CONVERT(date, [DateColumn]) AS [ItemDate],
    COUNT(*) AS [ItemCount]
FROM [SourceDatabase].[dbo].[SourceTable] WITH (NOLOCK)
WHERE [DateColumn] BETWEEN @StartDate AND @EndDate
GROUP BY CONVERT(date, [DateColumn]);
```

The approach I’d taken necessitated the use of a CURSOR.  If you’ve read other posts you’d know that I do not like to use CURSORs, except for special circumstances – this is one of them.  I had to generate a list of date ranges within a used-defined range.  For this specific case, and as shown in the examples, I opted to split the batches by day.

The output date ranges had to generated to include all entries from midnight of day 1 until 23:59:59 of the next day.  This can also be translated to “less than midnight of the next day”, which is in fact more accurate.  So, starting from 01-Nov-2012, the data range should include records between 2012-01-01 and 2012-01-02.  The T-SQL is writing itself!

In order to generate the date ranges I wrote a Recursive Common Table Expression which includes a self-join as shown below:

``` sql
WITH cteDateRange
AS (
    SELECT @StartDate AS dt
    UNION ALL
    SELECT DATEADD(day, 1, dt)
    FROM cteDateRange
    WHERE dt < @EndDate
)
SELECT d2.dt AS StartDate, d1.dt AS EndDate
FROM cteDateRange d1
    INNER JOIN cteDateRange d2 ON d1.dt = DATEADD(day, 1, d2.dt)
ORDER BY d1.dt ASC;
```

Using the self-join the query output two columns which would subsequently be used to selectively transfer daily subsets of the source table.  The rest of the script contains a CURSOR, as mentioned earlier, and the INSERT statements filtering on the date range as shown in the below snippet:

``` sql
OPEN @DateRangeCursor
FETCH NEXT FROM @DateRangeCursor INTO @StartDate, @EndDate;
WHILE @@FETCH_STATUS = 0
BEGIN
    -- transfer data
    INSERT INTO [DestinationDatabase].[dbo].[DestinationTable] (
        [RecordID]
        .....
        ,[DateColumn])
    SELECT
        [RecordID]
        .....
        ,[DateColumn]
    FROM [SourceDatabase].[dbo].[SourceTable] WITH (NOLOCK)
    WHERE [DateColumn] BETWEEN @StartDate AND @EndDate;

    -- next item in loop
    FETCH NEXT FROM @DateRangeCursor INTO @StartDate, @EndDate;
END
CLOSE @DateRangeCursor;
DEALLOCATE @DateRangeCursor;
```

You may download a copy of the entire script using the following link: [t-sql-to-transfer-data-based-on-periodic-date-ranges.zip](/assets/article_files/2012/12/t-sql-to-transfer-data-based-on-periodic-date-ranges.zip)
