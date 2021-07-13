---
layout: post
date:   2021-07-13
title:  "Export Permissions to a Report"
permalink: ./blog/index.php/2021/07/export-permissions-to-a-report/
categories: blog
published: true
tags: [PowerShell, Audit, Security]
comments: true
---
Many times a DBA is asked to provide the list of permissions, for auditing purposes, or simply to review the current permissions.  Sometimes the request is for server-wide permissions, sometimes the scope is limited to a database, sometimes to a Login, or combinations or "all of the above".

Of course we can write our own custom code, as I did with the [Report Server-level and Database-level permissions for a User.](https://github.com/reubensultana/DBAScripts/blob/master/Audit%2BSecurity/Report%20Server-level%20and%20Database-level%20permissions%20for%20a%20User.sql) script.

One alternative is to use the brilliant [dbatools](https://dbatools.io/) and [ImportExcel](https://www.powershellgallery.com/packages/ImportExcel/) PowerShell modules.

The below PowerShell script uses these two modules to retrieve all server and database permissions, then export the results to separate tabs in an Excel file.

Note that [Microsoft Excel](https://www.microsoft.com/excel/) is not required to generate the output, however it (or a compatible application) is required to open the file/s generated.

``` powershell
Import-Module dbatools,ImportExcel

# report output parameters
[string] $ReportFileName = "PermissionsReport"
[string] $ExportFolder = "C:\Users\Public\Documents"
[string] $ExportFileName = "$(Get-Date -Format 'yyyyMMdd_HHmmss')"
[string] $ExportFilePath = "$ExportFolder\$($ReportFileName)_$($ExportFileName).xlsx"

# list of instances to report on
$Instances = @(
    "localhost,14331"
    ,"localhost,14332"
    ,"localhost,14333"
)

Write-Host $("Export started at {0}" -f $(Get-Date -Format "yyyy=MM-dd HH:mm:ss"))
Write-Host "Output file: $ExportFilePath"

# remove any file with the same name
if (Test-Path -Path $ExportFilePath -PathType Leaf) { Remove-Item -Path $ExportFilePath -Force }

# export data
foreach ($Instance in $Instances) {
    Write-Host "Processing $Instance"
    Get-DbaUserPermission -SqlInstance $Instance | Export-Excel -Path $ExportFilePath -AutoSize -FreezeTopRow -BoldTopRow -WorksheetName $($Instance.replace("\", "$"))
}

Write-Host $("Export completed at {0}" -f $(Get-Date -Format "yyyy=MM-dd HH:mm:ss"))
```

The latest version of the above code can be found here: [Export-Permissions-to-a-Report.ps1](https://github.com/reubensultana/DBAScripts/blob/master/Audit+Security/Export-Permissions-to-a-Report.ps1)

More info:

* [Get-DbaUserPermission](https://docs.dbatools.io/#Get-DbaUserPermission)
* [Export-Excel](https://github.com/dfinke/ImportExcel/)
