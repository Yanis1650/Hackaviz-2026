"""Chargement des Parquet dépenses et population."""

import pandas as pd

from pipeline.config import DEPENSES_FILE, PIB_CSV, POPULATION_FILE


def charger_donnees() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Charge les fichiers Parquet des dépenses et de la population.

    @returns tuple (df_depenses, df_population)
    @throws FileNotFoundError si un fichier est introuvable
    """
    print("[1/6] Chargement des fichiers Parquet...")

    df_dep = pd.read_parquet(DEPENSES_FILE)
    df_dep.columns = ["pays", "pays_nom", "code_depense", "depense_nom", "annee", "montant"]

    df_pop = pd.read_parquet(POPULATION_FILE)
    df_pop.columns = ["annee", "pays", "population_totale", "femmes", "hommes"]

    print(f"    depenses_euro  : {df_dep.shape[0]:>6} lignes × {df_dep.shape[1]} colonnes")
    print(f"    population     : {df_pop.shape[0]:>6} lignes × {df_pop.shape[1]} colonnes")

    return df_dep, df_pop


def charger_pib() -> pd.DataFrame:
    """
    Charge le PIB (millions d'euros) depuis le CSV projet.

    @returns DataFrame [pays, annee, pib_millions]
    """
    df = pd.read_csv(PIB_CSV, sep=";", decimal=",")
    df = df.rename(
        columns={
            "Année": "annee",
            "Cde_Pays": "pays",
            "Montant": "pib_millions",
        }
    )
    return df[["pays", "annee", "pib_millions"]].copy()
