import Layout from "./Layout.vue"; // Your custom layout
import "./style.css";

export default {
  Layout, // <-- Custom theme, no VitePress defaults
  enhanceApp({ app, router, siteData }) {
    if (typeof window === "undefined") return;

    // GoatCounter's count.js auto-counts the very first page load via its own
    // DOMContentLoaded listener.  VitePress navigates with history.pushState(),
    // which never fires popstate, so every subsequent SPA transition is missed.
    // We hook onAfterRouteChanged to fill that gap — skipping the first call
    // so the initial load is not double-counted.
    let initialLoad = true;
    router.onAfterRouteChanged = (to) => {
      if (initialLoad) {
        initialLoad = false;
        return;
      }
      window.goatcounter?.count({
        path: to,
        title: document.title,
      });
    };
  },
};
