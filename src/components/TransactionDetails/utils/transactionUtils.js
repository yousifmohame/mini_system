export const safeNum = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

export const safeText = (val) => {
  if (!val) return "—";
  if (typeof val === "object") return val.ar || val.name || JSON.stringify(val);
  return String(val);
};

export const parseNumber = (val) => {
  if (!val) return 0;
  return Number(val.toString().replace(/,/g, ""));
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("ar-SA")} - ${d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
};

export const getDayNameAndDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const dayName = new Intl.DateTimeFormat("ar-SA", { weekday: "long" }).format(d);
  const dateFormatted = d.toLocaleDateString("en-GB");
  return `${dayName}، ${dateFormatted}`;
};

export const getCollectionStatus = (paid, total) => {
  if (paid >= total && total > 0)
    return { label: "محصل بالكامل", color: "bg-green-100 text-green-700" };
  if (paid > 0 && paid < total)
    return { label: "محصل جزئي", color: "bg-amber-100 text-amber-700" };
  return { label: "غير محصل", color: "bg-red-100 text-red-700" };
};