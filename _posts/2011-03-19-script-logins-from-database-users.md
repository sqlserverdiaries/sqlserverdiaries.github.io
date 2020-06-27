---
layout: post
date:   2011-03-19
title:  "Script Logins from Database Users"
permalink: ./blog/index.php/2011/03/19/script-logins-from-database-users/
published: true
tags: [SQL Server 2008, SQL Server 2000, Database Administration, T-SQL Programming, Security, SQL Server 2005, Security]
comments: false
---
When performing a database migration from one SQL Server instance to another, the DBA has to transfer all logins which have access to the database.  The transfer will only be successful if the logins retain the same passwords to reduce the impact on the end users, and more specifically, the logins have to be created with the same Security IDentifier (SID) as the original one.  The SID is a varbinay value and can be retrieved by querying the _dbo.syslogins_ view in SQL Server 2000, or the _sys.server_principals_ catalog view in SQL Server 2005 and 2008.

Generating a script to recreate all the logins created in an instance or one-by-one is possible by implementing and using the _sp_help_revlogin_ stored procedure as shown in the Microsoft KB articles [246133](http://support.microsoft.com/kb/246133) or [918992](http://support.microsoft.com/kb/918992).  The trouble with these versions is that the logins have to be transferred in bulk or individually.  Transferring only the logins which have access to a specific database can be time-consuming if the database has a large number of users.

Another option is to use the "Transfer Logins Task" component in an SQL Server Integration Services (2005 and later) package as shown in the below screenshot.  Personally, I prefer to generate a script which can be transferred between DBAs, reused during testing, or simply retained for records and auditing purposes.

![SSIS Transfer Logins Task component](/assets/article_files/2011-03-19-script-logins-from-database-users/SSIS_Transfer_Logins_Task.jpg)

Building on the concept of the _sp_help_revlogin_ stored procedure, I created the _sp_migrate_logins_ stored procedure.  Since the source DBMS's being managed are SQL Server 2000, 2007 and 2008 ﻿﻿environments two versions of the stored procedure were created - one for SQL Server 2000 and another for SQL Server 2005 and later.  This object is created in the master database to allow it to be called from any database in the instance and has a number of input parameters as described below.

Parameter | Data Type | Default Value | Description
--------- | --------- | ------------- | -------------
@dbname | sysname | NULL | Database whose logins are to be migrated; if not set the current database will be used
@default_database | sysname | NULL | Which database will be set as default; if not set the login's default will be used
@login_name | sysname | NULL | The (single) login to migrate
@sqlserverversion | tinyint | 80 (or 90) depending on the version | The destination SQL Server version (allowed: 80, 90)
@check_policy | bit | NULL | Parameter used when @sqlserverversion value is 90 or greater
@check_expiration | bit | NULL | Parameter used when @sqlserverversion value is 90 or greater

The first check in the stored procedure is to verify that only members of the _sysadmins_ fixed server role can execute it.  The reason being because since we shall be migrating logins, and although the passwords are stored in a non-reversibile encryption (hashed), access to this information should be limited.  Of course once the script to re-create the logins is extracted this should be protected from falling into the wrong hands!

Back to the stored procedure.  The next few checks verify that the database name is valid, the default database name is valid, that the login is valid, the destination SQL Server version number is one of the allowed ranges, etc.

The main body of the stored procedure then extracts the required information from the _dbo.syslogins_ or the _sys.server_principals_ objects depending on which version is being executed.

The stored procedure also makes use of the _sp_hexadecimal_ stored procedure which is distributed as part of the original Microsoft scripts mentioned earlier.  This stored procedure has been included in the final scripts which are available for download below.

The target was to ease off part of the burden such a mudane task from a DBA's duties.  The complete script for both versions of the stored procedure is shown below:

### sp_migrate_logins - SQL Server 2000 version ###

``` sql
USE [master]
GO

IF OBJECT_ID('dbo.sp_migrate_logins') IS NOT NULL
    DROP PROCEDURE dbo.sp_migrate_logins
GO

CREATE PROCEDURE dbo.sp_migrate_logins
    @dbname SYSNAME = NULL,             -- database whose logins are to be migrated; if not set the current database will be used
    @default_database SYSNAME = NULL,   -- which database will be set as default; if not set the login's default will be used
    @login_name SYSNAME = NULL,         -- the (single) login to migrate
    @sqlserverversion tinyint = 80,     -- the destination SQL Server version (allowed: 80, 90)
    @check_policy bit = NULL,           -- parameter used when @sqlserverversion value is 90 or greater
    @check_expiration bit = NULL        -- parameter used when @sqlserverversion value is 90 or greater
AS
/*
----------------------------------------------------------------------------
-- Object Name:             dbo.sp_migrate_logins
-- Project:                 N/A
-- Business Process:        N/A
-- Purpose:                 Transfer logins which are authorised users in a database.
-- Detailed Description:    Transfer logins which are authorised users in a database between instances of SQL Server 2000 or to 2005.
--                          NOTE: SQL Server 2000 ONLY!
-- Database:                master
-- Dependent Objects:       None
-- Called By:               SysAdmin
--
--------------------------------------------------------------------------------------
-- Rev   | CMR      | Date Modified  | Developer             | Change Summary
--------------------------------------------------------------------------------------
--   1.0 |          | 01/03/2011     | Reuben Sultana        | First implementation
--       |          |                |                       |
--
*/
BEGIN
    SET NOCOUNT ON;
    DECLARE @sqlcmd NVARCHAR(1000);

    SET @sqlcmd ='';
    PRINT '/* ***** Login Migration Script ***** */';

    /* ***** preliminary checks ***** */
    -- verify that a sysadmin is executing this stored procedure
    IF (IS_SRVROLEMEMBER('sysadmin') = 0)
    BEGIN
        RAISERROR('Only members of the ''sysadmin'' fixed server role can execute this stored procedure.', 16, 1);
        RETURN;
    END

    /* ***** check values of input variables ***** */
    -- @dbname
    IF (@dbname IS NULL)
    BEGIN
        SET @dbname = DB_NAME();
        PRINT '-- Setting default database to the current database.';
    END
    --
    IF (@dbname IN ('master', 'model', 'msdb', 'tempdb'))
    BEGIN
        RAISERROR('System databases cannot be migrated. Please select another database.', 16, 1);
        RETURN;
    END
    --
    IF NOT EXISTS(SELECT [name] FROM [master].dbo.sysdatabases WHERE [name]=@dbname)
    BEGIN
        RAISERROR('Database ''%s'' does not exist.', 16, 1, @dbname);
        RETURN;
    END

    PRINT '-- Generated ' + CONVERT(VARCHAR(20), CURRENT_TIMESTAMP, 113) + ' on ' + ISNULL(@@SERVERNAME, CAST(SERVERPROPERTY('ServerName') AS VARCHAR(50))) + ' for database ''' + @dbname + '';
    PRINT '';

    -- @default_database
    IF (@default_database IN ('master', 'model', 'msdb', 'tempdb'))
    BEGIN
        RAISERROR('Cannot set a system database as the default database. Please select another database.', 16, 1);
        RETURN;
    END
    --
    IF (@default_database IS NOT NULL) AND NOT EXISTS(SELECT [name] FROM [master].dbo.sysdatabases WHERE [name]=@default_database)
    BEGIN
        RAISERROR('Database ''%s'' does not exist.', 16, 1, @default_database);
        RETURN;
    END

    -- @login_name
    IF (@login_name IS NULL)
    BEGIN
        PRINT '-- A single login was not defined.  All logins authorised to access database ''' + @dbname + ''' will be extracted.';
    END
    ELSE
    IF NOT EXISTS(SELECT [name] FROM [master].dbo.syslogins WHERE [name]=@login_name)
    BEGIN
        RAISERROR('Login ''%s'' does not exist.', 16, 1, @@login_name);
        RETURN;
    END

    -- @sqlserverversion
    IF (@sqlserverversion NOT IN (80, 90))
    BEGIN
        RAISERROR('The supplied SQL Server version ''%d'' is not valid.', 16, 1, @sqlserverversion);
        RETURN;
    END

    /* ***** the nitty-gritty... ***** */
    CREATE TABLE #LoginList (login_name SYSNAME NOT NULL, login_sid VARBINARY(85));

    DECLARE @name SYSNAME
    DECLARE @xstatus INT
    DECLARE @binpwd VARBINARY(256)
    DECLARE @txtpwd SYSNAME
    DECLARE @tmpstr VARCHAR(256)
    DECLARE @SID_varbinary VARBINARY(85)
    DECLARE @SID_string VARCHAR(256)

    DECLARE @defaultdb SYSNAME;

    DECLARE @curLogins CURSOR;
    DECLARE @outputstring VARCHAR(2000);

    IF (@login_name IS NULL)
        SET @sqlcmd = 'SELECT [name], [sid] FROM ' + QUOTENAME(@dbname, '[') + '.dbo.sysusers WHERE [uid]>2 AND [islogin]=1 ORDER BY [name] ASC;'
    ELSE
        SET @sqlcmd = 'SELECT [name], [sid] FROM ' + QUOTENAME(@dbname, '[') + '.dbo.sysusers WHERE [name]=''' + @login_name + ''';'

    INSERT INTO #LoginList EXEC sp_executesql @sqlcmd;
    IF (@@ROWCOUNT = 0)
    BEGIN
        RAISERROR('No logins authorised to access database ''%s'' were found.', 16, 1, @dbname);
        RETURN;
    END

    PRINT 'USE [master]';
    PRINT 'GO';

    IF (@sqlserverversion = 80)
    BEGIN
        PRINT '';
        PRINT 'DECLARE @pwd sysname;';
        PRINT '';
    END

    SET @curLogins = CURSOR FOR
        SELECT l.[sid], l.[name], l.[xstatus], l.[password], ISNULL(DB_NAME(l.[dbid]), 'master')
        FROM [master]..sysxlogins l
            INNER JOIN #LoginList u ON l.[sid] = u.[login_sid]
        WHERE l.[srvid] IS NULL;  -- copied from 'syslogins' view to remove extra login names (?)

    OPEN @curLogins;
    FETCH NEXT FROM @curLogins INTO @SID_varbinary, @name, @xstatus, @binpwd, @defaultdb;
    WHILE (@@FETCH_STATUS = 0)
    BEGIN
        SET @outputstring = '';

        IF (@sqlserverversion = 80)  -- SQL Server 2000
        BEGIN
            SET @outputstring = 'IF NOT EXISTS(SELECT [name] FROM [master].dbo.syslogins WHERE [name]=''' + @name + ''')' + CHAR(13);
            SET @outputstring = @outputstring + 'BEGIN' + CHAR(13);

            IF ((@xstatus &amp; 4) = 4) -- Windows Authenticated account/group
            BEGIN
                IF ((@xstatus &amp; 1) = 1) -- NT login is denied access
                    SET @outputstring = @outputstring + '   EXEC [master].dbo.sp_denylogin @loginame=''' + @name + '''' + CHAR(13);
                ELSE -- NT login has access
                    SET @outputstring = @outputstring + '   EXEC [master].dbo.sp_grantlogin @loginame=''' + @name + '''' + CHAR(13);
            END
            ELSE
            BEGIN -- SQL Server authentication
                EXEC [master].dbo.sp_hexadecimal @SID_varbinary, @SID_string OUT;

                -- retrieve password and sid
                IF (@binpwd IS NOT NULL)
                BEGIN -- Non-null password
                    EXEC [master].dbo.sp_hexadecimal @binpwd, @txtpwd OUT;

                    IF ((@xstatus &amp; 2048) = 2048)
                        SET @outputstring = @outputstring + '   SET @pwd = CONVERT(varchar(256), ' + @txtpwd + ');' + CHAR(13);
                    ELSE
                        SET @outputstring = @outputstring + '   SET @pwd = CONVERT(varbinary(256), ' + @txtpwd + ');' + CHAR(13);
                END
                ELSE
                    -- Null password
                    SET @outputstring = @outputstring + '   SET @pwd = NULL;' + CHAR(13);

                SET @outputstring = @outputstring + '   EXEC [master].dbo.sp_addlogin ''' + @name + ''', @pwd, @sid=' + @SID_string + ', @encryptopt=';

                IF ((@xstatus &amp; 2048) = 2048)
                    -- login upgraded from 6.5
                    SET @outputstring = @outputstring + '''skip_encryption_old'';' + CHAR(13);
                ELSE
                    SET @outputstring = @outputstring + '''skip_encryption'';' + CHAR(13);
            END

            SET @outputstring = @outputstring + 'END' + CHAR(13);

            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_defaultdb @loginame=' + QUOTENAME(@name, '[') + ', @defdb=' + QUOTENAME(ISNULL(@default_database, @defaultdb), '[')  + ';' + CHAR(13);
            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_defaultlanguage @loginame=' + QUOTENAME(@name, '[') + ', @language=''' + CAST(@@LANGUAGE AS VARCHAR(50)) + ''';' + CHAR(13);
        END

        ELSE IF (@sqlserverversion = 90)  -- SQL Server 2005
        BEGIN
            SET @outputstring = 'IF NOT EXISTS(SELECT [name] FROM sys.server_principals WHERE [name]=''' + @name + ''')' + CHAR(13);

            IF ((@xstatus &amp; 4) = 4) -- Windows Authenticated account/group
            BEGIN
                SET @outputstring = @outputstring + '   CREATE LOGIN ' + QUOTENAME(@name) + ' FROM WINDOWS WITH DEFAULT_DATABASE=' + QUOTENAME(ISNULL(@default_database, @defaultdb), '[');
                SET @outputstring = @outputstring + ', DEFAULT_LANGUAGE=[' + CAST(@@LANGUAGE AS VARCHAR(50)) + ']';
            END
            ELSE
            BEGIN -- SQL Server authentication
                -- retrieve password and sid
                EXEC [master].dbo.sp_hexadecimal @SID_varbinary, @SID_string OUT;
                IF (@binpwd IS NOT NULL)
                BEGIN -- Non-null password
                    EXEC [master].dbo.sp_hexadecimal @binpwd, @txtpwd OUT;
                    SET @outputstring = @outputstring + '   CREATE LOGIN ' + QUOTENAME(@name) + ' WITH PASSWORD= ' + @txtpwd + ' HASHED, SID=' + @SID_string + ', DEFAULT_DATABASE=' + QUOTENAME(ISNULL(@default_database, @defaultdb), '[');
                    SET @outputstring = @outputstring + ', DEFAULT_LANGUAGE=[' + CAST(@@LANGUAGE AS VARCHAR(50)) + ']';
                END
                ELSE -- Null password
                BEGIN
                    SET @outputstring = @outputstring + '   CREATE LOGIN ' + QUOTENAME(@name) + ' WITH PASSWORD=NULL, SID=' + @SID_string + ', DEFAULT_DATABASE=' + QUOTENAME(ISNULL(@default_database, @defaultdb), '[');
                    SET @outputstring = @outputstring + ', DEFAULT_LANGUAGE=[' + CAST(@@LANGUAGE AS VARCHAR(50)) + ']';
                END

                -- set password policy state
                SET @outputstring = @outputstring + ', CHECK_POLICY=' + (CASE @check_policy WHEN 1 THEN 'ON' WHEN 0 THEN 'OFF' ELSE 'OFF' END);
                SET @outputstring = @outputstring + ', CHECK_EXPIRATION=' + (CASE @check_expiration WHEN 1 THEN 'ON' WHEN 0 THEN 'OFF' ELSE 'OFF' END) + CHAR(13);
            END

        END

        -- check and set membership in server roles
        IF (@xstatus &amp;16 = 16) -- sysadmin
            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_addsrvrolemember @loginame=' + QUOTENAME(@name) + ', @rolename=[sysadmin]' + CHAR(13);

        IF (@xstatus &amp;32 = 32) -- securityadmin
            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_addsrvrolemember @loginame=' + QUOTENAME(@name) + ', @rolename=[securityadmin]' + CHAR(13);

        IF @xstatus &amp;64 = 64 -- serveradmin
            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_addsrvrolemember @loginame=' + QUOTENAME(@name) + ', @rolename=[serveradmin]' + CHAR(13);

        IF @xstatus &amp;128 = 128 -- setupadmin
            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_addsrvrolemember @loginame=' + QUOTENAME(@name) + ', @rolename=[setupadmin]' + CHAR(13);

        IF @xstatus &amp;256 = 256 --processadmin
            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_addsrvrolemember @loginame=' + QUOTENAME(@name) + ', @rolename=[processadmin]' + CHAR(13);

        IF @xstatus &amp;512 = 512 -- diskadmin
            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_addsrvrolemember @loginame=' + QUOTENAME(@name) + ', @rolename=[diskadmin]' + CHAR(13);

        IF @xstatus &amp;1024 = 1024 -- dbcreator
            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_addsrvrolemember @loginame=' + QUOTENAME(@name) + ', @rolename=[dbcreator]' + CHAR(13);

        IF @xstatus &amp;4096 = 4096 -- bulkadmin
            SET @outputstring = @outputstring + 'EXEC [master].dbo.sp_addsrvrolemember @loginame=' + QUOTENAME(@name) + ', @rolename=[bulkadmin]' + CHAR(13);

        PRINT @outputstring;

        FETCH NEXT FROM @curLogins INTO @SID_varbinary, @name, @xstatus, @binpwd, @defaultdb;
    END
    CLOSE @curLogins;
    DEALLOCATE @curLogins;

    PRINT 'GO';
    PRINT '';
    PRINT '/* ***** WARNING: Check logins for NULL password! ***** */';

    /* ***** clean up ***** */
    DROP TABLE #LoginList;
END
GO
```

### sp_migrate_logins - SQL Server 2005 version ###

``` sql
USE [master]
GO

IF OBJECT_ID('dbo.sp_migrate_logins') IS NOT NULL
    DROP PROCEDURE dbo.sp_migrate_logins
GO

CREATE PROCEDURE dbo.sp_migrate_logins
    @dbname SYSNAME = NULL,             -- database whose logins are to be migrated; if not set the current database will be used
    @default_database SYSNAME = NULL,   -- which database will be set as default; if not set the login's default will be used
    @login_name SYSNAME = NULL,         -- the (single) login to migrate
    @sqlserverversion tinyint = 90,     -- the destination SQL Server version (allowed: 90)
    @check_policy bit = NULL,           -- whether to override and enforce the CHECK_POLICY property
    @check_expiration bit = NULL        -- whether to override and enforce the CHECK_EXPIRATION property
AS
/*
----------------------------------------------------------------------------
-- Object Name:             dbo.sp_migrate_logins
-- Project:                 N/A
-- Business Process:        N/A
-- Purpose:                 Transfer logins which are authorised users in a database.
-- Detailed Description:    Transfer logins which are authorised users in a database between instances of SQL Server 2005.
--                          NOTE: SQL Server 2005 ONLY!
-- Database:                master
-- Dependent Objects:       None
-- Called By:               SysAdmin
--
--------------------------------------------------------------------------------------
-- Rev   | CMR      | Date Modified  | Developer             | Change Summary
--------------------------------------------------------------------------------------
--   1.0 |          | 01/03/2011     | Reuben Sultana        | First implementation
--       |          |                |                       |
--
*/
BEGIN
    SET NOCOUNT ON;
    DECLARE @sqlcmd NVARCHAR(1000);

    SET @sqlcmd ='';
    PRINT '/* ***** Login Migration Script ***** */';

    /* ***** preliminary checks ***** */
    -- verify that a sysadmin is executing this stored procedure
    IF (IS_SRVROLEMEMBER('sysadmin') = 0)
    BEGIN
        RAISERROR('Only members of the ''sysadmin'' fixed server role can execute this stored procedure.', 16, 1);
        RETURN;
    END

    /* ***** check values of input variables ***** */
    -- @dbname
    IF (@dbname IS NULL)
    BEGIN
        SET @dbname = DB_NAME();
        PRINT '-- Setting default database to the current database.';
    END
    --
    IF (@dbname IN ('master', 'model', 'msdb', 'tempdb'))
    BEGIN
        RAISERROR('System databases cannot be migrated. Please select another database.', 16, 1);
        RETURN;
    END
    --
    IF NOT EXISTS(SELECT [name] FROM sys.databases WHERE [name]=@dbname)
    BEGIN
        RAISERROR('Database ''%s'' does not exist.', 16, 1, @dbname);
        RETURN;
    END

    PRINT '-- Generated ' + CONVERT(VARCHAR(20), CURRENT_TIMESTAMP, 113) + ' on ' + ISNULL(@@SERVERNAME, CAST(SERVERPROPERTY('ServerName') AS VARCHAR(50))) + ' for database ''' + @dbname + '';
    PRINT '';

    -- @default_database
    IF (@default_database IN ('master', 'model', 'msdb', 'tempdb'))
    BEGIN
        RAISERROR('Cannot set a system database as the default database. Please select another database.', 16, 1);
        RETURN;
    END
    --
    IF (@default_database IS NOT NULL) AND NOT EXISTS(SELECT [name] FROM sys.databases WHERE [name]=@default_database)
    BEGIN
        RAISERROR('Database ''%s'' does not exist.', 16, 1, @default_database);
        RETURN;
    END

    -- @login_name
    IF (@login_name IS NULL)
    BEGIN
        PRINT '-- A single login was not defined.  All logins authorised to access database ''' + @dbname + ''' will be extracted.';
    END
    ELSE
    IF NOT EXISTS(SELECT [name] FROM sys.server_principals WHERE [name]=@login_name AND [type] IN ('G', 'S', 'U') AND principal_id>100)
    BEGIN
        RAISERROR('Login ''%s'' does not exist.',, 16, 1, @login_name);
        RETURN;
    END

    -- @sqlserverversion
    IF (@sqlserverversion NOT IN (90))
    BEGIN
        RAISERROR('The supplied SQL Server version ''%d'' is not valid.', 16, 1, @sqlserverversion);
        RETURN;
    END

    /* ***** the nitty-gritty... ***** */
    CREATE TABLE #LoginList (login_name SYSNAME NOT NULL, login_sid VARBINARY(85));

    DECLARE @name SYSNAME;
    DECLARE @type VARCHAR(1);
    DECLARE @hasaccess INT;
    DECLARE @denylogin INT;
    DECLARE @is_disabled INT;
    DECLARE @PWD_varbinary VARBINARY(256);
    DECLARE @PWD_string VARCHAR(514);
    DECLARE @SID_varbinary VARBINARY(85);
    DECLARE @SID_string VARCHAR(514);
    DECLARE @tmpstr VARCHAR(1024);
    DECLARE @is_policy_checked VARCHAR(3);
    DECLARE @is_expiration_checked VARCHAR(3);

    DECLARE @defaultdb SYSNAME;

    DECLARE @curLogins CURSOR;
    DECLARE @outputstring VARCHAR(2000);

    IF (@login_name IS NULL)
        SET @sqlcmd = 'SELECT [name], [sid] FROM ' + QUOTENAME(@dbname, '[') + '.sys.sysusers WHERE [uid]>4 AND [islogin]=1 ORDER BY [name] ASC;'
    ELSE
        SET @sqlcmd = 'SELECT [name], [sid] FROM ' + QUOTENAME(@dbname, '[') + '.sys.sysusers WHERE [name]=''' + @login_name + ''';'

    INSERT INTO #LoginList EXEC sp_executesql @sqlcmd;
    IF (@@ROWCOUNT = 0)
    BEGIN
        RAISERROR('No logins authorised to access database ''%s'' were found.', 16, 1, @dbname);
        RETURN;
    END

    PRINT 'USE [master]';
    PRINT 'GO';

    SET @curLogins = CURSOR FOR
        SELECT p.[sid], p.[name], p.[type], p.[is_disabled], ISNULL(p.[default_database_name], 'master'), l.[hasaccess], l.[denylogin]
        FROM sys.server_principals p
            INNER JOIN #LoginList u ON p.[sid] = u.[login_sid]
            LEFT JOIN sys.syslogins l ON l.[name] = p.[name]
        WHERE p.[type] IN ('G', 'S', 'U') AND p.[principal_id]>100;

    OPEN @curLogins;
    FETCH NEXT FROM @curLogins INTO @SID_varbinary, @name, @type, @is_disabled, @defaultdb, @hasaccess, @denylogin;
    WHILE (@@FETCH_STATUS = 0)
    BEGIN
        SET @outputstring = '';
        SET @outputstring = 'IF NOT EXISTS(SELECT [name] FROM sys.server_principals WHERE [name]=''' + @name + ''')' + CHAR(13);

        IF (@type IN ('G', 'U'))
        BEGIN -- Windows Authenticated account/group
            SET @outputstring = @outputstring + '   CREATE LOGIN ' + QUOTENAME(@name) + ' FROM WINDOWS WITH DEFAULT_DATABASE=[' + ISNULL(@default_database, @defaultdb) + ']';
            SET @outputstring = @outputstring + ', DEFAULT_LANGUAGE=[' + CAST(@@LANGUAGE AS VARCHAR(50)) + '];';
        END
        ELSE
        BEGIN -- SQL Server authentication
            -- retrieve password and sid
            SET @PWD_varbinary = CAST(LOGINPROPERTY(@name, 'PasswordHash') AS VARBINARY(256))
            EXEC sp_hexadecimal @PWD_varbinary, @PWD_string OUT
            EXEC sp_hexadecimal @SID_varbinary, @SID_string OUT

            SET @outputstring = @outputstring + '   CREATE LOGIN ' + QUOTENAME(@name) + ' WITH PASSWORD= ' + @PWD_string + ' HASHED, SID=' + @SID_string + ', DEFAULT_DATABASE=[' + ISNULL(@default_database, @defaultdb) + ']';
            SET @outputstring = @outputstring + ', DEFAULT_LANGUAGE=[' + CAST(@@LANGUAGE AS VARCHAR(50)) + ']';

            -- retrieve password policy state
            SELECT
                @is_policy_checked = CASE ISNULL(@check_policy, [is_policy_checked]) WHEN 1 THEN 'ON' WHEN 0 THEN 'OFF' ELSE NULL END,
                @is_expiration_checked = CASE ISNULL(@check_expiration, [is_expiration_checked]) WHEN 1 THEN 'ON' WHEN 0 THEN 'OFF' ELSE NULL END
            FROM sys.sql_logins WHERE [name] = @name

            IF (@is_policy_checked IS NOT NULL)
                SET @outputstring = @outputstring + ', CHECK_POLICY=' + @is_policy_checked;

            IF (@is_expiration_checked IS NOT NULL)
                SET @outputstring = @outputstring + ', CHECK_EXPIRATION=' + @is_expiration_checked + ';' + CHAR(13);
        END

        IF (@denylogin = 1) -- login is denied access
            SET @outputstring = @outputstring + 'DENY CONNECT SQL TO ' + QUOTENAME(@name, '[') + ';' + CHAR(13);
        ELSE IF (@hasaccess = 0) -- login exists but does not have access
            SET @outputstring = @outputstring + 'REVOKE CONNECT SQL TO ' + QUOTENAME(@name, '[') + ';' + CHAR(13);

        IF (@is_disabled = 1) -- login is disabled
            SET @outputstring = @outputstring + 'ALTER LOGIN ' + QUOTENAME(@name, '[') + ' DISABLE;' + CHAR(13);

        PRINT @outputstring;

        FETCH NEXT FROM @curLogins INTO @SID_varbinary, @name, @type, @is_disabled, @defaultdb, @hasaccess, @denylogin;
    END
    CLOSE @curLogins;
    DEALLOCATE @curLogins;

    PRINT 'GO';
    PRINT '';
    PRINT '/* ***** WARNING: Check logins for NULL password! ***** */';

    /* ***** clean up ***** */
    DROP TABLE #LoginList;
END
GO
```

If you have any comments or suggestions to improve these stored procedures please let me know by filling in the form in the Contact page.

Thank you.
