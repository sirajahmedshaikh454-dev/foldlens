"""Minimal PDB parsing: one C-alpha per residue, pLDDT read from the B-factor column (AlphaFold convention)."""
from dataclasses import dataclass
import numpy as np


@dataclass
class Residue:
    num: int
    name: str  # three-letter code
    chain: str
    xyz: tuple
    plddt: float


def parse_ca(pdb_text: str) -> list[Residue]:
    residues, seen = [], set()
    for line in pdb_text.splitlines():
        if not line.startswith("ATOM") or line[12:16].strip() != "CA":
            continue
        key = (line[21], line[22:27])  # chain + resnum + insertion code
        if key in seen:  # skip alternate locations
            continue
        seen.add(key)
        residues.append(Residue(
            num=int(line[22:26]),
            name=line[17:20].strip(),
            chain=line[21].strip() or "A",
            xyz=(float(line[30:38]), float(line[38:46]), float(line[46:54])),
            plddt=float(line[60:66] or 0),
        ))
    if not residues:
        raise ValueError("No C-alpha atoms found; is this a PDB file?")
    return residues


def neighbor_counts(residues: list[Residue], radius: float = 10.0) -> np.ndarray:
    """Count C-alphas within `radius` Å of each residue (sequence neighbours ±2 excluded). A burial proxy."""
    xyz = np.array([r.xyz for r in residues])
    d = np.linalg.norm(xyz[:, None] - xyz[None], axis=-1)
    idx = np.arange(len(residues))
    close = (d < radius) & (np.abs(idx[:, None] - idx[None]) > 2)
    return close.sum(axis=1)


def contacts_of(residues: list[Residue], i: int, radius: float = 8.0) -> list[int]:
    xyz = np.array([r.xyz for r in residues])
    d = np.linalg.norm(xyz - xyz[i], axis=1)
    return [j for j in np.argsort(d) if d[j] < radius and abs(j - i) > 2]
