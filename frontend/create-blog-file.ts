const fs = require('fs');
const apiResponse = require('/tmp/rdkit-full.json');

const post = apiResponse;

const frontmatter = `---
title: "${post.title}"
slug: "${post.slug}"
date: "${post.published_at}"
lastmod: "${post.updated_at}"
summary: ${post.summary ? JSON.stringify(post.summary) : '""'}
tags: [RDKit, 化学, 可视化, JavaScript]
category: 化学
authors: [default]
show_toc: true
layout: PostLayout
draft: false
---

${post.content}
`;

fs.writeFileSync('/home/Sisyphus/zhengbi-yong.github.io/frontend/content/blog/rdkit化学结构可视化完整指南.md', frontmatter);
console.log('File created successfully');
