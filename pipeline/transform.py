"""Filtrage COFOG, pivot, jointure population et métriques par habitant."""

import numpy as np
import pandas as pd

from pipeline.config import CODE_DEFENSE, CODE_SOCIAL


def filtrer_themes(df_dep: pd.DataFrame) -> pd.DataFrame:
    """
    Conserve uniquement GF02 (Défense) et GF10 (Protection sociale), niveau agrégé.

    @param df_dep DataFrame des dépenses normalisé
    @returns DataFrame filtré [pays, annee, code_depense, montant]
    """
    print(f"\n[2/6] Filtrage sur les thèmes {CODE_DEFENSE} (Défense) et {CODE_SOCIAL} (Protection sociale)...")

    avant = df_dep.shape[0]
    masque = df_dep["code_depense"].isin([CODE_DEFENSE, CODE_SOCIAL])
    df_filtre = df_dep.loc[masque, ["pays", "annee", "code_depense", "montant"]].copy()
    apres = df_filtre.shape[0]

    print(f"    Avant filtrage : {avant:>6} lignes")
    print(f"    Après filtrage : {apres:>6} lignes ({avant - apres} lignes supprimées)")
    print(f"    Pays couverts  : {df_filtre['pays'].nunique()}")
    print(f"    Annees         : {df_filtre['annee'].min()} -> {df_filtre['annee'].max()}")

    return df_filtre


def pivoter_depenses(df_filtre: pd.DataFrame) -> pd.DataFrame:
    """
    Une ligne par (pays, annee) avec defense_mds et social_mds.

    @param df_filtre DataFrame filtré
    @returns DataFrame pivoté
    """
    print("\n[3/6] Pivot du DataFrame (pays × annee)...")

    pivot = (
        df_filtre
        .pivot_table(
            index=["pays", "annee"],
            columns="code_depense",
            values="montant",
            aggfunc="sum",
            observed=True,
        )
        .rename(columns={CODE_DEFENSE: "defense_mds", CODE_SOCIAL: "social_mds"})
        .fillna(0)
        .reset_index()
    )

    for col in ("defense_mds", "social_mds"):
        if col not in pivot.columns:
            pivot[col] = 0.0

    pivot.columns.name = None

    print(f"    DataFrame pivoté : {pivot.shape[0]:>6} lignes × {pivot.shape[1]} colonnes")

    return pivot


def joindre_population(pivot: pd.DataFrame, df_pop: pd.DataFrame) -> pd.DataFrame:
    """Jointure interne sur (pays, annee)."""
    print("\n[4/6] Jointure avec la population...")

    df_pop_clean = df_pop[["pays", "annee", "population_totale"]].copy()

    avant = pivot.shape[0]
    merged = pivot.merge(df_pop_clean, on=["pays", "annee"], how="inner")
    apres = merged.shape[0]

    lignes_perdues = avant - apres
    if lignes_perdues > 0:
        print(f"    ATTENTION : {lignes_perdues} lignes perdues à la jointure (pays/années sans population)")

    print(f"    Après jointure : {apres:>6} lignes × {merged.shape[1]} colonnes")

    return merged


def joindre_pib(merged: pd.DataFrame, df_pib: pd.DataFrame) -> pd.DataFrame:
    """Jointure gauche sur (pays, annee) pour le PIB en millions d'euros."""
    print("\n[4b/6] Jointure avec le PIB (millions €)...")
    avant = merged.shape[0]
    out = merged.merge(df_pib, on=["pays", "annee"], how="left")
    manque = out["pib_millions"].isna().sum()
    if manque > 0:
        print(f"    ATTENTION : {manque} lignes sans PIB (pourcentages PIB non calculés)")
    print(f"    Après jointure PIB : {out.shape[0]:>6} lignes (inchangé si left join : {avant})")
    return out


def calculer_metriques(merged: pd.DataFrame) -> pd.DataFrame:
    """
    defense_per_capita, social_per_capita, ratio_defense (0 si dénominateur nul).
    """
    print("\n[5/6] Calcul des métriques par habitant et du ratio défense...")

    df = merged.copy()

    df["defense_per_capita"] = (df["defense_mds"] * 1_000_000_000) / df["population_totale"]
    df["social_per_capita"] = (df["social_mds"] * 1_000_000_000) / df["population_totale"]

    # Dépenses COFOG en milliards € ; PIB en millions € → % du PIB.
    if "pib_millions" in df.columns:
        pm = df["pib_millions"].astype(float)
        ok = pm > 0
        df["def_pib"] = np.where(
            ok,
            100_000.0 * df["defense_mds"] / pm,
            np.nan,
        )
        df["soc_pib"] = np.where(
            ok,
            100_000.0 * df["social_mds"] / pm,
            np.nan,
        )
    else:
        df["def_pib"] = np.nan
        df["soc_pib"] = np.nan

    denominateur = df["defense_per_capita"] + df["social_per_capita"]
    df["ratio_defense"] = np.where(
        denominateur > 0,
        df["defense_per_capita"] / denominateur,
        0.0,
    )

    print(f"    defense_per_capita — min: {df['defense_per_capita'].min():.1f} €  max: {df['defense_per_capita'].max():.1f} €")
    print(f"    social_per_capita  — min: {df['social_per_capita'].min():.1f} €  max: {df['social_per_capita'].max():.1f} €")
    print(f"    ratio_defense      — min: {df['ratio_defense'].min():.4f}   max: {df['ratio_defense'].max():.4f}")
    print(f"    DataFrame final    : {df.shape[0]:>6} lignes × {df.shape[1]} colonnes")

    return df
