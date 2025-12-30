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

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-start">
    <div class="flex flex-col items-center">
        <div class="relative w-80 h-80">
            <img
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :enter="finalMotion"
                class="w-full h-full object-contain"
                src="./images/allegro_hand.png"
                alt="allegro hand"
            />
        </div>
        <div 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 600, duration: 400 } }" 
            class="mt-4 text-lg font-semibold text-center"
        >
            Allegro Hand
        </div>
    </div>

  <div class="flex flex-col items-center">
        <div class="relative w-80 h-80">
            <img
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :enter="finalMotion"
                class="w-full h-full object-contain"
                src="./images/LEAP_hand.png"
                alt="LEAP Hand"
            />
        </div>
        <div
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 600, duration: 400 } }"
            class="mt-4 text-lg font-semibold text-center"
        >
            LEAP Hand
        </div>
    </div>

</div>


---

# 舵机直驱灵巧手缺点

<div class="grid md:grid-cols-2 gap-10 items-center">
  <!-- 左侧：16:9 容器，竖屏视频完整呈现（letterbox，不裁切） -->
  <div class="w-full">
    <!-- 关键：用 aspect-[16/9] + object-contain 保证竖屏视频不被裁切 -->
    <div
      v-motion
      :initial="{ opacity: 0, x: -24 }"
      :enter="videoSpring"
      class="aspect-[1/1] w-full max-w-3xl mx-auto bg-black/80 rounded-xl shadow-lg overflow-hidden flex items-center justify-center"
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

  <!-- 右侧：文字列表（左右弹簧摆动，缓慢停止） -->
  <div>
    <h2 class="text-2xl font-semibold mb-6 text-gray-800">直驱的缺点</h2>
    <ul class="space-y-3">
      <li v-motion :initial="getSwayInitial(0)" :enter="getSpringSway(0)" class="">
        体积大
      </li>
      <li v-motion :initial="getSwayInitial(1)" :enter="getSpringSway(1)" class="">
        由于体积大一般只有三到四根手指
      </li>
      <li v-motion :initial="getSwayInitial(2)" :enter="getSpringSway(2)" class="">
        指头粗导致精细操作困难
      </li>
      <li v-motion :initial="getSwayInitial(3)" :enter="getSpringSway(3)" class="">
        大电机在手掌上制约设计
      </li>
    </ul>
  </div>
</div>


---

# 友商-灵巧手-空心杯

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-start">
    <div class="flex flex-col items-center">
        <div class="relative w-80 h-80">
            <img
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :enter="finalMotion"
                class="w-full h-full object-contain"
                src="./images/unitree_dex5.png"
                alt="宇树 Dex5"
            />
        </div>
        <div 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 600, duration: 400 } }" 
            class="mt-4 text-lg font-semibold text-center"
        >
            宇树 Dex5
        </div>
    </div>

  <div class="flex flex-col items-center">
        <div class="relative w-80 h-80">
            <img
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :enter="finalMotion"
                class="w-full h-full object-contain"
                src="./images/inspire_hand.png"
                alt="Inspire Hand"
            />
        </div>
        <div
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 600, duration: 400 } }"
            class="mt-4 text-lg font-semibold text-center"
        >
            因时灵巧手
        </div>
    </div>

</div>


---

# 灵巧手

