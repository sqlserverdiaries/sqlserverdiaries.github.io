---
layout: post
date:   2022-02-05
title:  "SQL Linter - Code Analysis"
permalink: ./blog/index.php/2022/02/sql-linter-code-analysis/
categories: blog
published: true
tags: [Database Administration, Development, Linter]
comments: true
---
During the course of our development (yes, DBAs do develop code) we use and sometimes write our own tools, scripts, and so forth. Some I use regularly to format code for readability (such as [PoorSQL](https://poorsql.com/)), and others not that often. One of the latter is a SQL linter.

One definition I came across on the web on *"what is a SQL linter"* was:

> *A linter parses code to tell you where you screwed up.*

That pretty much sums it up.

A linter tool I used a while back was [SQL Code Guard](https://sqlcodeguard.com/). Once installed it would integrate with SSMS, providing a right-click context menu to analyse the selected database. The results would then be displayed in SSMS, and I recall there also being an option to export to XML.

SQL Code Guard was eventually purchased by [Redgate](https://www.red-gate.com/) and integrated into some of their other [products](https://www.red-gate.com/products/) such as [SQL Prompt](https://www.red-gate.com/products/sql-development/sql-prompt/), [SQL Monitor](https://www.red-gate.com/products/dba/sql-monitor/) and [SQL Change Automation](https://www.red-gate.com/products/sql-development/sql-change-automation/).

There is also a [code analysis command line](https://documentation.red-gate.com/scg/sql-code-analysis-documentation/code-analysis-for-sql-server-command-line) option, which is what I used recently.

## Code Analysis for SQL Server command line

The tool still exports results to XML and the output is quite verbose, which will help any database code developer understand and learn more about the rule being checked. This advice will invariably this will result in better code.

The rule categories (copied from [the Redgate documentation](https://documentation.red-gate.com/codeanalysis/code-analysis-for-sql-server)) are:

- [Best practice rules](https://documentation.red-gate.com/codeanalysis/code-analysis-for-sql-server/best-practice-rules) — Adhere to good industry practices.
- [Deprecated syntax rules](https://documentation.red-gate.com/codeanalysis/code-analysis-for-sql-server/deprecated-syntax-rules) — T-SQL keywords or syntax discontinued by Microsoft.
- [Execution rules](https://documentation.red-gate.com/codeanalysis/code-analysis-for-sql-server/execution-rules) — Identify issues that may be problematic upon execution.
- [Miscellaneous rules](https://documentation.red-gate.com/codeanalysis/code-analysis-for-sql-server/miscellaneous-rules) — Rules that don't fall under one of the other categories.
- [Naming convention rules](https://documentation.red-gate.com/codeanalysis/code-analysis-for-sql-server/naming-convention-rules) — Naming convention rules
- [Performance rules](https://documentation.red-gate.com/codeanalysis/code-analysis-for-sql-server/performance-rules) — Use of SQL that could cause performance problems.
- [Script rules](https://documentation.red-gate.com/codeanalysis/code-analysis-for-sql-server/script-rules) — Issues to do with the SQL script and not the SQL itself.
- [Style rules](https://documentation.red-gate.com/codeanalysis/code-analysis-for-sql-server/style-rules) — Code style issues.

I will end this with a couple of sample commands. The first will output the results as a XML file.

``` text
.\SqlCodeGuard.cmd.exe /S:"localhost,1433" /d"Adventureworks" /include:all /warning:all /out:".\Adventureworks.xml"
```

The next one will output the results as a HTML file. The only difference here is the output file extension.

``` text
.\SqlCodeGuard.cmd.exe /S:"localhost,1433" /d"Adventureworks" /include:all /warning:all /out:".\Adventureworks.html"
```

Go on, fire up a Command Prompt and try it. You might be surprised.
