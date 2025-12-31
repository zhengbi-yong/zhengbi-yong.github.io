<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  delay?: number
  duration?: number
  xOffset?: number
  yOffset?: number
  scale?: boolean
}>()

const motion = computed(() => ({
  initial: {
    opacity: 0,
    x: props.xOffset || 0,
    y: props.yOffset || 0,
    scale: props.scale ? 0.95 : 1
  },
  enter: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: props.duration || 600,
      delay: props.delay || 0,
      ease: 'easeOut'
    }
  }
}))
</script>

<template>
  <div v-motion="motion.initial" v-bind="motion.enter">
    <slot />
  </div>
</template>