<div class="grid md:grid-cols-2 gap-8 items-center">
  <!-- 左侧：图片 -->
  <div class="flex justify-center md:justify-start">
    <img
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="finalMotion"
      class="max-h-[22rem] w-auto object-contain"
      src="./images/orca_hand.png"
      alt="ORCA 灵巧手"
    />
  </div>

  <!-- 右侧：优势（弹簧式左右摆动并逐渐停下） -->
  <div>
    <h2
      v-motion
      :initial="{ opacity: 0, x: -8 }"
      :enter="{ opacity: 1, x: 0, transition: { duration: 500, ease: 'easeOut' } }"
      class="text-xl font-semibold mb-4 origin-left "
    >
      优势
    </h2>

  <ul class="space-y-3">
      <li v-motion :initial="getSwayInitial(0)" :enter="getSpringSway(6)" class="">性价比高，舵机下移，用便宜舵机获得更大力</li>
      <li v-motion :initial="getSwayInitial(1)" :enter="getSpringSway(6)" class="">绳驱最大化设计自由度</li>
      <li v-motion :initial="getSwayInitial(2)" :enter="getSpringSway(0)" class="">高自由度与精细操控</li>
      <li v-motion :initial="getSwayInitial(3)" :enter="getSpringSway(1)" class="">自适应抓取，适配多形状/材质目标</li>
      <li v-motion :initial="getSwayInitial(4)" :enter="getSpringSway(3)" class="">轻量化与低功耗设计</li>
      <li v-motion :initial="getSwayInitial(5)" :enter="getSpringSway(5)" class="">模块化部件，维护更友好</li>
    </ul>

  </div>
</div>


---

# 灵巧手-视触觉

<div class="grid md:grid-cols-2 gap-8 items-center">
  <!-- 左侧：图片 -->
  <div class="flex justify-center md:justify-start">
    <img
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="finalMotion"
      class="max-h-[22rem] w-auto object-contain"
      src="./images/tipsight_hand.png"
      alt="自研高自由度视触觉灵巧手"
    />
  </div>

  <!-- 右侧：优势（弹簧式左右摆动并逐渐停下） -->
  <div>
    <h2
      v-motion
      :initial="{ opacity: 0, x: -8 }"
      :enter="{ opacity: 1, x: 0, transition: { duration: 500, ease: 'easeOut' } }"
      class="text-xl font-semibold mb-4 origin-left "
    >
      优势
    </h2>

  <ul class="space-y-3">
      <li v-motion :initial="getSwayInitial(0)" :enter="getSpringSway(6)" class="">五个指尖均有超高精度视触觉传感器</li>
      <li v-motion :initial="getSwayInitial(1)" :enter="getSpringSway(6)" class="">低成本</li>
      <li v-motion :initial="getSwayInitial(2)" :enter="getSpringSway(0)" class="">柔性自适应</li>
    </ul>

  </div>
</div>


---

# 自研视触觉灵巧手

<div class="w-full flex items-center justify-center px-6">
  <!-- 可按实际视觉调整 9rem（标题+上下留白的总高度） -->
  <!-- <div class="w-full max-w-4xl h-[calc(100vh-30rem)]"> -->
    <video
      class="w-half h-full object-contain rounded-xl shadow-lg"
      :src="leapVideo"
      controls
      preload="metadata"
      playsinline
    >
      您的浏览器不支持视频播放。
    </video>
  <!-- </div> -->
</div>

<script setup lang="ts">
import leapVideo from './videos/wanren_hand_withvt.mp4'
</script>

---

# 友商-压阻式触觉传感器

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-start">
    <div class="flex flex-col items-center">
        <div class="relative w-80 h-80">
            <img
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :enter="finalMotion"
                class="w-full h-full object-contain"
                src="./images/tac_yazu1.png"
                alt="条形压阻式传感器"
            />
        </div>
        <div 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 600, duration: 400 } }" 
            class="mt-4 text-lg font-semibold text-center"
        >
            条形压阻式传感器
        </div>
    </div>

  <div class="flex flex-col items-center">
        <div class="relative w-80 h-80">
            <img
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :enter="finalMotion"
                class="w-full h-full object-contain"
                src="./images/tac_yazu2.png"
                alt="圆形压阻式传感器"
            />
        </div>
        <div
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 600, duration: 400 } }"
            class="mt-4 text-lg font-semibold text-center"
        >
            圆形压阻式传感器
        </div>
    </div>

</div>

<script setup lang="ts">
// Define the final state and transition for the motion.
// This uses a "spring" effect for a natural, bouncy feel.
const finalMotion = {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
        type: 'spring',
        damping: 10,  // 控制震荡停止的速度
        stiffness: 20, // 控制弹簧的阻力 (速度)
        mass: 2       // 控制移动对象的“重量”
    }
}
</script>

