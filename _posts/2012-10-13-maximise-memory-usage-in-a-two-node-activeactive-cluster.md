---
layout: post
date:   2012-10-13
title:  "Maximise Memory Usage in a Two-Node Active/Active Cluster"
permalink: ./blog/index.php/2012/10/maximise-memory-usage-in-a-two-node-activeactive-cluster/
categories: blog
published: true
tags: [Architecture, Database Administration, Performance, Virtualization, Code Samples, DMV, Linked Servers, Microsoft Cluster, SQL Server 2005, SQL Server 2008, SQL Server 2008 R2, SQL Server 2012, SQL Server Agent, Windows]
comments: false
---
When implementing and configuring a Two-Node Active/Active SQL Server Cluster you have to ensure that the memory allocation will suffice for the operating system and other services (a minimum of 2GB is reccomended), as well as for the eventuality when all instances would be on the same physical node. This means that if, for example, you purchased each of your nodes with 32GB of RAM, memory will be allocated as shown in the below table.

Service             | Memory (GB)
------------------- | ----------:
Operating System    | 2
Instance 1          | 15
Instance 2          | 15
&nbsp;

As you can see, in an Active-Active state, 15GB of memory are “wasted” for the “just in case” (or failover) scenario. That is a lot of unused memory, and this amount will be even greater for machines with higher specifications. This solution address this wastage by dynamically reconfiguring the SQL Server instances depending on whether both instances are on the same node or not.

The first step is defining and translating into T-SQL the relatively simple logic that will reconfigure the _“max server memory (MB)”_ option. In a nutshell, the memory configuration combinations are show below:

Instance 1 position     | Instance 2 position   | Memory (GB)
----------------------- | --------------------- | ----------:
Node A                  | Node B                | 30
Node A                  | Node A                | 15
Node B                  | Node A                | 30
Node B                  | Node B                | 15
&nbsp;

The stored procedure accepts two input and one output parameters. The @CallingNodeHostName will contain the name of the Node from where the procedure is being called; the @FullMemoryAllocation is the **total** amount of memory allocated for all instances; the value for the @CurrentNodeHostName will be returned by the stored procedure on completion.

``` sql
CREATE PROCEDURE [dbo].[usp_configure_server_memory]
    @CallingNodeHostName nvarchar(128),
    @FullMemoryAllocation int,
    @CurrentNodeHostName nvarchar(128) OUTPUT
AS
```

