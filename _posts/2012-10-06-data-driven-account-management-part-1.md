---
layout: post
date:   2012-10-06
title:  "Data Driven Account Management - part 1"
permalink: ./blog/index.php/2012/10/data-driven-account-management-part-1/
categories: blog
published: true
tags: [Architecture, Database Administration, Security, T-SQL Programming, Code Samples, Development, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012]
comments: false
---
In previous posts I mention that Windows Authentication should be used and account management functions should be delegated to the domain (e.g. Active Directory). This however is not possible in all cases. Sometimes, due to specific application requirements, SQL Authentication has to be used. Account names (logins/users) should preferably follow a standard naming convention however this is not absolutely necessary. The maximum length allowed for a login/user name is 128 characters of Unicode text.

Logins can be created by members of the syadmin and securityadmin fixed server roles, however membership in these roles should be limited to a few individuals to avoid granting more privileges than necessary to perform the assigned functions. Managing SQL logins and users will be an added burden on the DBAs especially if new accounts or permissions changes occur regularly. One solution is to grant membership in one of the syadmin and securityadmin fixed server roles but this is not recommended. Another solution is to create functionality with which the functions can be limited and delegated. This can be achieved using a set of stored procedures using the EXECUTE AS clause.

The first this is to design the storage. First I will create a number of base tables to store the Users, Roles and Object permissions as shown below. The tables are simplified for this example.

``` sql
CREATE DATABASE MyDatabase;
GO

EXEC MyDatabase..sp_changedbowner 'sa';
GO

USE MyDatabase
GO

CREATE TABLE Users (
    usr_pk int IDENTITY(1,1) NOT NULL,
    usr_name nvarchar(12) NOT NULL,
    usr_status bit NOT NULL DEFAULT (1)
);

CREATE TABLE Roles (
    rol_pk int IDENTITY(1,1) NOT NULL,
    rol_name nvarchar(12) NOT NULL,
    rol_status bit NOT NULL DEFAULT (1)
);

CREATE TABLE RoleMembers (
    mem_pk int IDENTITY(1,1) NOT NULL,
    mem_usr_fk int NOT NULL,
    mem_rol_fk int NOT NULL,
    mem_status bit NOT NULL DEFAULT (1)
);

ALTER TABLE Users ADD CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (usr_pk ASC)
ALTER TABLE Roles ADD CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (rol_pk ASC)
ALTER TABLE RoleMembers ADD CONSTRAINT PK_RoleMembers PRIMARY KEY CLUSTERED (mem_pk ASC)
GO

ALTER TABLE RoleMembers WITH CHECK
    ADD CONSTRAINT [FK_RoleMembers_User] FOREIGN KEY (mem_usr_fk)
    REFERENCES Users (usr_pk) ON UPDATE NO ACTION ON DELETE NO ACTION
ALTER TABLE RoleMembers WITH CHECK
    ADD CONSTRAINT [FK_RoleMembers_Role] FOREIGN KEY (mem_rol_fk)
    REFERENCES Roles (rol_pk) ON UPDATE NO ACTION ON DELETE NO ACTION
GO
```

The next logical step is to insert some sample data which will reflect the users, roles and role membership using the script shown below. But first we need to implement functionality which will create the logins, users and roles as mentioned earlier. DO NOT EXECUTE THE BELOW!

``` sql
SET IDENTITY_INSERT Users ON;
INSERT INTO Users (usr_pk, usr_name, usr_status) VALUES (1, 'User001', 1);
INSERT INTO Users (usr_pk, usr_name, usr_status) VALUES (2, 'User002', 1);
INSERT INTO Users (usr_pk, usr_name, usr_status) VALUES (3, 'User003', 1);
INSERT INTO Users (usr_pk, usr_name, usr_status) VALUES (4, 'User004', 1);
SET IDENTITY_INSERT Users OFF;
GO

SET IDENTITY_INSERT Roles ON;
INSERT INTO Roles (rol_pk, rol_name, rol_status) VALUES (1, 'Role001', 1);
INSERT INTO Roles (rol_pk, rol_name, rol_status) VALUES (2, 'Role002', 1);
SET IDENTITY_INSERT Roles OFF;
GO

SET IDENTITY_INSERT RoleMembers ON;
INSERT INTO RoleMembers (mem_pk, mem_usr_fk, mem_rol_fk, mem_status) VALUES (1, 1, 1, 1);
INSERT INTO RoleMembers (mem_pk, mem_usr_fk, mem_rol_fk, mem_status) VALUES (2, 2, 1, 1);
INSERT INTO RoleMembers (mem_pk, mem_usr_fk, mem_rol_fk, mem_status) VALUES (3, 3, 2, 1);
INSERT INTO RoleMembers (mem_pk, mem_usr_fk, mem_rol_fk, mem_status) VALUES (4, 4, 2, 1);
INSERT INTO RoleMembers (mem_pk, mem_usr_fk, mem_rol_fk, mem_status) VALUES (5, 2, 2, 1);
SET IDENTITY_INSERT RoleMembers OFF;
GO
```

We have to write a stored procedure that will create a (Server) Login and (Database) User, another that will create a Database Role and another that will make a User a member of an existing Role. We also need to enable the TRUSTWORHTY database option and create a stored procedure that will Generate a Random Password.

``` sql
USE [master]
GO
ALTER DATABASE [MyDatabase] SET TRUSTWORTHY ON
GO
```

The script for the GenerateRandomPassword stored procedure can be downloaded at the end of this article and can be called using the following snippet:

