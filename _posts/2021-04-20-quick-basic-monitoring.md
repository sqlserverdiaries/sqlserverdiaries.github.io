---
layout: post
date:   2021-04-20
title:  "Quick Basic Monitoring"
permalink: ./blog/index.php/2021/04/quick-basic-monitoring/
categories: blog
published: true
tags: [TSQL, SSMS, Monitoring]
comments: true
---
Looking into a performance issue, such as when someone reports "blocking", an important tool every DBA (in my opinion) should have on their toolbelt is the `sp_WhoIsActive` stored procedure.

The stored procedure can be run without parameters, however the input parameters available (see [documentation](http://whoisactive.com/docs/) for details) provide increased flexibility and/or results.

One of these handy features is storing the results in a table; this combined with other features in SSMS will allow for quick basic monitoring.

## Store the data

The following will create a table in the `TEMPDB` database - since this database is reinitialized when the SQL Server instance is restarted (emphasis: any data in this table will be lost), so make sure to copy the data elsewhere if you want it to be persisted.

``` sql
CREATE TABLE [tempdb].[dbo].[WhoIsActive] (
    [dd hh:mm:ss.mss] VARCHAR(8000) NULL
     ,[session_id] SMALLINT NOT NULL
    ,[sql_text] XML NULL
    ,[sql_command] XML NULL
    ,[login_name] NVARCHAR(128) NOT NULL
    ,[wait_info] NVARCHAR(4000) NULL
    ,[CPU] VARCHAR(30) NULL
    ,[tempdb_allocations] VARCHAR(30) NULL
    ,[tempdb_current] VARCHAR(30) NULL
    ,[blocking_session_id] SMALLINT NULL
    ,[blocked_session_count] VARCHAR(30) NULL
    ,[reads] VARCHAR(30) NULL
    ,[writes] VARCHAR(30) NULL
    ,[physical_reads] VARCHAR(30) NULL
    ,[query_plan] XML NULL
    ,[used_memory] VARCHAR(30) NULL
    ,[status] VARCHAR(30) NOT NULL
    ,[open_tran_count] VARCHAR(30) NULL
    ,[percent_complete] VARCHAR(30) NULL
    ,[host_name] NVARCHAR(128) NULL
    ,[database_name] NVARCHAR(128) NULL
    ,[program_name] NVARCHAR(128) NULL
    ,[start_time] DATETIME NOT NULL
    ,[login_time] DATETIME NULL
    ,[request_id] INT NULL
    ,[collection_time] DATETIME NOT NULL
    )
GO
```

This `CREATE TABLE` script was created using `sp_WhoIsActive` with the input parameters shown in the below example:

``` sql
DECLARE @CreateTableSchema varchar(MAX);

EXEC sp_WhoIsActive @get_plans=1,
    @get_outer_command=1,
    @find_block_leaders=1,
    @return_schema = 1,
    @schema = @CreateTableSchema OUTPUT

PRINT @CreateTableSchema;
```

The `PRINT` output is returned as a single line, so it was then formatted using the [Poor Man's T-SQL Formatter](https://poorsql.com/) to make it more readable/presentable.

## Run multiple iterations of the sp_WhoIsActive stored procedure

Using a combination of the TSQL `WAITFOR DELAY` function and the SQL Server Management Studio `GO` batch seperator, we can run the same command multiple times, evey few seconds.

``` sql
WAITFOR DELAY '00:00:05';
EXEC sp_WhoIsActive @get_plans=1,
    @get_outer_command=1,
    @find_block_leaders=1,
    @destination_table='tempdb.dbo.WhoIsActive';
GO 200
```

The above code will run the `sp_WhoIsActive` stored procedure, with the parameters shown, for 200 times and with a delay of 5 seconds between iterations.

Here is a different and slightly more verbose approach to the above example:

``` sql
SET NOCOUNT ON;
WAITFOR TIME '16:30:00';
GO
DELCARE @Continue bit = 1;
DECLARE @StopTIme datetime = '2021-02-15 19:30:00';
WHILE (@Continue = 1)
BEGIN
    -- collect a snapshot of running sessions
    EXEC sp_WhoIsActive @get_plans=1,
        @get_outer_command=1,
        @find_block_leaders=1,
        @destination_table='tempdb.dbo.WhoIsActive';
    -- wait 5 seconds
    WAITFOR DELAY '00:00:05';
    -- check time of day
    IF (CURRENT_TIMESTAMP >= @StopTime)
        SET @Continue = 0;
END
GO
```

We can see that the commands will start execution at 16:30, then run a `WHILE` loop checking for the value of the `@Continue` variable, capture the output of the `sp_WhoIsActive` stored procedure, and finally compare the `@StopTime` variable value with the current time to determine whether to exit the loop. This is a more flexible approach than the previous example since it allows you to define the capture start and stop times.

Also note that the input parameters used when exeuting the `sp_WhoIsActive` stored procedure are the same used to generate the `CREATE TABLE` above. This is because the result set changes depending on the parameters used, so we need the inputs to be consistent.

## View the results

Finally we can review the results, which include both the original query executed, the blocking statement, or the statement being blocked, the Execution Plan, the account and host name used to initiate the connection, and other helpful information.

``` sql
SELECT TOP(100) * FROM tempdb.dbo.WhoIsActive WHERE 1=1
/* add your filters here */
ORDER BY [collection_time] DESC, [dd hh:mm:ss.mss] DESC;
```

Of course this will return a row for every iteration of the snapshot capture. If we want to limit our results to the most recent record we'd have to aggregate the results as shown below.

``` sql
WITH cteWhoIsActive AS (
    SELECT * FROM [tempdb].[dbo].[WhoIsActive] WHERE 1=1
    /* add your filters here */
),
cteWhoIsActiveGrouped AS (
    SELECT 
        MAX([dd hh:mm:ss.mss]) AS [dd hh:mm:ss.mss]
        ,[session_id]
        ,CAST([sql_text] AS varchar(max)) AS [sql_text]
        ,CAST([sql_command] AS varchar(max)) AS [sql_command]
        ,[login_name]
        ,CAST([query_plan] AS varchar(max)) AS [query_plan]
        ,[host_name]
        ,[database_name]
        ,[program_name]
        ,[start_time]
        ,[login_time]
        ,[request_id]
        ,MAX([collection_time]) AS [collection_time]
    
    FROM cteWhoIsActive
    
    GROUP BY
        [session_id]
        ,CAST([sql_text] AS varchar(max))
        ,CAST([sql_command] AS varchar(max))
        ,[login_name]
        ,CAST([query_plan] AS varchar(max))
        ,[host_name]
        ,[database_name]
        ,[program_name]
        ,[start_time]
        ,[login_time]
        ,[request_id]
)
SELECT 
    g.[dd hh:mm:ss.mss]
    ,g.[session_id]
    ,CAST(g.[sql_text] AS xml) AS [sql_text]
    ,CAST(g.[sql_command] AS xml) AS [sql_command]
    ,g.[login_name]
    ,w.[wait_info]
    ,w.[CPU]
    ,w.[tempdb_allocations]
    ,w.[tempdb_current]
    ,w.[blocking_session_id]
    ,w.[blocked_session_count]
    ,w.[reads]
    ,w.[writes]
    ,w.[physical_reads]
    ,CAST(g.[query_plan] AS xml) AS [query_plan]
    ,w.[used_memory]
    ,w.[status]
    ,w.[open_tran_count]
    ,w.[percent_complete]
    ,g.[host_name]
    ,g.[database_name]
    ,g.[program_name]
    ,g.[start_time]
    ,g.[login_time]
    ,g.[request_id]
    ,g.[collection_time]

FROM cteWhoIsActiveGrouped g
    INNER JOIN cteWhoIsActive w ON g.[session_id] = w.[session_id] 
        AND w.[collection_time] = g.[collection_time]

ORDER BY g.[collection_time] DESC, g.[dd hh:mm:ss.mss] DESC;
```

As we can see, we've had to sacrifice a few columns in order to group the results; these had to be removed from the Grouping query since they either do not satisfy the rules for the `GROUP BY` clause, or contain incrementing/varying values which skew the grouping results.

The columns were later added back in by creating a self-join with the original CTE, using columns which are not *that* efficient.

&nbsp;

**BONUS TIP**: It is a good practice to run the stored procedure as typed here: sp_**W**ho**I**s**A**ctive. Since the stored procedure was created with Capitalization of the letters W, I, ans A, running the SP using lower case letters will throw an *"object not found"* error where the SQL Server instance was installed with a Case Sensitive Collation.

## References

[sp_whoisactive Documentation](http://whoisactive.com/docs/)

[sp_whoisactive Source Code](https://github.com/amachanic/sp_whoisactive/)

[WAITFOR (Transact-SQL)](https://docs.microsoft.com/en-us/sql/t-sql/language-elements/waitfor-transact-sql)

[SQL Server Utilities - GO](https://docs.microsoft.com/en-us/sql/t-sql/language-elements/sql-server-utilities-statements-go)
