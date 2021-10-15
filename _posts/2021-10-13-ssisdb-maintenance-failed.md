---
layout: post
date:   2021-10-13
title:  "SSISDB Maintenance Failed"
permalink: ./blog/index.php/2021/10/ssisdb-maintenance-failed/
categories: blog
published: true
tags: [SSISDB, Database Administration, SQL Tools, Errors, SQL Server 2012]
comments: true
---
I recently came across a number of SSISDB databases (on SQL Server 2012 instances) configured with the default log retention settings. While this might not seem like a problem, on a system hosting a considerable number of packages, where some of said packages are scheduled to run multiple times a day or more, the amount of logging can easily add up to consume a significant amount of disk space.

This can be remedied very easily by reducing the Retention Period from the default of 365 days to one that complies with your requirements.

![/assets/article_files/2021/10/ssisdb-catalog-properties.png "ssisdb-catalog-properties"](/assets/article_files/2021/10/ssisdb-catalog-properties.png)

NOTE: In the following examples, the Retention Period is reduced to 32 days.

Reducing the Retention Period can be achieved using the UI, or (my preferred method) using the following TSQL code:

``` sql
USE [SSISDB]
GO
EXEC [catalog].[configure_catalog]
    @property_name=N'RETENTION_WINDOW',
    @property_value=32
GO
```

Once the Retention Period is set, the SQL Agent job "SSIS Server Maintenance Job" will handle maintenance tasks.  One of the jobs steps will execute the `[internal].[cleanup_server_retention_window]` stored procedure which retrieves values from the `[catalog].[catalog_properties]` table, runs a number of checks, then runs a `DELETE` command on the `[internal].[operations]` table.  The SQL Agent job is scheduled to run daily at 00:00, so what is described next happened when nobody was around.

The problem was that the Transaction Log for the SSISDB database grew uncontrollably, [tested] both with a SIMPLE Recovery Model as well as when the database was set to FULL Recovery Model and with periodic Transaction Log backups.

Of course all the available disk space was consumed, and the process failed.

After reviewing the stored procedure definition, and running the code parts separately to debug the variable values, the problem was found to be in the actual `DELETE` operation.  The code is written so as to delete in batches, however the value of the `@delete_batch_count` variable is hard-coded (ugh!) with a value of 1000 in the stored procedure code.  Although this might seem like a low-enough value for deletes, I was wrong to think so.

The Execution Plan for this DELETE operation showed that a number of other objects were involved.

![/assets/article_files/2021/10/ssisdb-delete-execution-plan.png "ssisdb-delete-execution-plan"](/assets/article_files/2021/10/ssisdb-delete-execution-plan.png)

This immediately pointed me to look at the object dependencies on the `[internal].[operations]` table, which in fact were the same shown in the Execution Plan. As soon as the table creation was scripted, this confirmed my suspicion - the Foreign Keys referencing the `[internal].[operations]` table were created with the `ON DELETE CASCADE` option.

Although this technique allows the data to somehow "maintain itself", in my opinion this is a form of lazy programming where the Developer didn't want to bother with deleting dependent records before deleting the main one.

The scenario wouldn't have caused any issues on smaller databases with a few hundred records (a classic "works on my machine" example), but on a larger database with hundreds of thousands of records in the `[internal].[operations]` table, things did not go as intended.

Once the root cause was identified I got on to writing code to, first delete a single record and get the timings, then increase the batch size to an acceptable level. Spoiler Alert: The "sweet spot" value was found to be 5.

Anyway, here's the code:

### Deleting in smaller batches

``` sql
USE [SSISDB]
GO
SET NOCOUNT ON;

DECLARE @delete_batch_size int = 5; -- a "more manageable" size
DECLARE @rows_affected bigint = @delete_batch_size; -- set to variable value to initialize
DECLARE @temp_date datetime = GETDATE() - 32; -- log retention of 32 days

CREATE TABLE #AllRowsToDelete ([RowID] bigint);
CREATE TABLE #RowsToDelete ([RowID] bigint);

BEGIN TRY
    -- get the list of Row ID's which exceed the date threshold
    INSERT INTO #AllRowsToDelete ([RowID])
    SELECT [operation_id]
    FROM [internal].[operations]
    WHERE ( [end_time] <= @temp_date
    OR ([end_time] IS NULL AND [status] = 1 AND [created_time] <= @temp_date ))

    WHILE (@rows_affected = @delete_batch_size)
    BEGIN
        -- clear Temp tables
        DELETE FROM #AllRowsToDelete WHERE [RowID] IN ( SELECT [RowID] FROM #RowsToDelete );
        TRUNCATE TABLE #RowsToDelete;

        -- get a subset of the Row ID's which exceed the date threshold
        INSERT INTO #RowsToDelete([RowID])
            SELECT TOP (@delete_batch_size) [RowID] FROM #AllRowsToDelete;

        -- batch delete the Row ID's which exceed the date threshold
        BEGIN TRANSACTION
            DELETE FROM [internal].[operations] WHERE [operation_id] IN ( SELECT [RowID] FROM #RowsToDelete );
            SET @rows_affected = @@ROWCOUNT;
        COMMIT TRANSACTION
    END
END TRY
BEGIN CATCH
    -- only if something goes wrong...
    ROLLBACK TRANSACTION;
    THROW;
END CATCH

-- clean up
DROP TABLE #AllRowsToDelete;
DROP TABLE #RowsToDelete;
```

### Checking status (using another SSMS session)

``` sql
USE [SSISDB]
GO
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SET NOCOUNT ON;
DECLARE @temp_date datetime = GETDATE() - 32;
SELECT COUNT(*)
FROM [internal].[operations]
WHERE ( [end_time] <= @temp_date
OR ([end_time] IS NULL AND [status] = 1 AND [created_time] <= @temp_date ));
```

### Check open transactions (in yet another SSMS session)

``` sql
USE [SSISDB]
GO
DBCC OPENTRAN()
GO
```

Hope this saves you some trouble!
