---
layout: post
date:   2011-07-16
title:  "SQL Agent jobs originated from an MSX server"
permalink: ./blog/index.php/2011/07/sql-agent-jobs-originated-from-an-msx-server/
categories: blog
published: true
tags: [Database Migration, Database Administration, Virtualization, SQL Server, SQL Server 2000, SQL Server Agent, SQL Server errors]
comments: false
---
We recently virtualized a server whose hardware was so dated it would probably have been cheaper to buy a new server than to maintain it. After verifying that it was a good candidate for virtualization, we scheduled a downtime and our virtualization experts converted the physical machine.

Unfortunately, after a few days the environment, which incidentally was an SQL Server 2000 hosted on a Windows 2000 Server, whose hardware was old and had had so many packages installed and reconfigurations that we began to experience a kaleidoscope of errors.  After a brainstorming session with our management we decided to create a new virtual server with a clean installation of Windows 2003 Server and SQL Server 2000. We decided to upgrade the operating system because the server role was that of a database server. We did not though consider upgrading the SQL Server installation because we had not yet tackled the legacy applications connecting to it. This exercise would have given us some breathing space to start that part of the project.

After installing the Windows 2003 Server and finalising the SQL Server 2000 configuration (as the default instance), as well as countless reboots to bring the OS to the latest patch level, the server was ready to start hosting the migrated databases. We decided to use a backup-restore approach to migrate the databases, with a shorter time window of downtime on the systems and which was communicated and agreed upong with the end users.

The new server was also joined to the domain with a different name and IP address to the old one. Our plan was to switch off the old server once the migration was complete, and change the IP address of the new server as well as rename the new server so that we wouldn’t have to modify any network access lists, client configurations, etc.  The implementation tasks we planned are shown below.

1. Script the logins.
2. Script the SQL Agent jobs.
3. Restrict access to the databases.
4. Back up the databases.
5. Copy the backup files to the new server.
6. Restore the databases.
7. Create the logins using the script created in step 1 above.
8. Create the SQL Agent jobs using the script created in step 2.
9. Shut down the old server.
10. Change the server IP address.
11. Rename the server.
12. Reboot.
13. Rename the SQL Server instance using the _sp\_dropserver_ and _sp\_addserver_ stored procedures.
14. Restart the SQL Server instance.
15. Test and verify.
16. Allow access to the databases.
17. Go live with the new environment.
18. Go home.

As you can see the plan covered all the obvious steps and we were quite confident that the migration was going to be a success and that we would manage to complete it within the agreed time frames. Actually the only item that proved to be a problem were testing that the SQL Agent jobs could run correctly. When attempting to stat a job and even when trying to open a job to edit it, it was raising the following error:

>Error 14274: Cannot add, update, or delete a job (or its steps or schedules) that originated from an MSX server. The job was not saved.

A quick web search pointed us to the [Microsoft Knowledgebase article 281642 (PRB: Error 14274 Occurs When You Update a SQL Agent Job After Renaming Windows Server)](http://support.microsoft.com/kb/281642) and which is marked as a problem. The article basically stated that this behaviour was expected in SQL Server 2000 and that to avoid it we should have created the SQL Agent jobs **after** renaming the SQL Server instance. The article went on to suggest that we rename the SQL Server instance back to the original name (using _sp\_dropserver_ and _sp\_addserver_), restart it, delete all the jobs, rename the instance to the new name, restart it, and finally recreate the jobs.

The first part went well. We were however still getting the same error when attempting to delete the jobs. The same article explained that this issue was due to the Server Name being stored in the _originating\_server_ column of the _msdb..sysjobs_ table. At that point time was pressing. Knowing that the server was temporary (i.e. a few months) we decided to (risk and) manually update the _sysjobs_ table records with the new server name.

The server was renamed and, after restarting, the jobs could be deleted and recreated from the scripts. Success! Go live!!
