export async function api(path, opts) {
  const r = await fetch(`/api${path}`, opts);
  const isJson = r.headers.get("content-type")?.includes("json");
  const body = isJson ? await r.json() : await r.text();
  if (!r.ok) throw new Error((isJson && body.error) || `Request failed (${r.status})`);
  return body;
}

export const postJson = (path, data) =>
  api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

// AlphaFold's own pLDDT colour scheme
export const BANDS = [
  { key: "very_high", label: "Very high (>90)", min: 90, color: "var(--vh)", hex: "#0053D6" },
  { key: "confident", label: "Confident (70-90)", min: 70, color: "var(--c)", hex: "#65CBF3" },
  { key: "low", label: "Low (50-70)", min: 50, color: "var(--lo)", hex: "#FFDB13" },
  { key: "very_low", label: "Very low (<50)", min: 0, color: "var(--vl)", hex: "#FF7D45" },
];
export const plddtHex = (p) => BANDS.find((b) => p >= b.min).hex;
