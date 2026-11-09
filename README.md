# FoldLens

**See what AlphaFold is really telling you.** FoldLens turns AlphaFold predictions into plain-English answers for people who aren't structural biologists: genetic counsellors, students, wet-lab scientists and small biotech teams.

| Module | What it does |
|---|---|
| **Explorer + Trust Map** | Load any protein from the AlphaFold DB (or upload a `.pdb`). 3D view coloured by confidence, a clickable per-residue *confidence barcode*, and a plain-English report of which regions you can trust (pLDDT + PAE). |
| **Variant Lens** | Type a mutation (`R175H`, `p.Arg175His`). FoldLens checks it against the real sequence, finds the residue's 3D neighbourhood, and writes a *mutation story* with a 0-100 disruption score. Optional ESM-2 pretrained language-model score. |
| **Ligand Bench** | Paste SMILES and rank molecules by drug-likeness (QED, Lipinski, TPSA) with RDKit. A fast filter before docking. |
| **Fold School** | Five hands-on lessons on real structures (haemoglobin, p53, GFP...) with quizzes that deep-link into the tool. |

No GPU needed: structures come precomputed from the [AlphaFold Protein Structure Database](https://alphafold.ebi.ac.uk).

## Stack
React 18 + Vite · 3Dmol.js · Flask · NumPy · RDKit · optional PyTorch + Hugging Face `facebook/esm2_t12_35M_UR50D`

## Run it

```bash
# backend
cd backend
python -m venv .venv && . .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-ml.txt                # optional: ESM-2 scoring (~2 GB)
python app.py                                     # http://127.0.0.1:5000
pytest                                            # tests

# frontend (new terminal)
cd frontend
npm install
npm run dev                                       # http://localhost:5173
```

## API
| Method | Path | Body |
|---|---|---|
| GET | `/api/health` | |
| GET | `/api/protein/<uniprot>` | metadata + trust report |
| GET | `/api/protein/<uniprot>/pdb` | PDB text |
| POST | `/api/variant` | `{accession, mutation, use_esm?}` |
| POST | `/api/trust/upload` | multipart `file` |
| POST | `/api/ligands` | `{smiles: [..] or "a\nb"}` |

## Limits (be honest with users)
- The variant score is a transparent **heuristic** (burial, charge, size, proline/glycine, confidence), optionally blended with ESM-2. **Research use only; not a clinical classification.**
- Burial uses a C-alpha neighbour count, not true solvent accessibility.
- Ligand Bench ranks drug-likeness, **not binding**.
- AlphaFold structures are static snapshots; low-confidence regions shouldn't be interpreted.

## Ideas for next
Real SASA (freesasa) · AlphaMissense lookup · Boltz-2 co-folding for Ligand Bench on a GPU worker · PDF report export.
