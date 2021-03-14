---
layout: post
date:   2021-03-14
title:  "Filter Out Error Log Messages"
permalink: ./blog/index.php/2021/03/filter-out-errorlog-messages/
categories: blog
published: true
tags: [ERRORLOG, SSMS, PowerShell]
comments: true
---

The SQL Server error log is a text file, which by default is located in the LOG folder and stores various messages. The message types vary from informational to warnings, to actual errors, all of which can help a DBA in troubleshooting or actually prevent something unwanted from happening.

A new `ERRORLOG` file is generated every time the SQL Server service is started, or when the server is rebooted. The files are rotated by replacing the file extension with a numeric value. This means that file currently in use will not have an extension; the next oldest will be called `ERRORLOG.1`, and so forth.

A new installation of SQL Server will store a maximum of 30 files by default, however that can be increased to a (current) maximum of 99 (files). This can be achieved using the UI or the following code:

![/assets/article_files/2021/03/ssms_errorlog_change_number_of_files.png "ssms_errorlog_change_number_of_files"](/assets/article_files/2021/03/ssms_errorlog_change_number_of_files.png)

Screenshot showing how to change the number of files

``` sql
-- Increase the number of ErrorLog files to 99 
EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer', 
    N'NumErrorLogs', 
    REG_DWORD, 99;
```

The file location can also be changed, however most of the time we'd leave that in the default location. Changing it can be done using the UI, or using PowerShell as shown below:

![/assets/article_files/2021/03/ssms_errorlog_location.png "ssms_errorlog_location"](/assets/article_files/2021/03/ssms_errorlog_location.png)

Screenshot showing how to change the location of the error log

``` powershell
[string] $SQLServerVersion = "MSSQL14"
[string] $InstanceName = "MSSQLSERVER"
[string] $SystemDBRoot = "E:"
[string] $SQLService = "SQL Server ($InstanceName)";

$SQLServiceName = ((Get-Service | WHERE { $_.DisplayName -eq $SQLService }).Name).Trim();

# Get the SQL Server instance registry path
[string] $SQLInstanceRegistryPath = "";

If ($SQLServiceName.contains("`$")) { $SQLServiceName = $SQLServiceName.SubString($SQLServiceName.IndexOf("`$")+1,$SQLServiceName.Length-$SQLServiceName.IndexOf("`$")-1) }

