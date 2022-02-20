---
layout: post
date:   2022-02-20
title:  "Automate AG Failover on Standard Edition"
permalink: ./blog/index.php/2022/02/automate-ag-failover-on-standard-edition/
categories: blog
published: true
tags: [Database Administration, Availability Groups, Automation]
comments: true
---
Availability Groups (AGs) on Enterprise Edition can be used to group databases and have them failover together to Secondary nodes for example - the key words here are "Enterprise Edition" and "together".

Those who opt for the [cheaper] Standard Edition which supports [Basic Availability Groups](https://docs.microsoft.com/en-us/sql/database-engine/availability-groups/windows/basic-availability-groups-always-on-availability-groups) and which come with a number of limitations, one of which is that it supports a failover environment for a single database.

In a multi-database instance you can create multiple AGs, each with a single database, however failing them over together can prove to be a bit tricky.

Consider this scenario. Your AGs have the `FAILOVER_MODE` set to `MANUAL` because you want to control when the failover happens and don't want the database/s to fail over whenever there the Cluster panics due to a network glitch, DNS failure, etc. The problem is that, with multiple AGs, you would have to fail each AG over to the SECONDARY node manually too. Manageable with under a handful, however more challenging as the number of AGs increases.

In this scenario with, say 25 databases and 25 AGS, only one AG has a [Listener](https://docs.microsoft.com/en-us/sql/database-engine/availability-groups/windows/create-or-configure-an-availability-group-listener-sql-server) - the one holding the "main" database. You wouldn't need more than one Listener if all databases are related and possibly used by the same application/s. Remember that each Listener requires an IP address, and most (probably all) Network Administrators will not want ot dish out IPs unless absolutely required. Anyway, I digress.

Enter a SQL Agent job.

The job must be created on both Primary and Secondary nodes, can be scheduled to run every five minutes (or more frequently, and manually if necessary), and the "main" database specified in the `@DatabaseName` variable.

``` sql
SET NOCOUNT ON;
DECLARE @DatabaseName nvarchar(128) =N'MainDB';
IF 'PRIMARY' = (
    SELECT [role_desc] 
    FROM sys.dm_hadr_availability_replica_states hadrs
        INNER JOIN sys.availability_groups ag ON hadrs.[group_id] = ag..[group_id]
        INNER JOIN sys.availability_databases_cluster adc ON hadrs.[group_id] = adc.[group_id]
        LEFT JOIN sys.availability_group_listeners agl on hadrs.[group_id] = agl.[group_id]
    WHERE hadrs.[is_local] = 1 AND adc.[database_name] = @DatabaseName
)
BEGIN
    DECLARE @SqlCmd nvarchar(4000) = N'';
    SELECT @SqlCmd = N'ALTER AVAILABILITY GROUP ' + ag.[name] + N' FAILOVER; ' + @SqlCmd
    FROM sys.dm_hadr_availability_replica_states hadrs
        INNER JOIN sys.availability_groups ag ON hadrs.[group_id] = ag..[group_id]
        INNER JOIN sys.availability_databases_cluster adc ON hadrs.[group_id] = adc.[group_id]
        LEFT JOIN sys.availability_group_listeners agl on hadrs.[group_id] = agl.[group_id]
    WHERE hadrs.[is_local] = 1 AND agl.[dns_name] IS NULL AND hadrs.[role_desc] = 'SECONDARY'
    ORDER BY ag.[name], adc.[database_name];

    EXEC sp_executesql @SqlCmd;
END
```

The script checks if the "main" database has the current node set to "PRIMARY", then will dynamically build and execute `ALTER AVAILABILITY GROUP...FAILOVER` commands for all AGs which do not have a Listener and have not been moved (i.e. have the current node set to "SECONDARY").

&nbsp;

## References

* [Editions and Features of SQL Server](https://docs.microsoft.com/en-us/sql/sql-server/editions-and-components-of-sql-server-version-15)

* [Failover and Failover Modes (Always On Availability Groups)](https://docs.microsoft.com/en-us/sql/database-engine/availability-groups/windows/failover-and-failover-modes-always-on-availability-groups)

* [Basic Always On availability groups for a single database](https://docs.microsoft.com/en-us/sql/database-engine/availability-groups/windows/basic-availability-groups-always-on-availability-groups)

* [CREATE AVAILABILITY GROUP (Transact-SQL)](https://docs.microsoft.com/en-us/sql/t-sql/statements/create-availability-group-transact-sql)

* [Configure a listener for an Always On availability group](https://docs.microsoft.com/en-us/sql/database-engine/availability-groups/windows/create-or-configure-an-availability-group-listener-sql-server)
