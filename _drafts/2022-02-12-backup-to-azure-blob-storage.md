---
layout: post
date:   2022-02-12
title:  "Backup to Azure Blob Storage"
permalink: ./blog/index.php/2022/02/backup-to-azure-blob-storage/
categories: blog
published: true
tags: [Database Administration, Ola Hallengren, Backup, Azure Blob Storage]
comments: true
---
Backing up SQL Server databases in Azure IaaS environments can quickly become difficult to manage, costly, or "all of the above". One of the solutions available in the Azure platform is Blob Storage, which is relatively cheaper when compared to having a disk (even the slower storage) attached to your Virtual Machine. This document will show the necessary steps to set up this process.

An assumption that is being made is that your backup strategy is in place and uses the [SQL Server Maintenance Solution](SQL Server Maintenance Solution) and has been deployed successfully.

## Create Blob Storage Account

The below storage account which allows for the storage of Blobs (only) has been created to document the process and to allow the grabbing of screenshots.

## Create Container

Next, a Blob Container is created using a server name as the Container name - the server name in question is the one being used for this demo, however in practice it could be replaced by other identifiers to assist in locating backups easily.

## Obtain Container URL

Open the Container Properties and copy the URL shown in the below screenshot and store it temporarily in a Plain Text file:

## Obtain Access Keys

Open the Access Keys menu and copy the values to the same temporary Plain Text file.

## Create Credential

Open SSMS and connect to your server, then create the Credential using the below TSQL script as a baseline. Note that that Credential Identity must match the Storage Account name, and the Secret must match the Key (copied earlier).
You will observe that the script is deleting the Credential if it exists, then creating it.

``` sql
-- Create Credential
IF EXISTS (SELECT * FROM sys.credentials WHERE name = 'dublinstoragesql') 
BEGIN
    DROP CREDENTIAL [dublinstoragesql] 
END;

CREATE CREDENTIAL [dublinstoragesql] 
WITH 
    IDENTITY= 'dublinstoragesql', 
    SECRET = '5HGd9Abnrms5bUfSQT03GkKMLfs7wlbVK0mmI4GTEZz1qf4sEI/12eWANZUpeZKusiw9hTdDlFr3sRc5T3Yz8A==';
GO
```

## Test Backup to URL

We're now going to perform a database backup to verify that the solution we've just put in place is working correctly. The following TSQL will back up the DBAToolbox database to the URL copied earlier, creating a file name as specified in the code.

``` sql
-- Backup to URL
BACKUP DATABASE [DBAToolbox]  
TO URL = 'https://dublinstoragesql.blob.core.windows.net/dub-dev-sql01/DBAToolbox.bak'   
WITH CREDENTIAL = 'dublinstoragesql'   
    ,COMPRESSION  
    ,STATS = 10;  
GO
```

If the configuration is correct the following will be observed:

## Verify Backup File in Azure Blob Storage

As a final step we want to verify that the backup file does actually exist in the Azure Blob Storage Container. Two methods that can be used are:

Connect using SSMS; and

The Account Key should be the same one we copied earlier.

View through the Azure Portal.

Other methods include using Azure PowerShell or the free Azure Storage Explorer.

## Configure SQL Server Maintenance Solution jobs for Azure Blob Storage

The default SQL Server Maintenance Solution jobs will back up to a local disk or UNC path. Extensive documentation on parameters can be found at [SQL Server Backup](SQL Server Backup) however the following screenshots will give an indication of how minor the change/s would be:

Note that the solution will create a folder structure similar to the one used for the TO DISK option, while the actual backup file names will contain the Server Name, Database Name, Backup Type, and the Date and Time the backup was taken.

## Database Restore

The database can then be restored from Azure Blob Storage using FROM URL as part of the RESTORE DATABASE command. For more details please refer to [Restoring From Backups Stored in Microsoft Azure](Restoring From Backups Stored in Microsoft Azure) for more information.