``` sql
DECLARE @NewPwd NVARCHAR(64);
SET @NewPwd = '';
EXEC [dbo].[GenerateRandomPassword] @randomPwd = @NewPwd OUTPUT;
PRINT @NewPwd;
```

The stored procedures to create a Login/User, create a Role and add make the User a member of a Role can be called using the following examples:

``` sql
EXEC [dbo].[CreateSQLUser] 'User001';

EXEC [dbo].[CreateRole] 'Role001';

EXEC [dbo].[AddUserToRole] 'User001', 'Role001';
```

Of course we have to also have functionality that will remove the User-Role membership and also that which will remove the User/Login account.

``` sql
EXEC [dbo].[DeleteSQLUser] 'User001';

EXEC [dbo].[RemoveUserMembership] 'User001', 'Role001';
```

What’s left are the mechanisms that will call these stored procedures based on the data saved. This can be achieved by creating an INSERT and an UPDATE trigger on each of the original tables. Separate triggers will be used to separate the rules. The trigger that will fire following an INSERT is shown below.

``` sql
CREATE TRIGGER [trg_INS_User] ON [dbo].[Users]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @LoginName nvarchar(12);
    DECLARE @CursorData CURSOR;

    -- process only those which have been inserted with status = 1
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.usr_status = 1)
    BEGIN
        -- a cursor has to be used to cater for multiple inserts in one batch (e.g. INSERT INTO...SELECT...)
        SET @CursorData = CURSOR FAST_FORWARD FOR
            SELECT i.usr_name FROM inserted i WHERE i.usr_status = 1;

        OPEN @CursorData;
        FETCH NEXT FROM @CursorData INTO @LoginName;
        WHILE (@@FETCH_STATUS=0)
        BEGIN
            -- execute stored procedure for each iteration
            EXEC [dbo].[CreateSQLUser] @LoginName;

            FETCH NEXT FROM @CursorData INTO @LoginName;
        END
        CLOSE @CursorData;
        DEALLOCATE @CursorData;
    END
END
GO
```

The UPDATE trigger has to check whether the record status is being changed, then action accordingly.

``` sql
CREATE TRIGGER [trg_UPD_User] ON [dbo].[Users]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @LoginName nvarchar(12),
            @LoginStatus bit;
    DECLARE @CursorData CURSOR;

    -- process only those whose status has changed
    IF EXISTS(SELECT 1 FROM inserted i WHERE UPDATE(usr_status))
    BEGIN
        -- a cursor has to be used to cater for multiple updates in one batch
        SET @CursorData = CURSOR FAST_FORWARD FOR
            SELECT i.usr_name, i.usr_status FROM inserted i WHERE UPDATE(usr_status);

        OPEN @CursorData;
        FETCH NEXT FROM @CursorData INTO @LoginName, @LoginStatus;
        WHILE (@@FETCH_STATUS=0)
        BEGIN
            IF (@LoginStatus = 1) -- Create New
                EXEC [dbo].[CreateSQLUser] @LoginName;

            ELSE IF (@LoginStatus = 0) -- Delete Existing
                EXEC [dbo].[DeleteSQLUser] @LoginName;

            FETCH NEXT FROM @CursorData INTO @LoginName, @LoginStatus;
        END
        CLOSE @CursorData;
        DEALLOCATE @CursorData;
    END
END
GO
```

In the case of Roles, we only have a stored procedure that will create Role, thus only an INSERT trigger will be scripted. Deleting Roles might be quite tricky since you’d first have to update your tables to remove the User-Role membership. The INSERT trigger for the Roles is similar to the one implemented for the Users table.

``` sql
CREATE TRIGGER [trg_INS_Role] ON [dbo].[Roles]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoleName nvarchar(12);
    DECLARE @CursorData CURSOR;

    -- process only those which have been inserted with status = 1
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.rol_status = 1)
    BEGIN
        -- a cursor has to be used to cater for multiple inserts in one batch (e.g. INSERT INTO...SELECT...)
        SET @CursorData = CURSOR FAST_FORWARD FOR
            SELECT i.rol_name FROM inserted i WHERE i.rol_status = 1;

        OPEN @CursorData;
        FETCH NEXT FROM @CursorData INTO @RoleName;
        WHILE (@@FETCH_STATUS=0)
        BEGIN
            -- execute stored procedure for each iteration
            EXEC [dbo].[CreateRole] @RoleName;

            FETCH NEXT FROM @CursorData INTO @RoleName;
        END
        CLOSE @CursorData;
        DEALLOCATE @CursorData;
    END
END
GO
```

The triggers which handle Role Membership have to retrieve the Login/User name and the name of the Role before continuing. Similarly to the AFTER UPDATE trigger on the Users table, the AFTER UPDATE trigger on the RoleMembers will action according to the value in the Status column. At this point we can test the functionality by executing the INSERT statements shown earlier. These will create the User001, User002, User003 and User004 logins, database users with the same names, the Role001 and Role002 database roles, and make the users members of the roles indicated. Further testing to verify that User-Role Membership is handled and that Logins/Users are managed can be carried out using scripts similar to the below:

``` sql
-- delete membership for User001
UPDATE RoleMembers SET mem_status = 0 WHERE mem_usr_fk = 1;

-- delete user and login for User003
UPDATE Users SET usr_status = 0 WHERE usr_pk = 3;
```

All code samples and referenced objects used for this article can be downloaded using the link below.

Download [Data Driven Account Management – part 1.sql](/assets/article_files/2012/10/data-driven-account-management-part-1.zip)
