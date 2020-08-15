# NOTES FOR NEW ARTICLES #

## Ideas ##

* Add Comedy section - send your stories

* URL rewriting using Jekyll - avoid Wordpress structure but retain old URLs

* Crete a Picture Gallery - SQL-related pictures

* List of (favourite) Podcasts

* Ghost is taking full backup and breaking my backup chain . Be careful with Azure VM backup on VM having SQL server installation  
  <http://www.practicalsqldba.com/2020/05/a-ghost-is-taking-full-backup-and.html>

* Capture User Errors using Profiler Trace / Servier-side Trace / Extended Events
  Especially useful after making breaking changes, such as revoking elevated permissions

* Using a Global Temporary Table as a staging destination when importing data (e.g. from Excel)

* Why SQL Injection is still in the OWASP TOP 10 Application Vulnerabilities

* Renaming the MASTER database in SQL Server (and why you can not)

* DBA Appreciation Day - 3rd July

* Convert columns to support Unicode character

* Using xp_cmdshell "creatively"
  Example showing creating/downloading malicious code, compiling it (if necessary), elevating permissions by exploiting vulnerabilities
  (such as: missing patches, incorrectly configured service account, use cached Admin credentials, etc.), creating Domain Admin...GAME OVER!
  * run PowerShell script using sys.xp_cmdshell;
  * download EXE from the web;
  * install "dummy" Application under User profile OR run Application.
  Will need input from ITSEC Pros - reference/appreciation in article

* Create TEMPDB files in Temporary Drive in Azure VM (IAAS)
  Include creating a Sceduled Task
  
* Prepping the disks for a SQL Server installation (see PoSh script)
  
* Break down PowerShell scripts which move System Databases and configure SQL Server instance into seperate articles/posts

* Review scripts created at Axla and convert to posts/articles

* Transferring Large Amounts of Data Using Linked Servers (e.g. archiving to a different server)

* Kill Sleeping sessions older than N hours

* How a Scalar Function used in a Default Constraint causes RBAR Operations

* Migrating (and Upgrading) Database Using Database Mirroring

## Reference ##

* Languages known to GitHub
  <https://github.com/github/linguist/blob/master/lib/linguist/languages.yml>

* Working with Tables in GitHub Markdown
  <https://www.pluralsight.com/guides/working-tables-github-markdown>
