---
layout: post
date:   2012-01-21
title:  "Using Built-In Multi-Language Month and Weekday Names for Application Lists"
permalink: ./blog/index.php/2012/01/using-built-in-multi-language-month-and-weekday-names-for-application-lists/
categories: blog
published: true
tags: [Code Samples, T-SQL Programming, Development, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2]
comments: false
---
Client-facing applications which require that a user choose say, a month or weekday name from a list usually rely on hard-coded lists or by the values in a table, config file, or other location.  Unless the original design allows for multiple languages, it can easily get messy when extending the functionality.

A database developer has another option in this case - use the lists already built into SQL Server.  This information is stored in the [sys.syslanguages (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms190303.aspx) compatibility view and can also be retrieved using the [sp_helplanguage (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms187357.aspx) stored procedure.  Most notably are the _months_, _shortmonths_ and _days_ columns.  These columns are stored as comma-delimited values and since the permission defaults to the _public_ role, they can be retrieved by all authenticated logins.  What is interesting is that the view or stored procedure can return the values in one of the installed languages (see [sys.syslanguages documentation](http://msdn.microsoft.com/en-us/library/ms190303.aspx)).

The following script can be used as a proof of concept.  It uses the T-SQL _fn\_split_ function whose object definition can be found at the end of this article (truthfully, I didn't write this version of the _fn\_split_ function and unfortunately I cannot recall from where I got it, but I'm sharing anyway).  In the below sample I tested the script using three different langauges.

``` sql
--SET LANGUAGE French
--SET LANGUAGE Italian
--SET LANGUAGE us_english

DECLARE @months nvarchar(372),
        @shortmonths varchar(132),
        @days nvarchar(217);

SELECT @months = [months], @shortmonths = [shortmonths], @days = [days]
--SELECT *
FROM [master].[sys].[syslanguages]
WHERE [name] = @@LANGUAGE;

PRINT @months;
PRINT @shortmonths;
PRINT @days;
-- RESULTS:
/*
Le paramètre de langue est passé à Français.
janvier,février,mars,avril,mai,juin,juillet,août,septembre,octobre,novembre,décembre
janv,févr,mars,avr,mai,juin,juil,août,sept,oct,nov,déc
lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche
*/
/*
L'impostazione della lingua è stata sostituita con Italiano.
gennaio,febbraio,marzo,aprile,maggio,giugno,luglio,agosto,settembre,ottobre,novembre,dicembre
gen,feb,mar,apr,mag,giu,lug,ago,set,ott,nov,dic
lunedì,martedì,mercoledì,giovedì,venerdì,sabato,domenica
*/
/*
Changed language setting to us_english.
January,February,March,April,May,June,July,August,September,October,November,December
Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec
Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday
*/

SELECT ReturnCol AS [Months] FROM [db_dba].dbo.fn_split(@months, ',');
SELECT ReturnCol AS [ShortMonths] FROM [db_dba].dbo.fn_split(@shortmonths, ',');
SELECT ReturnCol AS [Days] FROM [db_dba].dbo.fn_split(@days, ',');
```

The above is an example of reusing what is already persent in the DBMS without having to _"reinvent the wheel"_.

The script for the [fn_split function can be downloaded here](/assets/article_files/2012-01-using-built-in-multi-language-month-and-weekday-names-for-application-lists/fn_split.zip).
