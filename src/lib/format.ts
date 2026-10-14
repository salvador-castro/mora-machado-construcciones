const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function formatDate(date: Date | string) {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}
