---
layout: post
date:   2011-04-02
title:  "SQL Server Connection Strings, Unique Application DNS and Listening Ports"
permalink: ./blog/index.php/2011/04/sql-server-connection-strings-unique-application-dns-and-listening-ports/
published: true
tags: [Security, DNS, Connection Strings, Listening Ports, Database Migration, SQL Server, Database Administration, Database Design, Virtualization, Architecture]
comments: false
---
Managing SQL Server applications can be a bit tricky, especially in an enterprise scenario with tens or hundreds of applications deployed for a large user-base across geographically dispersed locations.  With a bit of planning, events such as database migrations, DBMS upgrade, or server virtualisation to name a few, can be carried out without affecting the end-users and with much less effort than configuring each machine or redeploying an update.

A sample connection string would be similar to one of the following examples:


* Data Source=myServerAddress;Initial Catalog=myDataBase;User Id=myUsername;Password=myPassword;
* Server=myServerAddress;Database=myDataBase;User ID=myUsername;Password=myPassword;Trusted_Connection=False;
* Data Source=myServerAddress;Initial Catalog=myDataBase;Integrated Security=SSPI;
* Server=myServerAddress;Database=myDataBase;Trusted_Connection=True;
* Server=myServerName\theInstanceName;Database=myDataBase;Trusted_Connection=True;

Source: [http://www.connectionstrings.com](http://www.connectionstrings.com)

Thus, a basic connection string is (mainly) composed of the following parts:

1. _Data Source_ or _Server_
2. _Initial Catalog_ or _Database_
3. _User Id_ and _Password_ / _Integrated Security_ or _Trusted\_Connection_

The drawback with connection strings is that the Data Source or Server parameter can include the the server name or IP address.  An alternative to this is to assign individual DNS records for each application.  Extending this approach slightly, and bearing in mind that SQL Server can be configured to listen on more than one port, you can consider assigning individual static port numbers for each application.  More information on how to configure SQL Server to listen on multiple ports can be found in the Microsoft KB article [How to configure an instance of SQL Server to listen on a specific TCP port or dynamic port](http://support.microsoft.com/kb/823938).

Thus, if "Application 123" is set to use the DNS "app123.myenterprise.com" and port 9387, the application connection string would be as follows:

> Data Source=**app123.myenterprise.com,9387**;Initial Catalog=myDataBase;User Id=myUsername;Password=myPassword;

OR

> Data Source=**app123.myenterprise.com,9387**;Initial Catalog=myDataBase;Integrated Security=SSPI;

The secret lies in adding the port number as part of the _Data Source_ or _Server_ parameter value in the connection string as shown above.  This approach has been tested in a production environment and is being promoted in my current workplace.  By implementing this approach, applications would be unaware (and unaffected) by SQL Server implementations using named instances, migrations, upgrades (potentially...), etc.  The downside is that the SQL Server instance has to be restarted to add/remove listening ports.

The next step is to identify a range (or ranges) of port numbers (eg. 9320-9400) and manage the mappings between applications, DNS names and port numbers using something like the below table.

Port No. | Application Name | DNS
-------- | ---------------- | ---------
9320 | Application 123 | app123.myenterprise.com
9321 | Application 124 | app124.myenterprise.com
9322 | Application 125 | app125.myenterprise.com
9323 | Application 126 | app126.myenterprise.com
9324 | Application 127 | app127.myenterprise.com
9325 | Application 128 | app128.myenterprise.com
9326 | -- | --
9327 | -- | --
9328 | -- | --
9329 | -- | --
9330 | -- | --

Database Administrators, Application Developers and DNS Administratrators have to work togetherto implement this approach.  Last but definitely not least, you'd have to speak to the Networking Administrators to make sure that the required ports are open from the web/application server or client machines (or site) to the database server.
