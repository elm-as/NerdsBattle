"""Moniteur de progression en direct des cours et questions NerdsBattle.

Usage :
    python scripts/monitor_progress.py
"""

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSES_ROOT = os.path.join(BASE_DIR, "src", "data", "courses")

def get_stats_by_level(level="sixieme"):
    stats = {}
    total_q = 0
    total_c = 0

    if not os.path.exists(COURSES_ROOT):
        return stats, 0, 0

    for subject in sorted(os.listdir(COURSES_ROOT)):
        lvl_dir = os.path.join(COURSES_ROOT, subject, level)
        if not os.path.isdir(lvl_dir):
            continue

        files = [f for f in os.listdir(lvl_dir) if f.endswith(".json")]
        if not files:
            continue

        q_count = 0
        for f in files:
            try:
                with open(os.path.join(lvl_dir, f), "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    q_count += len(data.get("questions", []))
            except Exception:
                pass

        stats[subject] = {"courses": len(files), "questions": q_count}
        total_c += len(files)
        total_q += q_count

    return stats, total_c, total_q

def main():
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    level_arg = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    level_map = {
        "6eme": "sixieme", "6e": "sixieme", "sixieme": "sixieme",
        "5eme": "cinquieme", "5e": "cinquieme", "cinquieme": "cinquieme",
        "4eme": "quatrieme", "4e": "quatrieme", "quatrieme": "quatrieme",
        "3eme": "troisieme", "3e": "troisieme", "troisieme": "troisieme",
        "2nde": "seconde", "2nd": "seconde", "seconde": "seconde",
        "1ere": "premiere", "1er": "premiere", "premiere": "premiere",
        "tle": "terminale", "terminale": "terminale",
    }

    if level_arg in ("all", "global", "total"):
        all_lvls = ["sixieme", "cinquieme", "quatrieme", "troisieme", "seconde", "premiere", "terminale"]
        g_c, g_q = 0, 0
        print("\n" + "=" * 56)
        print("   TABLEAU DE BORD GLOBAL NERDSBATTLE")
        print("=" * 56)
        print(f"{'Niveau':<20} | {'Cours':<8} | {'Questions':<12}")
        print("-" * 56)
        for lvl in all_lvls:
            _, c, q = get_stats_by_level(lvl)
            g_c += c
            g_q += q
            print(f"{lvl.capitalize():<20} | {c:<8} | {q:<12}")
        print("-" * 56)
        print(f"{'TOTAL GENERAL':<20} | {g_c:<8} | {g_q:<12}")
        print("=" * 56 + "\n")
        return

    level = level_map.get(level_arg.strip("-"), level_arg)
    stats, total_c, total_q = get_stats_by_level(level)

    print("\n" + "=" * 56)
    print(f"   TABLEAU DE BORD NERDSBATTLE — NIVEAU {level.upper()}")
    print("=" * 56)
    print(f"{'Matiere':<20} | {'Cours':<8} | {'Questions':<12}")
    print("-" * 56)

    for subj, data in sorted(stats.items(), key=lambda x: -x[1]["questions"]):
        print(f"{subj.capitalize():<20} | {data['courses']:<8} | {data['questions']:<12}")

    print("-" * 56)
    print(f"{('TOTAL ' + level.upper())[:20]:<20} | {total_c:<8} | {total_q:<12}")
    print("=" * 56)

    # Afficher les 5 derniers fichiers crees
    all_files = []
    for subject in os.listdir(COURSES_ROOT):
        lvl_dir = os.path.join(COURSES_ROOT, subject, level)
        if os.path.isdir(lvl_dir):
            for f in os.listdir(lvl_dir):
                if f.endswith(".json"):
                    fp = os.path.join(lvl_dir, f)
                    all_files.append((os.path.getmtime(fp), subject, f))

    all_files.sort(reverse=True)
    if all_files:
        print("\n  Derniers cours generes :")
        for mtime, subj, f in all_files[:5]:
            print(f"   * [{subj.upper()}] {f}")
    print()

if __name__ == "__main__":
    main()
