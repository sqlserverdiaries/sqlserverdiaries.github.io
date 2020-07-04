---
layout: post
date:   2011-12-17
title:  "A Mechanism to Store SYSLOG Messages"
permalink: ./blog/index.php/2011/12/a-mechanism-to-store-syslog-messages/
categories: blog
published: true
tags: [Performance, Database Administration, Database Design, Security, Architecture, Code Samples, data types, Development, SQL Server 2008, SQL Server 2008 R2, SQL Server Agent, T-SQL Programming]
comments: false
---
One of the resorces Network specialists use to monitor, troubleshoot, and identify issues with network device (such as routers, switches, firewalls, etc.) is the use of SYSLOG messages. These messages are broadcast on the network via UDP and are captured by specific listener applications and/or devices. One fo these applications is [Kiwi SysLog Server from SolarWinds](http://www.solarwinds.com/products/kiwi_syslog_server/) The product allows that the captured messages can be stored in an SQL Server database for analysis and reporting.

After configuring the network devices to notify when selected events are encountered, and the product to capture the required messages only the next step is to set up the SQL Server database. The database server was allocated 1TB storage on a SAN, had 8GB RAM and the CPU was licenced for SQL Server 2008 Standard Edition. A connection to the database was achieveable using an ODBC DSN, and the Kiwi SysLog Server GUI provided a basic/sample script to create the table as shown below.

``` sql
CREATE TABLE tb_syslogd (
    MsgDate datetime,
    MsgPriority VARCHAR(30),
    MsgHostname VARCHAR(255),
    MsgText VARCHAR(8000)
);
```

Our network specialists (the business decision makers) required that the SYSLOG messages be retained for a maximum of 21 days, after which they were no longer required not even for archival purposes (i.e. could be deleted). Our main problem was that since there were quite a few network devices and a considerable number of messages were being captured (over 1.1 billion per month), a data cleanup using the "default" setup was not a feasibile solution. The easiest way was to partition the data by month using the _MsgDate datetime_ column. Unfortunately, partitioning is only available in the Enterprise Edition of SQL Server so I was back to the drawing board.

The design evolved to use a "manual partitioning" mechanism where a table would be created for each month and a view would join the results of all the tables. Part of the script is shown below.

``` sql
CREATE TABLE tb_syslogd_01 (
    MsgDate datetime,
    MsgPriority VARCHAR(30),
    MsgHostname VARCHAR(255),
    MsgText VARCHAR(8000)
);

CREATE TABLE tb_syslogd_02 (
    MsgDate datetime,
    MsgPriority VARCHAR(30),
    MsgHostname VARCHAR(255),
    MsgText VARCHAR(8000)
);

-- tables for other months...

CREATE TABLE tb_syslogd_11 (
    MsgDate datetime,
    MsgPriority VARCHAR(30),
    MsgHostname VARCHAR(255),
    MsgText VARCHAR(8000)
);

CREATE TABLE tb_syslogd_12 (
    MsgDate datetime,
    MsgPriority VARCHAR(30),
    MsgHostname VARCHAR(255),
    MsgText VARCHAR(8000)
);
```

The _MsgPK_ column of data type INT and with the IDENTITY property set was added to each of the tables. This would allow ensure that every row in each table was uniquely identifyable. The IDENTITY property was set to start from -2,147,483,648 which is the minimum value possible for an integer and increases the data range from 2,147,483,647 to 4,294,967,295 possible values. The data type of the _MsgDate_ column was also modified to the a datetime2(0) type to save on some storage. This decision was made because the values received from the network devices do not contain the milliseconds part and thus I could shave off an extra 2 bytes storage overhead per row. The data type of the _MsgText_ column was changed to a varchar(MAX) since the client wanted to cater for "very long" messages.

``` sql
CREATE VIEW tb_syslogd
AS
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_01 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_02 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_03 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_04 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_05 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_06 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_07 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_08 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_09 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_10 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_11 UNION ALL
SELECT MsgDate, MsgPriority, MsgHostname, MsgText FROM tb_syslogd_12
GO
```

An [INSTEAD OF trigger](http://msdn.microsoft.com/en-us/library/ms189799.aspx) was then created on the view to insert the records into the appropriate table based on the value of the _MsgDate_ column. Unfortunately after testing this approach I found that the performance using the INSTEAD OF trigger was less than desirable (to put it mildly). Once again I had to go back to the drawing board.

I finally devised a solution where the Kiwi SysLog Server application was configured to:

1. store the messages in tab-delimited text files;
2. the name of the capture file is fixed and contains a sequence number ("capture.txt.001");
3. the file name extension is rotated/incremented every hour;
4. the files retained on disk for a period of 120 hours (5 days);
5. the folder storing the files was compressed to maximise the available storage.

In order to import the file data into the SQL Server tables I wrote a stored procedure that would generate and execute dynamic strings containing the [BULK INSERT (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms188365.aspx) command. A [format file](http://msdn.microsoft.com/en-us/library/ms190393.aspx) that would define the file structure was also required - this was created using the below:

``` text
10.0
4
1  SQLCHAR  0  24  "\t"   2  MsgDate      ""
2  SQLCHAR  0  30  "\t"   3  MsgPriority  SQL_Latin1_General_CP1_CI_AS
3  SQLCHAR  0  255 "\t"   4  MsgHostname  SQL_Latin1_General_CP1_CI_AS
4  SQLCHAR  0  0   "\r\n" 5  MsgText      SQL_Latin1_General_CP1_CI_AS
```

Since I am against hard-coding anything (where technically possible) I ceated a "parameters" table that would initially store the path of the data file and the path of the format file that will be used in the BULK INSERT.

The code of the stored procedure that loads the data from the Kiwi Syslog Server capture file is shown below.

``` sql
CREATE PROCEDURE [usp_bulkloadfile]
AS
SET NOCOUNT ON;
DECLARE @filepath nvarchar(256) = (
    SELECT [param_value] FROM [tb_params]
    WHERE [param_desc] = 'BULK_LOAD_FILE_PATH');
DECLARE @configpath nvarchar(256) = (
    SELECT [param_value] FROM [tb_params]
    WHERE [param_desc] = 'BULK_LOAD_CONFIG_PATH');
DECLARE @UploadMonth smallint = (
    SELECT DATEPART(m, DATEADD(hh, -1, CURRENT_TIMESTAMP)));
DECLARE @SQL nvarchar(2000) = N'';

-- execute the bulk load statement
-- file name is hard-coded since this is set in the application
SET @SQL = '
SET NOCOUNT ON;
BULK INSERT [db_syslog].[dbo].[tb_syslogd_' +
    RIGHT('0' + CAST(@UploadMonth AS nvarchar(2)), 2) + ']
FROM ''' + @filepath + '''
WITH (
    FIELDTERMINATOR = ''\t'',
    FIRSTROW = 1,
    DATAFILETYPE = ''char'',
    FORMATFILE = ''' + @configpath + ''',
    KEEPNULLS,
    MAXERRORS = 1,
    ROWTERMINATOR = ''\n'',
    ORDER (MsgDate ASC),
    TABLOCK
);
PRINT CONVERT(varchar(25), CURRENT_TIMESTAMP, 121) + '' - '' +
    CAST(@@ROWCOUNT AS varchar(20)) + '' rows loaded to table tb_syslogd_' +
    RIGHT('0' + CAST(@UploadMonth AS nvarchar(2)), 2) + ''';';
SET NOCOUNT OFF;
EXEC sp_executesql @SQL;
GO
```

What was needed next was a routine that would remove data older than the one defined by the business on a periodic basis. Earlier on I mentioned that any records older than 21 days were not required. To keep it simple this process will delete data using monthly periods. The required data maintenance was achieved by implementing a stored procedure that TRUNCATEs tables which represent a particular month. The number of months to retain is stored in the parameters table and is retrieved at runtime. The first part of the stored procedure which mantains the data is shown below. You will also observe that, although the TRUNCATE resets the IDENTIY property to it's orginal value, I am explicitly resetting following a [TRUNCATE TABLE (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms177570.aspx).

``` sql
CREATE PROCEDURE [usp_purgeoldrecords]
AS
SET NOCOUNT ON
DECLARE @MaxRetentionMonths int = 0 - (
    SELECT TOP(1) CONVERT(int, [param_value]) FROM tb_params
    WHERE [param_desc]='DATA_HOARD_MONTHS' AND [param_status]='A');
DECLARE @MaxRetentionDate datetime =
    DATEADD(m, @MaxRetentionMonths, CURRENT_TIMESTAMP);
DECLARE @ClearMonth smallint = (SELECT DATEPART(m, @MaxRetentionDate))
BEGIN
    PRINT 'Deleting data for ' + DATENAME(m, @MaxRetentionDate);
    IF (@ClearMonth = 1)      -- January
    BEGIN
        TRUNCATE TABLE tb_syslogd_01;
        DBCC CHECKIDENT ('tb_syslogd_01', RESEED, -2147483648);
    END
    ELSE IF (@ClearMonth = 2) -- February
    BEGIN
        TRUNCATE TABLE tb_syslogd_02;
        DBCC CHECKIDENT ('tb_syslogd_02', RESEED, -2147483648);
    END
    ELSE IF (@ClearMonth = 3) -- March
    BEGIN
        TRUNCATE TABLE tb_syslogd_03;
        DBCC CHECKIDENT ('tb_syslogd_03', RESEED, -2147483648);
    END
-- and so forth...
```

The last part of the data collection of this solution is to create two SQL Server Agent scheduled job; one which loads the data every hour (say 10 minutes after the hour), and another job which purges data older than the value defined in the parameters table.

The entire script used for this implementation can be downloaded from the below link.

Script: [a-mechanism-to-store-syslog-messages.zip](/assets/article_files/2011-12-a-mechanism-to-store-syslog-messages/a-mechanism-to-store-syslog-messages.zip)
