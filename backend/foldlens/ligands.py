"""Ligand Bench: rank candidate molecules by drug-likeness with RDKit (no docking)."""
from functools import lru_cache

MAX_MOLECULES = 200


@lru_cache(maxsize=1)
def _rdkit():
    """Lazy import so the rest of FoldLens runs where RDKit can't load (e.g. blocked native DLLs)."""
    try:
        from rdkit import Chem, RDLogger
        from rdkit.Chem import Descriptors, QED, rdMolDescriptors
    except ImportError:
        return None
    RDLogger.DisableLog("rdApp.*")
    return Chem, Descriptors, QED, rdMolDescriptors


def available() -> bool:
    return _rdkit() is not None


def profile(smiles: str) -> dict:
    Chem, Descriptors, QED, rdMolDescriptors = _rdkit()
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return {"smiles": smiles, "valid": False, "error": "Could not parse SMILES"}
    mw, logp = Descriptors.MolWt(mol), Descriptors.MolLogP(mol)
    hbd, hba = rdMolDescriptors.CalcNumHBD(mol), rdMolDescriptors.CalcNumHBA(mol)
    tpsa = rdMolDescriptors.CalcTPSA(mol)
    violations = sum([mw > 500, logp > 5, hbd > 5, hba > 10])
    flags = []
    if violations > 1:
        flags.append("Fails Lipinski rule of five")
    if tpsa > 140:
        flags.append("Poor oral absorption likely (TPSA > 140)")
    if tpsa < 90 and mw < 450:
        flags.append("May cross the blood-brain barrier")
    return {
        "smiles": Chem.MolToSmiles(mol), "valid": True, "qed": round(QED.qed(mol), 3),
        "mw": round(mw, 1), "logp": round(logp, 2), "hbd": hbd, "hba": hba, "tpsa": round(tpsa, 1),
        "rotatable": rdMolDescriptors.CalcNumRotatableBonds(mol), "lipinski_violations": violations, "flags": flags,
    }


def rank(smiles_list: list[str]) -> list[dict]:
    if not available():
        raise RuntimeError("Ligand Bench needs RDKit, which could not load on this server")
    items = [s.strip() for s in smiles_list if s and s.strip()]
    if not items:
        raise ValueError("Provide at least one SMILES string")
    if len(items) > MAX_MOLECULES:
        raise ValueError(f"At most {MAX_MOLECULES} molecules per request")
    out = [profile(s) for s in items]
    return sorted(out, key=lambda m: (m["valid"], m.get("qed", 0)), reverse=True)
