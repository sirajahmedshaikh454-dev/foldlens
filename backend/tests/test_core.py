import pytest
from foldlens.structure import parse_ca
from foldlens import confidence, variant, ligands
from app import app


def fake_pdb(seq="MKVLAGRE", plddts=None):
    from foldlens.aminos import ONE_TO_THREE
    plddts = plddts or [95, 92, 88, 75, 60, 45, 30, 91]
    lines = []
    for i, (aa, p) in enumerate(zip(seq, plddts), start=1):
        lines.append(f"ATOM  {i:5d}  CA  {ONE_TO_THREE[aa]} A{i:4d}    {i*3.8:8.3f}{0:8.3f}{0:8.3f}  1.00{p:6.2f}           C")
    return "\n".join(lines)


def test_parse_reads_plddt_and_names():
    res = parse_ca(fake_pdb())
    assert len(res) == 8 and res[0].name == "MET" and res[0].plddt == 95


def test_parse_rejects_garbage():
    with pytest.raises(ValueError):
        parse_ca("hello")


def test_confidence_bands():
    assert confidence.band(95)["key"] == "very_high"
    assert confidence.band(70)["key"] == "confident"
    assert confidence.band(49.9)["key"] == "very_low"
    rep = confidence.report(parse_ca(fake_pdb()))
    assert rep["length"] == 8 and abs(sum(rep["fractions"].values()) - 1) < 0.01


@pytest.mark.parametrize("text,expected", [("R175H", ("R", 175, "H")), ("p.Arg175His", ("R", 175, "H")), ("g12d", ("G", 12, "D"))])
def test_parse_mutation(text, expected):
    assert variant.parse_mutation(text) == expected


@pytest.mark.parametrize("bad", ["", "R175", "R175R", "X12A", "drop table"])
def test_parse_mutation_rejects(bad):
    with pytest.raises(ValueError):
        variant.parse_mutation(bad)


def test_analyze_checks_wildtype_and_scores():
    res = parse_ca(fake_pdb())
    with pytest.raises(ValueError):
        variant.analyze(res, "A", 2, "P")  # residue 2 is K
    out = variant.analyze(res, "G", 6, "P")
    assert 0 <= out["score"] <= 100 and out["story"]


needs_rdkit = pytest.mark.skipif(not ligands.available(), reason="RDKit cannot load here")


@needs_rdkit
def test_ligands_rank_and_invalid():
    out = ligands.rank(["CC(=O)Oc1ccccc1C(=O)O", "not_a_smiles"])
    assert out[0]["valid"] and not out[-1]["valid"]
    with pytest.raises(ValueError):
        ligands.rank([])


def test_api_validation():
    c = app.test_client()
    assert c.get("/api/protein/bad!").status_code == 400
    assert c.post("/api/variant", json={"accession": "P04637", "mutation": "zzz"}).status_code == 400
    r = c.post("/api/ligands", json={"smiles": "CCO\nc1ccccc1"})
    if ligands.available():
        assert r.status_code == 200 and len(r.json["results"]) == 2
    else:
        assert r.status_code == 503
