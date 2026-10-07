"""Ingesteur officiel par niveau avec multi-provider (Groq, Gemini, DeepSeek).

Garantit le respect strict du programme MENA CI et supporte les providers
gratuits pour continuer l'ingestion sans interruption.

Usage :
    python scripts/ingest_level_full.py --level 6eme [--dry-run] [--force] [--limit N]
"""

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import pypdf
import requests

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSES_ROOT = os.path.join(BASE_DIR, "src", "data", "courses")

LEVEL_MAP = {
    "6eme": "sixieme", "5eme": "cinquieme", "4eme": "quatrieme",
    "3eme": "troisieme", "2nde": "seconde", "1ere": "premiere",
    "terminale": "terminale",
}

def load_environment():
    env_vars = {}
    path = os.path.join(BASE_DIR, ".env")
    if not os.path.exists(path):
        return env_vars
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                m = re.match(r"^([A-Z0-9_]+)=(.*)$", line)
                if m:
                    env_vars[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return env_vars

def configure_provider(env_vars):
    """Détecte le provider actif : Groq (gratuit), Gemini (gratuit) ou DeepSeek."""
    # 1. Groq (gratuit, 14 400 req/jour, ultra-rapide)
    groq_key = env_vars.get("GROQ_API_KEY") or (env_vars.get("API_KEY") if str(env_vars.get("API_KEY", "")).startswith("gsk_") else None)
    if groq_key:
        return {
            "name": "Groq (Gratuit)",
            "key": groq_key,
            "base": "https://api.groq.com/openai/v1",
            "model": env_vars.get("GROQ_MODEL", "openai/gpt-oss-120b")
        }

    # 2. Google Gemini (gratuit, 1 500 req/jour)
    gemini_key = env_vars.get("GEMINI_API_KEY") or (env_vars.get("API_KEY") if str(env_vars.get("API_KEY", "")).startswith("AIza") else None)
    if gemini_key:
        return {
            "name": "Google Gemini (Gratuit)",
            "key": gemini_key,
            "base": "https://generativelanguage.googleapis.com/v1beta/openai",
            "model": env_vars.get("GEMINI_MODEL", "gemini-1.5-flash")
        }

    # 3. DeepSeek (par défaut)
    return {
        "name": "DeepSeek",
        "key": env_vars.get("DEEPSEEK_API_KEY") or env_vars.get("API_KEY"),
        "base": env_vars.get("API_BASE_URL", "https://api.deepseek.com/v1"),
        "model": env_vars.get("API_MODEL", "deepseek-chat")
    }

def is_excluded_document(filename_norm, parent_folder, target_level):
    if re.search(r"programme[s]?|guide|progression|emploi_du_temps|schema_d.un_cours|exemple_de_fiche|document_didactique", filename_norm):
        return "GUIDE_PROF"
    if "eps" in parent_folder.lower() or re.search(r"(?:^|[\s_\-\.\(])eps(?:[\s_\-\.\)]|$)|sport", filename_norm):
        return "EPS"
    if "arts" in parent_folder.lower() or re.search(r"(?:^|[\s_\-\.\(])ap_\d|ed_mus|\bart.*plastique\b|\bmusique\b|\bem\b|5e_em_", filename_norm):
        return "ARTS_MUSIQUE"
    if re.search(r"comptabilit[eé]|finance|economie_d.entreprise|economie_generale|bescherelle", filename_norm):
        return "INTRUS_SUP"
    if target_level in ("6eme", "5eme", "4eme", "3eme"):
        lvl_num = target_level[0]
        other_nums = [n for n in ["6", "5", "4", "3"] if n != lvl_num]
        other_pat = "|".join([f"{n}[eè]me?" for n in other_nums])
        alien = rf"(?:^|[\s_\-\.\(])(?:bac|capes|concours|1ere|1ère|2nde|tle|terminale|{other_pat})(?:[\s_\-\.\)]|$)"
        if re.search(alien, filename_norm):
            target_pat = rf"(?:^|[\s_\-\.\(]){lvl_num}[eè]me?(?:[\s_\-\.\)]|$)"
            if not re.search(target_pat, filename_norm) or any(re.search(rf"{n}[eè]_", filename_norm) for n in other_nums):
                return "INTRUS_NIVEAU"
    return None

def detect_subject(fn_norm, first_p):
    if re.search(r"\d+[eè]me_[hg]\d+|_g[1-9]_|_h[1-9]_|histoire|g[ée]ographie|pal[ée]olithique|n[ée]olithique|m[ée]tallurgie.*fer|climat|relief|cycle_de_l.eau|population_et_environnement", fn_norm):
        return "histoire"
    if re.search(r"svt|germination|graine|reproduction.*(?:mammif|oiseau)|croissance.*(?:plante|vert)|actions_n[eé]fastes|lutte_contre.*d[eé]gradation|observation_des_[eê]tres|sortie_biologique", fn_norm):
        return "svt"
    if re.search(r"(?:pc_|physique|chimie).*\d+[eè]me|\d+[eè]me.*(?:pc_|physique|chimie)|pc_\d+[eè]me|cours_de_pc|cours_pc|\bpc\b|physique|chimie|[eé]lectricit[eé]|circuit|m[eé]lange|combustion|source.*lumi[eè]re|masse_d.un|solides_et_liquides|les_gaz|temp[eé]rature|constituants_de_l.air|changements_d.[eé]tat", fn_norm):
        return "physique"
    if re.search(r"\d+e_(?:ee|gr|ortho|voc|tl|eo|lect|eoi|fr)|fran[cç]ais|grammaire|orthographe|conjugaison|vocabulaire|lecture|r[eé]cit|phrase|portrait|po[eè]me|subordonn[eé]e|relative|compl[eé]tive|circonstancielle", fn_norm):
        return "francais"
    if re.search(r"maths?|alg[eè]bre|g[eé]om[eé]trie|d[eé]cimaux|fraction|angle|cercle|disque|segment|triangle|proportionnalit[eé]|sym[eé]trie|parall[eé]logramme|statistique|pav[eé]_droit|cylindre|p[eé]rim[eè]tre|volume|multiplication|donn[eé]es|calculs_num", fn_norm):
        return "maths"
    if re.search(r"unit[eé]?_\d+|anglais|english|worksheet", fn_norm):
        return "anglais"
    if re.search(r"espagnol|spanish", fn_norm):
        return "espagnol"
    if re.search(r"allemand|deutsch|german", fn_norm):
        return "allemand"
    if re.search(r"\d+e_tice|tic[e]?_\d+[eè]me|cours_pic|cours_tice|\btic[e]?\b|informatique|ordinateur", fn_norm):
        return "info"
    if re.search(r"edhc|droit|paix|abstinence|latrine|sant[eé]|citoyen|famille.*communaut[eé]|d[eé]mocrati|circulation_routi[eè]re|ch[oô]mage|agro-pastorale|alcool|drogue|ordure|revenu|engin|sexuel|vih|sida|pouvoir.*politique|victime.*conflit|hygi[eè]ne|assainissement", fn_norm):
        return "culture_generale"
    if re.search(r"philo|philosophie|conscience|inconscient|libert[eé]|devoir|bonheur|v[eé]rit[eé]|justice", fn_norm):
        return "philosophie"

    p_lower = first_p.lower()
    mapping = {
        "sciences de la vie": "svt", "physique-chimie": "physique",
        "mathématiques": "maths", "histoire-géographie": "histoire",
        "français": "francais", "english": "anglais",
        "espagnol": "espagnol", "allemand": "allemand",
        "informatique": "info", "edhc": "culture_generale",
        "philosophie": "philosophie"
    }
    for k, v in mapping.items():
        if k in p_lower:
            return v
    return None

def build_course_slug(filename):
    base = os.path.splitext(filename)[0]
    match = re.search(r'(?:L|Le[cç]on|Maths_|PC_|SVT_|H|G)[\s_-]*(\d+)', base, re.I)
    prefix = f"l{int(match.group(1))}-" if match else ""
    clean = re.sub(r'^(?:PC_|Maths_|HG_|SVT_)?\d+[eè]me[\s_-]*', '', base, flags=re.I)
    clean = re.sub(r'^(?:[0-9]+[eè]_)?(?:Maths_|PC_|SVT_|HG_)?', '', clean, flags=re.I)
    clean = re.sub(r'^(?:L|Le[cç]on|H|G)[\s_-]*\d+[\s_-]*', '', clean, flags=re.I)
    clean = re.sub(r'^\d+[\s_-]*|_-_Cours_.*$', '', clean, flags=re.I)
    norm = unicodedata.normalize('NFKD', clean).encode('ASCII', 'ignore').decode('utf-8').lower()
    norm = re.sub(r'[^a-z0-9]+', '-', norm).strip('-')
    final_slug = f"{prefix}{norm[:36]}" if prefix else norm[:44]
    return final_slug.strip('-') or 'cours'

def call_llm(provider, system_prompt, user_prompt):
    url = f"{provider['base']}/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {provider['key']}"}
    payload = {
        "model": provider["model"],
        "temperature": 0.25,
        "response_format": {"type": "json_object"},
        "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]
    }
    for attempt in range(6):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=90)
            if resp.status_code == 200:
                return json.loads(resp.json()["choices"][0]["message"]["content"])
            if resp.status_code == 402:
                print(f" [Solde insuffisant: {provider['name']}]", end="")
                return None
            if resp.status_code == 429:
                err_msg = resp.text
                if "per day (tpd)" in err_msg.lower():
                    chain = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]
                    curr = payload.get("model")
                    next_idx = (chain.index(curr) + 1) % len(chain) if curr in chain else 0
                    next_model = chain[next_idx]
                    print(f" [TPD -> {next_model}]", end="", flush=True)
                    payload["model"] = next_model
                    if attempt >= 2:
                        print(" [Pause fenetre 45s]...", end="", flush=True)
                        time.sleep(45)
                    else:
                        time.sleep(2)
                    continue
                reset_tokens = resp.headers.get("x-ratelimit-reset-tokens", "")
                wait_sec = 8.0
                if "s" in reset_tokens:
                    try:
                        wait_sec = min(float(reset_tokens.replace("s", "").strip()) + 1.0, 15.0)
                    except Exception:
                        pass
                print(f" [Pause TPM {wait_sec:.0f}s]...", end="", flush=True)
                time.sleep(wait_sec)
                continue
        except Exception:
            time.sleep(3)
    return None

