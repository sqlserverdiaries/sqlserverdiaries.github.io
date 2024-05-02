---
layout: post
date:   2011-07-09
title:  "Apply the principle of least privilege on a Linked Server connection"
permalink: ./blog/index.php/2011/07/apply-the-principle-of-least-privilege-on-a-linked-server-connection/
categories: blog
published: true
tags: [Security, Database Administration, Architecture, Connection Strings, Development, Linked Servers]
comments: false
---
Linked Servers are easy to set up in all versions of SQL Server.  Using a Linked Server one can connect to databases on the same SQL Server instance, on other instances, other DBMSs such as Oracle, MySQL, Informix and using the appropriate driver (e.g. OLEDB, ODBC, etc.), even Microsoft Access or Excel files.  Details on the architecture of [Linked Servers](http://msdn.microsoft.com/en-us/library/ms188279.aspx) can be found in the SQL Server BOL.

This post will focus on a how to apply the principle of least privilege on a Linked Server connection.  The first step is to create the actual Linked Server.

``` sql
EXEC MASTER.dbo.sp_addlinkedserver
    @server = N'AWConn',
    @srvproduct=N'AWConn',
    @provider=N'SQLOLEDB',
    @datasrc=N'SQLHost\INST1,9356',
    @catalog=N'AdventureWorks';
```

The above will create the _AWConn_ Linked Server which will redirect connections to the SQL Server instance _SQLHost\Inst1_ on port 9356 (alternatively you could use an individual application DNS as explained in [another post](/blog/index.php/2011/04/sql-server-connection-strings-unique-application-dns-and-listening-ports/).  There are other configuration settings which have to be defined however, the most relevant one at this point is the one that allows outbound RPC traffic.

``` sql
EXEC MASTER.dbo.sp_serveroption
    @server=N'AWConn',
    @optname=N'rpc out',
    @optvalue=N'true';
```

At this point we have to decide how connections will be opened using this Linked Server.  We have three options to achieve this:

1. Allow connections using the current credentials (SQL logins and passwords should be synchronised)

    ``` sql
    EXEC MASTER.dbo.sp_addlinkedsrvlogin
        @rmtsrvname=N'AWConn',
        @useself=N'True',
        @locallogin=NULL,
        @rmtuser=NULL,
        @rmtpassword=NULL;
    ```

2. Map a local login to a remote login

    ``` sql
    EXEC MASTER.dbo.sp_addlinkedsrvlogin
        @rmtsrvname = N'AWConn',
        @locallogin = N'login001',
        @useself = N'False',
        @rmtuser = N'login999',
        @rmtpassword = N'P@ssw0rd';
    ```

3. Map all other local logins to a single remote login (catch all)

    ``` sql
    EXEC MASTER.dbo.sp_addlinkedsrvlogin
        @rmtsrvname=N'AWConn',
        @useself=N'False',
        @locallogin=NULL,
        @rmtuser=N'login999',
        @rmtpassword='P@ssw0rd';
    ```

In the case of assigning permissions, in my opinion, the most secure option is to use the second option where each local login is mapped to a specific remote login.  The downside is that once set, the password is NOT retrievable (easily...  I haven't managed).  Should a change be required to the password of the remote login, there will be an administrative effort on the DBAs part where you'd have to drop all local logins associated with the remote login (see sample below), then recreate them using the script sample in option 2.

#### Deleting a linked server login ####

``` sql
EXEC MASTER.dbo.sp_droplinkedsrvlogin
    @rmtsrvname = N'AWConn',
    @locallogin = 'login001';
```

Additional tests were carried out in order to verify the security of an implementation where the same SQL Server instance would be shared by multiple systems, and with the same users possibly accessing different application and/or databases.

Consider this scenario:

User 1 with login "user001" uses 2 applications developed by the company's developers or by third parties; Application A &amp; Application B.  Both applications require access to a particular database which is now hosted on this shared environment.  In the previous paragraphs I mentioned that option 2 was the most secure; we now have to perform the necessary steps to grant the required permissions.

To keep it simple, lets say that User 1 requires SELECT permissions on the database table "Employees" for Application A and SELECT permissions on table "Invoices" for Application B.  The application administrator creates 2 sets of permissions, one for each application.  These will be named "permission001" and "permission002" accordingly.  We shall now map the login user001 on the local server with each of the permission sets using the code below:

``` sql
EXEC MASTER.dbo.sp_addlinkedsrvlogin
    @rmtsrvname = N'AWConn',
    @locallogin = N'user001',
    @useself = N'False',
    @rmtuser = N'permission001',
    @rmtpassword = N'pa$$w0rd';

EXEC MASTER.dbo.sp_addlinkedsrvlogin
    @rmtsrvname = N'AWConn',
    @locallogin = N'user001',
    @useself = N'False',
    @rmtuser = N'permission002',
    @rmtpassword = N'qwerty1234';
```

We then execute the following 2 lines of code to simulate a user query:

``` sql
SELECT * FROM [AWConn].AdventureWorks.dbo.Employees; -- permission001
SELECT * FROM [AWConn].AdventureWorks.dbo.Invoices; -- permission002
```

Both statements execute, however the first one returns the following error:

> OLE DB error trace [Non-interface error:  OLE DB provider does not contain the table: ProviderName='AWConn', TableName='"AdventureWorks"."dbo"."Employee"'].
> Msg 7314, Level 16, State 1, Line 1
> OLE DB provider 'AWConn' does not contain table '"AdventureWorks"."dbo"."Employee"'.  The table either does not exist or the current user does not have permissions on that table.

The second query however returned the correct result set.  Following an investigation, the source of the error was found to be due to the user "user001" not being mapped to the "permission001" permission set.  Further testing showed that when executing the system stored procedure "sp_addlinkedsrvlogin" and passing a value for the parameter "@locallogin" equal to one which already exists this **OVERWRITES** the previous settings.  Thus, each login can be linked to only one set of permissions in a Linked Server configuration.  A workaround solution would be to create a linked server for each application, however this might entail creating as many linked servers as there are databases.  This would also create a further administrative overhead for database administrators.

Alternatively (though I wouldn't recommend it) one could put the responsibility of creating the connectivity to the database on the developer or application supplier.  One can create the equivalent of a linked server connection at runtime using the following as a sample:

``` sql
SELECT * FROM OPENROWSET(
    'SQLNCLI',
    'Server=SQLHost\Inst1;Database=AdventureWorks;Uid=permissions001;Pwd=pa$$w0rd;',
    'SELECT * FROM dbo.Employee')
```

Unfortunately the connection string for the [OPENROWSET (Transact-SQL)](http://msdn.microsoft.com/en-us/library/ms190312.aspx) function does not permit variable parameters and the credentials have to be part of the query.  The downside to this is that:

1. the username and password are stored within each stored procedure, view or function code;
2. credentials are passed over the network in clear text;
3. developers 'might' feel tempted to reuse the same username and password for different systems.

Another option would be that the application connects directly to the target database, bypassing the current database layer shown above.  In this case the user credentials would have to be stored within a parameter location, external to the application binaries and preferably in encrypted form (e.g. the app.config or the web.config).  Again, in this case the responsibility falls on the developer or application supplier.

In my opinion, a DBA should not sacrifice security over comfort.  Although DBAs do not "own" the data, they have the responsibility of making sure that the business' data is secure.  On the other hand, as DBAs we can make our life easier by building a set of scripts to manage or even delegate the assignment of permissions.  That is however another story.
