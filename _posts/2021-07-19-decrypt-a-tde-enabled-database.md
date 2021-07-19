---
layout: post
date:   2021-07-19
title:  "Decrypt a TDE-enabled database"
permalink: ./blog/index.php/2021/07/decrypt-a-tde-enabled-database/
categories: blog
published: true
tags: [Encryption, Security]
comments: true
---
[Transparent Data Encryption (TDE)](https://docs.microsoft.com/en-us/sql/relational-databases/security/encryption/transparent-data-encryption)has many advantages, and satisfies a number of audit, security and compliance requirements.  This article is not about setting up TDE.

What if however, for whatever reason, your organization wants to remove TDE from one or more databases?  This is what this article is about.

### 1. Get the current Database Encryption status

Verify that the databases are TDE enabled: `encryption_state = 3`

``` sql
USE [master]
GO
SELECT 
    DB_NAME([database_id]) AS DatabaseName
    ,[encryption_state] AS EncryptionState
    ,[key_algorithm] AS Algorithm
    ,[key_length] AS KeyLength
FROM sys.dm_database_encryption_keys
WHERE [database_id] = DB_ID('<DATABASE_NAME>');
GO
```

### 2. Turn off TDE

``` sql
USE [master];
GO
ALTER DATABASE <DATABASE_NAME> SET ENCRYPTION OFF;
GO
```

### 3. Check the status of the decryption process

When you `ALTER` your database and set the `ENCRYPTION` to `OFF`, however that is not instantaneous and depends on the size of your database.

Run the following command to check progress:

``` sql
USE [master]
GO
SELECT DB_NAME([database_id]) AS DatabaseName,
    [encryption_state],
    [encryption_state_desc] =
        CASE [encryption_state]
            WHEN '0'  THEN  'No database encryption key present, no encryption'
            WHEN '1'  THEN  'Unencrypted'
            WHEN '2'  THEN  'Encryption in progress'
            WHEN '3'  THEN  'Encrypted'
            WHEN '4'  THEN  'Key change in progress'
            WHEN '5'  THEN  'Decryption in progress'
            WHEN '6'  THEN  'Protection change in progress (The certificate or asymmetric key that is encrypting the database encryption key is being changed.)'
            ELSE 'No Status'
        END,
    [percent_complete],
    [encryptor_thumbprint],
    [encryptor_type]
FROM sys.dm_database_encryption_keys
WHERE [database_id] = DB_ID('<DATABASE_NAME>');
GO
```

If the encryption_state has a value of 5 the database is still being decrypted.  
If the encryption_state has a value of 1 then the database is decrypted,  
If the encryption_state has a value of 0, then the database does not have an encryption key present.

### 4. Remove the Encryption Key

Once decryption is complete remove the Encryption Key from each Database

``` sql
USE [<DATABASE_NAME>];
GO
DROP DATABASE ENCRYPTION KEY;
GO
```

### 5. Clean up

Assuming you are doing this as a proof of concept, remove the decrypted databases once ready.

``` sql
USE [master];
GO
DROP DATABASE [<DATABASE_NAME>];
GO
```
