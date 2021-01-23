---
layout: post
date:   2021-01-23
title:  "Bringing the blog back"
permalink: ./blog/index.php/2021/01/bringing-the-blog-back/
categories: blog
published: true
tags: [Uncategorized]
comments: true
---

When I started thinking about bringing back the SQL Server Diaries blog, my starting point (and the only source to recover the old material) was an eight-year old WordPress export. Those who use Wordpress know that the data can be exported as a series of MySQL INSERT statements, as well as a XML file which can be imported through the WordPress UI.  Luckily I had both.

I also had copies of most of my posts as plain TXT files, as well as all the attachments and image files referenced in the articles.

Between the time I launched the site in January 2010 and when it was brought offline in December 2012, I had published more than 100 posts. Compared to some bloggers, this is not a substantial amount, however it isn't a small number either.

## A new blogging platform?

Everybody knows that technology moves at a rapid pace, and blogging platforms are no exception. I started looking at the available options, and of course the easiest would have been [WordPress](https://wordpress.com/). I was already in possession of the domain through another Registrar, however I didn't want to self-host a WordPress site and end up supporting it too. The only way to have a WordPress site with a Custom Domain and no Tech Support from my side was to transfer to WP, and pay a monthly charge.

Some 18 months ago a friend suggested using an open source flat-file CMS called [Grav](https://getgrav.org/). I had used a similar solution written in ASP.NET way back, which stored data as XML files in the "App_Data" folder, and required IIS for hosting. I liked the concept as it removed the need of a database (e.g. WordPress depends on MySQL), and I was so intrigued by the idea, that I started looking into what developments had been made since.

I also looked at writing in one of the already established platforms, such as [LinkedIn](https://www.linkedin.com/), [Medium](https://medium.com/), and [ITNEXT](https://itnext.io/) to name a few. Avoiding my own Tech Support and the possibility of making something extra out of my writing was tempting, however this meant that the old content would not be republished.

A final option that I looked into briefly, was hosting within [Azure Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website). This however also came with a Tech Support requirement, as well as a monthly charge.

## GitHub to the rescue

That is when I discovered [GitHub Pages](https://pages.github.com/). I have been using [GitHub](https://github.com/) as a repository for projects and scripts I write in my spare time, and the familiarity was a breath of fresh air. The only caveat at the time was that I would have to learn how to configure and use this blogging platform called [Jekyll](https://jekyllrb.com/). I later came to realise that my fears were unfounded.

So I followed the instructions, created a repository, cloned the repository, threw in my first _"Hello World"_ in an index.html file, pushed it to GitHub, and there it was!

Next, I went looking at how I was going to set up a local copy of Jekyll on my workstation. This is where a [Docker](https://www.docker.com/) container came in handy. I had been using [SQL Server 2017](https://microsoft.com/sql/) and later [SQL Server 2019](https://microsoft.com/sql/) on Linux in Docker containers for a couple of years, so I was already familiar with the technology.  A couple of online articles provided valuable guidance:

* [Running Jekyll in Windows Using Docker](https://www.jamessturtevant.com/posts/Running-Jekyll-in-Windows-using-Docker/)
* [Building a Jekyll Site on Windows with Docker](https://www.ryansouthgate.com/2018/05/31/building-a-jekyll-site-on-windows-with-docker/)
* [Building a static website with Jekyll and GitHub Pages](https://programminghistorian.org/en/lessons/building-static-sites-with-jekyll-github-pages)
* [Jekyll - Quickstart](https://jekyllrb.com/docs/)

Once I had Jekyll up and running in a Docker Container, a _docker-compose.yml_ file mapping the site volume correctly, and with two sample SQL Server Diaries posts converted to Markdown, I went on to look for themes. I found these at [Jekyll Themes](https://jekyllthemes.io/). I chose the [Beautiful Jekyll](https://beautifuljekyll.com/), and setting up the theme template was pretty straightforward.

## Conversion

This is when the pain started. I had around 100 articles, some of which contained encoded HTML, to convert to Markdown. I used a mixture of [Visual Studio Code](https://code.visualstudio.com/) and [Joplin](https://joplinapp.org/markdown/) to edit the MD files. In the case of VSCode, I decided to use the [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) and the [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) extensions for VSCode to review and visualise the content.

The Markdown syntax cheatsheet from the [GitHub Guides](https://guides.github.com/) proved to be very useful, as was the [Joplin Markdown Guide](https://joplinapp.org/markdown/). The first few were fun, because I was learning as I went along.  Like every repetitive action, this became a chore and by the 15th file I started looking for ways to speed up the process.

The quickest (or so I thought) was to use a HTML to Markdown converter, such as this: [Convert HTML to Markdown](https://www.browserling.com/tools/html-to-markdown).  It worked for me however I later came across other bloggers' experiences where more efficient approaches were used. Here's one example by Chrissy LeMaire - [Migrating my WordPress sites to GitHub Pages](https://blog.netnerds.net/2020/08/migrating-my-wordpress-sites-to-github-pages/).

## Final touches

Once all the articles had been converted, and all looked right, next was to configure other components of the website.  These included:

* [Linking A Custom Domain To Github Pages](https://richpauloo.github.io/2019-11-17-Linking-a-Custom-Domain-to-Github-Pages/)
* Delivery and protection using [Cloudflare](https://www.cloudflare.com/) - this only required pointing the Nameservers to those provided by Cloudflare.
* Configuring [Google Analytics](https://analytics.google.com/) and [Discus](https://disqus.com/) required setting up the respective accounts and using the ID provided by each service.

That's it! I got the site working on my test environment, and the final step was to check in all the Markdown files and see how it would work out.
