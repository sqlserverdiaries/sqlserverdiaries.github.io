---
layout: post
date:   2013-01-05
title:  "Deploy or Migrate a Database using Scripts - part 2"
permalink: ./blog/index.php/2012/12/deploy-or-migrate-a-database-using-scripts-part-2/
categories: blog
published: true
tags: [Uncategorized]
comments: false
---
In last weeks Deploy or Migrate a Database using Scripts - part 1 article we saw the first steps that will lead to a successful database deployment or migration project. So far we've covered the following scripts or instructions:

1. 00 Build Database Creation.txt
2. 01 Create Database Trigger(s).txt
3. 02 Create User-Defined Types.sql
4. 03 Generate Database Tables Script.sql
5. 04 Migrate Data.txt

This week we shall start from the index deployments.

#### 05 Generate Indexes Script.sql ####

The first objects to create once the tables have been created and the data imported are the CLUSTERED and NONCLUSTERED indexes. In an ideal database configration (and which in my opinion all database must have) the PRIMARY filegroup would not be used for User Objects. Tables and CLUSTERED indexes would be created in their own (same) filegroup, while NONCLUSTERED indexes would be created in another. The article [Script to Drop and Create Indexes](./blog/index.php/2012/03/script-to-drop-and-create-indexes/) explains and provides a download location for the scripts for 2005 and 2008 versions.

#### 06 Create Linked Server.txt ####

Linked Servers can be used in Views, Synonyms, Stored Procedures, Functions, and even in the code of application binaries. But you know that already. Linked Servers can be scripted out by querying the [sys.servers](msdn.microsoft.com/en-us/library/ms178530.aspx) DMV and retrieving rows where the value of the _server\_id_ column is greater than zero, the SSMS GUI by right-clicking on the Linked Server, or even using third-party tools. The only problem is that any passwords used to map local logins with remote one's cannot be reverse-engineered, and from a security perspective is the way it should be. Passwords should be stored in an alternate location and retrieved whenever required, such as when migrating or changing Linked Servers. The [Apply the principle of least privilige on a Linked Server connection](./blog/index.php/2011/07/apply-the-principle-of-least-privilige-on-a-linked-server-connection/) article explains a how a secure configuration can be implemented.

#### 07 Generate Default Constraints Script.sql ####

Next in line are the creation of Default Contraints. These are created after importing the data to avoid that any empty (NULL) values are overwritten when the Default Constraint kicks in. The article [Script to generate DEFAULT Constraint definitions](./blog/index.php/2012/02/script-to-generate-default-constraint-definitions/) explains how to generate the necessary scripts.

#### 08 Generate Check Constraints Script.sql ####

Similarly to Step 7, the Check Contraints step should be carried out after the data has been transferred. This does not preclude the fact that data validity should be verified to fall within the parameters of the Check Constraint. The script to generate these object can be found in the [Script to generate CHECK Constraints](./blog/index.php/2012/05/script-to-generate-check-constraints/) article.

#### 09 Disable, Enable, Drop & Recreate Foreign Key Constraints.sql ####

The script that I use to generate Foreign Key Constraints comes from MSSQLTips.com and was written by Greg Robidoux. The article [Disable, enable, drop and recreate SQL Server Foreign Keys](http://www.mssqltips.com/sqlservertip/1376/disable-enable-drop-and-recreate-sql-server-foreign-keys/) explains it all.

#### 10 Create Assemblies.txt ####

In the case of Assemblies, I haven't written a script-generator script to date. So for this you'll have to use the GUI (as I do...).

#### 11 Create Functions (TABLES).txt ####

I separate Function creation into two. This first part should contain those functions which refer to or depend on tables only. This is almost impossible to determine automatically and the best way is to "know" your code. Alternatively the CREATE FUNCTION statements could include an IF NOT EXISTS clause before creating. Together with carefully placed PRINT statements this will allow you to execute the script more than once and know when all objects have been created (i.e. no errors).

#### 12 Create Views.txt ####

The CREATE VIEW code can be created simply by querying the VIEW_DEFINITION column of the [INFORMATION_SCHEMA.VIEWS](http://msdn.microsoft.com/en-us/library/ms181381.aspx) metadata view. A starting point can be obtained by going through the [Generating a Database Data Dictionary](./blog/index.php/2011/02/generating-a-database-data-dictionary/) article.

#### 13 Create Functions (VIEWS).txt ####

As mentioned earlier, CREATE FUCNTION statements have been split into two. The secons part will include functions not created the first time round and which depend on the existence of Tables AND Views. As mentioned previously, having the EXISTS function can be used to exclude those functions which have already been processed.

#### 14 Create Stored Procedures.txt ####

The article [Database Object Code Split on Multiple Lines](./blog/index.php/2012/06/database-object-code-split-on-multiple-lines/) I wrote in June 2012 explains that errors are encountered for stored procedures having (very) long lines of text. I have to admit that I haven't found a T-SQL solution to this, but a remedy can be found using the GUI. Just select all the stored procedures you want to migrate (all?), right-click and script them out. The SSMS GUI does a good job at that.
&nbsp;
___
> **NOTE:** This article was meant to be published in January 2013 however, following the incident which brought down the original version of this blog, I never got round to completing it. Although the techniques I started to describe here can be used for the current technology, some better-suited ones exist nowadays.  
I shall make this a topic for a future post.  
Thank you.
___

#### 15 Generate Triggers Script.sql ####

#### 16 Create Database Roles.txt ####

#### 17 Create Logins and Users.txt ####

#### 18 Generate Object Permissions Script.sql ####

#### 19 Script Object Permissions.sql ####

#### 20 Create Keys, Certificates.txt ####