---

# 压阻式传感器缺点

<div class="grid md:grid-cols-2 gap-10 items-center">
      <div class="flex flex-col items-center">
        <div class="relative w-80 h-80">
            <img
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :enter="finalMotion"
                class="w-full h-full object-contain"
                src="./images/tac_yazu1.png"
                alt="条形压阻式传感器"
            />
        </div>
        <div 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 600, duration: 400 } }" 
            class="mt-4 text-lg font-semibold text-center"
        >
            条形压阻式传感器
        </div>
    </div>

  <!-- 右侧：文字列表（左右弹簧摆动，缓慢停止） -->
  <div>
    <h2 class="text-2xl font-semibold mb-6 text-gray-800">压阻的缺点</h2>
    <ul class="space-y-3">
      <li v-motion :initial="getSwayInitial(0)" :enter="getSpringSway(0)" class="">
        力的维度信息不够丰富
      </li>
      <li v-motion :initial="getSwayInitial(1)" :enter="getSpringSway(1)" class="">
        测量范围有限
      </li>
      <li v-motion :initial="getSwayInitial(2)" :enter="getSpringSway(2)" class="">
        复杂曲面难以贴合
      </li>
      <li v-motion :initial="getSwayInitial(3)" :enter="getSpringSway(3)" class="">
        容易产生机械疲劳然后损坏
      </li>
    </ul>
  </div>
</div>


---

# 友商-ITPU

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-start">
    <div class="flex flex-col items-center">
        <div class="relative w-80 h-80">
            <img
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :enter="finalMotion"
                class="w-full h-full object-contain"
                src="./images/tac_itpu.png"
                alt="ITPU"
            />
        </div>
        <div 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 600, duration: 400 } }" 
            class="mt-4 text-lg font-semibold text-center"
        >
            ITPU
        </div>
    </div>

  <div class="flex flex-col items-center">
        <div class="relative w-80 h-80">
            <img
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :enter="finalMotion"
                class="w-full h-full object-contain"
                src="./images/tac_itpu_result.png"
                alt="ITPU结果"
            />
        </div>
        <div
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 600, duration: 400 } }"
            class="mt-4 text-lg font-semibold text-center"
        >
            ITPU结果
        </div>
    </div>

</div>

<script setup lang="ts">
// Define the final state and transition for the motion.
// This uses a "spring" effect for a natural, bouncy feel.
const finalMotion = {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
        type: 'spring',
        damping: 10,  // 控制震荡停止的速度
        stiffness: 20, // 控制弹簧的阻力 (速度)
        mass: 2       // 控制移动对象的“重量”
    }
}
</script>

---

# 视触觉传感器-平面

<div class="relative w-80 h-80 mx-auto">
  <img
    v-motion
    :initial="{ opacity: 0, scale: 0.95 }"
    :enter="finalMotion"
    class="absolute inset-0 w-full h-full object-contain"
    src="./images/9dtact.png"
    alt="9D Tact"
  />
</div>

<script setup lang="ts">
// Define the final state and transition for the motion.
// This uses a "spring" effect for a natural, bouncy feel.
const finalMotion = {
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  transition: {
    type: 'spring',
    damping: 10,  // Controls how quickly the oscillation stops
    stiffness: 20, // Controls the spring's resistance (speed)
    mass: 2       // Controls the weight of the moving object
  }
}
</script>

---

# 视触觉传感器-球面

<div class="relative w-80 h-80 mx-auto">
  <img
    v-motion
    :initial="{ opacity: 0, scale: 0.95 }"
    :enter="finalMotion"
    class="absolute inset-0 w-full h-full object-contain"
    src="./images/pptac.png"
    alt="PP-Tac"
  />
</div>

<script setup lang="ts">
// Define the final state and transition for the motion.
// This uses a "spring" effect for a natural, bouncy feel.
const finalMotion = {
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  transition: {
    type: 'spring',
    damping: 10,  // Controls how quickly the oscillation stops
    stiffness: 20, // Controls the spring's resistance (speed)
    mass: 2       // Controls the weight of the moving object
  }
}
</script>

