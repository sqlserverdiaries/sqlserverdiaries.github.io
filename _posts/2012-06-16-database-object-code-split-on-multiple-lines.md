---
layout: post
date:   2012-06-16
title:  "Database Object Code Split on Multiple Lines"
permalink: ./blog/index.php/2012/06/database-object-code-split-on-multiple-lines/
categories: blog
published: true
tags: [Coding Practices, Database Design, T-SQL Programming, Database Migration, Development, SQL Server, SQL Server errors, Upgrade, Testing]
comments: false
---
During a recent database migration I encountered strange behaviour when scripting out views, stored procedures and triggers. The issue was reported by the development team who noticed that object code lines were being split into two lines. After fixing the objects affected by this problem I investigated the cause and found that the only objects affected were the ones which had “very long” lines of code – the line break occurred after character 255.

It seems that some of the scripting tools such as the [sp_helptext](http://msdn.microsoft.com/en-us/library/ms176112.aspx) stored procedure as well as the SSMS GUI, will split object code beyond 255 characters in length. In fact, a T-SQL extract (shown below) from the _sp_helptext_ object code verified this:

``` sql
create procedure sys.sp_helptext
@objname nvarchar(776)
,@columnname sysname = NULL
as

set nocount on

declare @dbname sysname
,@objid         int
,@BlankSpaceAdded   int
,@BasePos       int
,@CurrentPos    int
,@TextLength    int
,@LineId        int
,@AddOnLen      int
,@LFCR          int --lengths of line feed carriage return
,@DefinedLength int

/* NOTE: Length of @SyscomText is 4000 to replace the length of
** text column in syscomments.
** lengths on @Line, #CommentText Text column and
** value for @DefinedLength are all 255\. These need to all have
** the same values. 255 was selected in order for the max length
** display using down level clients
*/
,@SyscomText    nvarchar(4000)
,@Line          nvarchar(255)

select @DefinedLength = 255
select @BlankSpaceAdded = 0 /*Keeps track of blank spaces at end of lines. Note Len function ignores
                             trailing blank spaces*/
CREATE TABLE #CommentText
(LineId int
 ,Text  nvarchar(255) collate database_default)
 ```

So it appears that this behaviour is for “backward compatibility”, though I’m not sure why it has been left there. My suggestion to the developers is that adopting the practice of limiting the amount of code in a single line to somewhere in the region of 120-160 characters (depending on the size of your monitor?) is probably the best way forward to avoid this. In any case, writing a line longer than 255 characters is not really that readable unless you are ready to scroll left and right to understand what’s happening.
