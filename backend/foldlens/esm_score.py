"""Optional pretrained-model score: ESM-2 masked-marginal log-likelihood ratio.
Enabled only if torch + transformers are installed (pip install -r requirements-ml.txt)."""
from functools import lru_cache

MODEL = "facebook/esm2_t12_35M_UR50D"
WINDOW = 1000  # shortcut: score a window around long proteins; ESM-2 max context is ~1022 tokens


@lru_cache(maxsize=1)
def _load():
    try:
        import torch
        from transformers import AutoTokenizer, EsmForMaskedLM
    except ImportError:
        return None
    tok = AutoTokenizer.from_pretrained(MODEL)
    model = EsmForMaskedLM.from_pretrained(MODEL).eval()
    return torch, tok, model


def available() -> bool:
    try:
        import torch, transformers  # noqa: F401
        return True
    except ImportError:
        return False


def score(sequence: str, pos: int, wt: str, mt: str) -> dict | None:
    loaded = _load()
    if not loaded or not sequence:
        return None
    torch, tok, model = loaded
    start = max(0, min(pos - 1 - WINDOW // 2, len(sequence) - WINDOW))
    window = sequence[start:start + WINDOW]
    i = pos - 1 - start + 1  # +1 for the <cls> token
    ids = tok(window, return_tensors="pt")["input_ids"]
    ids[0, i] = tok.mask_token_id
    with torch.no_grad():
        logp = torch.log_softmax(model(ids).logits[0, i], dim=-1)
    llr = (logp[tok.convert_tokens_to_ids(mt)] - logp[tok.convert_tokens_to_ids(wt)]).item()
    # map LLR (~ -10..+2) to 0..100 disruption
    return {"model": MODEL, "llr": round(llr, 2), "disruption": int(max(0, min(100, -llr * 10)))}
