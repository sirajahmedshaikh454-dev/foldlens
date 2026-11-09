"""Amino-acid facts used to narrate a mutation."""

THREE_TO_ONE = {
    "ALA": "A", "ARG": "R", "ASN": "N", "ASP": "D", "CYS": "C", "GLN": "Q", "GLU": "E", "GLY": "G",
    "HIS": "H", "ILE": "I", "LEU": "L", "LYS": "K", "MET": "M", "PHE": "F", "PRO": "P", "SER": "S",
    "THR": "T", "TRP": "W", "TYR": "Y", "VAL": "V",
}
ONE_TO_THREE = {v: k for k, v in THREE_TO_ONE.items()}

NAMES = {
    "A": "alanine", "R": "arginine", "N": "asparagine", "D": "aspartate", "C": "cysteine",
    "Q": "glutamine", "E": "glutamate", "G": "glycine", "H": "histidine", "I": "isoleucine",
    "L": "leucine", "K": "lysine", "M": "methionine", "F": "phenylalanine", "P": "proline",
    "S": "serine", "T": "threonine", "W": "tryptophan", "Y": "tyrosine", "V": "valine",
}

# Kyte-Doolittle hydropathy
HYDROPATHY = {
    "A": 1.8, "R": -4.5, "N": -3.5, "D": -3.5, "C": 2.5, "Q": -3.5, "E": -3.5, "G": -0.4, "H": -3.2, "I": 4.5,
    "L": 3.8, "K": -3.9, "M": 1.9, "F": 2.8, "P": -1.6, "S": -0.8, "T": -0.7, "W": -0.9, "Y": -1.3, "V": 4.2,
}

# Side-chain volume, Å^3 (Zamyatnin)
VOLUME = {
    "A": 88.6, "R": 173.4, "N": 114.1, "D": 111.1, "C": 108.5, "Q": 143.8, "E": 138.4, "G": 60.1, "H": 153.2, "I": 166.7,
    "L": 166.7, "K": 168.6, "M": 162.9, "F": 189.9, "P": 112.7, "S": 89.0, "T": 116.1, "W": 227.8, "Y": 193.6, "V": 140.0,
}

CHARGE = {"R": 1, "K": 1, "H": 0.1, "D": -1, "E": -1}  # His mostly neutral at pH 7.4
