import { useEffect, useState } from "react";
import { Search, Upload, Loader2 } from "lucide-react";
import { api } from "../api";
import Viewer from "../components/Viewer";
import TrustStrip from "../components/TrustStrip";
import TrustPanel from "../components/TrustPanel";
import VariantPanel from "../components/VariantPanel";

const EXAMPLES = [["P04637", "p53 tumour suppressor"], ["P69905", "Haemoglobin α"], ["P42212", "Green fluorescent protein"], ["P01308", "Insulin"], ["P38398", "BRCA1"]];

export default function Explorer({ initial, esmReady }) {
  const [acc, setAcc] = useState(initial || "");
  const [data, setData] = useState(null); // { meta?, trust, pdb, source }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("trust");
  const [focus, setFocus] = useState(null);
  const [contacts, setContacts] = useState([]);

  const load = async (accession) => {
    setBusy(true); setErr(""); setFocus(null); setContacts([]);
    try {
      const [info, pdb] = await Promise.all([api(`/protein/${encodeURIComponent(accession)}`), api(`/protein/${encodeURIComponent(accession)}/pdb`)]);
      setData({ ...info, pdb });
      setAcc(info.meta.accession);
      history.replaceState(null, "", `#/explore/${info.meta.accession}`);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy(true); setErr(""); setFocus(null); setContacts([]);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api("/trust/upload", { method: "POST", body: fd });
      setData({ meta: null, trust: r.trust, pdb: r.pdb, fileName: file.name }); setTab("trust");
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  useEffect(() => { if (initial) load(initial); }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (resi) => { setFocus(resi); setContacts([]); };
  const meta = data?.meta;

  return (
    <>
      <section className="hero">
        <h1>See what AlphaFold is really telling you</h1>
        <p>Load any protein from the AlphaFold database, learn which parts you can trust, and find out what a mutation is likely to do, in plain English.</p>
      </section>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <form className="row" onSubmit={(e) => { e.preventDefault(); load(acc); }}>
          <label style={{ flex: "1 1 220px" }}>
            UniProt accession <span className="hint">The ID on uniprot.org, e.g. P04637</span>
            <input className="mono" value={acc} onChange={(e) => setAcc(e.target.value)} required placeholder="P04637" />
          </label>
          <button disabled={busy}>{busy ? <Loader2 size={18} className="spin" aria-hidden /> : <Search size={18} aria-hidden />}Load</button>
          <label className="btn ghost">
            <Upload size={18} aria-hidden />Upload .pdb
            <input type="file" accept=".pdb,.ent,.txt" hidden onChange={(e) => upload(e.target.files[0])} />
          </label>
        </form>
        <div className="chips" aria-label="Examples">
          {EXAMPLES.map(([a, n]) => <button key={a} className="chip" onClick={() => load(a)} disabled={busy}>{n}</button>)}
        </div>
        {err && <p className="error" role="alert">{err}</p>}
      </div>

      <div className="grid workspace">
        <div className="card">
          {meta ? (
            <div className="meta-title"><h2>{meta.name}</h2><span className="tag">{meta.gene || "-"}</span><span className="tag">{meta.accession}</span><span className="muted">{meta.organism}</span></div>
          ) : data?.fileName ? <h2>{data.fileName}</h2> : <h2>Structure</h2>}
          <Viewer pdb={data?.pdb} focus={focus} contacts={contacts} onPick={pick} />
          <TrustStrip values={data?.trust?.per_residue} onPick={pick} focus={focus} />
          {data && <p className="hint">Confidence barcode: each bar is one residue. Click it, or click the 3D model, to inspect a residue.</p>}
        </div>

        <div className="card">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === "trust"} onClick={() => setTab("trust")}>Trust Map</button>
            <button role="tab" aria-selected={tab === "variant"} onClick={() => setTab("variant")}>Variant Lens</button>
          </div>
          <div role="tabpanel">
            {tab === "trust"
              ? <TrustPanel trust={data?.trust} onPick={pick} />
              : <VariantPanel accession={meta?.accession} esmReady={esmReady}
                  onResult={(r) => { setFocus(r?.position ?? null); setContacts(r?.contacts ?? []); }} />}
          </div>
        </div>
      </div>
    </>
  );
}
