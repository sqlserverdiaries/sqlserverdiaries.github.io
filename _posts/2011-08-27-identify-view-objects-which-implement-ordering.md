---
layout: post
date:   2011-08-27
title:  "Identify VIEW objects which implement ORDERing"
permalink: ./blog/index.php/2011/08/identify-view-objects-which-implement-ordering/
categories: blog
published: true
tags: [Code Samples, Database Administration, T-SQL Programming, Coding Practices, Database Migration, Development, SQL Server 2000, SQL Server errors, Upgrade]
comments: false
---
In an earlier post I explained a number of migration or upgrade issues arising from the usage of SELECT TOP 100 PERCENT…ORDER BY… constructs when used in a VIEW. I wrote the below script to identify the VIEW objects which are implemented in this way and also identify from which other database objects (views and stored procedures) the identified views are called.

Of course you will also have to review and fix any .NET, JAVA, etc. code that is calling the original views to order the result sets as explained in my original article.

``` sql
SET NOCOUNT ON
DECLARE @ViewName nvarchar(128);
DECLARE @curViews CURSOR;

DECLARE @ViewUsage TABLE (
    [view_name]   nvarchar(128) NOT NULL,
    [object_name] nvarchar(128) NULL,
    [object_type] char(1) NULL
);

SET @curViews = CURSOR FOR
    SELECT table_name
    FROM information_schema.views
    WHERE view_definition LIKE '% PERCENT %ORDER BY%'
    ORDER BY table_name ASC;

OPEN @curViews;
FETCH NEXT FROM @curViews INTO @ViewName;
WHILE (@@FETCH_STATUS=0)
BEGIN
    -- stored procedures
    IF EXISTS (
        SELECT @ViewName, routine_name
        FROM information_schema.routines
        WHERE routine_definition LIKE '%' + @ViewName + '%')
    BEGIN
        INSERT INTO @ViewUsage([view_name], [object_name], [object_type])
            SELECT @ViewName, routine_name, 'R'
            FROM information_schema.routines
            WHERE routine_definition LIKE '%' + @ViewName + '%';
    END
    ELSE
    BEGIN
        INSERT INTO @ViewUsage([view_name], [object_name], [object_type])
        VALUES (@ViewName, NULL, 'R');
    END

    -- views
    IF EXISTS (
        SELECT @ViewName, table_name
        FROM information_schema.views
        WHERE view_definition LIKE '%' + @ViewName + '%'
        AND table_name != @ViewName)
    BEGIN
        INSERT INTO @ViewUsage([view_name], [object_name], [object_type])
            SELECT @ViewName, table_name, 'V'
            FROM information_schema.views
            WHERE view_definition LIKE '%' + @ViewName + '%'
            AND table_name != @ViewName;
    END
    ELSE
    BEGIN
        INSERT INTO @ViewUsage([view_name], [object_name], [object_type])
        VALUES (@ViewName, NULL, 'V');
    END

    FETCH NEXT FROM @curViews INTO @ViewName;
END
CLOSE @curViews;
DEALLOCATE @curViews;

SELECT * FROM @ViewUsage
ORDER BY [view_name], [object_type], [object_name];
```