## Clean-up a.k.a Deleting Old Files

The SQL Server Maintenance Solution does not delete files - in fact the presence of the @Cleanuptime variable in the command when performing a backup to a URL will cause the process to fail (see Troubleshooting section below).
One possible solution to delete files older than a specific date would be to use a PowerShell script running as a separate job. This can be an SQL Agent job or Job Step, or a Window Task. The following sample PowerShell code can be used as a baseline to delete BAK files older than 30 days:

``` powershell
Import-Module AzureRM
#Script to delete backup files
$StorageAccountName = "dublinstoragesql"
$StorageAccountKey = "5HGd9Abnrms5bUfSQT03GkKMLfs7wlbVK0mmI4GTEZz1qf4sEI/12eWANZUpeZKusiw9hTdDlFr3sRc5T3Yz8A=="
$StorageContainer = "dub-dev-sql01"
$FileExtension = "*.bak"
$DaysToKeep = "30"
$Context = New-AzureStorageContext -StorageAccountName $StorageAccountName -StorageAccountKey $StorageAccountKey
$FileList = Get-AzureStorageBlob -Container $StorageContainer -Context $Context 
foreach ($File in $FileList | Where-Object {$_.LastModified.DateTime -lt ((Get-Date).AddDays(-$DaysToKeep)) -and $_.Name -like $FileExtension}) {
    $RemoveFile = $File.Name
    if ($RemoveFile -ne $null) {
        Write-Host "Removing file $RemoveFile"
        Remove-AzureStorageBlob -Blob $RemoveFile -Container $StorageContainer -Context $Context
    }
}
```

---

## Troubleshooting

1. One error that was encountered when backing up to Azure Blob Storage was the following:

``` text
Msg 3271, Level 16, State 1, Line 3
A nonrecoverable I/O error occurred on file "https://dublinstoragesql.blob.core.windows.net/dub-dev-sql01/DBAToolbox.bak:"
Backup to URL received an exception from the remote endpoint.
Exception Message: The remote server returned an error: (400) Bad Request.
Msg 3013, Level 16, State 1, Line 3
BACKUP DATABSE is terminating abnormally.
```

This is a strange one and the cause is the "Account kind" selected when creating the Azure Storage Account. The above error manifests when the Blob Storage option is selected, rather than the default General Purpose (see below).

2. Another error related to authentication is the following:

``` text
Msg 3298, Level 16, State 2, Line 3
Backup/Restore to URL device error: Error while decoding the storage key.
Msg 3013, Level 16, State 1, Line 3
BACKUP DATABASE is terminating abnormally.
```

The above was due to an incorrect Secret stored for the Credential. Two possible causes could be:

* Operator typo; or

* Azure Storage Keys were changed / refreshed.

In this case the only thing to do would be to obtain the current (correct) key from Azure and apply it to the Credential.

3. One error that might be encountered for the SQL Server Maintenance Solution is this:

``` text
Msg 50000, Level 16, State 1, Procedure DatabaseBackup, Line 954 [Batch Start Line 0]
The value for the parameter @CleanupTime is not supported. Cleanup is not supported on Azure Blob Storage.
Msg 50000, Level 16, State 1, Procedure DatabaseBackup, Line 1385 [Batch Start Line 0]
The documentation is available at https://ola.hallengren.com/sql-server-backup.html.
```

The error is quite self-explanatory. Removing the `@Cleanuptime` parameter from the jobs backing up to URL will fix the issue.

---

## References

1. Create a storage account
   https://docs.microsoft.com/en-gb/azure/storage/common/storage-quickstart-create-account

2. SQL Server Backup To URL
   https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/sql-server-backup-to-url

3. Restoring From Backups Stored in Microsoft Azure
   https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/restoring-from-backups-stored-in-microsoft-azure

4. SQL Server Backup
   https://ola.hallengren.com/sql-server-backup.html
