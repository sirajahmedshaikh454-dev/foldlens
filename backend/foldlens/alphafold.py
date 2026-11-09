"""AlphaFold Protein Structure Database client (precomputed predictions, no GPU needed)."""
import json
import re
import urllib.request
from functools import lru_cache

API = "https://alphafold.ebi.ac.uk/api/prediction/{}"
ACCESSION = re.compile(r"^[A-Z0-9]{6,10}$")


def _get(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "FoldLens/0.1"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def check_accession(acc: str) -> str:
    acc = acc.strip().upper()
    if not ACCESSION.match(acc):
        raise ValueError("Use a UniProt accession like P04637")
    return acc


@lru_cache(maxsize=64)
def entry(acc: str) -> dict:
    acc = check_accession(acc)
    try:
        data = json.loads(_get(API.format(acc)))
    except urllib.error.HTTPError as e:
        if 400 <= e.code < 500:
            raise LookupError(f"No AlphaFold prediction for {acc}") from e
        raise
    e = data[0]
    return {
        "accession": acc,
        "name": e.get("uniprotDescription", ""),
        "gene": e.get("gene", ""),
        "organism": e.get("organismScientificName", ""),
        "sequence": e.get("uniprotSequence") or e.get("sequence", ""),
        "pdb_url": e["pdbUrl"],
        "pae_url": e.get("paeDocUrl"),
        "version": e.get("latestVersion"),
    }


@lru_cache(maxsize=64)
def pdb_text(acc: str) -> str:
    return _get(entry(acc)["pdb_url"]).decode()


@lru_cache(maxsize=16)
def pae_matrix(acc: str):
    url = entry(acc)["pae_url"]
    if not url:
        return None
    doc = json.loads(_get(url, timeout=60))
    doc = doc[0] if isinstance(doc, list) else doc
    return doc.get("predicted_aligned_error")
