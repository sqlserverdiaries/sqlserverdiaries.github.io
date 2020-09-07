---
layout: post
date:   2012-05-19
title:  "Generate RESTORE DATABASE command from an existing backup"
permalink: ./blog/index.php/2012/05/generate-restore-database-command-from-an-existing-backup/
categories: blog
published: true
tags: [Code Samples, Backup and Recovery, Database Administration, T-SQL Programming, Database Migration, SQL Server, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, Testing, Backup, Restore]
comments: false
---
Restoring databases is quite simple, especially if you’re using the GUI.  Just right-click on the Databases _“folder”_ in SSMS, Choose the _“Restore Database”_ option and the interface will prompt you for the database name, from where you want to restore, and other parameters.  I prefer scripting though.  One reason is that more options are exposed when using scripting.  The RESTORE DATABASE command can be generated by following the steps I just mentioned and clicking the Script button at the top right of the “Restore Database” window.  The only caveat is that the command is output in a single line and is not “that” readable unless you format it.

The method I will be demonstrating generates a RESTORE DATABASE T-SQL command from an existing (valid) backup file.  The full syntax to restore a database can be found in the [RESTORE (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms186858.aspx) article of the SQL Server Books Online.

The first step is to execute the RESTORE FILELISTONLY command to obtain the database file names and file paths from where the database was backed up.  The results are then inserted into a temporary table (#BackupFileList) using the below code snippet:

``` sql
SET @sqlcmd = N'RESTORE FILELISTONLY FROM DISK=''' + @BackupFile +
    ''' WITH FILE=' + CAST(@FileNumber AS nvarchar(5)) + ';';
INSERT INTO #BackupFileList EXEC sp_executesql @sqlcmd;
```

The next step is to generate the actual RESTORE DATABASE command using string concatenation techniques.  The first part is quite easy.  The next part is to generate the _“MOVE [file_name] TO [file_path]“_ part for all the data and log files.  In cases where a database is composed of one data file and one log file this would be quite easy, however we cannot assume that.  My script uses the COALESCE function to concatenate and append the string results into a single string.  I am also using the REVERSE and SUBSTRING functions to replace the original file path with the file paths on the target environment.

Finally I am appending additional RESTORE parameters and outputting the results using the PRINT statement.  [Click here to download script](/assets/article_files/2012/05/generate-restore-database-command-from-an-existing-backup.zip).