<script setup lang="ts">
import { ref, computed } from "vue";
import { useData, useRoute } from "vitepress";

interface NavItem {
  text: string;
  link?: string;
  items?: NavItem[];
}

interface Language {
  code: string;
  label: string;
  path: string;
}

const { theme, site } = useData();
const route = useRoute();

const nav = computed(() => theme.value.nav || []);
const languages = computed<Language[]>(() => theme.value.languages || []);

const currentLang = computed(() => {
  const path = route.path;
  return languages.value.find((l) => path.startsWith(`/${l.path}`) || (l.path === "/" && !path.match(/^\/(en|eus)\//))) || languages.value[0];
});

function langUrl(url) {
  return url;
  //return url.replace(/^\/+/, "");
  //console.log(currentLang.value.path, url);
  //return "/" + currentLang.value.path + url;
}

const hasItems = (item: NavItem) => item.items && item.items.length > 0;
const isActive = (item: NavItem) => item.link && (route.path === item.link || route.path.startsWith(item.link + "/"));

const switchLanguage = (langPath) => {
  return;
  let pathname = "";
  let origin = "";
  if (typeof window !== "undefined") {
    pathname = window.location;
    origin = window.location.origin;
  }

  const newPath = origin + "/" + pathname.replace(currentLang.value.path, langPath).replace("//", "/");
  return newPath;
};

const openSections = ref<Record<string, boolean>>({});
const toggleSection = (key: string) => (openSections.value[key] = !openSections.value[key]);

const mobileMenuOpen = ref(false);
</script>

<template>
  <div class="sticky top-0 z-50 shadow-sm transition-colors bg-white">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <a href="/" class="text-xl font-bold hover:text-accent transition-colors">
            {{ site.title }}
          </a>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden lg:flex items-center space-x-1 font-medium text-md bg-white">
          <template v-for="item in nav" :key="item.text">
            <!-- Simple link -->
            <div v-if="!hasItems(item)">
              <a :href="langUrl(item.link)" :class="['px-4 py-2 transition-colors rounded-sm', isActive(item) ? 'text-accent' : 'hover:text-accent hover:bg-gray-50']">
                {{ item.text }}
              </a>
            </div>

            <!-- Dropdown -->
            <div v-else class="relative group bg-white">
              <button class="px-4 py-2 hover:text-accent transition-colors flex items-center gap-1">
                {{ item.text }}
                <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <div class="absolute left-0 mt-0 w-96 rounded-sm shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50 bg-white">
                <template v-for="section in item.items" :key="section.text">
                  <a :href="langUrl(section.link)" class="block px-3 py-2 rounded-sm hover:bg-white dark:hover:bg-gray-700 hover:text-accent transition-colors" :class="isActive(section) ? 'text-accent' : ''">
                    {{ section.text }}
                  </a>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- Right controls -->
        <div class="flex items-center space-x-2 bg-white">
          <!-- Language Switcher -->
          <div v-if="languages.length > 1" class="relative group bg-white">
            <button class="px-2 py-1 rounded-sm hover:bg-white dark:hover:bg-gray-700 hover:text-accent transition-colors flex items-center space-x-1">
              <span>{{ currentLang.code.toUpperCase() }}</span>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.23 7.21a.75.75 0 011.06 0L10 10.91l3.71-3.7a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 010-1.06z" />
              </svg>
            </button>
            <div class="absolute right-0 w-36 opacity-0 group-hover:opacity-100 invisible group-hover:visible group-focus-within:visible group-focus-within:opacity-100 transition-all z-50 bg-white">
              <a v-for="lang in languages" :key="lang.code" :href="switchLanguage(lang.path)" class="block px-3 py-2 rounded-sm hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors" :class="lang.code === currentLang.code ? 'text-accent' : ''">
                {{ lang.label }}
              </a>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <button @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden px-2 py-1 rounded-sm hover:bg-white dark:hover:bg-gray-700 transition-colors hover:text-accent">
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div v-show="mobileMenuOpen" class="lg:hidden border-t text-md">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <template v-for="item in nav" :key="item.text">
            <div v-if="!hasItems(item)">
              <a :href="langUrl(item.link)" @click="mobileMenuOpen = false" class="block px-3 py-1 rounded-sm hover:bg-white dark:hover:bg-gray-700 transition-colors hover:text-accent">
                {{ item.text }}
              </a>
            </div>
            <div v-else>
              <details class="group">
                <summary class="font-bold px-3 py-2 rounded-sm flex justify-between items-center hover:bg-white dark:hover:bg-gray-700 cursor-pointer hover:text-accent">
                  <span>{{ item.text }}</span>
                  <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.23 7.21a.75.75 0 011.06 0L10 10.91l3.71-3.7a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 010-1.06z" />
                  </svg>
                </summary>
                <div class="pl-4 space-y-1 mt-1">
                  <template v-for="section in item.items" :key="section.text">
                    <a @click="mobileMenuOpen = false" :href="langUrl(section.link)" class="block px-3 py-2 rounded-sm hover:bg-white dark:hover:bg-gray-700 transition-colors hover:text-accent">
                      {{ section.text }}
                    </a>
                  </template>
                </div>
              </details>
            </div>
          </template>
        </div>
      </div>
    </nav>
  </div>
</template>
