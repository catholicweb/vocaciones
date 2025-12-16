// oembed-ultra.js
import { Parser } from "htmlparser2";
import { read, write, path } from "./node_helpers.js";

function extractIframeSrc(html) {
  // Busca el atributo src dentro del iframe de Spotify
  const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

async function fetchOembed(url) {
  const res = await fetch(url);
  const data = await res.json();

  return {
    title: data.title,
    author: data.author_name,
    src: extractIframeSrc(data.html),
    image: data.thumbnail_url,
    aspect: data.width / data.height,
  };
}

// método auxiliar para extraer el ID del vídeo
function extractVideoId(urlOrId) {
  if (!urlOrId) return null;
  if (/^[\w-]{11}$/.test(urlOrId)) return urlOrId; // ya es un id
  const match = urlOrId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return match ? match[1] : null;
}

const KNOWN_PROVIDERS = [
  { re: /youtube\.com|youtu\.be$/, api: "https://www.youtube.com/oembed" },
  { re: /vimeo\.com$/, api: "https://vimeo.com/api/oembed.json" },
  { re: /flickr\.com|flic\.kr$/, api: "https://www.flickr.com/services/oembed/" },
  { re: /dailymotion\.com|dai\.ly$/, api: "https://www.dailymotion.com/services/oembed" },
  { re: /soundcloud\.com$/, api: "https://soundcloud.com/oembed" },
  { re: /twitter\.com$/, api: "https://publish.twitter.com/oembed" },
  { re: /slideshare\.net$/, api: "https://www.slideshare.net/api/oembed/2" },
  { re: /scribd\.com$/, api: "https://www.scribd.com/services/oembed" },
  { re: /spotify\.com$/, api: "https://open.spotify.com/oembed" }, // Added Spotify
];

export async function getPreview(url) {
  if (url.endsWith(".md")) {
    return localLinks(url);
  } else {
    return getOEmbed(url);
  }
}

async function getOEmbed(url) {
  const host = new URL(url).hostname.toLowerCase();

  // --- 1) Provider conocido
  const known = KNOWN_PROVIDERS.find((p) => p.re.test(host));
  if (known) {
    const params = new URLSearchParams({ url, format: "json" });
    const oembedUrl = `${known.api}?${params.toString()}`;
    return fetchOembed(oembedUrl);
  }

  console.log("ouch! need to try harder", url);

  // --- 2) Ultra-fast autodiscovery + OG reading
  let oembedUrl = null;
  const og = {};
  let done = false;

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        if (done) return;

        if (name === "link" && attribs.rel === "alternate") {
          if (attribs.type === "application/json+oembed" || attribs.type === "text/xml+oembed") {
            oembedUrl = attribs.href;
            done = true;
          }
        }

        if (name === "meta" && attribs.property?.startsWith("og:") && attribs.content) {
          og[attribs.property.slice(3)] = attribs.content;
        }
      },
      onclosetag(name) {
        if (name === "head") done = true;
      },
    },
    { decodeEntities: true },
  );

  // Stream hasta </head>
  const res = await fetch(url);
  const reader = res.body.getReader();

  while (!done) {
    const { value, done: end } = await reader.read();
    if (end) break;
    parser.write(new TextDecoder().decode(value));
  }
  parser.end();

  if (oembedUrl) return fetchOembed(oembedUrl);

  // --- 3) Fallback OG ultra-minimal
  return {
    type: "link",
    src: og.url || url,
    title: og.title || "",
    image: og.image || "",
    aspect: 16 / 9,
  };
}

function localLinks(linkPath) {
  const { data } = read(linkPath);
  return {
    title: data.title,
    description: data.description || "",
    image: data.image || "",
    aspect: 16 / 9,
    link: linkPath.replace("docs/", "").replace(".md", ""),
  };
}
