---
layout: post
date:   2011-04-16
title:  "Use the Forfiles Utility to Delete Old Database Backup Files"
permalink: ./blog/index.php/2011/04/16/use-the-forfiles-utility-to-delete-old-database-backup-files/
published: true
tags:
    - forfiles
    - Database Administration
    - Windows
    - Backup and Recovery
comments: false
---
I came across a tool that some might find useful.  The [Forfiles on Microsoft Technet](http://technet.microsoft.com/en-us/library/cc753551%28WS.10%29.aspx) utility (forfiles.exe) is preinstalled with Windows Server 2003 and later.  Forfiles enables batch processing of files.  One use of this utility would be to delete old backup files to remove dependencies on items such as VBScript objects.  For example, the following command uses Forfiles to delete all .bak files that are two days old or older in the E:\MyBackup folder:

``` text
forfiles /p "E:\MyBackup" /m "*.bak" /c "cmd /c del /Q @path" /d -2
```

Note that you would enter this command all on one line at the command prompt. For more information about this utility, see [Forfiles on Microsoft Technet](http://technet.microsoft.com/en-us/library/cc753551%28WS.10%29.aspx).

Unfortunately the Forfiles utility is not part of Windows XP however you can copy the executable to the Windows System32 folder to obtain the same functionality.
