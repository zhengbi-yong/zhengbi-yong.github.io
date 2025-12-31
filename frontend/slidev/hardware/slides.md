---
theme: apple-basic
# random image from a curated Unsplash collection by Anthony
# like them? see https://unsplash.com/collections/94734566/slidev
background: ./images/hero_image.png
# some information about your slides (markdown enabled)
title: 项目进展
info: |
  多个项目的阶段性成果汇总
# apply UnoCSS classes to the current slide
class: text-center
# https://sli.dev/features/drawing
drawings:
  persist: false
# slide transition: https://sli.dev/guide/animations.html#slide-transitions
transition: slide-left
# enable MDC Syntax: https://sli.dev/features/mdc
mdc: true
# base path for GitHub Pages deployment - note the trailing slash is important
base: /pre/hardware/
# download url for assets
download: /pre/hardware/
# router mode for GitHub Pages compatibility
routerMode: hash
---

<div class="flex flex-col items-center justify-center h-full">
  <div v-motion :initial="{ opacity: 0, y: 30 }" :enter="{ opacity: 1, y: 0, transition: { duration: 800, ease: 'easeOut' } }">
    <h1 class="text-7xl font-bold text-gray-900 mb-4 tracking-tight">自研硬件体系</h1>
    <p class="text-2xl text-gray-500 font-light">Hardware Development Progress</p>
  </div>

  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { delay: 400, duration: 800 } }" class="mt-16">
    <a href="https://github.com/zhengbi-yong" target="_blank" class="text-gray-400 hover:text-gray-900 transition-colors">
      <carbon:logo-github class="w-10 h-10" />
    </a>
  </div>
</div>

<!--
The last comment block of each slide will be treated as slide notes. It will be visible and editable in Presenter Mode along with the slide. [Read more in the docs](https://sli.dev/guide/syntax.html#notes)
-->

---

# 目录

<div class="max-w-3xl mx-auto">
  <ul class="space-y-4">
    <li v-click="1" class="flex items-start gap-3 py-2">
      <span class="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
      <div>
        <span class="font-semibold text-blue-600">灵巧手</span>
        <span class="text-gray-400 ml-2">— 自研人手尺寸绳驱灵巧手</span>
      </div>
    </li>
    <li v-click="2" class="flex items-start gap-3 py-2">
      <span class="mt-1 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></span>
      <div>
        <span class="font-semibold text-purple-600">灵巧手-视触觉</span>
        <span class="text-gray-400 ml-2">— 装载视触觉传感器的灵巧手</span>
      </div>
    </li>
    <li v-click="3" class="flex items-start gap-3 py-2">
      <span class="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
      <div>
        <span class="font-semibold text-green-600">视触觉传感器-平面</span>
        <span class="text-gray-400 ml-2">— 基于 9DTact 研发</span>
      </div>
    </li>
    <li v-click="4" class="flex items-start gap-3 py-2">
      <span class="mt-1 w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
      <div>
        <span class="font-semibold text-orange-600">视触觉传感器-球面</span>
        <span class="text-gray-400 ml-2">— 基于 PP-Tac 研发</span>
      </div>
    </li>
    <li v-click="5" class="flex items-start gap-3 py-2">
      <span class="mt-1 w-2 h-2 rounded-full bg-pink-500 flex-shrink-0"></span>
      <div>
        <span class="font-semibold text-pink-600">视触觉传感器-人手尺寸</span>
        <span class="text-gray-400 ml-2">— 自研指尖尺寸传感器</span>
      </div>
    </li>
    <li v-click="6" class="flex items-start gap-3 py-2">
      <span class="mt-1 w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></span>
      <div>
        <span class="font-semibold text-teal-600">关节电机-中空轴向磁通</span>
        <span class="text-gray-400 ml-2">— 自研轴向磁通电机</span>
      </div>
    </li>
  </ul>
</div>

---

# 友商-灵巧手-舵机直驱

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
    <ImageCard
        src="./images/allegro_hand.png"
        alt="allegro hand"
        caption="Allegro Hand"
    />
    <ImageCard
        src="./images/LEAP_hand.png"
        alt="LEAP Hand"
        caption="LEAP Hand"
        :delay="200"
    />
</div>


---

# 舵机直驱灵巧手缺点

<div class="grid md:grid-cols-2 gap-8 items-center">
  <div class="w-full">
    <div
      v-motion
      :initial="{ opacity: 0, x: -20 }"
      :enter="{ opacity: 1, x: 0, transition: { duration: 600, ease: 'easeOut' } }"
      class="aspect-square w-full max-w-3xl mx-auto bg-gray-900 rounded-xl shadow-lg overflow-hidden flex items-center justify-center"
    >
      <video
        class="w-full h-full object-contain"
        :src="leapVideo"
        controls
        preload="metadata"
        playsinline
      >
        您的浏览器不支持视频播放。
      </video>
    </div>
  </div>

  <div>
    <h2 class="section-header text-blue-600">直驱的缺点</h2>
    <ul class="animated-list space-y-3">
      <li
        v-motion
        :initial="{ opacity: 0, x: -10 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 100, duration: 500, ease: 'easeOut' } }"
        class="bullet-blue"
      >
        体积大
      </li>
      <li
        v-motion
        :initial="{ opacity: 0, x: -10 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 200, duration: 500, ease: 'easeOut' } }"
        class="bullet-blue"
      >
        由于体积大一般只有三到四根手指
      </li>
      <li
        v-motion
        :initial="{ opacity: 0, x: -10 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 300, duration: 500, ease: 'easeOut' } }"
        class="bullet-blue"
      >
        指头粗导致精细操作困难
      </li>
      <li
        v-motion
        :initial="{ opacity: 0, x: -10 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 400, duration: 500, ease: 'easeOut' } }"
        class="bullet-blue"
      >
        大电机在手掌上制约设计
      </li>
    </ul>
  </div>
</div>


