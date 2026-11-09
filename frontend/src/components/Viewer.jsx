import { useEffect, useRef } from "react";
import * as $3Dmol from "3dmol";
import { plddtHex, BANDS } from "../api";

/** 3D structure coloured by AlphaFold confidence. `focus` = residue number to highlight, `contacts` = neighbours. */
export default function Viewer({ pdb, focus, contacts = [], onPick }) {
  const el = useRef(null);
  const viewer = useRef(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    viewer.current = $3Dmol.createViewer(el.current, { backgroundColor: "white", backgroundAlpha: 0 });
    const onResize = () => viewer.current?.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); viewer.current?.clear(); };
  }, []);

  useEffect(() => {
    const v = viewer.current;
    if (!v) return;
    v.clear();
    if (!pdb) { v.render(); return; }
    v.addModel(pdb, "pdb");
    v.setClickable({ atom: "CA" }, true, (atom) => pick.current?.(atom.resi));
    v.zoomTo();
  }, [pdb]);

  useEffect(() => {
    const v = viewer.current;
    if (!v || !pdb) return;
    v.removeAllLabels();
    v.setStyle({}, { cartoon: { colorfunc: (a) => plddtHex(a.b) } });
    if (contacts.length) v.addStyle({ resi: contacts }, { stick: { radius: 0.15, colorscheme: "greenCarbon" } });
    if (focus) {
      v.addStyle({ resi: focus }, { stick: { radius: 0.3, colorscheme: "magentaCarbon" } });
      v.addLabel(`Residue ${focus}`, { fontSize: 13, backgroundColor: "#0c4a6e", fontColor: "white", backgroundOpacity: 0.85 }, { resi: focus, atom: "CA" });
      v.zoomTo({ resi: [focus, ...contacts] }, 600);
    }
    v.render();
  }, [pdb, focus, contacts]);

  return (
    <div>
      <div className="viewer-wrap">
        <div ref={el} className="viewer" role="img" aria-label="Interactive 3D protein structure. Drag to rotate, scroll to zoom, click a residue to inspect it." />
        {!pdb && <div className="viewer-empty"><p>Load a protein to see its predicted 3D structure.</p></div>}
      </div>
      <div className="legend" aria-label="Colour legend">
        {BANDS.map((b) => <span key={b.key}><i className="sw" style={{ background: b.color }} />{b.label}</span>)}
        <span><i className="sw" style={{ background: "#d946ef" }} />Selected</span>
        <span><i className="sw" style={{ background: "#22c55e" }} />Neighbours</span>
      </div>
    </div>
  );
}