def validate_questions(raw_questions):
    validated = []
    if not isinstance(raw_questions, list):
        return validated
    for idx, q in enumerate(raw_questions, start=1):
        if not isinstance(q, dict):
            continue
        prompt = str(q.get("prompt", "")).strip()
        explanation = str(q.get("explanation", "")).strip()
        if len(prompt) < 8:
            continue
        q_type = q.get("type", "mcq")
        if q_type == "mcq":
            opts, ans = q.get("options", []), q.get("answer")
            if isinstance(opts, list) and len(opts) >= 4 and isinstance(ans, int) and 0 <= ans < len(opts):
                validated.append({
                    "id": f"q{idx}", "type": "mcq", "prompt": prompt,
                    "options": [str(o).strip() for o in opts[:4]], "answer": ans, "explanation": explanation
                })
        elif q_type == "truefalse" and isinstance(q.get("answer"), bool):
            validated.append({
                "id": f"q{idx}", "type": "truefalse", "prompt": prompt, "answer": q.get("answer"), "explanation": explanation
            })
        elif q_type == "fill":
            ans = str(q.get("answer", "")).strip()
            if ans and len(ans) <= 60:
                validated.append({
                    "id": f"q{idx}", "type": "fill", "prompt": prompt, "answer": ans, "explanation": explanation
                })
    return validated

