// In-browser Ligand Bench using RDKit's WebAssembly build. Used when the server can't load native RDKit.
// shortcut: RDKit.js has no QED, so browser mode ranks by rule-of-five checks; server RDKit gives QED.
import initRDKitModule from "@rdkit/rdkit";
import wasmUrl from "@rdkit/rdkit/RDKit_minimal.wasm?url";

const MAX_MOLECULES = 200; // same limit as the server
let rdkit;
const load = () => (rdkit ??= initRDKitModule({ locateFile: () => wasmUrl }));

function profile(R, smiles) {
  const mol = R.get_mol(smiles);
  if (!mol || !mol.is_valid()) { mol?.delete(); return { smiles, valid: false, error: "Could not parse SMILES" }; }
  try {
    const d = JSON.parse(mol.get_descriptors());
    const mw = d.amw, logp = d.CrippenClogP, hbd = d.NumHBD, hba = d.NumHBA, tpsa = d.tpsa;
    const violations = [mw > 500, logp > 5, hbd > 5, hba > 10].filter(Boolean).length;
    const flags = [];
    if (violations > 1) flags.push("Fails Lipinski rule of five");
    if (tpsa > 140) flags.push("Poor oral absorption likely (TPSA > 140)");
    if (tpsa < 90 && mw < 450) flags.push("May cross the blood-brain barrier");
    return {
      smiles: mol.get_smiles(), valid: true, qed: null, mw: +mw.toFixed(1), logp: +logp.toFixed(2), hbd, hba,
      tpsa: +tpsa.toFixed(1), rotatable: d.NumRotatableBonds, lipinski_violations: violations, flags,
    };
  } finally { mol.delete(); } // wasm memory isn't garbage-collected
}

export async function rankInBrowser(text) {
  const items = text.split("\n").map((s) => s.trim()).filter(Boolean);
  if (!items.length) throw new Error("Provide at least one SMILES string");
  if (items.length > MAX_MOLECULES) throw new Error(`At most ${MAX_MOLECULES} molecules per request`);
  const R = await load();
  const out = items.map((s) => profile(R, s));
  // valid first, then fewest rule-of-five violations, then lowest TPSA
  return out.sort((a, b) => (b.valid - a.valid) || (a.lipinski_violations - b.lipinski_violations) || (a.tpsa - b.tpsa));
}
