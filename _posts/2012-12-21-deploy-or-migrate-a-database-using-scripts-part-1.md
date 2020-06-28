---
layout: post
date:   2012-12-21
title:  "Deploy or Migrate a Database using Scripts - part 1"
permalink: ./blog/index.php/2012/12/deploy-or-migrate-a-database-using-scripts-part-1/
published: true
tags: [SQL Tools, Database Administration, Virtualization, Backup, Code Samples, command-line utilities, Database Documentation, Database Migration, data types, Development, T-SQL Programming, SQL Server Integration Services, SSIS, Storage, Testing, Upgrade]
comments: false
---
A database migration is always a headache for DBAs.  There are different approaches one may take, some being simpler than others. A couple of weeks ago, in the [Migrate Databases Using Backup-Restore](/blog/index.php/2012/11/migrate-databases-using-backup-restore/) article, I explained how a database migration can be carried out effortlessly and with minimal downtime.  This is however not possible if you are upgrading from one version to another or if, for instance you want to ensure that the CHECKSUM option is applicable to all pages.  The post titled [Database Upgrade from SQL Server 7](/blog/index.php/2011/02/database-upgrade-from-sql-server-7/) explains that although the option is set it will be applicable to *newly created* pages only.  Existing pages will retain the previous setting.  Moving binary data to another "normal" FILEGROUP or one using the FILESTREAM capabilities is another reason to migrate using scripting.  The method I will be explaining covers dissecting and rebuilding the database from scratch.

For my migration projects I use a defined set of scripts or instructions which will generate the final script or lead to the desired action.  In my case they are numbered from 00 to 20, with a descriptive file name.  The scripts will be executed in sequence and might require a few iterations to get to the final and error-free version.  The most I required was five iterations, with developers reviewing all the way and application end-users testing for the final iteration/s.

#### 00 Build Database Creation.txt ####

The first step is to prepare the CREATE DATABASE script which will also include individual FILEGROUPs for data pages, index pages and the optional binary data.  As a standard I always suggest setting the size of the PRIMARY filegroup to 10MB (more than enough), placing user TABLES and CLUSTERED indexes in their own filegroup, NONCLUSTERED indexes in another, binary data in another and effectively leaving the PRIMARY filegroup for system objects.  As a rule and together with the developers I also review the table usage patterns, sizes and forecasted growth.  If we identify that one or more tables are going to be large, frequently hit, or even both, we might opt to place that/those tables in their own FILEGROUP.  The same reasoning goes for large, frequently hit (or both) the NONCLUSTERED indexes.

This script will also contain database options such as the Recovery Model and Page Verify, as well as setting the file sizes, autogrowth, maximum size, the database owner and the default FILEGROUP.

The script can be generated using the SSMS GUI and modified for the target environment.

#### 01 Create Database Trigger(s).txt ####

This script will contain any database triggers which might have been created for example, to monitor schema changes as explained in the [A Low-Cost Solution to Track Database Code Changes](/blog/index.php/2012/06/a-low-cost-solution-to-track-database-code-changes/) article.  My suggestion is that once again Database Triggers are scripted using the SSMS GUI since it is the easiest option.

#### 02 Create User-Defined Types.sql ####

UDTs should be created before creating the actual tables since there might be dependencies on this type of object.  As explained in the [Why I avoid using User-Defined Data Types](/blog/index.php/2012/09/why-i-avoid-using-user-defined-data-types/) article I am against using these objects.  If they are being used in your environment you can either script them out and migrate, or remove them as part of the exercise.  My choice is clear but if you opt to retain them, here's a query you can use to script them out:

