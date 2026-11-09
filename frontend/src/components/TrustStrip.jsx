import { plddtHex } from "../api";

/** Confidence "barcode": one bar per residue, height and colour = pLDDT. Click to fly to that residue. */
export default function TrustStrip({ values, onPick, focus }) {
  if (!values?.length) return null;
  const n = values.length;
  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    onPick?.(Math.min(n, Math.max(1, Math.ceil(((e.clientX - r.left) / r.width) * n))));
  };
  return (
    <svg className="strip" viewBox={`0 0 ${n} 100`} preserveAspectRatio="none" onClick={pick}
      role="img" aria-label={`Per-residue confidence for ${n} residues. Click to focus a residue.`}>
      {values.map((p, i) => (
        <rect key={i} x={i} y={100 - p} width="1" height={p} fill={plddtHex(p)} />
      ))}
      {focus && <rect x={focus - 1} y="0" width={Math.max(1, n / 200)} height="100" fill="#d946ef" />}
    </svg>
  );
}
