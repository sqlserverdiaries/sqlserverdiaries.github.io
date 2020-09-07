---
layout: post
date:   2011-06-18
title:  "Loading MSSQL Blocks XML files into a table"
permalink: ./blog/index.php/2011/06/loading-mssql-blocks-xml-files-into-a-table/
categories: blog
published: true
tags: [Code Samples, Database Administration, SQL Tools, T-SQL Programming, data types, SQL Server]
comments: false
---
I sometimes use the [MSSQL Blocks](http://sqlblocks.narod.ru) application to monitor and especially collect information related to database locks.  I know that I could use an SQL Profiler trace or a Server-level trace however I found that this application is offers a "start and forget" approach.

The application is written by an SQL Server DBA and runs in the currently logged on user session.  Quoting from the author's website:

> This utility has been developed for collecting information on blocking/blocked processes (sessions) from multiple SQL Server 2000/2005 instances and presenting it in user-friendly format. The history behind creation of this utility is that we have our (translator: in-house developed) application which is running on several SQL instances and intermittently hangs (translator: due to blocks). To save us time of manually checking though all instances for possible long-running blocks I wrote this small program. It works through ADO in asynchronous mode. During refresh it fetches data from [sysprocesses] (system table) and transforms them into tree-like structure allowing to show only processes(sessions) in trouble.

The information collected is stored in XML files (a sample of which is shown below), a file is created for each **blocking** session, and each file will contain the session information as well as information for the blocked process or process tree.  For more information about this application just visit the author's website, download it and try it out.

``` xml
<?xml version="1.0" encoding="windows-1251"?>
<snapshot server_name="SQLSERVER\INSTANCE" start_time="2011-04-28T09-16-58" duration="17764">
    <process state="Blocking" spid="198" block_spid="197" dbname="MonitoredDatabase" wait_time="2360" last_wait_type="LCK_M_U" wait_resource="KEY: 23:526729029:1 (d80032e65824)" open_tran_count="2" status="sleeping" host_name="HOSTNAME1" app_name="Application A" cmd="UPDATE" login_name="login001" cpu="6136" physical_io="713" mem_usage="7" last_batch="2011-04-28T09-16-51">
        <sql>sp_executesql;1</sql>
        <process state="Blocking" spid="197" block_spid="198" dbname="MonitoredDatabase" wait_time="18359" last_wait_type="LCK_M_U" wait_resource="KEY: 23:526729029:1 (d900ace6f2e8)" open_tran_count="2" status="sleeping" host_name="HOSTNAME2" app_name="Application B" cmd="UPDATE" login_name="login002" cpu="9684" physical_io="811" mem_usage="0" last_batch="2011-04-28T09-16-50">
            <sql>sp_executesql;1</sql>
        </process>
    </process>
</snapshot>
```

Once the data was captured I ended up with a multitude of XML files for various blocked processes across various SQL Server instances.  Looking for information and especially, trying to find trends in blocks or the major culprits started becoming a headache.

Since SQL Server 2005, T-SQL offered the ability to [store and read XML data](http://msdn.microsoft.com/en-us/library/ms189887.aspx) to/from tables (columns) or variables having this data type.  So I decided to build a script that would allow me to read the data in the files and deliver it to a target audience as a spreadsheet.

The first step had to be reading the actual XML files.  I did this using the [OPENROWSET (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms190312.aspx) command as shown below.

``` sql
SELECT CAST(BulkColumn AS XML)
FROM OPENROWSET(BULK 'C:\temp\myxmlfile.xml', SINGLE_BLOB) AS x;
```

Next I created a temporary table that would store the results from the above query.  The table defintion is shown below.

``` sql
CREATE TABLE #XMLData (XmlData XML);
```

The resulting XML data was inserted into this temporary table using the following:

``` sql
INSERT INTO #XMLData(XMLData)
SELECT CAST(BulkColumn AS XML)
FROM OPENROWSET(BULK 'C:\temp\mssqlblocks_outputfile.xml', SINGLE_BLOB) AS x;
```

The column data is then moved to an XML-type variable using:

``` sql
SELECT @XMLResult = XMLData FROM #XMLData;
```

The XML data is then split into columns using the below query.

``` sql
SELECT
    T.sqlblock.value('@server_name','varchar(128)'),
    T.sqlblock.value('@start_time','varchar(20)'),
    T.sqlblock.value('@duration','int')
    T.sqlblock.value('@state', 'varchar(50)') AS [state],
    T.sqlblock.value('@spid', 'int') AS [spid],
    T.sqlblock.value('@block_spid', 'int') AS [block_spid],
    T.sqlblock.value('@dbname', 'varchar(128)') AS [dbname],
    T.sqlblock.value('@wait_time', 'int') AS [wait_time],
    T.sqlblock.value('@last_wait_type', 'varchar(100)') AS [last_wait_type],
    T.sqlblock.value('@wait_resource', 'varchar(100)') AS [wait_resource],
    T.sqlblock.value('@open_tran_count', 'int') AS [open_tran_count],
    T.sqlblock.value('@status', 'varchar(100)') AS [status],
    T.sqlblock.value('@host_name', 'varchar(128)') AS [host_name],
    T.sqlblock.value('@app_name', 'varchar(1000)') AS [app_name],
    T.sqlblock.value('@cmd', 'varchar(100)') AS [cmd],
    T.sqlblock.value('@login_name', 'varchar(128)') AS [login_name],
    T.sqlblock.value('@cpu', 'bigint') AS [cpu],
    T.sqlblock.value('@physical_io', 'bigint') AS [physical_io],
    T.sqlblock.value('@mem_usage', 'int') AS [mem_usage],
    T.sqlblock.value('@last_batch', 'varchar(20)') AS [last_batch],
    T.sqlblock.value('sql[1]','varchar(2000)') AS [sql_query]
FROM @XMLResult.nodes('/snapshot/process') T (sqlblock);
```

The entire script used for this implementation can be downloaded by clicking the link at the end of the article.  My script caters for multiple XML files using the _xp\_cmdshell_ extended stored procedure and can also be used to filter results for a specific SQL Server instance name.  I am thining of developing it further by creating a stored procedure that will load the XML files on schedule and delete them when done, but I'm still not sure if this is the right tool for the job.  Anyway, I hope you find the script as explained here useful.  If you do, let me know if and how you used it in your environment.

Download script: [Import MS SQL Blocks XML Files](/assets/article_files/2011/06/Import-MS-SQL-Blocks-XML-Files.zip)
