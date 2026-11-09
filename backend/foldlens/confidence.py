"""Trust Map: turn pLDDT / PAE numbers into plain-English guidance."""
from .structure import Residue

BANDS = [  # (min pLDDT, key, label, advice) - thresholds from AlphaFold DB documentation
    (90, "very_high", "Very high", "Backbone and most side chains are reliable. OK for detailed work like binding-site analysis."),
    (70, "confident", "Confident", "Backbone fold is reliable; side-chain details may be off."),
    (50, "low", "Low", "Treat with caution. Shape is uncertain; may be flexible."),
    (0, "very_low", "Very low", "Likely disordered or unstructured. Do not interpret this shape."),
]


def band(plddt: float) -> dict:
    for lo, key, label, advice in BANDS:
        if plddt >= lo:
            return {"key": key, "label": label, "advice": advice}


def segments(residues: list[Residue], min_len: int = 5) -> list[dict]:
    """Contiguous runs of residues in the same confidence band."""
    out, start = [], 0
    for i in range(1, len(residues) + 1):
        if i == len(residues) or band(residues[i].plddt)["key"] != band(residues[start].plddt)["key"]:
            run = residues[start:i]
            if len(run) >= min_len:
                b = band(run[0].plddt)
                out.append({"start": run[0].num, "end": run[-1].num, "band": b["key"], "label": b["label"],
                            "mean_plddt": round(sum(r.plddt for r in run) / len(run), 1)})
            start = i
    return out


def pae_summary(pae: list[list[float]] | None) -> dict | None:
    if not pae:
        return None
    flat = [v for row in pae for v in row]
    good = sum(v < 5 for v in flat) / len(flat)
    return {
        "mean_pae": round(sum(flat) / len(flat), 1),
        "fraction_confident_pairs": round(good, 3),
        "advice": ("Domain arrangement is well defined." if good > 0.5 else
                   "Relative positions of domains are uncertain; don't trust how distant parts are placed."),
    }


def report(residues: list[Residue], pae=None) -> dict:
    counts = {k: 0 for _, k, _, _ in BANDS}
    for r in residues:
        counts[band(r.plddt)["key"]] += 1
    n = len(residues)
    frac = {k: round(v / n, 3) for k, v in counts.items()}
    mean = round(sum(r.plddt for r in residues) / n, 1)
    segs = segments(residues)
    disordered = [s for s in segs if s["band"] == "very_low"]
    verdict = (
        "This model is highly trustworthy overall." if mean >= 85 else
        "The core fold is trustworthy, but some regions are not." if mean >= 70 else
        "Large parts of this model are uncertain. Use it for rough shape only."
    )
    lines = [verdict, f"{round(100 * (frac['very_high'] + frac['confident']))}% of residues are predicted confidently."]
    if disordered:
        spans = ", ".join(f"{s['start']}-{s['end']}" for s in disordered[:5])
        lines.append(f"Likely disordered regions: {spans}. These may be flexible in reality, not misfolded.")
    p = pae_summary(pae)
    if p:
        lines.append(p["advice"])
    return {"length": n, "mean_plddt": mean, "fractions": frac, "segments": segs, "pae": p,
            "summary": lines, "per_residue": [round(r.plddt, 1) for r in residues]}