``` sql
SET NOCOUNT ON

SELECT 'USE ' + QUOTENAME(DB_NAME(), '[') + '
GO';

SELECT '
IF EXISTS (
    SELECT * FROM sys.types st JOIN sys.schemas ss ON st.schema_id = ss.schema_id
    WHERE st.name = N''' + st.[name] + ''' AND ss.name = N''' + ss.[name] + ''')
    DROP TYPE ' + QUOTENAME(ss.name, '[') + '.' + QUOTENAME(st.name, '[') + '
GO

CREATE TYPE ' + QUOTENAME(ss.name, '[') + '.' + QUOTENAME(st.name, '[') + ' FROM ' +
QUOTENAME(bs.[name], '[') +
    CASE bs.[name]
        WHEN 'char' THEN (
            CASE ISNULL(st.max_length, 0) WHEN 0 THEN '' WHEN -1 THEN '(MAX)'
            ELSE '(' + convert(varchar(10), st.max_length) + ')' END)
        WHEN 'nchar' THEN (
            CASE ISNULL(st.max_length, 0) WHEN 0 THEN '' WHEN -1 THEN '(MAX)'
            ELSE '(' + convert(varchar(10), st.max_length/2) + ')' END)
        WHEN 'varchar' THEN (
            CASE ISNULL(st.max_length, 0) WHEN 0 THEN '' WHEN -1 THEN '(MAX)'
            ELSE '(' + convert(varchar(10), st.max_length) + ')' END)
        WHEN 'nvarchar' THEN (
            CASE ISNULL(st.max_length, 0) WHEN 0 THEN '' WHEN -1 THEN '(MAX)'
            ELSE '(' + convert(varchar(10), st.max_length/2) + ')' END)
        WHEN 'numeric' THEN (
            CASE ISNULL(st.[precision], 0) WHEN 0 THEN '' 
            ELSE '(' + convert(varchar(10), st.[precision]) + ', ' + convert(varchar(10), st.[scale]) + ')' END)
        WHEN 'decimal' THEN (
            CASE ISNULL(st.[precision], 0) WHEN 0 THEN '' 
            ELSE '(' + convert(varchar(10), st.[precision]) + ', ' + convert(varchar(10), st.[scale]) + ')' END)
        WHEN 'varbinary' THEN (
            CASE st.max_length WHEN -1 THEN '(max)' ELSE '(' + convert(varchar(10), st.max_length) + ')' END)
        ELSE ''
    END + '
GO
'
FROM sys.types st 
    INNER JOIN sys.schemas ss ON st.[schema_id] = ss.[schema_id]
    INNER JOIN sys.types bs ON bs.[user_type_id] = st.[system_type_id]
WHERE st.[is_user_defined] = 1 -- exclude system types
ORDER BY st.[name], ss.[name];
```

#### 03 Generate Database Tables Script.sql ####

This step is explained in detail in the [Script to Generate CREATE TABLE Definitions](./blog/index.php/2012/04/script-to-generate-create-table-definitions/) article.

#### 04 Migrate Data.txt ####

The data migration step in one of the most crucial.  Actually they all are and there is no room for less than 100% perfection.  This step is the only one where it is more difficult (but not impossible) to actually check that the DBAs actions were carried out correctly.  There are various approaches one may take.

1. **INSERT statement scripts provided by developers**
This is quite self explanatory.  For an initial deployment this might be the most appropriate but for larger implementations, or an actual migration where the data size runs into hundreds of GB or more the text file containing the individual INSERT statements might be too large.  There are other methods though.
2. **Using the Bulk Copy Program (BCP)**
An explanation of how to use the BCP utility to extract or load data from/to a database can be found in the [Generate BCP Export and BCP or BULK INSERT Import Code](/blog/index.php/2011/12/generate-bcp-export-and-bcp-or-bulk-insert-import-code/) article.  You should also bear in mind that the BCP utility cannot be used to transfer XML and varbinary data.  To insert these data types you could use a custom-made application or the TEXTCOPY utility as explained in [Exporting SQL Server 2000 binary data using textcopy.exe](/blog/index.php/2011/05/exporting-sql-server-2000-binary-data-using-textcopy-exe/).
3. **SSIS - preferred**
In my opinion this is the easiest, quickest and least error-prone method to transfer data from source to destination.  The quick part involes running DTSWIZARD from the "Run" command, choosing which objects you want to migrate, and saving the selections as a package.  Make sure that the "Enable Identity Insert" option is selected for the tables in oredr to retain the same IDENTITY values as in the source.  Once saved you should open the DTSX file using a text editor (my favourite is [Notepad++](href="http://notepad-plus-plus.org/) and replace the text shown below to set the "Keep Nulls" option to TRUE.  The replacement will ensure that NULL values will remain as is while copying.<br>
Original: 
        ```
        <property>name="FastLoadKeepNulls" dataType="System.Boolean" state="default" isArray="false" description="Indicates whether the columns containing null will have null inserted in the destination. If false, columns containing null will have their default values inserted at the destination. Applies only if fast load is turned on." typeConverter="" UITypeEditor="" containsID="false" expressionType="None">false</property>;
        ```<br>
Modified: <br>
        ```
        <property>name="FastLoadKeepNulls" dataType="System.Boolean" state="default" isArray="false" description="Indicates whether the columns containing null will have null inserted in the destination. If false, columns containing null will have their default values inserted at the destination. Applies only if fast load is turned on." typeConverter="" UITypeEditor="" containsID="false" expressionType="None">true</property>;
        ```
4. **INSERT statement scripts generated by SSMS**
Similarly to the first point, this also is a feasibile approach for initial deployments or deployments with small data sets.  In the case of larger ones the resulting file containing the INSERT statements could be quite large and probably unmanageable.
5. **Other third-party tools**
The last option includes the use of third-party products.  I will not list any here however if you search the web using your favourite search engine I am sure you will find a few.

Next week I will describe further steps to ensure a successful database deployment or migration.
