---
layout: post
date:   2011-02-19
title:  "Send SQL Server Agent Job log file by Email"
permalink: ./blog/index.php/2011/02/send-sql-server-agent-job-log-by-email/
published: true
tags: [T-SQL Programming, SQL Server Agent, SQL Server 2005, Database Mail, Backup and Recovery, Database Administration, SQL Server 2008]
comments: false
---
When creating an SQL Server Agent job with one or more steps, each step can be configured to write the query output to a log file.  If the job failes, such a log can assist a DBA identify the cause of the failure.  That is, if the log is still available.

In certain cases, when a job is configured to run frequently, a DBA might not always be in a position to retrieve the log file by the time the next iteration is scheduled to run.  This means that the log file will be overwritten.

This stored procedure can be created in the _master_ database or in a custom database.  The stored procedure should be added as an SQL Server Agent job step, and the flow of the steps should be made to start this step on failure.  The job step should contain the following:

``` sql
EXEC dbo.usp_job_failure_notification
    @DatabaseMailProfile = 'Database Mail Profile Name',
    @EmailRecipients = 'dba@yourdomain.com',
    @EmailCC = '',
    @EmailBCC = '';
```

For this stored procedure to work correctly, a valid [Database Mail](http://msdn.microsoft.com/en-us/library/ms175887.aspx) profile has to be configured (and tested).  Configuring Database Mail is beyond the scope of this article but will be documented in another article.

The stored procedure creates a table in the _tempdb_ database and enables the _xp\_cmdshell_ option if it is disabled.  A CURSOR is then defined to retrieve the job name, the job step nameand the output file path defined for each job.  Note that the latter field might be NULL if an output file is not set.  The procedure then loops through the resultset of the cursor to write the contents of each file to the temporary table together with some comments to separate each file output.  The _xp\_cmdshell_ option is then disabled, the email parameters are prepared and a query is prepared.  This query will join the contents of each record retrieved into a single character string.

As a final step the Database Mail stored procedure stored _dbo.sp_send_dbmail_ present in the _msdb_ database is executed with the parameters shown.  For an explanation of each parameter please visit the [sp_send_dbmail (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms190307.aspx) documentation in the SQL Server Books Online.

The full stored procedure definition is shown below:

``` sql
IF EXISTS (SELECT * FROM sys.objects WHERE OBJECT_ID = OBJECT_ID(N'[dbo].[usp_job_failure_notification]') AND TYPE IN (N'P', N'PC'))
    DROP PROCEDURE [dbo].[usp_job_failure_notification]
GO

CREATE PROCEDURE [dbo].[usp_job_failure_notification]
    @DatabaseMailProfile NVARCHAR(128),
    @EmailRecipients NVARCHAR(2000),
    @EmailCC NVARCHAR(2000),
    @EmailBCC NVARCHAR(2000)
AS
/*
----------------------------------------------------------------------------
-- Object Name:             dbo.usp_job_failure_notification
-- Project:                 N/A
-- Business Process:        N/A
-- Purpose:                 Send an email when an SQL Server Agent job fails
-- Detailed Description:    Sends and email and file attachment when an SQL Server Agent fails.
--                          The file will contain the textual contents of any log files defined 
--                          in the steps of the job from where this procedure is called.
--                          SQL Server 2005 and later
-- Database:                master (or custom)
-- Dependent Objects:       Database Mail
-- Called By:               SQL Server Agent Service Account (sysadmin)
--
--------------------------------------------------------------------------------------
-- Rev   | CMR      | Date Modified  | Developer             | Change Summary
--------------------------------------------------------------------------------------
--   1.0 |          | 02/02/2011     | Reuben Sultana        | First implementation
--       |          |                |                       |
--       |          |                |                       |
--
*/
SET NOCOUNT ON;
DECLARE @EmailSubject NVARCHAR(128),
        @EmailBody VARCHAR(MAX),
        @EmailFileName VARCHAR(255);
DECLARE @ConfigValueChanged tinyint;
DECLARE @AgentJobName NVARCHAR(255),
        @AgentJobStepName NVARCHAR(255),
        @AgentJobStepFile NVARCHAR(2000),
        @AgentJobFiles CURSOR;
DECLARE @cmd NVARCHAR(1000);

-- drop (if it exists) and create the temporary table to store the file content
IF EXISTS(SELECT 1 FROM tempdb.sys.sysobjects WHERE xtype = 'U' AND name = 'cmdshell_output')
BEGIN
    DROP TABLE tempdb.dbo.cmdshell_output;
END
CREATE TABLE tempdb.dbo.cmdshell_output (idcol INT IDENTITY(1,1), outputcol VARCHAR(4000));

-- SQL Server 2005 and later
-- Enable "xp_cmdshell" option if off
SET @ConfigValueChanged = 0;
IF (SELECT [value] FROM MASTER.sys.configurations WHERE [name] = 'xp_cmdshell') = 0
BEGIN
    SET @ConfigValueChanged = 1;
    EXEC MASTER..sp_configure 'show advanced options', 1;
    RECONFIGURE;
    EXEC MASTER..sp_configure 'xp_cmdshell', 1;
    RECONFIGURE;
END

-- retrieve file names (if any)
SET @AgentJobFiles = CURSOR FOR
    SELECT
         COALESCE(j.[name], p.[program_name]),
        s.step_name,
        s.output_file_name
    FROM [master].dbo.sysprocesses p
        LEFT OUTER JOIN [msdb].dbo.sysjobs j ON SUBSTRING(p.[program_name],32,32) = SUBSTRING([master].dbo.fn_varbintohexstr(j.job_id),3,100)
        INNER JOIN [msdb].dbo.sysjobsteps s ON j.job_id = s.job_id
    WHERE p.spid = @@SPID
    ORDER BY s.step_id ASC;

OPEN @AgentJobFiles
FETCH NEXT FROM @AgentJobFiles INTO @AgentJobName, @AgentJobStepName, @AgentJobStepFile;
WHILE (@@FETCH_STATUS = 0)
BEGIN
    SET @cmd = '';
    INSERT INTO tempdb.dbo.cmdshell_output (outputcol)
        SELECT '********************************************************************************' UNION ALL
        SELECT 'Job name: "' + @AgentJobName + '"' UNION ALL
        SELECT 'Step Name: "' + @AgentJobStepName + '"' UNION ALL
        SELECT '';

    IF (@AgentJobStepFile IS NOT NULL)
    BEGIN
        INSERT INTO tempdb.dbo.cmdshell_output (outputcol)
            SELECT 'Outputting contents of file: "' + @AgentJobStepFile + '"' UNION ALL
            SELECT '---------------------------------------------------------------------------------';

        SET @cmd = 'type "' + @AgentJobStepFile + '"';
        INSERT INTO tempdb.dbo.cmdshell_output (outputcol)
            EXEC [master]..xp_cmdshell @cmd;
    END
    ELSE
    BEGIN
        INSERT INTO tempdb.dbo.cmdshell_output (outputcol)
            SELECT 'No output file associated with this Job step' UNION ALL
            SELECT '--------------------------------------------------------------------------------';
    END
    FETCH NEXT FROM @AgentJobFiles INTO @AgentJobName, @AgentJobStepName, @AgentJobStepFile;
END
CLOSE @AgentJobFiles;
DEALLOCATE @AgentJobFiles;

-- revert configuration change (only if changed earlier)
IF (@ConfigValueChanged = 1)
BEGIN
    SET @ConfigValueChanged = 0;
    EXEC MASTER..sp_configure 'xp_cmdshell', 0;
    RECONFIGURE;
    EXEC MASTER..sp_configure 'show advanced options', 0;
    RECONFIGURE;
END

-- a "nice" email message
SET @EmailSubject = 'SQL Server Job "' + @AgentJobName + '" Failed';
SET @EmailFileName = @AgentJobName + '.LOG';
SET @EmailBody = 'The SQL Server Agent job "' + @AgentJobName + '" failed on ' +
    CAST(SERVERPROPERTY('ServerName') AS NVARCHAR(128)) + CHAR(10) + '
Please review the contents of the attached log and refer to the SQL Server Error Log if further diagnostics are required.

Thank you.

The Database Administrator
';

-- prepare query to merge table row contents into a single variable
SET @cmd = 'SET NOCOUNT ON;
SELECT LEFT(column_names,LEN(column_names) - 1)
FROM tempdb.dbo.cmdshell_output AS extern
    CROSS APPLY (
        SELECT outputcol + CHAR(13) + CHAR(10)
        FROM tempdb.dbo.cmdshell_output AS intern
        ORDER BY idcol
        FOR XML PATH('''')
        ) pre_trimmed (column_names)
GROUP BY column_names;';

-- send email notification
EXEC msdb.dbo.sp_send_dbmail
    @profile_name = @DatabaseMailProfile,
    @recipients = @EmailRecipients,
    @copy_recipients = @EmailCC,
    @blind_copy_recipients = @EmailBCC,
    @subject = @EmailSubject,
    @body = @EmailBody,
    @body_format = 'TEXT',
    @query = @cmd,
    @execute_query_database = 'tempdb',
    @attach_query_result_as_file = 1,
    @query_attachment_filename = @EmailFileName,
    @query_result_header = 0,
    @query_result_width = 32767,
    @query_no_truncate = 1;

DROP TABLE tempdb.dbo.cmdshell_output;
GO
```
