---
layout: post
date:   2012-10-20
title:  "Data Driven Account Management – part 2"
permalink: ./blog/index.php/2012/10/data-driven-account-management-part-2/
categories: blog
published: true
tags: [Code Samples, Development, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, T-SQL Programming, Architecture, Database Administration, Security]
comments: false
---
Two weeks ago, in the [Data Driven Account Management – part 1](./blog/index.php/2012/10/data-driven-account-management-part-1/ "Data Driven Account Management – part 1") article, I demonstrated how a number of basic account management functions can be implemented for an SQL Server (2005 and later) database without granting elevated priviliges to end users.  The article and attached script showed how logins, users and roles could be created and users added as members of the roles.  The next logical step is to grant object permissions to the roles, permissions which would then be inherited by the database users.

Assuming that data access is made through stored porcedures, the front-end application would first have to obtain a list of the stored procedures in use by the main application.  This list can be obtained from the [INFORMATION_SCHEMA.ROUTINES](http://msdn.microsoft.com/en-us/library/ms188757.aspx "ROUTINES (Transact-SQL)") view, filtering on the ROUTINE\_TYPE column.  Alternatively you could create an intermediary table which lists only the stored procedures (or other objects) for which permissions can be granted.  Such a solution could also contain a “friendly” name for the stored procedure, for example “Create Invoice” instead of “dbo.usp\_createinvoice”.

Similarly to the solution in the first part of the article, the solution is based on a table which will store the permissions granted, INSERT and UPDATE triggers on this table and stored procedures which will handle the actual permission assignment.

The first step is to create a table that will store the list of available “functions” or “friendly names” and which stored procedure each function refers to.  Another table which will store the permissions granted, or the mapping between the Roles and the Functions is the main table in this example.

``` sql
USE MyDatabase
GO

/* Create the data store objects required for this example */
CREATE TABLE FunctionList (
    fnl_pk int IDENTITY(1,1) NOT NULL,
    fnl_friendlyname nvarchar(50) NOT NULL,
    fnl_objectname nvarchar(128) NOT NULL,
    fnl_status bit NOT NULL DEFAULT (1)
);

CREATE TABLE PermissionGranted (
    pmg_pk int IDENTITY(1,1) NOT NULL,
    pmg_fnl_fk int NOT NULL,
    pmg_rol_fk int NOT NULL,
    pmg_status bit NOT NULL DEFAULT (1)
);

/* Primary Key constraints */
ALTER TABLE FunctionList
    ADD CONSTRAINT PK_FunctionList PRIMARY KEY CLUSTERED (fnl_pk ASC)
ALTER TABLE PermissionGranted
    ADD CONSTRAINT PK_PermissionGranted PRIMARY KEY CLUSTERED (pmg_pk ASC)
GO

/* Foreign Key constraints */
ALTER TABLE PermissionGranted WITH CHECK
    ADD CONSTRAINT [FK_PermissionGranted_Function] FOREIGN KEY (pmg_fnl_fk)
    REFERENCES FunctionList (fnl_pk) ON UPDATE NO ACTION ON DELETE NO ACTION
ALTER TABLE RoleMembers WITH CHECK
    ADD CONSTRAINT [FK_PermissionGranted_Role] FOREIGN KEY (pmg_rol_fk)
    REFERENCES Roles (rol_pk) ON UPDATE NO ACTION ON DELETE NO ACTION
GO

/* Unique Key constraints */
ALTER TABLE FunctionList
    ADD CONSTRAINT UNQ_FunctionList_Name UNIQUE (fnl_friendlyname)
ALTER TABLE FunctionList
    ADD CONSTRAINT UNQ_FunctionList_Object UNIQUE (fnl_objectname)
ALTER TABLE PermissionGranted
    ADD CONSTRAINT UNQ_PermissionGranted_Link UNIQUE (pmg_fnl_fk, pmg_rol_fk)
GO
```

Next is creating the stored procedures which will handle the actual GRANT and REVOKE commands.  Similarly to the solution in the first article of this series, two stored procedures and two triggers will be created – the AFTER INSERT trigger will call the stored procedure which will create a new permission, while the AFTER UPDATE will either call the one which either revoke the permission or, if the status column was updated, create a new permission.  This is the same logic implemented in other procedures where a [data] record is not deleted but is updated to a “status” of _zero_ (or inactive).

The AFTER UPDATE trigger is shown below:

``` sql
CREATE TRIGGER [trg_UPD_Permission] ON [dbo].[PermissionGranted]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoleName nvarchar(12),
            @PermissionName nvarchar(50),
            @PermissionStatus bit;
    DECLARE @CursorData CURSOR;

    -- process only those whose status has changed
    IF EXISTS(SELECT 1 FROM inserted i WHERE UPDATE(pmg_status))
    BEGIN
        -- a cursor has to be used to cater for multiple updates in one batch
        SET @CursorData = CURSOR FAST_FORWARD FOR
            SELECT r.rol_name, f.fnl_objectname
            FROM inserted i 
                INNER JOIN FunctionList f ON f.fnl_pk = pmg_fnl_fk
                INNER JOIN Roles r ON r.rol_pk = pmg_rol_fk
            WHERE UPDATE(pmg_status);

        OPEN @CursorData;
        FETCH NEXT FROM @CursorData INTO @RoleName, @PermissionName, @PermissionStatus;
        WHILE (@@FETCH_STATUS=0)
        BEGIN
            IF (@PermissionStatus = 1) -- Create New
                EXEC [dbo].[GrantRolePermission] @RoleName, @PermissionName;

            ELSE IF (@PermissionStatus = 0) -- Delete Existing
                EXEC [dbo].[RevokeRolePermission] @RoleName, @PermissionName;

            FETCH NEXT FROM @CursorData INTO @RoleName, @PermissionName, @PermissionStatus;
        END
        CLOSE @CursorData;
        DEALLOCATE @CursorData;
    END
END
GO
```

The rest of the sample scripts used for this solution can be downloaded using the link below.  Of course feel free to customise this solution according to your requirements.

Download [Data Driven Account Management – part 2.sql](/assets/article_files/2012/10/data-driven-account-management-part-2.zip)