The instances also have to be able to inform each other of their Node position. This can be achieved by retrieving the value of the _ComputerNamePhysicalNetBIOS_, using the [SERVERPROPERTY function](http://msdn.microsoft.com/en-us/library/ms174396.aspx "SERVERPROPERTY (Transact-SQL)") and acting accordingly. Since the SERVERPROPERTY function returns an sql_variant data type, the result has to be converted to a character-type first.

``` sql
SET @CurrentNodeHostName = CAST(SERVERPROPERTY('ComputerNamePhysicalNetBIOS') as nvarchar(128));
```

The logic which decides whether to use the full allocation of only half is next. This is done by comparing the name of the node hosting the current instance with that supplied by the remote instance. I am also using the [FLOOR function](http://msdn.microsoft.com/en-us/library/ms178531.aspx "FLOOR (Transact-SQL)") to eliminate decimal values from the memory setting.

``` sql
IF (@CurrentNodeHostName = @CallingNodeHostName)
BEGIN
    -- if calling SQL Server instance is hosted on the CURRENT host, run in "degraded mode"
    SET @MemoryAllocation = FLOOR(@FullMemoryAllocation/2);
END
ELSE
BEGIN
    -- if calling SQL Server instance is hosted on the REMOTE host, run in "degraded mode"
    SET @MemoryAllocation = FLOOR(@FullMemoryAllocation);
END
```

The rest of the procedure will set the value of the _“max server memory (MB)”_ option using the [sp_configure](http://msdn.microsoft.com/en-us/library/ms188787.aspx "sp\_configure (Transact-SQL)") stored procedure. I am also checking for the value of the _”show advanced options”_ using the [sys.configurations DMV](http://msdn.microsoft.com/en-us/library/ms188345.aspx "sys.configurations (Transact-SQL)"), enabling it if it’s not and setting it back to the original value once the exercise is complete.

I deployed the stored procedure to the _master_ database since it is the first database that is brought online following a cluster failover/failback. The next part of the deployment requires a [Linked Server](http://msdn.microsoft.com/en-us/library/ms188279.aspx "Linked Servers (Database Engine)") on each node. The Linked Server authentication is a crucial part of the solution, without which calling the stored procedure across instances is not possible. The Linked Server can be created using the following sample as a guide:

``` sql
EXEC master.dbo.sp_addlinkedserver
    @server = N'SQLSRV1\SQLINST1',
    @srvproduct=N'SQLSRV1\SQLINST1',
    @provider=N'SQLNCLI',
    @datasrc=N'SQLSRV1\SQLINST1',
    @catalog=N'master';

EXEC master.dbo.sp_addlinkedsrvlogin
    @rmtsrvname=N'SQLSRV1\SQLINST1',
    @useself=N'True',
    @locallogin=NULL,
    @rmtuser=NULL,
    @rmtpassword=NULL;

EXEC master.dbo.sp_serveroption
    @server=N'SQLSRV1\SQLINST1',
    @optname=N'rpc out',
    @optvalue=N'true';
```

Once the Linked Servers have been created on both instances you can test that it is functional using the following and which should return a list of databases on the remote instance:

``` sql
EXEC [SQLSRV1\SQLINST1].master.sys.sp_databases;
```

And of course from the second instance:

``` sql
EXEC [SQLSRV2\SQLINST2].master.sys.sp_databases;
```

Once the Linked Server has been created and you confirmed that it’s working, the last step is to create an [SQL Server Agent job](http://msdn.microsoft.com/en-us/library/ms186273.aspx "Create Jobs"). The job should have a schedule which is [set to “Start automatically when SQL Server Agent starts”](http://msdn.microsoft.com/en-us/library/ms191439.aspx "Schedule a Job") and a single step containing the following T-SQL syntax:

``` sql
SET NOCOUNT ON;
DECLARE @CurrentHostName nvarchar(128),
        @RemoteHostName nvarchar(128);

SET @CurrentHostName = CAST(SERVERPROPERTY('ComputerNamePhysicalNetBIOS') as nvarchar(128));
SET @RemoteHostName = '';

PRINT @CurrentHostName;

PRINT 'SQLSRV1\SQLINST1';
EXEC [SQLSRV1\SQLINST1].master.dbo.usp_configure_server_memory
    @CallingNodeHostName = @CurrentHostName,
    @FullMemoryAllocation = 1024,
    @CurrentNodeHostName = @RemoteHostName OUTPUT;

PRINT 'SQLSRV2\SQLINST2';
EXEC master.dbo.usp_configure_server_memory
    @CallingNodeHostName = @RemoteHostName,
    @FullMemoryAllocation = 1024,
    @CurrentNodeHostName = '';
```

Of course the above T-SQL should be modified so that the SQL Server Agent job will call the remote stored procedure first then the local one. I used this approach because the reconfiguration has to be carried out every time any one of the instance is restarted (due to failover/failback or otherwise).

Once the entire setup is implemented you should try a couple of failovers/failbacks to ensure that everything is in order. Once all is set you can rest assured that the server memory in your cluster is being used to the maximum by the SQL Server instances.

The stored procedure and other parts of the solution can be downloaded using the below link.

[Maximise Memory Usage in a Two-Node Active/Active Cluster](/assets/article_files/2012/10/maximise-memory-usage-in-a-two-node-activeactive-cluster.zip)
