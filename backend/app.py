"""FoldLens API."""
import urllib.error
from flask import Flask, jsonify, request, Response

from foldlens import alphafold, confidence, variant, ligands, esm_score
from foldlens.structure import parse_ca

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # uploads up to 20 MB


@app.errorhandler(ValueError)
def bad_request(e):
    return jsonify(error=str(e)), 400


@app.errorhandler(LookupError)
def not_found(e):
    return jsonify(error=str(e)), 404


@app.errorhandler(RuntimeError)
def unavailable(e):
    return jsonify(error=str(e)), 503


@app.errorhandler(urllib.error.URLError)
def upstream(e):
    return jsonify(error="AlphaFold DB is unreachable right now. Try again shortly."), 502


@app.get("/api/health")
def health():
    return jsonify(ok=True, esm=esm_score.available(), rdkit=ligands.available())


@app.get("/api/protein/<acc>")
def protein(acc):
    meta = alphafold.entry(alphafold.check_accession(acc))
    residues = parse_ca(alphafold.pdb_text(meta["accession"]))
    pae = alphafold.pae_matrix(meta["accession"]) if len(residues) <= 1500 else None  # big PAE docs are slow
    return jsonify(meta=meta, trust=confidence.report(residues, pae))


@app.get("/api/protein/<acc>/pdb")
def protein_pdb(acc):
    return Response(alphafold.pdb_text(alphafold.check_accession(acc)), mimetype="chemical/x-pdb")


@app.post("/api/variant")
def variant_route():
    body = request.get_json(silent=True) or {}
    acc = alphafold.check_accession(str(body.get("accession", "")))
    wt, pos, mt = variant.parse_mutation(str(body.get("mutation", "")))
    meta = alphafold.entry(acc)
    residues = parse_ca(alphafold.pdb_text(acc))
    esm = esm_score.score(meta["sequence"], pos, wt, mt) if body.get("use_esm") else None
    return jsonify(variant.analyze(residues, wt, pos, mt, esm))


@app.post("/api/trust/upload")
def trust_upload():
    f = request.files.get("file")
    if not f:
        raise ValueError("Attach a .pdb file")
    text = f.read().decode("utf-8", errors="replace")
    return jsonify(pdb=text, trust=confidence.report(parse_ca(text)))


@app.post("/api/ligands")
def ligands_route():
    body = request.get_json(silent=True) or {}
    smiles = body.get("smiles", [])
    if isinstance(smiles, str):
        smiles = smiles.splitlines()
    if not isinstance(smiles, list):
        raise ValueError("smiles must be a list or newline-separated text")
    return jsonify(results=ligands.rank([str(s) for s in smiles]))


if __name__ == "__main__":
    app.run(port=5000, debug=True)
