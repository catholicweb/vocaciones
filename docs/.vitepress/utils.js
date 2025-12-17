export function formatDate(isoString, lang = "Español:es") {
  if (typeof lang !== "string") return isoString;
  if (!isoString) return "";
  const langCode = lang.split(":")[1];
  isoString = isoString.replaceAll("-", "-");
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const monthIndex = date.getMonth();
  const now = new Date();
  const note = date.getFullYear() < now.getFullYear() ? ` (${date.getFullYear()})` : "";

  const months = {
    eu: ["Urtarrilak", "Otsailak", "Martxoak", "Apirilak", "Maiatzak", "Ekainak", "Uztailak", "Abuztuak", "Irailak", "Urriak", "Azaroak", "Abenduak"],
    es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    bg: ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"],
    it: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
    ro: ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"],
    pt: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    ca: ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
    ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    default: ["-I", "-II", "-III", "-IV", "-V", "-VI", "-VII", "-VIII", "-IX", "-X", "-XI", "-XII"],
  };

  const names = months[langCode] || months["default"];
  return langCode === "eu" ? `${names[monthIndex]} ${date.getDate()} ${note}`.trim() : `${date.getDate()} ${names[monthIndex]} ${note}`.trim();
}

export function slugify(str) {
  if (!str) return "";
  return str
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // cualquier cosa rara → guion
    .replace(/^-+|-+$/g, ""); // limpia bordes
}
