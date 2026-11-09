export const API_DOWN = "Can't reach the FoldLens API. Start the Flask backend (python backend/app.py) and try again.";

export async function api(path, opts) {
  let r;
  try { r = await fetch(`/api${path}`, opts); }
  catch { throw new Error(API_DOWN); } // network error: server not running
  const isJson = r.headers.get("content-type")?.includes("json");
  const body = isJson ? await r.json() : await r.text();
  // non-JSON 5xx comes from the dev proxy when Flask is down
  if (!r.ok) throw new Error((isJson && body.error) || (r.status >= 500 ? API_DOWN : `Request failed (${r.status})`));
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