def process_single_course(filepath, subject, app_level, provider, force):
    slug = build_course_slug(os.path.basename(filepath))
    out_dir = os.path.join(COURSES_ROOT, subject, app_level)
    out_file = os.path.join(out_dir, f"{slug}.json")
    if os.path.exists(out_file) and not force:
        return "skipped"

    try:
        reader = pypdf.PdfReader(filepath)
        raw_text = "\n".join([p.extract_text() or "" for p in reader.pages]).strip()
    except Exception:
        return None
    if len(raw_text) < 400:
        return None

    sys_prompt = "Tu es un inspecteur pédagogique officiel MENA Côte d'Ivoire. Réponds UNIQUEMENT en JSON valide."
    user_prompt = f"""Document officiel MENA CI ({subject}/{app_level}) :\n{raw_text[:5500]}\n
Directives: Titre (max 80c), Résumé (max 400c), Leçon markdown structurée (max 6500c), 15 à 20 questions (mcq, truefalse, fill) STRICTES.
Format JSON: {{"title": "...", "summary": "...", "lesson": "...", "estimatedMinutes": 10, "questions": [{{"id":"q1","type":"mcq","prompt":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}}]}}"""

    data = call_llm(provider, sys_prompt, user_prompt)
    if not data:
        return None
    v_q = validate_questions(data.get("questions", []))
    if len(v_q) < 5:
        return None

    course_obj = {
        "id": f"{subject}-{app_level}-{slug}"[:128], "subjectId": subject, "levelId": app_level, "slug": slug,
        "title": str(data.get("title", slug)).strip()[:128], "summary": str(data.get("summary", "")).strip()[:512],
        "lesson": str(data.get("lesson", "")).strip()[:16384],
        "estimatedMinutes": max(1, min(60, int(data.get("estimatedMinutes", 10)))),
        "tags": [subject, app_level, "mena", "ci", "officiel"], "questions": v_q
    }
    os.makedirs(out_dir, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(course_obj, f, ensure_ascii=False, indent=2)
    return {"title": course_obj["title"], "subject": subject, "questions": len(v_q)}

def main():
    parser = argparse.ArgumentParser(description="Ingesteur MENA CI multi-provider")
    parser.add_argument("--level", required=True, help="Niveau (ex: 6eme)")
    parser.add_argument("--dry-run", action="store_true", help="Prévisualiser")
    parser.add_argument("--force", action="store_true", help="Forcer réécriture")
    args = parser.parse_args()

    app_level = LEVEL_MAP.get(args.level.lower(), args.level.lower())
    folder_level = os.path.join(BASE_DIR, "docs", "fomesoutra_courses", args.level)
    if not os.path.exists(folder_level):
        folder_level = os.path.join(BASE_DIR, "docs", "fomesoutra_courses", args.level.capitalize())
    if not os.path.exists(folder_level):
        print(f"Erreur : Dossier introuvable {folder_level}", file=sys.stderr)
        sys.exit(1)

    env_vars = load_environment()
    provider = configure_provider(env_vars)

    candidates = []
    for root, _, files in os.walk(folder_level):
        p_name = os.path.basename(root)
        for f in sorted(files):
            if f.lower().endswith(".pdf"):
                candidates.append((os.path.join(root, f), f, p_name))

    eligible = []
    for filepath, fname, parent in candidates:
        fn_norm = unicodedata.normalize("NFKD", fname).encode("ASCII", "ignore").decode("utf-8").lower()
        if is_excluded_document(fn_norm, parent, args.level):
            continue
        subj = detect_subject(fn_norm, "")
        if not subj:
            first_p = ""
            try:
                first_p = (pypdf.PdfReader(filepath).pages[0].extract_text() or "")[:1500]
            except Exception:
                pass
            subj = detect_subject(fn_norm, first_p)
        if subj:
            eligible.append((filepath, fname, parent, subj))

    print(f"\n========================================================")
    print(f"  INGESTION {args.level.upper()} -> {app_level.upper()} | Provider: {provider['name']}")
    print(f"  Cours officiels éligibles : {len(eligible)} / {len(candidates)} fichiers")
    print(f"========================================================\n")

    if args.dry_run:
        print("Mode --dry-run : aucun appel API.")
        return

    if not provider["key"]:
        print(f"Erreur : Aucune clé API configurée pour {provider['name']}.", file=sys.stderr)
        print("Ajoutez GROQ_API_KEY, GEMINI_API_KEY ou rechargez DeepSeek dans .env", file=sys.stderr)
        sys.exit(1)

    print(f"Lancement avec {provider['name']} ({provider['model']})...\n")
    skipped = 0
    for idx, (filepath, fname, _, subj) in enumerate(eligible, start=1):
        print(f"[{idx}/{len(eligible)}] [{subj.upper()}] {fname[:50]}...", end=" ", flush=True)
        res = process_single_course(filepath, subj, app_level, provider, args.force)
        if res == "skipped":
            print("passé (déjà existant)")
            skipped += 1
        elif isinstance(res, dict):
            print(f"OK (+{res['questions']} Q)")
            time.sleep(10)
        else:
            print("rejeté/erreur")
            time.sleep(0.05)

    print(f"\nTerminé pour {app_level.upper()} ! (Déjà en place : {skipped})")

if __name__ == "__main__":
    main()
