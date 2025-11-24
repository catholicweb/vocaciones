<template>
  <div>
    <!-- Banner (solo si autoReload = false) -->
    <div v-if="state.showUpdateBanner" class="fixed top-0 left-0 right-0 z-[9999] bg-blue-600 text-white p-4 flex gap-3 justify-center items-center shadow">
      <span>Nueva versión disponible</span>
      <button @click="reloadPage" class="px-3 py-1 bg-white text-blue-600 font-semibold rounded cursor-pointer">Refrescar</button>
      <button @click="state.showUpdateBanner = false" class="px-3 py-1 border border-white rounded cursor-pointer">Cerrar</button>
    </div>
    <!-- Botón instalar -->
    <button v-if="state.showInstallButton" @click="handleInstall" class="fixed bottom-6 right-6 bg-white border border-neutral-300 rounded-full p-3 shadow hover:bg-neutral-100 active:scale-95 cursor-pointer" title="Instalar app">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
        <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm-7 2h14v2H5v-2z" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useData } from "vitepress";

const { theme } = useData();
const state = ref({ showInstallButton: false, showUpdateBanner: false });
let deferredPrompt;

function reloadPage() {
  window.location.reload();
}

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    // Register
    navigator.serviceWorker.register("/sw.js");

    // Escuchar mensajes del SW
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (!event.data) return;
      if (event.data.type === "SW_UPDATED" || event.data.type === "CONTENT_UPDATED") {
        if (theme.value.pwa?.autoReload) {
          window.location.reload();
        } else {
          state.value.showUpdateBanner = true;
        }
      }
    });
  } catch (err) {
    console.error("SW registration failed:", err);
  }

  // --- BEFOREINSTALLPROMPT -----------------------------------------
  window.addEventListener("beforeinstallprompt", (e) => {
    return;
    e.preventDefault();
    deferredPrompt = e;
    state.value.showInstallButton = true;
  });

  // --- INSTALLED ---------------------------------------------------
  window.addEventListener("appinstalled", () => {
    state.value.showInstallButton = false;
    deferredPrompt = null;
  });

  // --- PUSH NOTIFICATION IF INSTALLED ------------------------------
  if (window.matchMedia("(display-mode: standalone)").matches) {
    setupNotifications();
  }
}

async function setupNotifications() {
  try {
    const sw = await navigator.serviceWorker.ready;
    const existing = await sw.pushManager.getSubscription();
    if (existing) return;

    const sub = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array("BMmcvUGPuJ2n3Ri1kNPmbOiMuN62RSNfMcDv7QHJd8MZveNj_KPTOXdSkzj7vNOQinq8h4b-Tdv-TpnN4YpF-hM"),
    });

    await fetch("https://arrietaeguren.es/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub }),
    });
  } catch (err) {
    console.error("Notification setup failed:", err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function handleInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  state.value.showInstallButton = false;
  deferredPrompt = null;
}
</script>
