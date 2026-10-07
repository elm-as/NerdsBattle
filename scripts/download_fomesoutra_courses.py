import os
import re
import sys
import json
import time
import urllib.parse
import requests
from bs4 import BeautifulSoup

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "https://www.fomesoutra.com"
START_URL = "https://www.fomesoutra.com/cours/secondaire/"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "fomesoutra_courses")
MANIFEST_PATH = os.path.join(OUTPUT_DIR, "manifest.json")
README_PATH = os.path.join(OUTPUT_DIR, "README_COURSES.md")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"
}

session = requests.Session()
session.headers.update(headers)

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

def clean_name(name):
    clean = re.sub(r'[\\/*?:"<>|]', "", name)
    clean = clean.strip().replace(" ", "_")
    return clean[:120]

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

def extract_metadata_from_url(page_url, doc_title):
    parsed_path = urllib.parse.urlparse(page_url).path.strip('/')
    parts = parsed_path.split('/')
    
    level = determine_level(doc_title, page_url)
    serie = None
    subject = determine_subject(doc_title, page_url)

    if 'secondaire' in parts:
        idx = parts.index('secondaire')
        subparts = parts[idx+1:]
        
        if len(subparts) >= 2:
            raw_sub = subparts[1]
            if any(k in raw_sub.lower() for k in ['terminale-', '1ere-', '2nd-', 'serie-', 'seconde-']):
                serie = raw_sub.replace("terminale-", "Tle_").replace("1ere-", "1ere_").replace("2nd-", "2nde_").upper()

    return level, serie, subject

def get_soup(url):
    for attempt in range(3):
        try:
            resp = session.get(url, timeout=20)
            if resp.status_code == 200:
                return BeautifulSoup(resp.text, 'html.parser')
        except Exception:
            time.sleep(1)
    return None

def load_existing_manifest():
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_manifest(manifest):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    with open(README_PATH, "w", encoding="utf-8") as f:
        f.write(f"# Base de Cours Fomesoutra Classés par Niveau, Série et Matière\n\n")
        f.write(f"**Nombre total de cours disponibles** : {len(manifest)}\n\n")
        
        grouped = {}
        for item in manifest:
            lvl = item.get("niveau", "Autres_Niveaux")
            ser = item.get("serie") or "Generale"
            subj = item.get("matiere", "General")
            
            if lvl not in grouped:
                grouped[lvl] = {}
            if ser not in grouped[lvl]:
                grouped[lvl][ser] = {}
            if subj not in grouped[lvl][ser]:
                grouped[lvl][ser][subj] = []
            grouped[lvl][ser][subj].append(item)

        for lvl in sorted(grouped.keys()):
            f.write(f"## 🎓 Niveau : `{lvl}`\n\n")
            for ser in sorted(grouped[lvl].keys()):
                f.write(f"### 📌 Série : `{ser}`\n")
                for subj in sorted(grouped[lvl][ser].keys()):
                    docs = grouped[lvl][ser][subj]
                    f.write(f"#### 📚 {subj} ({len(docs)} documents)\n")
                    for d in docs:
                        rel_p = d.get('relative_path', '')
                        f.write(f"- [{d['title']}]({rel_p}) ({d.get('size_mb', 0)} MB)\n")
                    f.write("\n")

