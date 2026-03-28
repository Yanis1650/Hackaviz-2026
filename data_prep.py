"""
data_prep.py — Orchestrateur du pipeline Hackaviz 2026.

Délègue à pipeline.load, pipeline.transform, pipeline.export.
"""

from pipeline.config import OUTPUT_PATH
from pipeline.export import exporter_json
from pipeline.load import charger_donnees, charger_pib
from pipeline.transform import (
    calculer_metriques,
    filtrer_themes,
    joindre_pib,
    joindre_population,
    pivoter_depenses,
)

if __name__ == "__main__":
    df_depenses, df_population = charger_donnees()
    df_pib = charger_pib()
    df_filtre = filtrer_themes(df_depenses)
    df_pivot = pivoter_depenses(df_filtre)
    df_merged = joindre_population(df_pivot, df_population)
    df_merged = joindre_pib(df_merged, df_pib)
    df_final = calculer_metriques(df_merged)
    exporter_json(df_final, OUTPUT_PATH)
