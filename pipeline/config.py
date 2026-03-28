"""Chemins et constantes COFOG du pipeline."""

import os

INPUT_DIR: str = "data/parquet_long"
OUTPUT_PATH: str = "public/data/processed_data.json"

DEPENSES_FILE: str = os.path.join(INPUT_DIR, "depenses_euro.parquet")
POPULATION_FILE: str = os.path.join(INPUT_DIR, "population.parquet")
# PIB en millions d'euros (même périmètre pays/année que les CSV du dépôt).
PIB_CSV: str = os.path.join("data", "csv_long", "pib.csv")

CODE_DEFENSE: str = "GF02"
CODE_SOCIAL: str = "GF10"
