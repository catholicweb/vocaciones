// notify.js
import webpush from "web-push";
import { groupEvents, applyComplexFilter, slugify } from "./utils.js";
import { read } from "./node_utils.js";

function isTomorrow(date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return new Date(date).toDateString() === tomorrow.toDateString();
}

function tomorrow_str() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const basqueDays = [
    "Igandean", // Domingo
    "Astelehenean", // Lunes
    "Asteartean", // Martes
    "Asteazkenean", // Miércoles
    "Ostegunean", // Jueves
    "Ostiralean", // Viernes
    "Larunbatean", // Sábado
  ];
  return "(" + basqueDays[tomorrow.getDay()] + " " + tomorrow.getDate() + ")";
}

function builNotifications() {
  let calendar = read("./docs/public/calendar.json");

  const filtered = calendar.filter((event) => applyComplexFilter(event, "byday:empty") && isTomorrow(event.dates[0]));
  let grouped = groupEvents(filtered, ["title", "times", "locations", "images"]);

  let notifications = [];

  for (const title in grouped) {
    let body = "";
    let image = "";
    for (const times in grouped[title]) {
      body += times + " - " + Object.keys(grouped[title][times]).join(", ") + "\n";
      if (!image) image = Object.values(grouped[title][times])?.[0]?.images;
    }
    console.log(title, body, image);
    notifications.push({
      title: title + " " + tomorrow_str(),
      options: {
        body: body,
        icon: image,
        badge: "https://img.icons8.com/fluency-systems-regular/48/000000/church.png",
        data: { url: "/#" + slugify(title) },
      },
    });
  }

  return notifications;
}

export async function sendNotifications() {
  const eventName = process.env.EVENT_NAME;
  const schedule = process.env.EVENT_SCHEDULE;
  const repository = process.env.GITHUB_REPOSITORY;

  if (repository == "catholicweb/web-template") {
    return console.log("Do not send notifications from template", repository);
  } else if (schedule != "0 19 * * *") {
    return console.log("Not the right time to sent notifications...", schedule, eventName);
  }

  console.log("Sending notifications!");
  try {
    const subsRes = await fetch(`https://arrietaeguren.es/subscriptions?token=${process.env.NOTIF_TOKEN}`);
    let subs = await subsRes.json();
    const notifications = builNotifications();

    webpush.setVapidDetails("mailto:admin@47herri.eus", process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

    for (const not of notifications) {
      console.log("notify!", JSON.stringify(not));
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub, JSON.stringify(not));
        } catch (err) {
          console.error("Error con suscripción:", err);
        }
      }
    }
  } catch (e) {
    console.error("Fallo notifications:", e);
  }
}