---

# 视触觉传感器-球面-人手尺寸

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
  <div class="relative w-80 h-80">
    <img
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="finalMotion"
      class="w-full h-full object-contain"
      src="./images/tipsight.png"
      alt="TipSight"
    />
  </div>

  <div class="relative w-80 h-80">
    <img
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="finalMotion"
      class="w-full h-full object-contain"
      src="./images/tipsight_explode.png"
      alt="TipSight（爆炸图）"
    />
  </div>
</div>

<script setup lang="ts">
const finalMotion = {
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  transition: {
    type: 'spring',
    damping: 10,
    stiffness: 20,
    mass: 2
  }
}
</script>

---

# 视触觉传感器-球面-人手尺寸

<div class="grid md:grid-cols-2 gap-8 items-center">
  <!-- 左侧：图片 -->
  <div class="flex justify-center md:justify-start">
    <img
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="finalMotion"
      class="max-h-[22rem] w-auto object-contain"
      src="./images/tipsight.png"
      alt="自研超高精度视触觉传感器"
    />
  </div>

  <!-- 右侧：优势（弹簧式左右摆动并逐渐停下） -->
  <div>
    <h2
      v-motion
      :initial="{ opacity: 0, x: -8 }"
      :enter="{ opacity: 1, x: 0, transition: { duration: 500, ease: 'easeOut' } }"
      class="text-xl font-semibold mb-4 origin-left "
    >
      优势
    </h2>

  <ul class="space-y-3">
      <li v-motion :initial="getSwayInitial(0)" :enter="getSpringSway(0)" class="">
        相比压阻提高了 <span v-html="katexInline('\\frac{1920\\times 1080}{94} \\approx 22059')"></span> 倍
      </li>
      <li v-motion :initial="getSwayInitial(0)" :enter="getSpringSway(0)" class="">
        空间分辨率(面积) <span v-html="katexInline(' \\approx \\frac{1 \\mathbf{cm^2}}{1920*1080} \\approx 0.00000048225 \\mathbf{cm^2}')"></span>
      </li>
      <li v-motion :initial="getSwayInitial(0)" :enter="getSpringSway(0)" class="">
        空间分辨率(长度) <span v-html="katexInline(' \\approx \\sqrt{\\frac{1 \\mathbf{cm^2}}{1920*1080}} \\approx 0.000694 \\mathbf{cm}\\approx 0.00694 \\mathbf{mm} \\approx 6.94 \\mathbf{\\mu m}')"></span>
      </li>
      <li v-motion :initial="getSwayInitial(1)" :enter="getSpringSway(1)" class="">
        低成本
      </li>
      <li v-motion :initial="getSwayInitial(2)" :enter="getSpringSway(2)" class="">
        柔性自适应
      </li>
      <li v-motion :initial="getSwayInitial(2)" :enter="getSpringSway(2)" class="">
        算法可复用已经高度发展的CV领域的所有算法，例如ResNet、DenseNet、SwinTransformer、VisionMamba……
      </li>
    </ul>

  </div>
</div>

<script setup lang="ts">
/* 引入 KaTeX（Slidev 默认带样式，但用 API 渲染时显式引入更稳） */
import katex from 'katex'
import 'katex/dist/katex.min.css'

/* 工具函数：行内与块级渲染 */
const katexInline = (tex: string) =>
  katex.renderToString(tex, { throwOnError: false, displayMode: false })
const katexBlock = (tex: string) =>
  katex.renderToString(tex, { throwOnError: false, displayMode: true })

/** 图片入场：保留 spring 弹性 */
const finalMotion = {
  x: 0, y: 0, rotate: 0, scale: 1,
  transition: { type: 'spring', damping: 10, stiffness: 20, mass: 2 }
}

/** 标题：一次性弹簧落定（无循环） */
const titleSpring = {
  opacity: 1,
  x: 0,
  transition: {
    x: { type: 'spring', damping: 18, stiffness: 140, mass: 1 },
    opacity: { duration: 0.35, easing: 'ease-out' }
  }
}

