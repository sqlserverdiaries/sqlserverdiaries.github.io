---
layout: post
date:   2012-11-03
title:  "Deciding on MIN and MAX Memory Configuration Settings"
permalink: ./blog/index.php/2012/11/deciding-on-min-and-max-memory-configuration-settings/
categories: blog
published: true
tags: [Architecture, Database Administration, Performance, Database Documentation, Microsoft Cluster, SQL Server]
comments: false
---
It is a well known fact that SQL Server is a “memory junkie” – with the default settings it will consume and reserve all the available memory until the service or the server is restarted.  This may cause a problem on servers which have other services or applications running (such as antivirus, backup programs, etc.), and which will require an amount to function. That is why setting the correct memory and not leaving the default ones is of utmost importance.  Of course working out the amount of memory allocations requires a formula of some sort. For smallish systems you don’t really have to though.  Just make sure you leave 2GB for the OS and the rest can be allocated to SQL Server.

The default values for minimum and maximum memory settings are zero and 2,147,483,647 respectively.  Of course having that amount of memory on a machine is unheard of, to date.  Or at least I haven’t.  As explained above this effectively means that SQL Server will keep allocating memory until all the available is consumed.  At that point you might need to restart the service, disrupting your applications and end-users, to be able to troubleshoot the server.  So setting these values is paramount.

To set the values you can use the SSMS GUI.  I am more comfortable using scripts.  The below is a sample script which will set the minimum at 4GB and a maximum of 10GB.  Values have to be in MB.

``` sql
USE [master]
GO

SET NOCOUNT ON;

DECLARE @ConfigName nvarchar(35);
DECLARE @ConfigValue int;

---------
SET @ConfigName = 'show advanced options';
SET @ConfigValue = 1;
IF EXISTS(
    SELECT 1 FROM sys.configurations WHERE [name] = @ConfigName 
    AND [value_in_use] <> @ConfigValue)
BEGIN
    EXEC sp_configure @ConfigName, @ConfigValue;
    RECONFIGURE;
END

---------
SET @ConfigName = 'min server memory (MB)';
SET @ConfigValue = 4096;
IF EXISTS(
    SELECT 1 FROM sys.configurations WHERE [name] = @ConfigName 
    AND [value_in_use] <> @ConfigValue)
BEGIN
    EXEC sp_configure @ConfigName, @ConfigValue;
    RECONFIGURE;
END

---------
SET @ConfigName = 'max server memory (MB)';
SET @ConfigValue = 10240;
IF EXISTS(
    SELECT 1 FROM sys.configurations WHERE [name] = @ConfigName 
    AND [value_in_use] <> @ConfigValue)
BEGIN
    EXEC sp_configure @ConfigName, @ConfigValue;
    RECONFIGURE;
END

/* FINALLY */
---------
SET @ConfigName = 'show advanced options';
SET @ConfigValue = 0;
IF EXISTS(
    SELECT 1 FROM sys.configurations WHERE [name] = @ConfigName 
    AND [value_in_use] <> @ConfigValue)
BEGIN
    EXEC sp_configure @ConfigName, @ConfigValue;
    RECONFIGURE;
END
GO
```

I use the above script to set other configuration option by changing the values of the @ConfigName and @ConfigValue variables.  Feel free to customise it as necessary for your configuration.

SQL Server allocates (or consumes) memory according to the amount required at that point in time.  This means that at startup you will observe that the service will be using much less than the minimum memory set.  But memory will not be released back to the OS until the minimum threshold is passed.  Once the value is reached, memory used by SQL Server will fluctuate between the min and max settings but will never go below the value of the min and of course will not surpass the max either.

The value for the max memory setting can either be set as 2GB less than the amount of memory available to the server (physical or virtual) or worked out using the formulae below.

For 32-bit systems:
> (255 + (8 * ([CPU Cores] – 4))) * 4MB

For 64-bit systems:
> (512 + (8 * ([CPU Cores] – 4))) * 4MB

NOTE: In the case of 64-bit systems, the maximum value for the [CPU Cores] is 64.

So, using the above formulas, for a 64-bit system with 4 quad-cores (i.e. 16 CPU) the memory required would work out as follows:

> **(512 + (8 * 12)) * 4MB = 2,432MB**

Should you have multiple SQL Server instances on the same box, or in the case of a clustered setup, these formulas will give a clear indication of how the memory should be shared.  The working have to be calculated for each instance that will be using the resources available to the hosting environment.

Read more about memory settings in the MSDN Library articles below:

[Server Memory Server Configuration Options](http://msdn.microsoft.com/en-us/library/ms178067.aspx "Server Memory Server Configuration Options")

[Effects of min and max server memory](http://msdn.microsoft.com/en-us/library/ms180797.aspx "Effects of min and max server memory")

[Memory Architecture](http://msdn.microsoft.com/en-us/library/ms187499.aspx "Memory Architecture")
