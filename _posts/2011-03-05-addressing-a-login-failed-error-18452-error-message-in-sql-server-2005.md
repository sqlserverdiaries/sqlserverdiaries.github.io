---
layout: post
date:   2011-03-05
title:  "Addressing a 'login failed' (Error 18452) error message in SQL Server 2005"
permalink: ./blog/index.php/2011/03/05/addressing-a-login-failed-error-18452-error-message-in-sql-server-2005/
published: true
tags:
    - SQL Server
    - Connection Strings
    - Database Administration
    - SQL Server errors
    - Security
comments: false
---
An excellent article posted by Il-Sung Lee (Program Manager, SQL Server Protocols) at [Understanding "login failed" (Error 18456) error messages in SQL Server 2005](http://blogs.msdn.com/b/sql_protocols/archive/2006/02/21/536201.aspx) describes the various error message severity levels.

Recently a user who uses an application which connects to an SQL Server 2005 instance using Windows Authentication from a Windows XP machine complained that she was getting a "login failed" error message.  An extract from the SQL Server Error Log is shown below:

``` text
2011-02-28 08:15:10.780 Logon  Error: 18452, Severity: 14, State: 1.
2011-02-28 08:15:10.780 Logon  Login failed for user ''. The user is not associated with a trusted SQL Server connection. [CLIENT: <ip_address>]
```

The error number (18452) is different than the one described in the blog post mentioned above.  We also noticed that this set of entries was immediately followed by:

``` text
2011-02-28 08:15:10.780 Logon  Error: 17806, Severity: 20, State: 2.
2011-02-28 08:15:10.780 Logon  SSPI handshake failed with error code 0x8009030c while establishing a connection with integrated security; the connection has been closed. [CLIENT: <ip_address>]
```

It seems that the Windows Authentication was failing.  After discussing this with our Active Directory administrators we found that the user had just changed her domain password.  We asked the user to log off and log on again to allow Windows to refresh the [access token](http://en.wikipedia.org/wiki/Access_token) which solved the issue.
