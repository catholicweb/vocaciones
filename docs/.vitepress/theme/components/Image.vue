<script setup>
//import { computed, ref, onMounted } from "vue";
import { computed } from "vue";

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: "" },
  index: { type: Number, default: 0 },
  progressive: { type: Boolean, default: false },
  class: { type: String, default: "" },
});

const isExternal = computed(() => /^(https?:)?\/\//.test(props.src));

const isMedia = computed(() => props.src?.startsWith("/media/"));

const basePath = computed(() => {
  const p = props.src?.replace(/^\/media\//, "");
  return encodeURIComponent(p?.replace(/\.[^/.]+$/, ".webp"));
});

const srcset = computed(() =>
  `/media/sm/${basePath.value} 480w,
  /media/md/${basePath.value} 768w,
  /media/lg/${basePath.value} 1080w`.trim(),
);
/*
const imgRef = ref(null);

onMounted(() => {
  if (imgRef.value) improveImage(imgRef.value);
});

function improveImage(elem) {
  requestAnimationFrame(() => {
    const width = elem.getBoundingClientRect().width;
    const img = new Image();
    img.onload = () => {
      elem.src = img.src;
    };
    if (width > 500) {
      img.src = elem.src.replace("/sm/", "/md/");
    } else if (width > 800) {
      img.src = elem.src.replace("/sm/", "/lg/");
    }
  });
}*/
</script>

<template>
  <!-- External or non-media image -->
  <img v-if="isExternal || !isMedia" :src="src" :alt="alt" :class="class" crossorigin="anonymous" :fetchpriority="index >= 1 ? 'low' : 'high'" :loading="index >= 1 ? 'lazy' : 'eager'" />

  <!-- Progressive --
  <img v-else-if="progressive" ref="imgRef" :src="`/media/sm/${basePath}`" :alt="alt" :class="class" crossorigin="anonymous" :fetchpriority="index >= 1 ? 'low' : 'high'" :loading="index >= 1 ? 'lazy' : 'eager'" />-->

  <!-- Optimised local image -->
  <picture v-else>
    <source type="image/webp" :srcset="srcset" />
    <img :src="`/media/md/${basePath}`" :alt="alt" :class="class" :fetchpriority="index >= 1 ? 'low' : 'high'" :loading="index >= 1 ? 'lazy' : 'eager'" />
  </picture>
</template>
