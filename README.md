# Hackaviz 2026 — Bascule géopolitique européenne

Application web de **dataviz** sur les dépenses publiques européennes (COFOG) : part **défense** vs **protection sociale**, dans le temps et par pays. Le parcours combine carte (MapLibre), graphiques (D3), carrousel d’années, timeline d’événements et flashes narratifs entre chapitres.

## Prérequis

- **Node.js** 20+ (recommandé 22 pour coller au Dockerfile)
- **npm** (lockfile présent : `npm ci` en CI / Docker)

Pour régénérer les données côté Python :

- **Python** 3.10+
- **pandas** et un moteur **Parquet** (ex. `pyarrow`)

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre l’URL affichée par Vite (souvent `http://localhost:5173`).

| Script        | Rôle                          |
|---------------|-------------------------------|
| `npm run dev` | Serveur de dev avec rechargement |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build localement |

## Structure du dépôt

```
src/
  App.svelte          # Orchestration année, carrousel, timeline
  components/         # Cartes, graphiques, chapitres, timeline…
  lib/                # Logique D3, MapLibre, narration, stores
  styles/global.css
public/
  data/
    processed_data.json   # Données agrégées consommées par l’app
    carte.geojson         # Fond géographique
pipeline/
  config.py             # Chemins d’entrée / sortie COFOG
  load.py, transform.py, export.py
data_prep.py            # Point d’entrée du pipeline
```

## Pipeline de données

Le script assemble les Parquet **dépenses** et **population**, joint le **PIB** (CSV), calcule les métriques et écrit `public/data/processed_data.json`.

**Entrées attendues** (voir `pipeline/config.py`) :

- `data/parquet_long/depenses_euro.parquet`
- `data/parquet_long/population.parquet`
- `data/csv_long/pib.csv` (séparateur `;`, décimales `,`)

**Sortie :** `public/data/processed_data.json`

```bash
python -m pip install pandas pyarrow
python data_prep.py
```

Ensuite, relancer `npm run dev` ou `npm run build` pour prendre en compte le JSON mis à jour.

## Docker

Image multi-étapes : build Vite + Svelte, puis Nginx pour servir les fichiers statiques.

```bash
docker compose up --build
```

L’app est exposée sur **http://127.0.0.1:8080** (voir `docker-compose.yml`).

## Stack technique

- **Svelte 5** + **Vite 6**
- **D3** (graphiques)
- **MapLibre GL** (carte choroplèthe / interactions)
- **Python / pandas** (préparation des données, hors runtime navigateur)

## Licence et crédits

Projet **privé** (`private: true` dans `package.json`). Adapter cette section si vous publiez le dépôt ou une démo (sources des données COFOG, Hackaviz, etc.).
