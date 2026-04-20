<template>
  <div ref="el">
    <slot v-if="visible" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
const props = defineProps({ alwaysVisible: { type: Boolean } });

const visible = ref(!!props.alwaysVisible);
const el = ref(null);
let observer;

onMounted(() => {
  if (visible.value) return;
  observer = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        visible.value = true;
        observer.disconnect();
      }
    },
    { rootMargin: "200px" },
  );

  observer.observe(el.value);
});

onUnmounted(() => observer?.disconnect());
</script>
