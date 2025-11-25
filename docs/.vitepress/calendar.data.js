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

export default {
  async load() {
    let config = readFrontmatter("./docs/events.json");
    const events = [];

    Object.keys(config).forEach((key) => {
      if (!key.startsWith("events")) return;
      for (var i = 0; i < config[key].length; i++) {
        const event = config[key][i];
        events.push({
          summary: event.summary || "",
          startTime: event.date.split(" ")[1],
          startDate: event.date.split(" ")[0],
          image: event.image,
          byday: intersectOptions(event.rrule, "BYDAY")?.join(","),
          freq: intersectOptions(event.rrule, "FREQ")?.join(","),
          location: event.location?.join(","),
          exceptions: event.exceptions,
        });
      }
    });

    for (var i = 0; i < config.urls.length; i++) {
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
              summary: event.summary || "",
              startTime: event.startDate.toJSDate().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
              startDate: event.startDate.toJSDate().toLocaleDateString("es-ES"),
              end: event.endDate.toJSDate(),
              image: image,
              location: event.location || "",
              ...JSON.parse(JSON.stringify(rrule)),
              exceptions: exdates,
            });
          } else {
            const now = ICAL.Time.now();
            const isPast = event.endDate ? event.endDate.compare(now) < 0 : false;

            if (isPast) return;
            events.push({
              summary: event.summary || "",
              startTime: event.startDate.toJSDate().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
              startDate: event.startDate.toJSDate().toLocaleDateString("es-ES"),
              image: image,
              byday: ["oneoff"],
              end: event.endDate.toJSDate(),
              location: event.location || "",
            });
          }
        });

        // Sort by start date
        events.sort((a, b) => a.startDate + b.startTime - (b.startDate + b.startTime));
      } catch (error) {
        console.error("Error loading calendar data:", error);
      }
    }
    exportCalendar(events);
    return { events };
  },
};
