---
layout: post
date:   2011-03-12
title:  "Generate Lottery Ticket Combinations"
permalink: ./blog/index.php/2011/03/12/generate-lottery-ticket-combinations/
published: true
tags:
    - T-SQL Programming
    - Code Samples
    - CTE
    - CROSS JOIN
    - Permutations
    - Combinations
    - SQL Server
comments: false
---
In Malta, the [Super 5](http://www.maltco.com/super/) lottery prize has always been considered the peak of winnings by the Maltese.  So much so that it has become part of the day-to-day language when referring to good luck (_I feel I just won the Super 5!_).  As a challenge, I thought of how to write a T-SQL statement that would retrieve all the possible combinations (or permutations) of the tickets.  As a backround to the lottery, the wining ticket will contain 5 distinct numbers between 1 and 42 in any order.  Each ticket costs €1.50 and draws are held once a week.

First we have to generate the range (array) of numbers which can be played.  Available in SQL Server 2005 and later are the Common Table Expressions (CTE) - more information about CTE's can be found in the [SQL Server Books Online](http://msdn.microsoft.com/en-us/library/ms130214.aspx).

``` sql
WITH cte_Numbers (number) AS (
    SELECT 1 AS [number]
    UNION ALL
    SELECT [number] + 1
    FROM cte_Numbers WHERE [number] < 42 )
SELECT [number]
FROM cte_Numbers;
```

The next step is creating the number combinations.  Since the largest number is 42, this means that there are 42 numbers that can be drawn first, then 41, then 40, and so forth.

> 42 x 41 x 40 x 39 x 38 = 102,080,160

This brings the odds of winning at over 102 million to one.  Since the order of the draws does not matter, the above should be divided by the number of ways the numbers can be drawn:

> 5 x 4 x 3 x 2 x 1 = 120

To calculate the odds of winning with one ticket we divide the first result by the latter:

> 102,080,160 / 120 = 850,668

This brings the odds of winning down to over 850 thousand to one. In theory, if one had to buy all the tickets costing 850,668 x €1.50 one would have to spend €1,276,002.

Back to the ticket generator.  In order to generate all possible combinations we shall utilise the Cartesian Product of five CROSS JOINs from the result of the original CTE as shown below.  Since each number can be drawn only once the WHERE clause will remove the one's already drawn.

``` sql
WITH cte_Numbers (number) AS (
    SELECT 1 AS [number]
    UNION ALL
    SELECT [number] + 1
    FROM cte_Numbers WHERE [number] < 42 )
SELECT
    CAST(a.[number] AS VARCHAR(2)) + '-' +
    CAST(b.[number] AS VARCHAR(2)) + '-' +
    CAST(c.[number] AS VARCHAR(2)) + '-' +
    CAST(d.[number] AS VARCHAR(2)) + '-' +
    CAST(e.[number] AS VARCHAR(2)) AS [Combinations]
FROM cte_Numbers a
    CROSS JOIN cte_Numbers b
    CROSS JOIN cte_Numbers c
    CROSS JOIN cte_Numbers d
    CROSS JOIN cte_Numbers e
WHERE (b.[number] > a.[number]) AND
    (c.[number] > b.[number]) AND
    (d.[number] > c.[number]) AND
    (e.[number] > d.[number]);
```

Actually that's it.  The above query will return all possible ticket combinations for the Maltese Super 5 lottery.

Good luck!
