import { BANDS } from "../api";

/** Trust Map: the plain-English confidence report. */
export default function TrustPanel({ trust, onPick }) {
  if (!trust) return <p className="muted">Load a protein to get a confidence report.</p>;
  return (
    <div>
      <p className="mono muted">Mean pLDDT {trust.mean_plddt} · {trust.length} residues</p>
      <ul className="summary">{trust.summary.map((s) => <li key={s}>{s}</li>)}</ul>
      <div className="bars">
        {BANDS.map((b) => {
          const pct = Math.round(trust.fractions[b.key] * 100);
          return (
            <div className="bar" key={b.key}>
              <span>{b.label.split(" (")[0]}</span>
              <div className="bar-track" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${b.label}: ${pct}%`}>
                <div className="bar-fill" style={{ width: `${pct}%`, background: b.color }} />
              </div>
              <span className="mono">{pct}%</span>
            </div>
          );
        })}
      </div>
      {trust.pae && <p className="hint mono">Mean PAE {trust.pae.mean_pae} Å · {Math.round(trust.pae.fraction_confident_pairs * 100)}% residue pairs placed within 5 Å</p>}
      <h3>Regions</h3>
      <div className="segs">
        {trust.segments.map((s) => (
          <button key={`${s.start}-${s.end}`} onClick={() => onPick?.(Math.round((s.start + s.end) / 2))}>
            <i className="sw" style={{ background: BANDS.find((b) => b.key === s.band).color }} />
            <span className="mono">{s.start}-{s.end}</span>
            <span>{s.label}</span>
            <span className="muted mono">pLDDT {s.mean_plddt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
