"""Batch ingest official educational documents from Fomesoutra into NerdsBattle.

Reads official PDF/DOCX files from a directory, extracts the verified text,
generates structured lesson Markdown and validated quiz questions via DeepSeek,
and saves the output to `src/data/courses/<subject>/<level>/<slug>.json`.

Usage:
    python scripts/batch_ingest_official.py --folder "docs/fomesoutra_courses/6eme/Physique-Chimie" --subject physique --level sixieme
"""

import argparse
import json
import os
import re
import sys
import time
import pypdf
import requests

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

SUBJECT_MAP = {
    "physique-chimie": "physique",
    "mathematiques": "maths",
    "histoire-geographie": "histoire",
    "francais": "francais",
    "svt": "svt",
    "anglais": "anglais",
    "philosophie": "philosophie",
    "informatique-tic": "info",
    "espagnol": "espagnol",
    "allemand": "allemand",
}

LEVEL_MAP = {
    "6eme": "sixieme",
    "5eme": "cinquieme",
    "4eme": "quatrieme",
    "3eme": "troisieme",
    "2nde": "seconde",
    "1ere": "premiere",
    "terminale": "terminale",
}

def load_env(root_dir):
    """Charge les clés d'environnement depuis le fichier .env."""
    env_vars = {}
    path = os.path.join(root_dir, ".env")
    if not os.path.exists(path):
        return env_vars
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"^([A-Z0-9_]+)=(.*)$", line)
            if m:
                env_vars[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return env_vars

def extract_text_from_pdf(filepath):
    """Extrait le texte d'un PDF en ignorant les pieds de page répétés."""
    try:
        reader = pypdf.PdfReader(filepath)
        texts = []
        for p in reader.pages:
            t = p.extract_text() or ""
            texts.append(t)
        raw = "\n".join(texts)
        cleaned = re.sub(r"Page \d+ sur \d+ ecole-ci\.online", "", raw, flags=re.I)
        cleaned = re.sub(r"CÔTE D’IVOIRE – ÉCOLE NUMÉRIQUE", "", cleaned, flags=re.I)
        return cleaned.strip()
    except Exception as e:
        print(f"  [Avertissement] Erreur lecture PDF {os.path.basename(filepath)}: {e}")
        return ""

def create_slug(filename):
    """Crée un slug lisible avec numéro de leçon s'il existe."""
    base = os.path.splitext(filename)[0]
    lesson_match = re.search(r'(?:L|Le[cç]on|Maths_|PC_|SVT_)[\s_-]*(\d+)', base, re.I)
    prefix = f"l{int(lesson_match.group(1))}-" if lesson_match else ""

    cleaned = re.sub(r'^(?:PC_|Maths_|HG_|SVT_)?\d+[eè]me[\s_-]*', '', base, flags=re.I)
    cleaned = re.sub(r'^(?:3[eè]_Maths_|3[eè]_SVT_|SVT_3[eè]me_)?', '', cleaned, flags=re.I)
    cleaned = re.sub(r'^(?:L|Le[cç]on)[\s_-]*\d+[\s_-]*', '', cleaned, flags=re.I)
    cleaned = re.sub(r'^\d+[\s_-]*', '', cleaned)
    cleaned = re.sub(r'_-_Cours_.*$', '', cleaned, flags=re.I)

    s = cleaned.lower()
    s = re.sub(r'[àáâä]', 'a', s)
    s = re.sub(r'[éèêë]', 'e', s)
    s = re.sub(r'[îï]', 'i', s)
    s = re.sub(r'[ôö]', 'o', s)
    s = re.sub(r'[ùûü]', 'u', s)
    s = re.sub(r'[ç]', 'c', s)
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    final_slug = f"{prefix}{s[:40]}" if prefix else s[:48]
    return final_slug.strip('-') or 'cours'

def call_deepseek_with_retry(api_key, api_base, model, system_prompt, user_prompt, max_retries=3):
    """Appelle DeepSeek avec gestion automatique des retries et backoff exponentiel."""
    url = f"{api_base}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": model,
        "temperature": 0.25,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    for attempt in range(max_retries):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
            elif resp.status_code == 429:
                wait_time = (attempt + 1) * 5
                print(f"  [Rate Limit] Pause de {wait_time}s avant nouvel essai...")
                time.sleep(wait_time)
            else:
                print(f"  [Erreur API {resp.status_code}] {resp.text[:200]}")
        except Exception as e:
            print(f"  [Exception réseau] {e}")
            time.sleep(3)
    return None

def validate_questions(raw_questions):
    """Valide rigoureusement le format et les réponses de chaque question."""
    validated = []
    for idx, q in enumerate(raw_questions, start=1):
        q_type = q.get("type", "mcq")
        prompt = str(q.get("prompt", "")).strip()
        explanation = str(q.get("explanation", "")).strip()
        if not prompt or len(prompt) < 10:
            continue

        if q_type == "mcq":
            opts = q.get("options", [])
            if isinstance(opts, list) and len(opts) >= 4:
                ans = q.get("answer")
                if isinstance(ans, int) and 0 <= ans < len(opts):
                    validated.append({
                        "id": f"q{idx}",
                        "type": "mcq",
                        "prompt": prompt,
                        "options": [str(o).strip() for o in opts[:4]],
                        "answer": ans,
                        "explanation": explanation
                    })
        elif q_type == "truefalse":
            ans = q.get("answer")
            if isinstance(ans, bool):
                validated.append({
                    "id": f"q{idx}",
                    "type": "truefalse",
                    "prompt": prompt,
                    "answer": ans,
                    "explanation": explanation
                })
        elif q_type == "fill":
            ans = str(q.get("answer", "")).strip()
            if ans and len(ans) <= 60:
                validated.append({
                    "id": f"q{idx}",
                    "type": "fill",
                    "prompt": prompt,
                    "answer": ans,
                    "explanation": explanation
                })
    return validated

def process_single_file(filepath, subject, level, config):
    """Traite un fichier unique : extrait, transforme et sauvegarde."""
    raw_text = extract_text_from_pdf(filepath)
    if len(raw_text) < 400:
        return None

    filename = os.path.basename(filepath)
    slug = create_slug(filename)
    out_file = os.path.join(config["courses_dir"], subject, level, f"{slug}.json")

    if os.path.exists(out_file) and not config["force"]:
        print(f"  [Déjà existant] {slug} (passé)")
        return "skipped"

    system_prompt = (
        "Tu es un inspecteur pédagogique officiel du Ministère de l'Éducation Nationale "
        "de Côte d'Ivoire (MENA). Analyse ce document de cours officiel ivoirien et génère "
        "un cours de référence pour l'application NerdsBattle. Réponds UNIQUEMENT en JSON valide."
    )
    user_prompt = f"""Document officiel ivoirien :
--- DÉBUT ---
{raw_text[:12000]}
--- FIN ---

Directives :
1. Titre : concis, fidèle au chapitre (max 80 car.).
2. Résumé : 2 phrases courtes et stimulantes (max 400 car.).
3. Leçon : Markdown soigné (max 6500 car.) avec sections claires (Introduction, 1. Définitions & Notions clés, 2. Applications & Méthodes, 3. Pièges fréquents, Synthèse).
4. Questions : Génère exactement {config['questions_per_course']} questions diversifiées (mcq, truefalse, fill) basées STRICTEMENT sur le document ci-dessus (définitions, exercices et corrigés).

Format JSON attendu :
{{
  "title": "Titre",
  "summary": "Résumé",
  "lesson": "Leçon markdown",
  "estimatedMinutes": 10,
  "tags": ["{subject}", "{level}", "mena", "ci"],
  "questions": [
    {{ "id": "q1", "type": "mcq", "prompt": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..." }}
  ]
}}"""

    res = call_deepseek_with_retry(config["api_key"], config["api_base"], config["model"], system_prompt, user_prompt)
    if not res:
        return None

    validated_q = validate_questions(res.get("questions", []))
    if len(validated_q) < 5:
        print(f"  [Rejet] Moins de 5 questions validées ({len(validated_q)})")
        return None

    course_obj = {
        "id": f"{subject}-{level}-{slug}"[:128],
        "subjectId": subject,
        "levelId": level,
        "slug": slug,
        "title": str(res.get("title", slug)).strip()[:128],
        "summary": str(res.get("summary", "")).strip()[:512],
        "lesson": str(res.get("lesson", "")).strip()[:16384],
        "estimatedMinutes": max(1, min(60, int(res.get("estimatedMinutes", 10)))),
        "tags": [subject, level, "mena", "ci", "officiel"],
        "questions": validated_q
    }

    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(course_obj, f, ensure_ascii=False, indent=2)

    print(f"  [Succès] {course_obj['title']} ({len(validated_q)} questions)")
    return len(validated_q)

def main():
    parser = argparse.ArgumentParser(description="Ingestion par lot de cours Fomesoutra")
    parser.add_argument("--folder", required=True, help="Dossier contenant les PDF sources")
    parser.add_argument("--subject", help="Identifiant matière (ex: physique)")
    parser.add_argument("--level", help="Identifiant niveau (ex: sixieme)")
    parser.add_argument("--questions", type=int, default=20, help="Questions par cours (défaut: 20)")
    parser.add_argument("--pattern", help="Filtre regex sur les noms de fichiers (ex: '3[eè]_Maths_')")
    parser.add_argument("--limit", type=int, default=0, help="Nombre max de documents à traiter (0 = illimité)")
    parser.add_argument("--force", action="store_true", help="Écraser les cours déjà existants")
    args = parser.parse_args()

    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_vars = load_env(root_dir)

    api_key = env_vars.get("API_KEY")
    if not api_key:
        print("Erreur: API_KEY non configurée dans .env", file=sys.stderr)
        sys.exit(1)

    subject = args.subject
    level = args.level

    if not subject or not level:
        parts = os.path.normpath(args.folder).lower().split(os.sep)
        for p in parts:
            if p in LEVEL_MAP and not level:
                level = LEVEL_MAP[p]
            if p in SUBJECT_MAP and not subject:
                subject = SUBJECT_MAP[p]

    if not subject or not level:
        print(f"Erreur: Impossible de déduire sujet/niveau depuis '{args.folder}'. Précisez --subject et --level.", file=sys.stderr)
        sys.exit(1)

    config = {
        "api_key": api_key,
        "api_base": env_vars.get("API_BASE_URL", "https://api.deepseek.com/v1"),
        "model": env_vars.get("API_MODEL", "deepseek-chat"),
        "courses_dir": os.path.join(root_dir, "src", "data", "courses"),
        "questions_per_course": args.questions,
        "force": args.force
    }

    files = [f for f in os.listdir(args.folder) if f.lower().endswith(".pdf")]
    
    if args.pattern:
        target_files = [f for f in files if re.search(args.pattern, f, re.I)]
    else:
        lesson_files = [f for f in files if re.search(r"(?:L|Le[cç]on|Maths_|PC_|SVT_)\d+", f, re.I)]
        target_files = lesson_files if lesson_files else files

    # Écarter les programmes éducatifs et guides
    target_files = [f for f in target_files if not re.search(r"programme[s]?|guide|annale|emploi_du_temps", f, re.I)]

    if args.limit > 0:
        target_files = target_files[:args.limit]

    print(f"\n========================================================")
    print(f"  Ingestion Officielle : {subject.upper()} / {level.upper()}")
    print(f"  Dossier : {args.folder}")
    print(f"  Fichiers à traiter : {len(target_files)}")
    print(f"========================================================\n")

    total_added_q = 0
    total_processed = 0

    for idx, f in enumerate(target_files, start=1):
        filepath = os.path.join(args.folder, f)
        print(f"[{idx}/{len(target_files)}] Traitement : {f}...")
        res = process_single_file(filepath, subject, level, config)
        if isinstance(res, int):
            total_added_q += res
            total_processed += 1
        time.sleep(0.5)

    print(f"\nTerminé ! {total_processed} cours générés, {total_added_q} nouvelles questions officielles validées.")

if __name__ == "__main__":
    main()
