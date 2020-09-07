---
layout: post
date:   2012-01-14
title:  "Convert MSDB date and time values stored as integers to datetime"
permalink: ./blog/index.php/2012/01/convert-msdb-date-and-time-values-stored-as-integers-to-datetime/
categories: blog
published: true
tags: [Code Samples, Database Administration, MSDB, SQL Server Agent]
comments: false
---
SQL Server Agent job definitions, schedules and other information are stored in the MSDB system database.  A DBA can retrieve details about the outcome of the scheduled jobs, when the job was executed, how long it took, etc.  This information is stored in the [sysjobhistory (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms174997.aspx) table.  The schema of this table shows that values such as those in the _run\_status_, _run\_date_, _run\_time_ and _run\_duration_ columns can be used to verify for example which jobs failed and when.  Of course any important SQL Server Agent jobs should use the built-in functionality to notify one or more operators about the job failure.

The problem I found with the values in the _run\_date_, _run\_time_ and _run\_duration_ columns is that these are stored as integer values.  I wrote the below query to convert these values to a datetime which I found more useful when storing this information for historical purposes (in an alternate location such as a Data Warehouse).

``` sql
SELECT
    SJ.name AS [JobName],
    --SJH.run_date AS [OriginalRunDate],
    --SJH.run_time AS [OrignialRunTime],
    CONVERT(varchar(10),
        CONVERT(datetime, CAST(SJH.run_date AS varchar(8)), 112),
        120) + ' ' +
        LEFT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_time AS varchar(10)), 6), 2) + ':' + -- hour
        SUBSTRING(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_time AS varchar(10)), 6) , 3, 2) + ':' + -- minute
        RIGHT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_time AS varchar(10)), 6), 2) -- second
    AS [StartDateTime],
    --SJH.run_duration AS [OriginalRunDuration],
    (
    LEFT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_duration AS varchar(10)), 6), 2) + ':' + -- hour
    SUBSTRING(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_duration AS varchar(10)), 6), 3, 2) + ':' + -- minute
    RIGHT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_duration AS varchar(10)), 6), 2) -- second
    ) AS [Duration],
    (CASE SJH.run_status WHEN 0 THEN 'Failed' WHEN 1 THEN 'Succeeded' WHEN 2 THEN 'Retry' WHEN 3 THEN 'Canceled' END) AS [Status]

FROM msdb.dbo.sysjobhistory SJH
    INNER JOIN msdb.dbo.sysjobs SJ ON SJH.job_id = SJ.job_id
WHERE SJH.step_id = 0;
```

In the above query the sysjobhistory table is joined with the sysjobs table to retrieve the job name. If you want to know at what time the job completed you'll have to add the the _run\_duration_ to the _run\_time_. Note that the _run\_duration_ is stored _"in HHMMSS format"_.

The next query using a [Common Table Expression (CTE)](http://msdn.microsoft.com/en-us/library/ms190766.aspx) should do the trick:

``` sql
WITH SQLAgentJobs
AS
(
SELECT
    SJ.name AS [JobName],
    --SJH.run_date AS [OriginalRunDate],
    --SJH.run_time AS [OrignialRunTime],
    CONVERT(varchar(10),
        CONVERT(datetime, CAST(SJH.run_date AS varchar(8)), 112),
        120) + ' ' +
        LEFT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_time AS varchar(10)), 6), 2) + ':' + -- hour
        SUBSTRING(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_time AS varchar(10)), 6) , 3, 2) + ':' + -- minute
        RIGHT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_time AS varchar(10)), 6), 2) -- second
    AS [StartDateTime],
    --SJH.run_duration AS [OriginalRunDuration],
    (
    LEFT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_duration AS varchar(10)), 6), 2) + ':' + -- hour
    SUBSTRING(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_duration AS varchar(10)), 6), 3, 2) + ':' + -- minute
    RIGHT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_duration AS varchar(10)), 6), 2) -- second
    ) AS [Duration],
    (CASE SJH.run_status WHEN 0 THEN 'Failed' WHEN 1 THEN 'Succeeded' WHEN 2 THEN 'Retry' WHEN 3 THEN 'Canceled' END) AS [Status]

FROM msdb.dbo.sysjobhistory SJH
    INNER JOIN msdb.dbo.sysjobs SJ ON SJH.job_id = SJ.job_id
WHERE SJH.step_id = 0
)
SELECT
    [JobName],
    [StartDateTime],
    [Duration],
    (CAST([StartDateTime] AS datetime) + CAST([Duration] AS datetime)) AS [EndDateTime],
    [Status]
FROM SQLAgentJobs
WHERE [JobName] = 'Database Backups'
ORDER BY [JobName];
```

The above query will work for SQL Server 2005 and later versions.  For SQL Server 2000 instances the following query which uses a [Derived Table](http://msdn.microsoft.com/en-us/library/ms177634.aspx) instead will return the same result set.

``` sql
SELECT
    [JobName],
    [StartDateTime],
    [Duration],
    (CAST([StartDateTime] AS datetime) + CAST([Duration] AS datetime)) AS [EndDateTime],
    [Status]
FROM (
    SELECT
        SJ.name AS [JobName],
        --SJH.run_date AS [OriginalRunDate],
        --SJH.run_time AS [OrignialRunTime],
        CONVERT(varchar(10),
            CONVERT(datetime, CAST(SJH.run_date AS varchar(8)), 112),
            120) + ' ' +
            LEFT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_time AS varchar(10)), 6), 2) + ':' + -- hour
            SUBSTRING(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_time AS varchar(10)), 6) , 3, 2) + ':' + -- minute
            RIGHT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_time AS varchar(10)), 6), 2) -- second
        AS [StartDateTime],
        --SJH.run_duration AS [OriginalRunDuration],
        (
        LEFT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_duration AS varchar(10)), 6), 2) + ':' + -- hour
        SUBSTRING(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_duration AS varchar(10)), 6), 3, 2) + ':' + -- minute
        RIGHT(RIGHT(REPLICATE('0', 6) + CAST(SJH.run_duration AS varchar(10)), 6), 2) -- second
        ) AS [Duration],
        (CASE SJH.run_status WHEN 0 THEN 'Failed' WHEN 1 THEN 'Succeeded' WHEN 2 THEN 'Retry' WHEN 3 THEN 'Canceled' END) AS [Status]
    FROM msdb.dbo.sysjobhistory SJH
        INNER JOIN msdb.dbo.sysjobs SJ ON SJH.job_id = SJ.job_id
    WHERE SJH.step_id = 0
) SQLAgentJobs
WHERE [JobName] = 'Database Backups'
ORDER BY [JobName];
```
