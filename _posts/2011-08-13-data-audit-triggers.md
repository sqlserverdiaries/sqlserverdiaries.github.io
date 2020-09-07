---
layout: post
date:   2011-08-13
title:  "Data Audit Triggers"
permalink: ./blog/index.php/2011/08/data-audit-triggers/
categories: blog
published: true
tags: [Security, T-SQL Programming, Audit, Development, Code Samples]
comments: false
---
For a while now, business have been more aware of the importance of protecting their data, at least from unwanted changes or deletions.  I will not go into the specifics of which method to use, whether to comply with an international standard or not, or even whether to use in-house development or purchase an off-the-shelf product.  There is a multitude of information on the web.

What you will find below is a script template on one of the approaches we used to audit data using triggers.  Our approach was to create an identical set of audit tables for each table that was identified to hold the "more important" information, then use the below sample to generate the triggers.

The first step is to create the base tables.

``` sql
/* SET UP TABLES */
CREATE TABLE dbo.tb_source (
    s_pk INT IDENTITY(1,1) NOT NULL,
    s_desc VARCHAR(50) NOT NULL
);
GO
CREATE TABLE dbo.tb_source_audit (
    d_pk INT IDENTITY(1,1) NOT NULL,
    d_action smallint NOT NULL,
    d_spk INT NOT NULL,
    d_sdesc VARCHAR(50) NOT NULL
);
GO
```

Next we'll create the actual audit trigger.

``` sql
/* SET UP AUDIT TRIGGER */
CREATE TRIGGER trg_auditsource ON tb_source
AFTER INSERT, UPDATE, DELETE 
AS
SET NOCOUNT ON
DECLARE @insert_action smallint,
        @update_action smallint,
        @delete_action smallint
BEGIN
    SELECT
        @insert_action = 1,
        @update_action = 2,
        @delete_action = 3;
    -- check for updates
    IF EXISTS(SELECT * FROM DELETED)
    BEGIN
        -- filter deletes only
        INSERT INTO dbo.tb_source_audit (d_action, d_spk, d_sdesc)
            SELECT @delete_action, s_pk, s_desc
            FROM DELETED
            WHERE s_pk NOT IN (SELECT s_pk FROM INSERTED);
        -- filter updates
        INSERT INTO dbo.tb_source_audit (d_action, d_spk, d_sdesc)
            SELECT @update_action, s_pk, s_desc
            FROM INSERTED
            WHERE s_pk IN (SELECT s_pk FROM DELETED);
    END
    ELSE
    -- inserts only
    BEGIN
        INSERT INTO dbo.tb_source_audit (d_action, d_spk, d_sdesc)
            SELECT @insert_action, s_pk, s_desc
            FROM INSERTED;
    END
END
GO
```

Now let's test whether the functionality has been achieved.  The first test is a simple one-row insert.

``` sql
INSERT INTO dbo.tb_source VALUES ('item 1');
-- 1 record inserted in source table
-- 1 record inserted in audit table
```

After each step, check that the contents of the source and audit tables are as expected.

``` sql
SELECT * FROM dbo.tb_source;
SELECT * FROM dbo.tb_source_audit;
```

Next we'll try with a multiple-row insert.

``` sql
INSERT INTO dbo.tb_source
    SELECT 'item 2' UNION ALL
    SELECT 'item 3' UNION ALL
    SELECT 'item 4' UNION ALL
    SELECT 'item 5' UNION ALL
    SELECT 'item 6';
-- 5 records inserted in source table
-- 5 records inserted in audit table
```

So far it looks like it's working correctly.  With the next tests we shall be verifying single and multiple-row updates.

``` sql
UPDATE dbo.tb_source SET s_desc = 'modified item 5' WHERE s_desc = 'item 5';
-- 1 record updated in source table
-- 1 record updated in audit table
```

Multiple-row update:

``` sql
UPDATE dbo.tb_source SET s_desc = 'same desc' WHERE s_pk IN (2,3);
-- 2 records updated in source table
-- 2 records updated in audit table
```

In the last of the tests we shall verify that single and multiple-row deletes are audited.

``` sql
DELETE FROM dbo.tb_source WHERE s_pk = 4;
-- 1 record deleted from source table
-- 1 record deleted from audit table
```

Multiple-row delete:

```sql
DELETE FROM dbo.tb_source WHERE s_pk IN (1, 6);
-- 2 records deleted from source table
-- 2 records deleted from audit table
```

Finally, we remove the tables used for this testing.

``` sql
/* CLEAN UP */
DROP TABLE dbo.tb_source;
DROP TABLE dbo.tb_source_audit;
GO
```

As explained earlier, this is just one of the approaches that can be implemented to audit data.  The entire script for the above can be downloaded here: [sample_trigger_multiple_actions.zip](/assets/article_files/2011/08/sample_trigger_multiple_actions.zip).
