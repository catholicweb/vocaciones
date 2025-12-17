<script setup>
import { computed } from "vue";

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: "" },
  index: { type: Number, default: 0 },
  class: { type: String, default: "" },
});

const isExternal = computed(() => /^(https?:)?\/\//.test(props.src));

const isMedia = computed(() => props.src?.startsWith("/media/"));

const basePath = computed(() => {
  const p = props.src?.replace(/^\/media\//, "");
  return p?.replace(/\.[^/.]+$/, ".webp");
});

const srcset = computed(() =>
  `
  /media/sm/${basePath.value} 480w,
  /media/md/${basePath.value} 768w,
  /media/lg/${basePath.value} 1080w
`.trim(),
);
</script>

<template>
  <!-- External or non-media image -->
  <img v-if="isExternal || !isMedia" :src="src" :alt="alt" :class="class" :fetchpriority="index >= 1 ? 'low' : 'high'" :loading="index >= 1 ? 'lazy' : 'eager'" />

  <!-- Optimised local image -->
  <picture v-else>
    <source type="image/webp" :srcset="srcset" sizes="(max-width: 768px) 100vw, 768px" />
    <img :src="`/media/lg/${basePath}`" :alt="alt" :class="class" :fetchpriority="index >= 1 ? 'low' : 'high'" :loading="index >= 1 ? 'lazy' : 'eager'" />
  </picture>
</template>
