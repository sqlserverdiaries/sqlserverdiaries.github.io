---
layout: post
date:   2012-03-24
title:  "Automated Database Scripting to Preserve Intellectual Property"
permalink: ./blog/index.php/2012/03/automated-database-scripting-to-preserve-intellectual-property/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, Database Documentation, SQL Tools, Coding Practices, command-line utilities, Database Documentation, Database Migration, Development, SQL Server, Storage, T-SQL Programming, Testing]
comments: false
---
Copies of live database are frequently hosted on development servers. In some cases these occupy several Megabytes or Gigabytes of disk storage. This is acceptable for the duration of the project development, testing (and other uses) however it might not be feasible, both from an economical as well as security point of view, to store additional copies or backups of the databases’ data on tapes. In such cases it might make more sense to store copies of the database source code, such as table structures, views, stored procedures, functions and other objects since these reflect the actual work performed by the development team. The source code, being the intellectual property of the company, may be stored in a central repository or other secure location accessible only by a selection of members of the organisation. Disk storage would in this case be much less than storing an actual copy of the whole database. A number of products were used to achieve these goals. These are listed below:

* A number of Windows batch file commands;
* SQL Server Command-Line Utility (SQLCMD);
* [SQL Server Database Publishing Wizard](http://sqlhost.codeplex.com "SQL Server Hosting Toolkit - Database Publishing Wizard") (SQLPUBWIZ);
* [Windows Server 2003 Resource Kit Tools](http://www.microsoft.com/download/en/details.aspx?id=17657 "Download: Windows Server 2003 Resource Kit Tools") (NOW command);
* WinRAR for Windows DOS (RAR32 - available from [http://www.rarlabs.com](http://www.rarlabs.com/ "RARLAB, home of WinRAR and RAR archivers"));
* Windows [Task] Scheduler
* The FORFILES utility - described in [Microsoft Technet](http://technet.microsoft.com/en-us/library/cc753551.aspx "Forfiles")

The Database Publishing Wizard is a graphical tool which also supports a command-line interface. Once the installation of the Database Publishing Wizard (downloaded from [http://sqlhost.codeplex.com](http://sqlhost.codeplex.com "SQL Server Hosting Toolkit - Database Publishing Wizard")) was completed, the following was added to the "collector" machine’s PATH environment variable: “C:\Program Files\Microsoft SQL Server\90\Tools\Publishing”. This will allow for the whole path to be omitted from the batch file, keeping it cleaner and more readable. The Windows Server 2003 Resource Kit Tools were downloaded from the [Microsoft Download Center](http://www.microsoft.com/download/en/details.aspx?id=17657 "Download: Windows Server 2003 Resource Kit Tools") and also installed on the collector machine. An SQL script named "list_databases.sql" is included and will return a list of database names, excluding the system databases (master, model, msdb, tempdb) and can be customised to exclude any other databases. A batch file was created utilising the above-listed tools in order to achieve the desired results. The batch file will:

1. Read a list of SQL Server Instances from the text file “servers.txt” contained in the same folder as the batch file. The text file should be structured as per Listing 1 below.
2. For each entry in the “servers.txt” file, a subfolder will be created using the SQL Server Instance name. This will be created within the “SERVERS” folder. Should the instance be the default instance only one subfolder will be created, otherwise a subfolder will be created below the server name subfolder.
3. The script will then check for the existence of the file “_databases.txt” within the instance subfolder, deleting it if found.
4. Using the SQL Server Command-Line Utility, the database names for the selected instance will be extracted to the file “_databases.txt”. Parameters for the SQLCMD command are shown in Listing 2 below.
5. The file “_databases.txt” is then read and for each entry the command SQLPUBWIZ with the necessary parameters is executed. With the parameters passed the application will generate a full schema of the selected database within the current instance name. Parameters for the SQLPUBWIZ command are listed in Listing 3.
6. Once all the SQL Server Instances have been processed the current date is retrieved from the NOW command, formatted and stored in the “_backupfile” variable.
7. The final step of this process is to compress the contents of the “SERVERS” folder using the RAR32 application. Once complete, the same program will delete the files which have just been compressed. Parameters for the RAR32command are listed in Listing 4.
8. Finally, the number of backup files is kept in check by using the FORFILES utility to delete files older than 20 days.

The files required for this solution to work correctly are the following:

* emx.dll
* emx.exe
* forfiles.exe
* list_databases.sql
* now.exe
* rar32.exe
* rsx.exe
* script_user_databases.bat
* servers.txt

The above-listed files should reside within the same folder as the batch file, unless additional tweaks are performed to the said file. The full batch file script described in this document is included in Listing 5.

### Listing 1 - The “servers.txt” file ###

This file should be structured as follows: [SQL Server instance name],[SQL Server version] For example:

* SRVR1\INST1,2000
* SRVR1\INST2,2005
* SRVR2,2005
* SRVR3,2008

### Listing 2 – Parameters for the SQLCMD command ###

``` text
Microsoft (R) SQL Server Command Line Tool
Version 9.00.1399.06 NT INTEL X86
Copyright (c) Microsoft Corporation.  All rights reserved.

usage: Sqlcmd            [-U login id]          [-P password]
  [-S server]            [-H hostname]          [-E trusted connection]
  [-d use database name] [-l login timeout]     [-t query timeout]
  [-h headers]           [-s colseparator]      [-w screen width]
  [-a packetsize]        [-e echo input]        [-I Enable Quoted Identifiers]
  [-c cmdend]            [-L[c] list servers[clean output]]
  [-q "cmdline query"]   [-Q "cmdline query" and exit]
  [-m errorlevel]        [-V severitylevel]     [-W remove trailing spaces]
  [-u unicode output]    [-r[0|1] msgs to stderr]
  [-i inputfile]         [-o outputfile]        [-z new password]
  [-f <codepage> | i:<codepage>[,o:<codepage>]] [-Z new password and exit]
  [-k[1|2] remove[replace] control characters]
  [-y variable length type display width]
  [-Y fixed length type display width]
  [-p[1] print statistics[colon format]]
  [-R use client regional setting]
  [-b On error batch abort]
  [-v var = "value"...]  [-A dedicated admin connection]
  [-X[1] disable commands, startup script, enviroment variables [and exit]]
  [-x disable variable substitution]
  [-? show syntax summary]
```

### Listing 3 – Parameters for the SQLPUBWIZ command ###

``` text
Microsoft (R) SQL Server Database Publishing Wizard
Version 1.1.1.0
Copyright (c) Microsoft Corporation.  All rights reserved.

Usage: sqlpubwiz script ( -C connection_string | -d local_database_name ) (output_file) [switches]

switches:
Output options:
[-f] : Overwrite existing files
[-noschemaqualify] : Output script does not qualify object names with schema name.
[-schemaonly] : Only script schema
[-dataonly] : Only script data
[-targetserver] : Specifies what version of SQL Server the script should target.  Valid versions are "2000", "2005". Default Value: 2005
[-q] : Suppress output
[-nodropexisting] : Default Value: False

Local connection related:
[-C connection_string] : Connection string
[-d local_database_name] : Database name to script
[-U local_user_name] : Username
[-P local_password] : Password
[-S local_server_name] : Server name
```

### Listing 4 – Parameters for the RAR32 command ###

``` text
Warning: No DPMI-server FPU support

RAR 3.80   Copyright (c) 1993-2008 Alexander Roshal   16 Sep 2008
Shareware version         Type RAR -? for help

Usage:     rar <command> -<switch 1> -<switch N> <archive> <files...>
               <@listfiles...> <path_to_extract\>

<Commands>
  a             Add files to archive
  c             Add archive comment
  cf            Add files comment
  ch            Change archive parameters
  cw            Write archive comment to file
  d             Delete files from archive
  e             Extract files to current directory
  f             Freshen files in archive
  i[par]=<str>  Find string in archives
  k             Lock archive
  l[t,b]        List archive [technical, bare]
  m[f]          Move to archive [files only]
  p             Print file to stdout
  r             Repair archive
  rc            Reconstruct missing volumes
  rn            Rename archived files
  rr[N]         Add data recovery record
  rv[N]         Create recovery volumes
  s[name|-]     Convert archive to or from SFX
  t             Test archive files
  u             Update files in archive
  v[t,b]        Verbosely list archive [technical,bare]
  x             Extract files with full path

<Switches>
  -             Stop switches scanning
  ac            Clear Archive attribute after compression or extraction
  ad            Append archive name to destination path
  ag[format]    Generate archive name using the current date
  ap<path>      Set path inside archive
  as            Synchronize archive contents
  av            Put authenticity verification (registered versions only)
  av-           Disable authenticity verification check
  c-            Disable comments show
  cfg-          Disable read configuration
  cl            Convert names to lower case
  cu            Convert names to upper case
  df            Delete files after archiving
  dh            Open shared files
  ds            Disable name sort for solid archive
  dw            Wipe files after archiving
  e[+]<attr>    Set file exclude and include attributes
  ed            Do not add empty directories
  en            Do not put 'end of archive' block
  ep            Exclude paths from names
  ep1           Exclude base directory from names
  ep3           Expand paths to full including the drive letter
  f             Freshen files
  hp[password]  Encrypt both file data and headers
  id[c,d,p,q]   Disable messages
  ierr          Send all messages to stderr
  ilog[name]    Log errors to file (registered versions only)
  inul          Disable all messages
  isnd          Enable sound
  k             Lock archive
  kb            Keep broken extracted files
  m<0..5>       Set compression level (0-store...3-default...5-maximal)
  mc<par>       Set advanced compression parameters
  md<size>      Dictionary size in KB (64,128,256,512,1024,2048,4096 or A-G)
  ms[ext;ext]   Specify file types to store
  n<file>       Include only specified file
  n@            Read file names to include from stdin
  n@<list>      Include files in specified list file
  o[+|-]        Set the overwrite mode
  or            Rename files automatically
  p[password]   Set password
  p-            Do not query password
  r             Recurse subdirectories
  r0            Recurse subdirectories for wildcard names only
  rr[N]         Add data recovery record
  rv[N]         Create recovery volumes
  s[<N>,v[-],e] Create solid archive
  s-            Disable solid archiving
  sc<chr>[obj]  Specify the character set
  sfx[name]     Create SFX archive
  si[name]      Read data from standard input (stdin)
  sl<size>      Process files with size less than specified
  sm<size>      Process files with size more than specified
  t             Test files after archiving
  ta<date>      Process files modified after <date> in YYYYMMDDHHMMSS format
  tb<date>      Process files modified before <date> in YYYYMMDDHHMMSS format
  tk            Keep original archive time
  tl            Set archive time to latest file
  tn<time>      Process files newer than <time>
  to<time>      Process files older than <time>
  ts<m,c,a>[N]  Save or restore file time (modification, creation, access)
  u             Update files
  v             Create volumes with size autodetection or list all volumes
  v<size>[k,b]  Create volumes with size=<size>*1000 [*1024, *1]
  ver[n]        File version control
  vn            Use the old style volume naming scheme
  vp            Pause before each volume
  w<path>       Assign work directory
  x<file>       Exclude specified file
  x@            Read file names to exclude from stdin
  x@<list>      Exclude files in specified list file
  y             Assume Yes on all queries
  z[file]       Read archive comment from file
```

### Listing 5 – The script described within this document ###

``` powershell
rem NOTE: Add "rem C:\Program Files\Microsoft SQL Server\90\Tools\Publishing" to the PATH environment variable
@ECHO OFF
CLS

FOR /F "tokens=1-3 delims=," %%a IN (.\servers.txt) DO (
    ECHO Processing server %%a
    rem *** Create server scripts folder ***
    mkdir .\SERVERS\%%a
    rem *** Remove old versions of databases file ***
    IF EXIST .\SERVERS\%%a\_databases.txt DEL .\SERVERS\%%a\_databases.txt
    rem *** Generate new list of user databases ***
    SQLCMD -E -S%%a -w8000 -W -s"|" -i".\list_databases.sql" -o".\SERVERS\%%a\_databases.txt" -h-1

    rem *** Process server databases ***
    FOR /F %%c IN (.\SERVERS\%%a\_databases.txt) DO (
        rem *** Remove old versions of script file ***
        IF EXIST .\SERVERS\%%a\%%c.sql DEL .\%%a\%%c.sql
        rem ***  Extract schema ***
        SQLPUBWIZ script -S %%a -d %%c -f -schemaonly -targetserver "%%b" -q .\SERVERS\%%a\%%c.sql >> .\SERVERS\%%a\_report.txt
    )
)
rem ** Get the current date and time
FOR /f "tokens=1,2,3,4,5,6 delims= " %%g IN ('NOW') DO (
    SET _backupfile=%%k%%h%%i
)

rem *** Compress server scripts as a single file ***
RAR32 a -r -df .\BACKUP\SERVERS_%_backupfile%.rar .\SERVERS\*.*

rem *** Delete RAR files older than 20 days ***
FORFILES /p ".\BACKUP" /m "SERVERS_*.rar" /c "cmd /c del /Q @path" /d -20

END
```

A ZIP file containing all the files mentioned above can be [downloaded here](\assets/article_files/2012-03-automated-database-scripting-to-preserve-intellectual-property/automated-database-scripting-to-preserve-intellectual-property.zip).
