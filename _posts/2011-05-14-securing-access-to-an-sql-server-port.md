---
layout: post
date:   2011-05-14
title:  "Securing Access to an SQL Server Port"
permalink: ./blog/index.php/2011/05/securing-access-to-an-sql-server-port/
categories: blog
published: true
tags: [Architecture, Database Administration, Database Design, Security, Virtualization, Connection Strings, Database Migration, Listening Ports, Security, SQL Server, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2]
comments: false
---
In an earlier article titled [SQL Server Connection Strings, Unique Application DNS and Listening Ports](/blog/index.php/2011/04/sql-server-connection-strings-unique-application-dns-and-listening-ports/) I explained a method that can be used to manage applications' connectivity to SQL Server databases across an enterprise.  This article extends the principles explained.

Introduced in SQL Server 2005, endpoints provide a point of entry to connect to an SQL Server instance.  Endpoints are also used when configuring [Database Mirroring Overview](http://msdn.microsoft.com/en-us/library/ms189852.aspx) and [SQL Server Service Broker](http://msdn.microsoft.com/en-us/library/bb522893.aspx), but those subjects will be covered in future articles.  A reminder and suggestion about HTTP Endpoints (or Native XML Web Services) which were introduced in SQL Server 2005 - do not use them and plan to replace their functionality with an alternative deployment (e.g. Web Services).  Microsoft have decided to remove this feature in a future version of SQL Server.  Read the MSDN article [Native XML Web Services: Deprecated in SQL Server 2008](http://msdn.microsoft.com/en-us/library/cc280436.aspx) for further details.

By default a number of System Endpoints are created for every service (TCP, VIA, Shared Memory, Named Pipes) and an additional one for the Dedicated Admin Connection, each of which are ready to accept TSQL connections if the protocol is enabled (see [SQL Server Configuration Manager](http://msdn.microsoft.com/en-us/library/ms174212.aspx)).  This article demonstrates how to create a TSQL endpoint and allow access only to specific logins.

After allocating a port to our application, configuring SQL Server to listen on that port and restarting the instance as explained in the [SQL Server Connection Strings, Unique Application DNS and Listening Ports](/blog/index.php/2011/04/sql-server-connection-strings-unique-application-dns-and-listening-ports/), the first step is to create the TSQL endpoint.  This is done using the following syntax:

``` sql
CREATE ENDPOINT [App125DBEndpoint]
STATE = STARTED
AS TCP (
    LISTENER_PORT = 9325,
    LISTENER_IP = ALL
    )
FOR TSQL();
```

The above will create the <em>App125DBEndpoint </em>listening on port 9325 for all active/enabled IP addresses on the server and accepting TSQL connections.  The endpoint can also be configured to accept connections on a single IP address if the SQL Server instance is listening on multiple IPs.

The following message will be returned as a result of the CREATE ENDPOINT command:

> "Creation of a TSQL endpoint will result in the revocation of any 'Public' connect permissions on the 'TSQL Default TCP' endpoint.  If 'Public' access is desired on this endpoint, reapply this permission using 'GRANT CONNECT ON ENDPOINT::[TSQL Default TCP] to [public]'."

Since we might (or do) want that other existing applications connect to our instance on the default TCP port we will "reopen" access to the default TCP endpoint using the provided code.

``` sql
GRANT CONNECT ON ENDPOINT::[TSQL Default TCP] TO [public]
```

The next step is to permit that only selected logins are allowed access on this endpoint.  The logins can be SQL Server Logins, Windows Logins (Local or Active Directory) and even Windows Groups (Local or Active Directory).  Samples for each type are shown below.

``` sql
-- sql login
GRANT CONNECT ON ENDPOINT::[App125DBEndpoint] TO [sqllogin125];

-- local or domain account
GRANT CONNECT ON ENDPOINT::[App125DBEndpoint] TO [DOMAIN\windowslogin125];

-- local or domain group
GRANT CONNECT ON ENDPOINT::[App125DBEndpoint] TO [DOMAIN\windowsgroup125];
```

For more information about the [CREATE ENDPOINT (Transact-SQL)](http://technet.microsoft.com/en-us/library/ms181591.aspx) command please read the appropriate articles in the [SQL Server Books Online](http://msdn.microsoft.com/en-us/library/ms130214.aspx).