/** 列表项初始：奇偶从左右轻微“拉开”进入 */
const getSwayInitial = (i: number, amp = 14) => ({
  opacity: 0,
  x: (i % 2 === 0 ? -1 : 1) * amp
})

/** 列表项：左右弹簧摆动并缓慢停止（不循环） */
const getSpringSway = (
  i: number,
  {
    delayBase = 0.10,  // 阶梯式入场延迟
    damping = 16,      // 阻尼：越大越快停下
    stiffness = 120,   // 刚度：越大越“紧”
    mass = 1.1         // 质量：越大惯性越强
  } = {}
) => ({
  opacity: 1,
  x: 0,
  transition: {
    delay: i * delayBase,
    opacity: { duration: 0.35, easing: 'ease-out' },
    x: { type: 'spring', damping, stiffness, mass }
  }
})
</script>

---

# 自研人手指尺寸视触觉传感器

<div class="w-full flex items-center justify-center px-6">
  <!-- 可按实际视觉调整 9rem（标题+上下留白的总高度） -->
  <!-- <div class="w-full max-w-4xl h-[calc(100vh-30rem)]"> -->
    <video
      class="w-half h-full object-contain rounded-xl shadow-lg"
      :src="leapVideo"
      controls
      preload="metadata"
      playsinline
    >
      您的浏览器不支持视频播放。
    </video>
  <!-- </div> -->
</div>

<script setup lang="ts">
import leapVideo from './videos/tipsight.mp4'
</script>

---

# 自研关节电机-轴向磁通电机

<div class="grid md:grid-cols-2 gap-8 items-center">
  <!-- 左侧：图片 -->
  <div class="flex justify-center md:justify-start">
    <img
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="finalMotion"
      class="max-h-[22rem] w-auto object-contain"
      src="./images/motor.png"
      alt="轴向磁通电机"
    />
  </div>

  <!-- 右侧：优势（弹簧式左右摆动并逐渐停下） -->
  <div>
    <h2
      v-motion
      :initial="{ opacity: 0, x: -8 }"
      :enter="{ opacity: 1, x: 0, transition: { duration: 500, ease: 'easeOut' } }"
      class="text-xl font-semibold mb-4 origin-left "
    >
      优势
    </h2>

  <ul class="space-y-3">
      <li v-motion :initial="getSwayInitial(0)" :enter="getSpringSway(0)" class="">
        功率密度高，在机器人典型应用场景中同体积下力矩是径向磁通的三倍
      </li>
      <li v-motion :initial="getSwayInitial(1)" :enter="getSpringSway(0)" class="">
        充分利用磁场，提高效率
      </li>
      <li v-motion :initial="getSwayInitial(2)" :enter="getSpringSway(0)" class="">
        自定义体积和力矩，软硬一体化设计，更有利于节能和节省冗余设计
      </li>
    </ul>

  </div>
</div>

<script setup lang="ts">
/* 引入 KaTeX（Slidev 默认带样式，但用 API 渲染时显式引入更稳） */
import katex from 'katex'
import 'katex/dist/katex.min.css'

/* 工具函数：行内与块级渲染 */
const katexInline = (tex: string) =>
  katex.renderToString(tex, { throwOnError: false, displayMode: false })
const katexBlock = (tex: string) =>
  katex.renderToString(tex, { throwOnError: false, displayMode: true })

/** 图片入场：保留 spring 弹性 */
const finalMotion = {
  x: 0, y: 0, rotate: 0, scale: 1,
  transition: { type: 'spring', damping: 10, stiffness: 20, mass: 2 }
}

/** 标题：一次性弹簧落定（无循环） */
const titleSpring = {
  opacity: 1,
  x: 0,
  transition: {
    x: { type: 'spring', damping: 18, stiffness: 140, mass: 1 },
    opacity: { duration: 0.35, easing: 'ease-out' }
  }
}

/** 列表项初始：奇偶从左右轻微“拉开”进入 */
const getSwayInitial = (i: number, amp = 14) => ({
  opacity: 0,
  x: (i % 2 === 0 ? -1 : 1) * amp
})

