---
theme: default
background: https://source.unsplash.com/1920x1080/?nature
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## Slidev 演示文稿 1

  这是第一个 Slidev 演示文稿的示例
drawings:
  persist: false
transition: slide-left
title: Slidev 演示文稿 1
mdc: true
routerMode: hash
---

# Slidev 演示文稿 1

欢迎使用 Slidev

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    开始演示 <carbon:arrow-right class="inline"/>
  </span>
</div>

---

## layout: default

# 第二页

这是演示文稿的第二页内容

- 项目 1
- 项目 2
- 项目 3

---

layout: center
class: text-center

---

# 第三页

感谢观看！
