"""Orchestrateur maître d'ingestion des niveaux restants du programme officiel ivoirien.

Exécute séquentiellement l'ingestion niveau par niveau :
1. Troisième (3ème - BEPC)
2. Seconde (2nde)
3. Première (1ère)
4. Terminale (BAC)

Usage :
    python scripts/run_curriculum_batch.py [--levels 3eme,2nde,1ere,terminale]
"""

import argparse
import os
import subprocess
import sys
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PYTHON_EXEC = sys.executable
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INGEST_SCRIPT = os.path.join(BASE_DIR, "scripts", "ingest_level_full.py")

DEFAULT_LEVELS = ["3eme", "2nde", "1ere", "terminale"]

def execute_level_ingestion(level_name, force=False):
    """Lance l'ingestion complète pour un niveau donné via l'ingesteur officiel."""
    cmd = [PYTHON_EXEC, INGEST_SCRIPT, "--level", level_name]
    if force:
        cmd.append("--force")

    print("\n" + "=" * 64)
    print(f"🚀 LANCEMENT DU NIVEAU : {level_name.upper()}")
    print("=" * 64 + "\n", flush=True)

    start_level = time.time()
    try:
        proc = subprocess.run(cmd, cwd=BASE_DIR)
        elapsed = round((time.time() - start_level) / 60, 1)
        if proc.returncode == 0:
            print(f"\n✅ Niveau {level_name.upper()} achevé avec succès ({elapsed} min).", flush=True)
            return True
        print(f"\n⚠️ Niveau {level_name.upper()} terminé avec code {proc.returncode} ({elapsed} min).", flush=True)
        return False
    except Exception as exc:
        print(f"\n❌ Erreur inattendue sur {level_name.upper()} : {exc}", file=sys.stderr, flush=True)
        return False

def main():
    parser = argparse.ArgumentParser(description="Orchestrateur d'ingestion multi-niveaux")
    parser.add_argument(
        "--levels",
        default=",".join(DEFAULT_LEVELS),
        help="Niveaux séparés par des virgules (défaut: 3eme,2nde,1ere,terminale)"
    )
    parser.add_argument("--force", action="store_true", help="Forcer réécriture des cours existants")
    args = parser.parse_args()

    targets = [lvl.strip() for lvl in args.levels.split(",") if lvl.strip()]
    if not targets:
        print("Aucun niveau spécifié.", file=sys.stderr)
        sys.exit(1)

    print("=" * 64)
    print("   NERDSBATTLE — BATCH GLOBAL D'INGESTION DU CURRICULUM")
    print(f"   Niveaux ciblés : {', '.join(targets)}")
    print("=" * 64)

    batch_start = time.time()
    for idx, lvl in enumerate(targets, start=1):
        print(f"\n>>> [Étape {idx}/{len(targets)}] Début du niveau {lvl.upper()}")
        execute_level_ingestion(lvl, force=args.force)

    total_time = round((time.time() - batch_start) / 60, 1)
    print("\n" + "=" * 64)
    print(f"🎉 BATCH GLOBAL TERMINÉ EN {total_time} MINUTES !")
    print("=" * 64 + "\n")

if __name__ == "__main__":
    main()
