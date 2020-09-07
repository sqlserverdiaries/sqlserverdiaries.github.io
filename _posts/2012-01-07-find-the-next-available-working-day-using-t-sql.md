---
layout: post
date:   2012-01-07
title:  "Find the Next Available Working Day using T-SQL"
permalink: ./blog/index.php/2012/01/find-the-next-available-working-day-using-t-sql/
categories: blog
published: true
tags: [Code Samples, Database Design, T-SQL Programming, datetime, Development, SQL Server 2000, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2]
comments: false
---
A while ago I helped a colleague develop a T-SQL function that would increment a date by an integer value and return the first working day following and closest to the resulting date.  The requirements were not complex - a date is incremented by a number of days and the next working date identified.  The only complexity was how to make sure that the date did not fall on a weekend or "non-working" days such as public or national holidays.

The first step would be to have a table that stores what I will call non-working days.  The table was filled with samle data which incidentally are Maltese Public and National holidays (obtained from the [Department of Information - Malta](http://www.doi.gov.mt/en/archive/publicholidays/pholidays12.asp) website).  I am also adding an "extra" day which is described as a "Family Activities Day", but of course you may add as many as necessary depending on the business area.

``` sql
USE [tempdb]
GO

-- table to hold Non-Working Days (such as Public/National holidays)
CREATE TABLE [dbo].[tb_nonworkingdays] (
    nwd_pk int IDENTITY(1,1) NOT NULL,
    nwd_date datetime NOT NULL,
    nwd_description nvarchar(255) NOT NULL,
    nwd_annualevent bit NOT NULL DEFAULT (1)
)
GO

-- create sample data - based on holidays for 2012 in Malta
-- source: http://www.doi.gov.mt/en/archive/publicholidays/pholidays12.asp
SET NOCOUNT ON;

-- annual repeatable events
INSERT INTO [dbo].[tb_nonworkingdays] (
    nwd_date, nwd_description, nwd_annualevent
    )
    SELECT '2012-01-01', 'New Year''s Day', 1 UNION ALL
    SELECT '2012-02-10', 'Feast of St. Paul''s Shipwreck', 1 UNION ALL
    SELECT '2012-03-19', 'Feast of St. Joseph', 1 UNION ALL
    SELECT '2012-03-31', 'Freedom Day', 1 UNION ALL
    SELECT '2012-05-01', 'Worker''s Day', 1 UNION ALL
    SELECT '2012-06-07', 'Sette Giugno', 1 UNION ALL
    SELECT '2012-06-29', 'Feast of St. Peter and St. Paul', 1 UNION ALL
    SELECT '2012-08-15', 'Feast of the Assumption', 1 UNION ALL
    SELECT '2012-09-08', 'Feast of Our Lady of Victories', 1 UNION ALL
    SELECT '2012-09-21', 'Independence Day', 1 UNION ALL
    SELECT '2012-12-08', 'Feast of the Immaculate Conception', 1 UNION ALL
    SELECT '2012-12-13', 'Republic Day', 1 UNION ALL
    SELECT '2012-12-25', 'Christmas Day', 1;
GO

-- one-off annual events
INSERT INTO [dbo].[tb_nonworkingdays] (
    nwd_date, nwd_description, nwd_annualevent
    )
    SELECT '2012-04-06', 'Good Friday', 0;
GO

-- one-off company events, etc.
INSERT INTO [dbo].[tb_nonworkingdays] (
    nwd_date, nwd_description, nwd_annualevent
    )
    SELECT '2012-04-09', 'Family Activities Day', 0;
GO
```

The function first checks the input parameters, then increments the _@StartDate_ variable by the number of days that have to be added.  Further checks verify whether the date falls on a weekday, and if the date is one of the pre-defined non-working days.  If either of these conditions fail the date is incremented further by another day.  These checks are repeated until the calculated date is valid.

``` sql
CREATE FUNCTION [dbo].[fn_NextWorkingDay] (@StartDate as datetime, @NoDays int)
RETURNS datetime 
AS
BEGIN
    IF (@StartDate IS NULL) OR (@NoDays IS NULL)
        RETURN NULL;

    DECLARE @NextDate datetime;
    DECLARE @DateFound bit;

    SET @DateFound = 0;
    -- increase the @StartDate by the @NoDays value to reduce iterations 
    -- from the below
    SET @NextDate = DATEADD(d, @NoDays, @StartDate);

    WHILE (@DateFound = 0)
    BEGIN
        -- if the date is between Mon and Fri
        IF DATEPART(weekday, @NextDate) IN (2,3,4,5,6)
        BEGIN
            IF EXISTS(
                SELECT 1 FROM dbo.tb_nonworkingdays WHERE nwd_date = @NextDate)
            BEGIN
                -- add one day if the date is a Public/National holiday
                SET @NextDate = DATEADD(d, 1, @NextDate); -- add one day
            END
            ELSE
            BEGIN
                -- the next date has been identified
                SET @DateFound = 1;
            END
        END
        ELSE
        BEGIN
            -- if the date is NOT between Mon and Fri (i.e. falls on a weekend)
            SET @NextDate = DATEADD(d, 1, @NextDate); -- add one day
        END
    END

    RETURN (@NextDate);
END
GO
```

As you can see the function is quite simple. The functionality can be extended further for other business areas and rules, such as for example:

* In the catering inductry both checks for weekdays and holidays would probably not apply;
* Most hair salons in Malta work Tuesdays to Saturdays;
* Teachers' non-working days include the Easter, Summer and Christmas periods (not that they don't work during these days...);
* The function can be made to exclude an employee's vacation leave bookings.

Other than that I'm sure it is a good starting point for the above-mentioned scenarios, or more.
