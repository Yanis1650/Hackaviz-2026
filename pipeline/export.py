"""Export JSON par année / pays avec rejet explicite de NaN et inf."""

import json
import math
import os
from typing import Any, Dict, Optional

import pandas as pd

from pipeline.config import OUTPUT_PATH


def _float_json(v: Any, ndigits: int) -> Optional[float]:
    """Convertit en float arrondi ; None si non fini (NaN, inf)."""
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(x):
        return None
    return round(x, ndigits)


def _int_json(v: Any) -> Optional[int]:
    """Entier population ; None si invalide ou non fini."""
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(x):
        return None
    return int(x)


def exporter_json(df: pd.DataFrame, output_path: str = OUTPUT_PATH) -> None:
    """
    Sérialise le DataFrame en JSON imbriqué année → pays.

    Valeurs non finies (NaN, ±inf) → clés absentes ou null selon le champ :
    def_pc, soc_pc, def_pib, soc_pib, ratio → null si invalide ; pop → null si invalide.
    """
    print(f"\n[6/6] Export JSON -> {output_path}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    resultat: Dict[str, Dict[str, Any]] = {}

    for annee, groupe_annee in df.groupby("annee"):
        cle_annee = str(int(annee))
        resultat[cle_annee] = {}

        for _, ligne in groupe_annee.iterrows():
            code_pays = str(ligne["pays"])
            entree: Dict[str, Any] = {}

            d_pc = _float_json(ligne["defense_per_capita"], 2)
            s_pc = _float_json(ligne["social_per_capita"], 2)
            d_pib = _float_json(ligne.get("def_pib"), 2)
            s_pib = _float_json(ligne.get("soc_pib"), 2)
            rat = _float_json(ligne["ratio_defense"], 4)
            pop = _int_json(ligne["population_totale"])

            if d_pc is not None:
                entree["def_pc"] = d_pc
            if s_pc is not None:
                entree["soc_pc"] = s_pc
            if d_pib is not None:
                entree["def_pib"] = d_pib
            if s_pib is not None:
                entree["soc_pib"] = s_pib
            if rat is not None:
                entree["ratio"] = rat
            if pop is not None:
                entree["pop"] = pop

            resultat[cle_annee][code_pays] = entree

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(resultat, f, ensure_ascii=False, indent=2)

    taille_ko = os.path.getsize(output_path) / 1024
    nb_annees = len(resultat)
    nb_pays = len(next(iter(resultat.values()))) if resultat else 0
    print(f"    Fichier créé    : {taille_ko:.1f} Ko")
    print(f"    Années          : {nb_annees}")
    print(f"    Pays (1re année): {nb_pays}")
    print("\n[OK] Pipeline termine avec succes.")