foreach ($i in (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server").InstalledInstances)
{
  If ( ((Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL").$i).contains($SQLServiceName) ) 
  { $SQLInstanceRegistryPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\"+`
  (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL").$i}
}

# Get the install root folder
[string] $SQLInstancePath = (Get-ItemProperty "$SQLInstanceRegistryPath\Setup").SQLPath

[string] $SQLArg = ""

# Change SQL Server startup parameter SQLArg2
$SQLArg = (Get-ItemProperty -Path "$SQLInstanceRegistryPath\$InstanceName\Parameters" -Name ("SQLArg2") | Select SQLArg2).SQLArg2
$SQLArg = $SQLArg.Replace($SQLInstancePath, "$SystemDBRoot\$SQLServerVersion.$InstanceName")
Set-ItemProperty -Path "$SQLInstanceRegistryPath\$InstanceName\Parameters" -Name ("SQLArg2") -Value $SQLArg
```

Yes, that is a bit verbose.

The location of the ERRORLOG can also be retrieved using the `SERVERPROPERTY` function:

``` sql
SELECT SERVERPROPERTY('ErrorLogFileName');
```

Another important setting is the maximum file size allowed before rotating the ERRORLOG file. This was introduced in SQL Server 2012 and it was only in recent versions of SSMS that the UI allowed this. It is recommended to use this configuration parameter since it allows for better management of the error messages. The drawback of not setting it is that the ERRORLOG will keep growing until it reaches 2GB in size, or until all the available disk space has been used, whichever comes first. At that point the instance would report an error and stop logging.

Configuring the maximum file size can be done using the following:

``` sql
-- Set a limit for the size of the ErrorLog file (30MB).
EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE',
    N'Software\Microsoft\MSSQLServer\MSSQLServer', 
    N'ErrorLogSizeInKb', 
    REG_DWORD, 30720;
```

Or in recent versions of SSMS, using the UI:

![/assets/article_files/2021/03/ssms_errorlog_file_size.png "ssms_errorlog_file_size"](/assets/article_files/2021/03/ssms_errorlog_file_size.png)

It is also a recommended practice to "force" the error log to cycle. This can be done by creating a scheduled task (eg. SQL Agent job, Windows Task, or your Enterprise Scheduling tool) which executes the `sp_cycle_errorlog` stored procedure. I like to have mine reset at midnight GMT in an attempt to have one file daily.

``` sql
EXEC sp_cycle_errorlog
```

Of course the error messages are logged so that the DBA can retrieve the relevant ones when carrying out an investigation. Retrieving the file contents can be achieved in a number of ways:

1. Execute the `sp_enumerrorlogs` stored procedure (or the `xp_enumerrorlogs` extended stored procedure) to view the list of error log files, their last change date, and their sizes.

    ``` sql
    EXEC sp_enumerrorlogs
    ```

2. Execute the `sp_readerrorlog` stored procedure (or the `xp_readerrorlog` extended stored procedure) to read one of the files, defaulting to the current one if no parameters are provided.  The stored procedure has a number of input parameters which allow you to retrieve a specific message matching the parameter values.

    ``` sql
    EXEC master..sp_readerrorlog

    -- OR

    EXEC master..xp_readerrorlog
    ```

    Note: The `sp_readerrorlog` stored procedure can also be used to read the SQL Agent log file.

3. Use SSMS to open the UI.

    ![/assets/article_files/2021/03/ssms_errorlog_ui.png "ssms_errorlog_ui"](/assets/article_files/2021/03/ssms_errorlog_ui.png)

    SSMS UI screenshot

4. You can use your favourite text viewer to read the files, however you'd need access to the actual file on the server, which might not be an option. Not to mention that the file would be locked by the SQL Server proccess, so you'd have to first copy the file elsewhere in order to open it safely. Some text viewers/editors that come to mind are Notepad, Wordpad, the [TYPE](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/type) command, [Notepad++](https://notepad-plus-plus.org/), PowerShell (e.g. [Get-Content](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-content)), VI or GREP (on Linux) and many more.

&nbsp;

In the latter example, a text viewer would display the enntire contents of the file, and it is up to you to extract the meaningful messages. This is where my script comes in handy.

&nbsp;

## Filter messages using TSQL

The script will copy the contents of the ERRORLOG file defined by the `@FileNumber` variable into a Temporary Table, then return the results **excluding** the items defined in the `#logexclusions` table.

This script will remove "noise" messages, such as *"(c) Microsoft Corporation"* or those containing *"This is an informational message"*, and allow a DBA to focus on the important items, such as a [Deadlock Graph](https://docs.microsoft.com/en-us/troubleshoot/sql/performance/understand-resolve-blocking) for starters.

Filtering is applied on the messages using Dynamic SQL (had to, sorry!) by concatenating a series of `NOT LIKE` comparisons. The messages which are being filtered are mostly informational in nature however the script gives one the option of commenting (hence **not** excluding) specific messages. Some of the filters contain Regular Expressions (as allowed by the `LIKE` operator), so one could for example decidew to **include** failed logon attempts in the output by changing this line:

``` sql
UNION ALL SELECT N'Login [fs]%d for user%'
```

The `@ShowSummary` variable will show aggregates for each `DISTINCT` message as a second result set providing information about the number of occurances of a specific message.

I like to output the results to text ("Ctrl+T" in a SSMS Query window) which allows sending the results by email or copying them to an Incident Management System. That's a personal preference though.

Note that performance might suffer with larger ERRORLOG files, which is why size management is as important as file management.

This script, which is hosted in [this Github repo](https://github.com/reubensultana/DBAScripts/tree/master/ERRORLOG), was written out of necessity, and hardly a day comes by that I don't use it. I hope you find it useful too!
