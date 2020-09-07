---
layout: post
date:   2012-09-29
title:  "Semi-Automated T-SQL Code Reviews"
permalink: ./blog/index.php/2012/09/semi-automated-t-sql-code-reviews/
categories: blog
published: true
tags: [Audit, Database Administration, Database Design, SQL Tools, T-SQL Programming, Code Samples, Coding Practices, Database Documentation, Development, SQL Server, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server errors, Testing, Upgrade]
comments: false
---
I am usually quite cautious when mentioning third-party tools since I don’t have any affiliations with any company or product mentioned.  In this case I want to make an exception.  I recently came across an SSMS addin called [SQL Code Guard](http://www.sqlcodeguard.com/ "SQL Code Guard").

The addin is free and, according to the author works with SSMS 2005, 2008, and 2008 R2 (confirmed…).  Once installed three new menu items appear under the Tools menu as shown in the below figure.

![/assets/article_files/2012/09/ssms_tools_menu.jpg "SSMS Tools Menu"](/assets/article_files/2012/09/ssms_tools_menu.jpg)

The tool works by reviewing the schema of a database that has bene deployed to an instance.  A nice feature would have been an automatic script analysis before actually running or deploying.

To analyse a database, in SSMS you have to click on _SqlCodeGuard_ (Ctrl+Shift+C) in the Tools menu (as shown above), open Object Explorer (F8), highlight a database and then click on the “Process database” button.  I tried it with the _AdventureWorks_ database as you can see in the below image.

![/assets/article_files/2012/09/ssms_screenshot.jpg "SSMS Screenshot"](/assets/article_files/2012/09/ssms_screenshot.jpg)

The results were quite astonishing!  The add-in quickly analysed the schema and code objects producing a tree view showing the issues.  As a sidenote, the issues can be enabled or disabled using the “Select issues…” button.  There is also an option to export the list of issues and the affected objects in XML format.  Just right-click on the tree-view and click on “Dump issues”.

Double clicking on an issue opens an SQL Query window containing the object definition.  Opening the Code Outline window and clicking the “Show outline” button breaks the object definition into numbered lines structured in a hierarchical view.

![/assets/article_files/2012/09/sqlcodeguard_code_outline.jpg "Sql Code Guard Code Outline"](/assets/article_files/2012/09/sqlcodeguard_code_outline.jpg)

What else can I say about this tool?  Try it out for yourself and remember to send feedback or suggestions to the author.  On my part it will surely reduce the time for code reviews and eventually lead to better quality code.
