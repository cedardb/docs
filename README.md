# CedarDB Documentation

This repository contains the code for the [CedarDB documentation](https://cedardb.com/docs).
The documentation is built by the static-site-generator [Hugo](https://gohugo.io/) and uses the [Hextra](https://imfing.github.io/hextra/docs/guide/) theme.

Clone repository:
```shell
git clone --recurse-submodules git@github.com:cedardb/docs.git
```

Run a web server:
```
cd docs_staging
hugo server
```

If you want to exclude the page from being built please add the following to the front matters.
```
draft: true
```

If you want to exclude the page until a certain publication date please add the following to the front matters.
```
publishDate: 2023-10-19T00:40:04-07:00
```

If you plan to use large tables, please create and edit them using [TableGenerator](https://www.tablesgenerator.com/markdown_tables) or similar tools to ensure well-formatted tables in the docs.