/** 列表项：左右弹簧摆动并缓慢停止（不循环） */
const getSpringSway = (
  i: number,
  {
    delayBase = 0.10,  // 阶梯式入场延迟
    damping = 16,      // 阻尼：越大越快停下
    stiffness = 120,   // 刚度：越大越“紧”
    mass = 1.1         // 质量：越大惯性越强
  } = {}
) => ({
  opacity: 1,
  x: 0,
  transition: {
    delay: i * delayBase,
    opacity: { duration: 0.35, easing: 'ease-out' },
    x: { type: 'spring', damping, stiffness, mass }
  }
})
</script>

---

# 自研关节电机-轴向磁通电机-原理

- 更大的有效转矩臂

$$
T=F \times r
$$

- 磁路更短，磁通利用率高

- 铜损更低，散热面积大

- 可模块化叠盘结构

$$
P\propto n盘​
$$

> 磁路短、转矩臂长、磁通利用率高、导线更短

---

# 自研关节电机-未来-中空轴向磁通电机

<div class="grid md:grid-cols-2 gap-8 items-center">
  <!-- 左侧：图片 -->
  <div class="flex justify-center md:justify-start">
    <img
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="finalMotion"
      class="max-h-[22rem] w-auto object-contain"
      src="./images/motor_sim.png"
      alt="中空轴向磁通电机"
    />
  </div>

  <!-- 右侧：优势（弹簧式左右摆动并逐渐停下） -->
  <div>
    <h2
      v-motion
      :initial="{ opacity: 0, x: -8 }"
      :enter="{ opacity: 1, x: 0, transition: { duration: 500, ease: 'easeOut' } }"
      class="text-xl font-semibold mb-4 origin-left "
    >
      优势
    </h2>

  <ul class="space-y-3">
      <li v-motion :initial="getSwayInitial(0)" :enter="getSpringSway(0)" class="">
        参数化建模和设计，快速迭代，广泛适配
      </li>
      <li v-motion :initial="getSwayInitial(1)" :enter="getSpringSway(0)" class="">
        中空便于机器人走线，使机器人更美观
      </li>
    </ul>

  </div>
</div>

<script setup lang="ts">
/* 引入 KaTeX（Slidev 默认带样式，但用 API 渲染时显式引入更稳） */
import katex from 'katex'
import 'katex/dist/katex.min.css'

/* 工具函数：行内与块级渲染 */
const katexInline = (tex: string) =>
  katex.renderToString(tex, { throwOnError: false, displayMode: false })
const katexBlock = (tex: string) =>
  katex.renderToString(tex, { throwOnError: false, displayMode: true })

/** 图片入场：保留 spring 弹性 */
const finalMotion = {
  x: 0, y: 0, rotate: 0, scale: 1,
  transition: { type: 'spring', damping: 10, stiffness: 20, mass: 2 }
}

/** 标题：一次性弹簧落定（无循环） */
const titleSpring = {
  opacity: 1,
  x: 0,
  transition: {
    x: { type: 'spring', damping: 18, stiffness: 140, mass: 1 },
    opacity: { duration: 0.35, easing: 'ease-out' }
  }
}

/** 列表项初始：奇偶从左右轻微“拉开”进入 */
const getSwayInitial = (i: number, amp = 14) => ({
  opacity: 0,
  x: (i % 2 === 0 ? -1 : 1) * amp
})

/** 列表项：左右弹簧摆动并缓慢停止（不循环） */
const getSpringSway = (
  i: number,
  {
    delayBase = 0.10,  // 阶梯式入场延迟
    damping = 16,      // 阻尼：越大越快停下
    stiffness = 120,   // 刚度：越大越“紧”
    mass = 1.1         // 质量：越大惯性越强
  } = {}
) => ({
  opacity: 1,
  x: 0,
  transition: {
    delay: i * delayBase,
    opacity: { duration: 0.35, easing: 'ease-out' },
    x: { type: 'spring', damping, stiffness, mass }
  }
})
</script>
