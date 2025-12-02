<!-- .vitepress/theme/Layout.vue -->
<template>
  <div class="min-h-screen flex flex-col max-w-screen overflow-hidden">
    <!-- Navbar Component -->
    <component :is="components.Navbar" />

    <!-- Hero Component (optional?) -->
    <component :is="components.Hero" :block="$frontmatter" />

    <!-- Main Content - Block System -->
    <main class="flex-1" v-if="$frontmatter.sections">
      <section v-for="(section, index) in $frontmatter.sections" :id="slugify(section.title)">
        <component :key="index" :is="getBlockComponent(section._block)" :block="section" />
      </section>
    </main>

    <!-- Footer Component -->
    <component :is="components.Footer" />

    <!-- PWA Component -->
    <component :is="components.PWA" />
  </div>
</template>

<script setup>
import components from "./components";

// Get the component matching the block type
function getBlockComponent(block = "gallery") {
  // Convert "hero-options" → "Hero"
  const name = block.split("-")[0].replace(/(^\w)/g, (s) => s.toUpperCase());
  return components[name] || components["Gallery"];
}

function slugify(str) {
  if (!str) return "";
  return str
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // cualquier cosa rara → guion
    .replace(/^-+|-+$/g, ""); // limpia bordes
}
</script>
