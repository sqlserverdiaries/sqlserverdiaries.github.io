---
layout: post
date:   2012-02-04
title:  "Execute Multiple Script Files in One Batch"
permalink: ./blog/index.php/2012/02/execute-multiple-script-files-in-one-batch/
categories: blog
published: true
tags: [command-line utilities, Database Administration, SQL Tools, T-SQL Programming, Code Samples, Development, SQL Server]
comments: false
---
This must have happened to most DBAs: you're working on the usual stuff, monitoring your SQL Server instances, trying to keep everything oiled and running smoothly when you receive a phone call from a developer who tells you about some new module that has to be implemented soon.  You schedule the work and ask for a copy of the script (or scripts) thinking that it's a straightforward deployment.  The developer sends the scripts in a compressed file which, when extracted creates a folder structure containing over 80 script files!  The developer had created a script file for each database object that had to be deployed, numbered so that (you) would know in which order they had to be executed.  But of course you don't want to spend a good hour opening each file, connecting to the correct SQL Server instance, executing the script and saving the results. And you cannot "refuse" to implement either.

Here's where the [SQLCMD utility](http://msdn.microsoft.com/en-us/library/ms162773.aspx) comes in handy.  This command line tool has been around since SQL Server 2005, replacing the SQL Server 2000 [OSQL utility](http://msdn.microsoft.com/en-us/library/aa214012(v=SQL.80).aspx).  The EXE accepts a number of options as shown in the MSDN documentation one of which is the _**-i**_ parameter.  This is what saves us.

To cut the story short, I created two files; a text file containing the list of SQL files that had to be executed, and a batch file (CMD) that would read the text file, and execute an SQLCMD command for each file against the SQL Server instance defined.  In my example the connection was established using Windows Authentication, but this can be modified easily to use SQL Authentication instead.

Once the file list is read, the following part does the "magic", saving me buckets of time.

``` text
FOR /F %%a IN (.\%_sqllist%) DO (
    ECHO Executing file %%a
    SQLCMD -E -S%_sqlinstance% -w8000 -W -s"|" -i%%a > .\output\%%a.log
)
```

An "output" sub-folder is created as part of the process and the output of each SQL script is written to a LOG file with the same name as the original file.  Besides helping to capture any script errors, this also serves to store any T-SQL [PRINT (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms176047.aspx) commands.

The batch file and a sample can be [downloaded from here](/assets/article_files/2012-02-execute-multiple-script-files-in-one-batch/execute-multiple-script-files-in-one-batch.zip).  One word of advice.  Do not execute any scripts against production environments without rigorous testing, especially using the techniques mentioned in this article because you might jeopardise the integrity of your system, and your job!
