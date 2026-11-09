import { useState } from "react";
import { Loader2, Dna } from "lucide-react";
import { postJson } from "../api";

const COLORS = { "likely disruptive": "var(--danger)", "possibly disruptive": "var(--warn)", "likely tolerated": "var(--ok)" };

/** Variant Lens: type a mutation, get a scored story. */
export default function VariantPanel({ accession, esmReady, onResult }) {
  const [mutation, setMutation] = useState("");
  const [useEsm, setUseEsm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState(null);

  if (!accession) return <p className="muted">Load a protein from AlphaFold DB first. Uploaded files have no sequence context for mutations.</p>;

  const run = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await postJson("/variant", { accession, mutation, use_esm: useEsm });
      setRes(r); onResult?.(r);
    } catch (x) { setErr(x.message); setRes(null); onResult?.(null); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <form onSubmit={run} className="row">
        <label style={{ flex: 1 }}>
          Mutation <span className="hint">e.g. R175H or p.Arg175His</span>
          <input className="mono" value={mutation} onChange={(e) => setMutation(e.target.value)} required
            aria-invalid={!!err} aria-describedby={err ? "variant-err" : undefined} placeholder="R175H" />
        </label>
        <button disabled={busy}>{busy ? <Loader2 size={18} className="spin" aria-hidden /> : <Dna size={18} aria-hidden />}Analyze</button>
      </form>
      <label className="check" style={{ marginTop: ".5rem" }}>
        <input type="checkbox" checked={useEsm} disabled={!esmReady} onChange={(e) => setUseEsm(e.target.checked)} />
        Add ESM-2 language-model score {!esmReady && <span className="hint">(install requirements-ml.txt on the server)</span>}
      </label>
      {err && <p id="variant-err" className="error" role="alert">{err}</p>}

      {res && (
        <div aria-live="polite">
          <div className="gauge">
            <div className="gauge-ring" style={{ "--p": res.score, "--gc": COLORS[res.verdict] }}><b>{res.score}</b></div>
            <div>
              <div className="verdict" style={{ color: COLORS[res.verdict] }}>{res.verdict}</div>
              <div className="hint mono">pLDDT {res.plddt} ({res.confidence.label}) · {res.buried ? "buried" : "surface"}</div>
              <div className="hint mono">Δhydropathy {res.deltas.hydropathy} · Δvolume {res.deltas.volume} Å³</div>
            </div>
          </div>
          <h3>Mutation story</h3>
          <ol className="story">{res.story.map((s) => <li key={s}>{s}</li>)}</ol>
          <p className="disclaimer">{res.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
