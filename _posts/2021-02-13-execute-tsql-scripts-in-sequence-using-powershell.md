---
layout: post
date:   2021-02-13
title:  "Execute TSQL scripts in sequence using PowerShell"
permalink: ./blog/index.php/2021/02/execute-tsql-scripts-in-sequence-using-powershell/
categories: blog
published: true
tags: [PowerShell, SQLCMD, command-line utilities, SQL Tools]
comments: true
---

When being asked to deploy changes to a database, sometimes the TSQL files are not provided to us (DBAs) using a "user-friendly" naming convention. Countless times I have been provided with script files similar to the below:

> function_called_from_sp.sql  
> function_used_as_default_value.sql  
> index_for_new_table.sql  
> last_script.sql  
> run_this_first.sql  
> stored_proc_2.sql  
> stored_procedure_1.sql  
> table_structure.sql  

&nbsp;

Of course, that is how they'd be sorted in your [insert favourite file browser here], because they are treated as "string" values. So unless we have been provided with documentation, it is up to us to figure out the meaning or context of the file names.

The file execution order is usually given to us as part of the [Change Management](https://en.wikipedia.org/wiki/Change_management_(ITSM)) documentation (if we're lucky) so the effort is minimised. It wouldn't be too much of a problem with a small number of files.

Sometimes however, the deployment scripts are provided as a compressed file, which when expanded transforms into a "beautiful" folder structure with tens of files (or more) - this did happen to me.

That is when I first started sending the request back, asking the originator to give the files appropriate names showing the execution order. After being faced with the scenario more often than not, I decided to make my life easier.

### Version 0

The first version was based on a batch file (.bat or .cmd), running the [SQLCMD utility](https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility), and defining the instance name, TSQL file name, and other parameters.  This solution simply worked, and saved me loads of time.

Then I discovered [PowerShell](https://docs.microsoft.com/en-us/powershell/scripting/).

### Version 1

The next version, and the first one written using PowerShell was split into two parts. In the first the code reads a text file and stores the contents in a [System.Collections.ArrayList](https://docs.microsoft.com/en-us/dotnet/api/system.collections.arraylist), then verifies that the file exists and that has a ".sql" extension. If verification passes, the valid file is copied to a second *System.Collections.ArrayList*.

The second part of the script dealt with the array of valid files, where these are executed in the order provided in the original text file (the array is populated in the same order). Each script was executed against the indicated SQL Server instance using the [Invoke-Sqlcmd](https://docs.microsoft.com/en-us/powershell/module/sqlserver/invoke-sqlcmd) cmdlet, and the output was written out to the console.

### Version 2

The previous version took a simplistic approach to the problem. The subsequent iteration of this code added:

* logging - writing the output to console as well as a text file;
* better error handling;
* running the same set of TSQL files against a set of servers and/or databases.

### Version 3

All versions so far did the job, got the scripts executed, and the last one produced output which couldbe used to review errors (if any).

The latest version introduced breaking changes when compared to the previous one. The changes include:

* different parameter names - there are actually less;
* limited [Authentication to Windows/Domain](https://docs.microsoft.com/en-us/sql/relational-databases/security/choose-an-authentication-mode) - I might consider adding SQL Authentication at a later stage;
* removed functionality which executed TSQL scripts against multiple databases. This scenario would only be applicable to specific circumstances and adds unnecessary complexity to the solution.

This might seem like a problem in some scenarios, however this version is better. And faster.

The code has been overhauled to include the following:

* even better logging;
* verify that network access to the target SQL Server on the specified Port is present;
* and last but not least, use [Runspaces](https://docs.microsoft.com/en-us/dotnet/api/system.management.automation.runspaces.runspace/).

### Future Version/s

I am toying with a couple of ideas for the next version/s, such as removing the dependency on text files for the Server and Script names, configurable log location (possibly logging to a database), etc., but more on that later.

&nbsp;

If you have any suggestions feel free to contact me, or just fork the repo and contribute.

The final version of the script can be found in the GitHub Repository at [Scripts-Deployment](https://github.com/reubensultana/Scripts-Deployment)