def full_recursive_download():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    manifest = load_existing_manifest()
    downloaded_urls = {item['source_url'] for item in manifest}

    print(f"=== Exploration Recursive de TOUTES les pages Fomesoutra Secondaire ===")
    print(f"Fichiers deja en cache: {len(downloaded_urls)}")

    queue = [START_URL]
    visited_pages = set()

    total_added = 0

    while queue:
        curr_url = queue.pop(0)
        if curr_url in visited_pages:
            continue
        visited_pages.add(curr_url)

        print(f"\n[Page en cours ({len(visited_pages)} explorees, {len(queue)} en attente)] : {curr_url}")

        page_soup = get_soup(curr_url)
        if not page_soup:
            continue

        # Find ALL sub-folder / category links on this page
        for a in page_soup.select("table.koowa_table--categories a, a.iconImage, td a[href*='/cours/secondaire/']"):
            href = a.get("href")
            if href and href.startswith("/cours/secondaire/"):
                full_sub = urllib.parse.urljoin(BASE_URL, href)
                # Ignore query params or pagination anchors
                full_sub = full_sub.split('?')[0].split('#')[0]
                if full_sub not in visited_pages and full_sub not in queue:
                    queue.append(full_sub)

        # Find pagination links if any
        for a in page_soup.select("ul.pagination a, a.k-js-pagination"):
            href = a.get("href")
            if href and "/cours/secondaire/" in href:
                full_p = urllib.parse.urljoin(BASE_URL, href)
                if full_p not in visited_pages and full_p not in queue:
                    queue.append(full_p)

        # Find all documents on this page
        items = page_soup.select("tr.docman_item, div.koowa_media__item, div.document, a.docman_track_download")
        for item in items:
            a_tag = item if item.name == 'a' else item.select_one("a.docman_track_download, a[data-title], a.koowa_media__item__link, td a[href*='/file']")
            if not a_tag:
                a_tag = item.select_one("a[href]")

            if not a_tag:
                continue

            href = a_tag.get("href")
            doc_title = a_tag.get("data-title") or a_tag.text.strip()

            if not href or not doc_title or doc_title in ["Dossier", "Télécharger", "Ouvrir", "Voir", "Télécharger le fichier"]:
                continue

            if not href.endswith("/file") and "/file" not in href:
                file_download_url = urllib.parse.urljoin(BASE_URL, href.rstrip("/") + "/file")
            else:
                file_download_url = urllib.parse.urljoin(BASE_URL, href)

            if file_download_url in downloaded_urls:
                continue

            level_name, serie_name, subject_name = extract_metadata_from_url(curr_url, doc_title)

            if serie_name:
                target_dir = os.path.join(OUTPUT_DIR, level_name, serie_name, subject_name)
            else:
                target_dir = os.path.join(OUTPUT_DIR, level_name, subject_name)
            
            os.makedirs(target_dir, exist_ok=True)

            print(f"   [Telechargement] : {doc_title}")
            print(f"      Target: {level_name} / {serie_name or 'Generale'} / {subject_name}")

            try:
                resp = session.get(file_download_url, stream=True, timeout=35)
                if resp.status_code == 200:
                    content_type = resp.headers.get('Content-Type', '')
                    ext = ".pdf"
                    if "word" in content_type or "docx" in href:
                        ext = ".docx"

                    filename = clean_name(doc_title) + ext
                    file_path = os.path.join(target_dir, filename)

                    size = 0
                    with open(file_path, 'wb') as f:
                        for chunk in resp.iter_content(chunk_size=16384):
                            if chunk:
                                f.write(chunk)
                                size += len(chunk)

                    if size > 1000:
                        rel_path = os.path.relpath(file_path, OUTPUT_DIR).replace("\\", "/")
                        meta = {
                            "title": doc_title,
                            "filename": filename,
                            "niveau": level_name,
                            "serie": serie_name,
                            "matiere": subject_name,
                            "local_path": file_path,
                            "relative_path": rel_path,
                            "size_bytes": size,
                            "size_mb": round(size / (1024 * 1024), 2),
                            "source_url": file_download_url,
                            "page_url": curr_url
                        }
                        manifest.append(meta)
                        downloaded_urls.add(file_download_url)
                        save_manifest(manifest)
                        total_added += 1
                        print(f"      + Succes: {rel_path} ({meta['size_mb']} MB)")
                    else:
                        print(f"      - Echec: fichier trop petit / non disponible")
                else:
                    print(f"      - Echec HTTP {resp.status_code}")
            except Exception as err:
                print(f"      - Erreur : {err}")

    print(f"\n==========================================")
    print(f"Collecte 100% terminee avec succes !")
    print(f"Total des cours dans la base : {len(manifest)} (Nouveaux ajouts : {total_added})")
    print(f"Dossier principal : {OUTPUT_DIR}")

if __name__ == "__main__":
    full_recursive_download()
