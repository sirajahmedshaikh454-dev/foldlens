"""Variant Lens: explain what a single amino-acid change likely does, in words."""
import re
from .aminos import THREE_TO_ONE, NAMES, HYDROPATHY, VOLUME, CHARGE
from .structure import Residue, neighbor_counts, contacts_of
from .confidence import band

_ONE = re.compile(r"^(?:p\.)?([A-Z])(\d+)([A-Z])$")
_THREE = re.compile(r"^(?:p\.)?([A-Za-z]{3})(\d+)([A-Za-z]{3})$")
BURIED_NEIGHBORS = 18  # shortcut: C-alpha count heuristic, upgrade to real SASA (e.g. freesasa) if accuracy matters


def parse_mutation(text: str) -> tuple[str, int, str]:
    t = text.strip()
    m = _ONE.match(t.upper())
    if m:
        wt, pos, mt = m.group(1), int(m.group(2)), m.group(3)
    else:
        m = _THREE.match(t)
        if not m:
            raise ValueError("Use a format like R175H or p.Arg175His")
        wt, mt = THREE_TO_ONE.get(m.group(1).upper()), THREE_TO_ONE.get(m.group(3).upper())
        pos = int(m.group(2))
    if wt not in NAMES or mt not in NAMES:
        raise ValueError("Unknown amino acid code")
    if wt == mt:
        raise ValueError("Wild-type and mutant are the same (synonymous)")
    return wt, pos, mt


def analyze(residues: list[Residue], wt: str, pos: int, mt: str, esm: dict | None = None) -> dict:
    idx = next((i for i, r in enumerate(residues) if r.num == pos), None)
    if idx is None:
        raise ValueError(f"Position {pos} is outside the model (1-{residues[-1].num})")
    actual = THREE_TO_ONE.get(residues[idx].name, "?")
    if actual != wt:
        raise ValueError(f"Residue {pos} is {NAMES.get(actual, actual)} ({actual}) in this protein, not {wt}")

    res = residues[idx]
    buried = int(neighbor_counts(residues)[idx]) >= BURIED_NEIGHBORS
    conf = band(res.plddt)
    contacts = contacts_of(residues, idx)
    d_hyd = HYDROPATHY[mt] - HYDROPATHY[wt]
    d_vol = VOLUME[mt] - VOLUME[wt]
    d_chg = CHARGE.get(mt, 0) - CHARGE.get(wt, 0)

    story, score = [], 0
    story.append(f"{NAMES[wt].capitalize()} at position {pos} becomes {NAMES[mt]}.")
    story.append(f"This residue sits {'deep inside the protein core' if buried else 'near the surface'} "
                 f"with {len(contacts)} close neighbours.")
    if buried:
        score += 20
    if abs(d_chg) >= 1:
        score += 25 if buried else 12
        story.append(f"The charge changes ({'gains' if d_chg > 0 else 'loses'} {abs(d_chg):g}); "
                     + ("burying a charge is usually destabilizing." if buried else "this can disrupt surface interactions or binding."))
    if abs(d_vol) > 40:
        score += 20 if buried else 6
        story.append(f"The side chain gets much {'bigger' if d_vol > 0 else 'smaller'} ({d_vol:+.0f} Å³), "
                     + ("which may clash or leave a cavity in the core." if buried else "a moderate change on the surface."))
    if buried and d_hyd < -3:
        score += 15
        story.append("A water-loving residue replaces a water-avoiding one inside the core.")
    if mt == "P":
        score += 20
        story.append("Proline is rigid and often breaks helices and strands.")
    if wt == "G":
        score += 15
        story.append("Glycine is uniquely flexible; replacing it can strain the backbone.")
    if wt == "C":
        score += 10
        story.append("Losing a cysteine can break a disulfide bond or metal site.")
    if conf["key"] in ("low", "very_low"):
        score = int(score * 0.6)
        story.append("Caution: AlphaFold is not confident about this region, so structural reasoning here is weak.")
    if esm:
        score = int(0.5 * score + 0.5 * esm["disruption"])
        story.append(f"The ESM-2 language model {'dislikes' if esm['llr'] < -2 else 'tolerates'} this change "
                     f"(log-likelihood ratio {esm['llr']:+.2f}).")

    score = min(score, 100)
    verdict = "likely disruptive" if score >= 50 else "possibly disruptive" if score >= 25 else "likely tolerated"
    return {
        "position": pos, "wt": wt, "mt": mt, "plddt": round(res.plddt, 1), "confidence": conf,
        "buried": buried, "contacts": [residues[j].num for j in contacts],
        "deltas": {"hydropathy": round(d_hyd, 2), "volume": round(d_vol, 1), "charge": d_chg},
        "score": score, "verdict": verdict, "story": story, "esm": esm,
        "disclaimer": "Research use only. Heuristic estimate, not a clinical classification.",
    }
