/**
 * GSAP 动态加载器
 * 用于按需加载 GSAP 核心和插件，优化 Bundle 大小
 */

let gsapLoaded = false
let gsapLoadPromise: Promise<typeof import('gsap')> | null = null

export async function loadGSAP() {
  if (gsapLoaded && typeof window !== 'undefined') {
    return await import('gsap')
  }

  if (gsapLoadPromise) {
    return gsapLoadPromise
  }

  gsapLoadPromise = import('gsap').then((gsapModule) => {
    gsapLoaded = true
    return gsapModule
  })

  return gsapLoadPromise
}

let scrollTriggerLoaded = false
let scrollTriggerLoadPromise: Promise<typeof import('gsap/ScrollTrigger')> | null = null

export async function loadScrollTrigger() {
  if (scrollTriggerLoaded && typeof window !== 'undefined') {
    return await import('gsap/ScrollTrigger')
  }

  if (scrollTriggerLoadPromise) {
    return scrollTriggerLoadPromise
  }

  scrollTriggerLoadPromise = import('gsap/ScrollTrigger').then((scrollTriggerModule) => {
    scrollTriggerLoaded = true
    return scrollTriggerModule
  })

  return scrollTriggerLoadPromise
}
