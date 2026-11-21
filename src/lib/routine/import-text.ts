import { roadmapInputSchema } from "./schema";
// CSV state machine supports quoted commas, escaped quotes and embedded newlines.
export function parseRoadmapText(
  text: string,
  title: string,
  newId: () => string,
) {
  if (text.trim().startsWith("{")) {
    const value = JSON.parse(text),
      ids = new Map<string, string>();
    if (!Array.isArray(value.topics))
      throw Error("JSON must contain a topics array.");
    for (const t of value.topics)
      if (typeof t.id === "string") ids.set(t.id, newId());
    return roadmapInputSchema.parse({
      ...value,
      topics: value.topics.map((t: Record<string, unknown>) => ({
        ...t,
        id: typeof t.id === "string" ? ids.get(t.id) : newId(),
        prerequisites: Array.isArray(t.prerequisites)
          ? t.prerequisites.map((p) => ids.get(String(p)) ?? p)
          : [],
      })),
    });
  }
  const delimiter = text.split("\n")[0]?.includes("|") ? "|" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("Unclosed quoted field in CSV.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (
    rows[0]?.[0]?.toLowerCase() === "subject" &&
    ["topic", "title"].includes(rows[0]?.[1]?.toLowerCase())
  )
    rows.shift();
  return roadmapInputSchema.parse({
    title,
    topics: rows.map(([subject, title, minutes]) => ({
      id: newId(),
      subject,
      title,
      minutes: Number(minutes || 60),
      prerequisites: [],
      resource: "",
      completed: false,
    })),
  });
}
