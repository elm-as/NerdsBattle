import os
import re
import sys
import json
import shutil

# Ensure stdout uses UTF-8 encoding on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "fomesoutra_courses")
MANIFEST_PATH = os.path.join(OUTPUT_DIR, "manifest.json")
README_PATH = os.path.join(OUTPUT_DIR, "README_COURSES.md")

# Map keywords to standardized level names
LEVEL_MAP = [
    (r'6[eè]me|6e\b', '6eme'),
    (r'5[eè]me|5e\b', '5eme'),
    (r'4[eè]me|4e\b', '4eme'),
    (r'3[eè]me|3e\b', '3eme'),
    (r'2nd|2nde|seconde', '2nde'),
    (r'1ere|1ère|premiere|première', '1ere'),
    (r'tle|terminale', 'Terminale'),
    (r'bt\b|brevet.*technicien', 'BT'),
    (r'guide.*secondaire|programme.*secondaire', 'Guides_Et_Programmes'),
]

# Map keywords to standardized subject names
SUBJECT_MAP = [
    (r'svt|biolog|sciences.*vie', 'SVT'),
    (r'physique|chimie|\bpc\b', 'Physique-Chimie'),
    (r'math|algebre|geometrie', 'Mathematiques'),
    (r'francais|fran[cç]ais|litterature|conjugaison|bescherelle|grammaire|orthographe|texte', 'Francais'),
    (r'histoire|geographie|h-g|hist-geo', 'Histoire-Geographie'),
    (r'anglais|english', 'Anglais'),
    (r'espagnol|spanish', 'Espagnol'),
    (r'philo|philosophie', 'Philosophie'),
    (r'edhc|education.*civique', 'EDHC'),
    (r'allemand|german', 'Allemand'),
    (r'compta|comptabilite|gestion|economie|entreprise', 'Economie-Comptabilite'),
    (r'informatique|tic\b|technologie', 'Informatique-TIC'),
    (r'eps|sport', 'EPS'),
    (r'art.*plastique|musique', 'Arts-Musique'),
]

def determine_level(title, url):
    combined = (url + " " + title).lower()
    for pattern, name in LEVEL_MAP:
        if re.search(pattern, combined):
            return name
    return "Autres_Niveaux"

def determine_subject(title, url):
    combined = (url + " " + title).lower()
    for pattern, name in SUBJECT_MAP:
        if re.search(pattern, combined):
            return name
    return "General"

def organize_files():
    if not os.path.exists(MANIFEST_PATH):
        print("Aucun fichier manifest.json trouvé.")
        return

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    print(f"=== Reclassification de {len(manifest)} cours ===")
    
    updated_manifest = []
    moved_count = 0

    for item in manifest:
        title = item.get("title", "")
        page_url = item.get("page_url", "")

        # Find level and subject
        level = determine_level(title, page_url)
        subject = determine_subject(title, page_url)

        # Current file path
        curr_path = item.get("local_path")
        if not curr_path or not os.path.exists(curr_path):
            filename = item.get("filename")
            found = False
            for root, _, files in os.walk(OUTPUT_DIR):
                if filename in files:
                    curr_path = os.path.join(root, filename)
                    found = True
                    break
            if not found:
                print(f"[-] Fichier non trouve: {item.get('filename')}")
                continue

        # Target new path
        target_dir = os.path.join(OUTPUT_DIR, level, subject)
        os.makedirs(target_dir, exist_ok=True)

        new_filename = os.path.basename(curr_path)
        new_path = os.path.join(target_dir, new_filename)

        if curr_path != new_path:
            try:
                shutil.move(curr_path, new_path)
                moved_count += 1
            except Exception as e:
                print(f"Error moving {curr_path}: {e}")

        rel_path = os.path.relpath(new_path, OUTPUT_DIR).replace("\\", "/")
        
        item["niveau"] = level
        item["matiere"] = subject
        item["local_path"] = new_path
        item["relative_path"] = rel_path
        updated_manifest.append(item)

    # Clean up empty directories like Dossier/
    for root, dirs, files in os.walk(OUTPUT_DIR, topdown=False):
        for d in dirs:
            dir_path = os.path.join(root, d)
            try:
                if not os.listdir(dir_path):
                    os.rmdir(dir_path)
            except Exception:
                pass

    # Save updated manifest
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(updated_manifest, f, ensure_ascii=False, indent=2)

    # Save summary README
    with open(README_PATH, "w", encoding="utf-8") as f:
        f.write(f"# Base de Cours Fomesoutra Classés par Niveau et Matière\n\n")
        f.write(f"**Nombre total de cours organisés** : {len(updated_manifest)}\n\n")

        # Group by level -> subject
        grouped = {}
        for item in updated_manifest:
            lvl = item["niveau"]
            subj = item["matiere"]
            if lvl not in grouped:
                grouped[lvl] = {}
            if subj not in grouped[lvl]:
                grouped[lvl][subj] = []
            grouped[lvl][subj].append(item)

        for lvl in sorted(grouped.keys()):
            f.write(f"## 🎓 Niveau : `{lvl}`\n\n")
            for subj in sorted(grouped[lvl].keys()):
                docs = grouped[lvl][subj]
                f.write(f"### 📚 {subj} ({len(docs)} documents)\n")
                for d in docs:
                    f.write(f"- [{d['title']}]({d['relative_path']}) ({d.get('size_mb', 0)} MB)\n")
                f.write("\n")

    print(f"Reclassification terminee !")
    print(f" -> {moved_count} fichiers deplaces dans leur sous-dossier Niveau / Matiere respectif.")
    print(f" -> Sommaire genere dans {README_PATH}")

if __name__ == "__main__":
    organize_files()
