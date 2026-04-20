<script setup>
import { onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
});

let observers = [];

onMounted(() => {
  const steps = Array.from(document.querySelectorAll(".step"));

  steps.forEach((step) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) step.classList.add("active__scroll");
          else step.classList.remove("active__scroll");
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.8,
      },
    );
    observer.observe(step);
    observers.push(observer);
  });
});

onBeforeUnmount(() => {
  observers.forEach((o) => o.disconnect());
});
</script>

<template>
  <div class="w-full mt-[10vh] relative z-[-20]">
    <div v-for="(item, i) in block.elements" :key="i" class="step relative h-[75vh] my-0 p-0">
      <div v-if="item.id" :id="item.id" class="scroll__id absolute max-w-[700px] -mt-[75vh]"></div>

      <div class="scroll__text opacity-20 absolute bottom-[25%] z-20 px-8 w-full">
        <p class="bg-white p-4 border rounded-lg mx-auto text-center w-fit" v-html="item.html"></p>
      </div>

      <div class="scroll__image fixed top-[calc(50%+30px)] left-1/2 -translate-x-1/2 -translate-y-1/2 m-auto opacity-0 transition-opacity duration-[1000ms] max-w-[700px] w-full">
        <img :src="item.image" class="w-full object-contain" :alt="item.html" />
      </div>
    </div>
  </div>
</template>

<style>
.active__scroll .scroll__text {
  opacity: 1;
}
.active__scroll .scroll__image {
  opacity: 1;
}
</style>
