import { useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { postJson } from "../api";
import { rankInBrowser } from "../browserLigands";

const SAMPLE = [
  "CC(=O)Oc1ccccc1C(=O)O",            // aspirin
  "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",     // caffeine
  "CC(C)Cc1ccc(cc1)C(C)C(=O)O",       // ibuprofen
  "Cc1ccc(NC(=O)c2ccc(CN3CCN(C)CC3)cc2)cc1Nc1nccc(-c2cccnc2)n1", // imatinib
  "CC(=O)Nc1ccc(O)cc1",               // paracetamol
].join("\n");

export default function LigandBench({ rdkitReady }) {
  const [text, setText] = useState(SAMPLE);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [mode, setMode] = useState(null); // "server" | "browser"

  const run = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      if (rdkitReady) {
        setRows((await postJson("/ligands", { smiles: text })).results); setMode("server");
      } else {
        setRows(await rankInBrowser(text)); setMode("browser");
      }
    }
    catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <section className="hero">
        <h1>Ligand Bench</h1>
        <p>Paste candidate molecules (one SMILES per line) and rank them by drug-likeness (QED) with rule-of-five checks. A fast first filter before you spend compute on docking or co-folding.</p>
      </section>
      <div className="grid workspace">
        <form className="card" onSubmit={run}>
          <label>
            Molecules <span className="hint">SMILES, one per line, up to 200</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          </label>
          <div className="row" style={{ marginTop: ".75rem" }}>
            <button disabled={busy}>{busy ? <Loader2 size={18} className="spin" aria-hidden /> : <FlaskConical size={18} aria-hidden />}Rank molecules</button>
            <button type="button" className="ghost" onClick={() => setText("")}>Clear</button>
          </div>
          {!rdkitReady && <p className="hint">Server RDKit is unavailable, so molecules are ranked in your browser (RDKit WebAssembly) by rule-of-five checks. QED needs the server.</p>}
          {err && <p className="error" role="alert">{err}</p>}
        </form>
        <div className="card">
          <h2>How to read this</h2>
          <ul className="summary">
            <li><b>QED</b> (0 to 1) blends weight, polarity, flexibility and more into one drug-likeness score. Most oral drugs score above 0.5.</li>
            <li><b>Lipinski violations</b>: more than one suggests poor oral absorption.</li>
            <li><b>TPSA</b> &lt; 90 Å² often means the molecule can reach the brain.</li>
          </ul>
          <p className="disclaimer">These are property filters, not binding predictions.</p>
        </div>
      </div>

      {rows && (
        <div className="card table-wrap" style={{ marginTop: "1.25rem" }} aria-live="polite">
          <p className="hint">{mode === "browser" ? "Computed in your browser. Ranked by fewest rule-of-five violations, then lowest TPSA." : "Computed on the server. Ranked by QED."}</p>
          <table>
            <thead><tr><th>#</th><th>SMILES</th><th>QED</th><th>MW</th><th>logP</th><th>HBD/HBA</th><th>TPSA</th><th>Notes</th></tr></thead>
            <tbody>
              {rows.map((m, i) => m.valid ? (
                <tr key={i}>
                  <td>{i + 1}</td><td className="mono">{m.smiles}</td>
                  <td>{m.qed == null ? <span className="muted" title="QED needs server RDKit">n/a</span>
                    : <span className="qed"><i style={{ width: `${m.qed * 60}px` }} aria-hidden /><span className="mono">{m.qed}</span></span>}</td>
                  <td className="mono">{m.mw}</td><td className="mono">{m.logp}</td><td className="mono">{m.hbd}/{m.hba}</td><td className="mono">{m.tpsa}</td>
                  <td>{m.flags.length ? m.flags.map((f) => <span className="flag" key={f}>{f}</span>) : <span className="muted">-</span>}</td>
                </tr>
              ) : (
                <tr key={i}><td>{i + 1}</td><td className="mono">{m.smiles}</td><td colSpan={6} className="error">{m.error}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
