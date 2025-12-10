// dataExporter.js
import ICAL from "ical.js";
import fs from "fs";
import matter from "gray-matter";

function readFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");

  if (filePath.endsWith(".json")) {
    return JSON.parse(content || "{}");
  }
  return matter(content).data || {};
}

function exportCalendar(events) {
  // TODO: export also as ICS
  const jsonString = JSON.stringify(events);
  fs.writeFileSync("./docs/public/calendar.json", jsonString, "utf8");
}

function intersectOptions(options, field) {
  options = options.join(",").toUpperCase().split(",");
  const validValues = {
    FREQ: ["YEARLY", "MONTHLY", "WEEKLY", "DAILY", "HOURLY", "MINUTELY", "SECONDLY"],
    BYDAY: ["MO", "TU", "WE", "TH", "FR", "SA", "SU", "1MO", "-1FR" /* etc */],
    BYMONTH: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    BYMONTHDAY: Array.from({ length: 31 }, (_, i) => i + 1),
    // Añade más campos según necesites
  };
  const validSet = new Set(validValues[field]);
  let valid = options.filter((opt) => validSet.has(opt));

  if (field == "BYDAY") {
    const weekMatch = options.join(",").match(/WEEK(\d+)/);
    if (!weekMatch) return valid;
    return valid.map((opt) => weekMatch[1] + opt);
  }
  if (field == "FREQ" && !valid.length) {
    const weekMatch = options.join(",").match(/WEEK(\d+)/);
    if (weekMatch) return ["MONTHLY"];

    const validBYDAYS = new Set(validValues["BYDAY"]);
    let byday = options.filter((opt) => validBYDAYS.has(opt));
    if (byday.length) return ["WEEKLY"];
  }
  return valid;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}

export default {
  async load() {
    let config = readFrontmatter("./pages/events.json");
    const events = [];

    Object.keys(config).forEach((key) => {
      if (!key.startsWith("events")) return;
      for (var i = 0; i < config[key].length; i++) {
        const def = config[key][i];
        const custom = def.custom || [{}];
        for (var j = 0; j < custom.length; j++) {
          const e = { ...def, ...custom[j] };
          events.push({
            type: key.split("-")[1],
            title: e.title || e.summary || "",
            times: toArray(e.times),
            dates: toArray(e.date),
            images: toArray(e.image),
            byday: intersectOptions(toArray(e.rrule), "BYDAY"),
            freq: intersectOptions(toArray(e.rrule), "FREQ"),
            end: "",
            locations: toArray(e.location),
            exceptions: toArray(e.except),
          });
        }
      }
    });

    for (var i = 0; i < config.urls?.length; i++) {
      const url = config.urls[i];
      try {
        const res = await fetch(url);
        const text = await res.text();
        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents("vevent");

        const oneOffEvents = [];

        vevents.forEach((eventComp, index) => {
          const event = new ICAL.Event(eventComp);
          const attach = event.component.getFirstProperty("attach");
          const image = attach?.getParameter("FMTTYPE") || null;

          if (event.isRecurring()) {
            // Get the recurrence rule
            const rruleProp = event.component.getFirstProperty("rrule");
            const rrule = rruleProp ? rruleProp.getFirstValue() : null;

            // Get exception dates
            const exdates = event.component.getAllProperties("exdate").map((p) => {
              const val = p.getFirstValue();
              return val.toJSDate();
            });

            events.push({
              type: "ics",
              title: event.summary || "",
              times: toArray(event.startDate.toJSDate().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })),
              dates: toArray(event.startDate.toJSDate().toLocaleDateString("es-ES")),
              end: event.endDate.toJSDate(),
              images: toArray(image),
              locations: toArray(event.location),
              ...JSON.parse(JSON.stringify(rrule)),
              exceptions: toArray(exdates),
            });
          } else {
            const now = ICAL.Time.now();
            const isPast = event.endDate ? event.endDate.compare(now) < 0 : false;

            if (isPast) return;
            events.push({
              title: event.summary || "",
              times: toArray(event.startDate.toJSDate().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })),
              dates: toArray(toevent.startDate.toJSDate().toLocaleDateString("es-ES")),
              images: toArray(image),
              byday: [],
              freq: ["oneoff"],
              end: event.endDate.toJSDate(),
              locations: toArray(event.location),
              exceptions: [],
            });
          }
        });

        // Sort by start date
        events.sort((a, b) => a.dates[0] + b.dates[0] - (b.times[0] + b.times[0]));
      } catch (error) {
        console.error("Error loading calendar data:", error);
      }
    }
    exportCalendar(events);
    return { events };
  },
};
