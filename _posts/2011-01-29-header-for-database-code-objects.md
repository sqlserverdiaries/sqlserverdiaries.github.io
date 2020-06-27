---
layout: post
date:   2011-01-29
title:  "Header for Database Code Objects"
permalink: ./blog/index.php/2011/01/29/header-for-database-code-objects/
tags: 
    - Database Administration
    - Database Design
    - Development
    - SQL Server
    - Code Samples
    - T-SQL Programming
    - Coding Practices
comments: false
---
Stored procedures and functions allow for the implementation of groups of data manipulation language (DML) statements as database objects.  Besides each code block having the relevant comments to facilitate other parties’ understanding of the same code blocks (amongst other reasons), a good coding practice is that some information about the object is included in the header of the object definition.

A sample code header is shown below:
``` text
/*
---------------------------------------------------------------------------------------
-- Object Name:             dbo.usp_somebusinessfunction
-- Project:                 Business Application
-- Business Process:        Registration of Business need
-- Purpose:                 Create a new business requirement
-- Detailed Description:    A new business requirement has arisen where the application
--                          will capture some value from user input, perform some calculations
--                          and store the result in the database for reporting purposes.
-- Database:                db_businessdatastore
-- Dependent Objects:       tb_business, tb_calculations,
-- Called By:               DatabaseRole_1, DatabaseRole_2, DatabaseRole_3
--
---------------------------------------------------------------------------------------
-- Rev  | CMR       | Date Modified  | Developer             | Change Summary
---------------------------------------------------------------------------------------
--  1.0 | CHG 2563  | 05/12/2007     | John Becker           | First implementation
--  2.0 | CHG 5952  | 18/04/2008     | John Becker           | Added some new functionality
--      |           |                |                       |
--
*/
```
*Note: CMR = Change Management Reference.*
