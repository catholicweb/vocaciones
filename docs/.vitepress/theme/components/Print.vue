<script setup>
import { onMounted, ref } from "vue";
import { useData } from "vitepress";
import { slugify } from "./../../utils.js";
const { theme } = useData();
const config = ref(theme.value.config || {});

const props = defineProps({
  block: { type: Object, required: true },
});

const tagMap = {
  Larraun: ["Albiasu", "Aldatz", "Alli", "Arruitz", "Astitz", "Azpirotz", "Baraibar", "Errazkin", "Etxarri", "Gorriti", "Iribas", "Lekunberri", "Lezaeta", "Madotz", "Mugiro", "Oderitz", "Uitzi"],
  Urumea: ["Arano", "Goizueta"],
  Leitzaran: ["Areso", "Leitza"],
  Basaburua: ["Arrarats", "Beramendi", "Beruete", "Erbiti", "Gartzaron", "Igoa eta Aizarotz", "Ihaben", "Itsaso", "Jauntsarats", "Udabe", "Orokieta"],
  Araitz: ["Arribe", "Atallu", "Azkarate", "Betelu", "Gaintza", "Intza", "Uztegi"],
  Imotz: ["Eraso", "Etxaleku", "Goldaratz", "Latasa", "Muskitz", "Oskotz", "Urritza", "Zarrantz"],
};

function highlightRelatedTitles() {
  document.querySelectorAll("section").forEach((section) => {
    // 1. Get the h2 inner text (the "Search Term")
    const h2 = section.querySelector("h2");
    if (!h2) return;

    let targetTitle = h2.innerText.toLowerCase().split("(")[0].trim();
    targetTitle = targetTitle.split("-")[1]?.trim() || targetTitle;
    console.log(targetTitle);
    generateQR(section, targetTitle);
    clone(section, "#contact");

    // 2. Get the list of related titles based on shared tags
    const relatedTitles = getRelatedTitles(targetTitle, tagMap);

    if (relatedTitles.length === 0) return;

    // 3. Find all <p> elements in this section
    const paragraphs = section.querySelectorAll("p");

    paragraphs.forEach((p) => {
      // Check if the paragraph text contains any of the related titles
      const containsRelated = relatedTitles.some((relatedTitle) => p.innerText.toLowerCase().includes(relatedTitle));

      if (containsRelated) {
        // Modern Tailwind approach: add a class or direct style
        p.classList.add("font-bold");
        // Or if using Tailwind: p.classList.add('font-bold');
      } else {
        p.classList.add("opacity-60");
      }
    });
  });
}

function clone(section, id) {
  // 1. Select the source and the target destination
  const original = document.querySelector(id);

  // 2. Clone it (true = deep clone)
  const clone = original.cloneNode(true);

  // 3. Optional: Modify the clone (e.g., change ID to avoid duplicates)
  clone.id = "cloned-div-" + Date.now();

  // 4. Place it in the DOM
  section.appendChild(clone);
}

/** * Helper from previous step to find related titles
 */
function getRelatedTitles(targetTitle = "", tagMap) {
  tagMap = JSON.parse(JSON.stringify(tagMap).toLowerCase());
  targetTitle = targetTitle.toLowerCase();
  const relatedSet = new Set();
  relatedSet.add(targetTitle);
  for (const [tag, titles] of Object.entries(tagMap)) {
    if (titles.includes(targetTitle)) {
      titles.forEach((t) => {
        if (t !== targetTitle) relatedSet.add(t);
      });
    }
  }
  return Array.from(relatedSet);
}

async function generateQR(section, title) {
  try {
    if (!title) return;
    const QRCode = await import("https://esm.sh/qrcode");
    const url = `https://47herri.eus/${slugify(title)}`;
    const qrWrapper = document.createElement("div");
    qrWrapper.innerText = url.replace("https://", "");
    qrWrapper.className = "qr-print-container text-center";

    // Create the canvas element needed by QRCode.js
    const canvas = document.createElement("canvas");
    qrWrapper.appendChild(canvas);
    section.appendChild(qrWrapper);

    // 2. Determine the title (slugify this)
    new QRCode.toCanvas(canvas, url, {
      width: 128,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("QR Generation failed", err);
  }
}

onMounted(() => {
  console.log("Mounting Print!");
  document.body.classList.add("print");
  highlightRelatedTitles();
});
</script>

<template>
  <nav class="no-print absolute">
    <button @click="window.print()">Imprimir</button>
  </nav>
  <div class="flex flex-col space-y-2 items-center contact" id="contact">
    <template v-for="(collab, index) in config.collaborators">
      <a v-if="collab.phonenumber" :href="`tel:+34${collab.phonenumber.replace(/\s/g, '')}`" class="flex items-center transition-colors">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
        <span class="mr-2">{{ collab.name }}</span> (<span>{{ collab.phonenumber }}</span
        >)
      </a>
      <a v-if="collab.email" :href="`mailto:${collab.email}`" class="flex items-center transition-colors">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        <span>{{ collab.name }}</span> - <span>{{ collab.email }}</span>
      </a>
    </template>
  </div>
</template>

<style>
@media print {
  .print canvas {
    margin: auto;
  }

  .print .calendar > div {
    padding: 0 20px;
  }

  .print .calendar {
    max-width: 110vw;
  }
  .print .contact {
    position: absolute;
    bottom: 275px;
    left: 100px;
  }

  .print .qr-print-container {
    position: absolute;
    bottom: 50px;
    left: 150px;
  }

  .print section {
    position: relative;
  }

  .print section h2 {
    padding-top: 10px;
    padding-bottom: 10px;
  }
  /* Force each section to start on a new page */
  section {
    page-break-before: always; /* Legacy support */
    break-before: page; /* Modern standard */

    zoom: 0.85;

    /* Ensure the section fills the page height if needed */
  }

  /* Prevent sections from breaking internally if they are short */
  section {
    break-inside: avoid;
  }

  /* Hide UI elements like navbars or buttons during print */
  nav,
  .no-print {
    display: none;
  }
}
</style>
