import fs from "fs";
import fg from "fast-glob";
import path from "path";
import matter from "gray-matter";

const dictPath = "./docs/public/dictionary.json";
const keysToExtract = ["description", "html", "title", "name", "action"];
const valueSet = new Set();
const dictionary = fs.existsSync(dictPath) ? JSON.parse(fs.readFileSync(dictPath, "utf-8")) : {};

function readFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");

  if (filePath.endsWith(".json")) {
    return JSON.parse(content || "{}");
  }
  return matter(content).data || {};
}

// Añade esta función para recorrer objetos recursivamente
function extractValues(obj, keys) {
  const results = [];
  for (const [k, v] of Object.entries(obj)) {
    if (keys.includes(k) && typeof v === "string") {
      const list = v
        .replace(/\n +\n/g, "\n\n")
        .split("\n\n")
        .map((s) => s.trim());
      results.push(...list);
    }
    if (typeof v === "object" && v !== null) {
      results.push(...extractValues(v, keys));
    }
  }
  return results;
}

// Traducir entradas faltantes
async function translateMissing(valuesArray, language) {
  if (!dictionary[language]) dictionary[language] = {};

  const missing = valuesArray.filter((phrase) => !dictionary[language][phrase]).slice(0, 50);

  const translations = await translateWithOpenAI(missing, language.split(":")[0]);

  missing.forEach((text, index) => {
    dictionary[language][text] = translations[index].replaceAll("\\n", "\n").replaceAll("\\\\", "");
  });

  // Guardar actualizaciones
  fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2), "utf-8");
}
async function translateWithOpenAI(missing, targetLanguage) {
  if (!Array.isArray(missing) || missing.length === 0) return [];

  console.log("Translating to ", targetLanguage, " the missing texts: ", missing);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-5-mini",
      reasoning: { effort: "minimal" },
      text: {
        format: {
          type: "json_schema",
          name: "translation_result",
          schema: {
            type: "object",
            properties: { translations: { type: "array", items: { type: "string" } } },
            required: ["translations"],
            additionalProperties: false,
          },
        },
      },

      input: [
        {
          role: "system",
          content: "You are a professional translator for a Catholic website. " + "Texts most likely include catholic event titles, descriptions, timings etc..." + "Translate the given texts preserving HTML or Markdown. Do not scape or modify new lines, tags... anything that is not text must be returned as it is. " + "If a text is already written in the target language, do NOT translate it, just fix ortography" + "Do NOT include explanations or reasoning." + "Return only a JSON object with translations, ej translations = { [translation-text-0, translation-text-1... ]}.",
        },
        { role: "user", content: `Translate this array of texts to ${targetLanguage}: ${JSON.stringify(missing)}` },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text}`);
  }

  const data = await response.json();

  console.log(JSON.stringify(data));

  try {
    return JSON.parse(data.output[1].content[0].text).translations;
  } catch (e) {
    console.log("Invalid response format from model", JSON.stringify(data));
    return [];
  }
}

(async () => {
  try {
    // Get values
    const files = await fg(["*.md", "!aviso-legal.md"], { cwd: "./pages", absolute: false });
    for (const file of files) {
      const content = fs.readFileSync("./pages/" + file, "utf-8");
      const parsed = matter(content);
      const values = extractValues(parsed.data, keysToExtract);
      values.forEach((v) => valueSet.add(v));

      if (parsed.content?.trim()) {
        let bits = parsed.content.trim().split("\n");
        bits.forEach((b) => valueSet.add(b));
      }
    }
    const valuesArray = [...valueSet];

    //
    let config = readFrontmatter("./pages/config.json");
    let languages = config.languages?.length ? config.languages : [];
    await Promise.allSettled(languages.map((lang) => translateMissing(valuesArray, lang)));
  } catch (error) {
    console.error("Error loading translating data:", error);
  }
})();
