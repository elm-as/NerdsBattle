"""Génère un cours NerdsBattle et son quiz officiel à partir d'un PDF Fomesoutra CI.

Ce script extrait le texte officiel d'un PDF, appelle l'API DeepSeek pour structurer
la leçon et générer 20 questions rigoureuses basées strictement sur le document,
puis valide et écrit le JSON dans `src/data/courses/<subject>/<level>/<slug>.json`.

Usage :
    python scripts/generate_official_course.py --pdf "chemin/vers/fichier.pdf" --subject physique --level sixieme --slug circuit-electrique
"""

import argparse
import json
import os
import re
import sys
import pypdf
import requests

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def load_env_variables(env_path):
    """Charge les clés d'environnement depuis le fichier .env."""
    env_vars = {}
    if not os.path.exists(env_path):
        return env_vars
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            match = re.match(r'^([A-Z0-9_]+)=(.*)$', line)
            if match:
                key, val = match.groups()
                env_vars[key] = val.strip().strip('"').strip("'")
    return env_vars

def extract_pdf_text(filepath):
    """Extrait le texte brut complet du fichier PDF."""
    reader = pypdf.PdfReader(filepath)
    pages_text = []
    for page in reader.pages:
        txt = page.extract_text() or ''
        pages_text.append(txt)
    raw = '\n'.join(pages_text)
    # Nettoyage minimal des en-têtes parasites répétitifs
    cleaned = re.sub(r'Page \d+ sur \d+ ecole-ci\.online', '', raw, flags=re.I)
    cleaned = re.sub(r'CÔTE D’IVOIRE – ÉCOLE NUMÉRIQUE', '', cleaned, flags=re.I)
    return cleaned.strip()

def build_prompt(subject, level, pdf_text, question_count=20):
    """Construit le prompt structuré avec consignes strictes anti-hallucination."""
    system_prompt = (
        "Tu es un inspecteur pédagogique officiel du Ministère de l'Éducation Nationale "
        "de Côte d'Ivoire (MENA). Ton rôle est d'analyser le cours officiel ci-dessous "
        "et de le transformer en un cours d'élite pour l'application NerdsBattle. "
        "Tu réponds STRICTEMENT avec un objet JSON valide, sans balises markdown, sans texte d'introduction."
    )

    user_prompt = f"""Voici le document de cours officiel ivoirien extrait :

--- DÉBUT DOCUMENT OFFICIEL ---
{pdf_text[:12000]}
--- FIN DOCUMENT OFFICIEL ---

Mission :
1. Crée un cours captivant pour le niveau "{level}" en matière "{subject}".
2. Titre : court, percutant (max 80 car.), ex: "Leçon 1 : Le circuit électrique simple".
3. Résumé : 2 phrases percutantes résumant les points clés (max 400 car.).
4. Leçon : Markdown pédagogique et structuré (max 7000 car.) avec :
   - ## Introduction & Mise en situation
   - ## 1. Notions et Définitions Clés
   - ## 2. Règles et Applications Pratiques
   - ## 3. Pièges fréquents & Mises en garde
   - ## Synthèse : Les 3 points à retenir
5. Questions : Génère exactement {question_count} questions variées (au moins 12 "mcq", 5 "truefalse", 3 "fill").
   RÈGLES IMPÉRATIVES DE SÉCURITÉ :
   - Basées UNIQUEMENT sur le document officiel ci-dessus (définitions, vocabulaire, exercices corrigés).
   - "mcq" : 4 options distinctes et claires, "answer" est l'index 0-based EXACT (0, 1, 2 ou 3) de la bonne réponse.
   - "truefalse" : "answer" est true ou false.
   - "fill" : "answer" est un mot ou nombre court sans ambiguïté.
   - "explanation" : explication concise confirmant pourquoi la réponse est vraie.

Format JSON STRICT attendu :
{{
  "title": "Titre du cours",
  "summary": "Résumé concis",
  "lesson": "Texte markdown complet",
  "estimatedMinutes": 10,
  "tags": ["{subject}", "{level}", "mena", "ci"],
  "questions": [
    {{
      "id": "q1",
      "type": "mcq",
      "prompt": "Question...",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "Explication..."
    }}
  ]
}}"""
    return system_prompt, user_prompt

def call_deepseek_api(api_key, api_base, model, system_prompt, user_prompt):
    """Appelle l'API DeepSeek pour obtenir le cours et les questions en JSON."""
    url = f"{api_base}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": model,
        "temperature": 0.3, # Température basse pour une fidélité maximale au document
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    response = requests.post(url, headers=headers, json=payload, timeout=90)
    response.raise_for_status()
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    return json.loads(content)

def validate_and_format_course(course_data, subject, level, slug):
    """Valide les contraintes de base de données et la cohérence des questions."""
    title = str(course_data.get("title", slug)).strip()[:128]
    summary = str(course_data.get("summary", "")).strip()[:512]
    lesson = str(course_data.get("lesson", "")).strip()[:16384]
    est_min = max(1, min(60, int(course_data.get("estimatedMinutes", 10))))
    tags = list(course_data.get("tags", [subject, level]))

    validated_questions = []
    raw_questions = course_data.get("questions", [])

    for idx, q in enumerate(raw_questions, start=1):
        q_id = f"q{idx}"
        q_type = q.get("type", "mcq")
        prompt = str(q.get("prompt", "")).strip()
        explanation = str(q.get("explanation", "")).strip()

        if q_type == "mcq":
            options = q.get("options", [])
            if not isinstance(options, list) or len(options) < 4:
                continue
            answer = q.get("answer")
            if not isinstance(answer, int) or answer < 0 or answer >= len(options):
                continue
            validated_questions.append({
                "id": q_id,
                "type": "mcq",
                "prompt": prompt,
                "options": [str(opt).strip() for opt in options[:4]],
                "answer": answer,
                "explanation": explanation
            })
        elif q_type == "truefalse":
            ans = q.get("answer")
            if not isinstance(ans, bool):
                continue
            validated_questions.append({
                "id": q_id,
                "type": "truefalse",
                "prompt": prompt,
                "answer": ans,
                "explanation": explanation
            })
        elif q_type == "fill":
            ans = str(q.get("answer", "")).strip()
            if not ans:
                continue
            validated_questions.append({
                "id": q_id,
                "type": "fill",
                "prompt": prompt,
                "answer": ans,
                "explanation": explanation
            })

    return {
        "id": f"{subject}-{level}-{slug}"[:128],
        "subjectId": subject,
        "levelId": level,
        "slug": slug,
        "title": title,
        "summary": summary,
        "lesson": lesson,
        "estimatedMinutes": est_min,
        "tags": tags,
        "questions": validated_questions
    }

def main():
    parser = argparse.ArgumentParser(description="Générateur de cours officiel CI")
    parser.add_argument("--pdf", required=True, help="Chemin vers le PDF source")
    parser.add_argument("--subject", required=True, help="ID de la matière (ex: physique)")
    parser.add_argument("--level", required=True, help="ID du niveau (ex: sixieme)")
    parser.add_argument("--slug", required=True, help="Slug unique (ex: circuit-electrique)")
    parser.add_argument("--questions", type=int, default=20, help="Nombre de questions cibles")
    args = parser.parse_args()

    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_vars = load_env_variables(os.path.join(root_dir, ".env"))

    api_key = env_vars.get("API_KEY")
    api_base = env_vars.get("API_BASE_URL", "https://api.deepseek.com/v1")
    model = env_vars.get("API_MODEL", "deepseek-chat")

    if not api_key:
        print("❌ Erreur : Clé API non trouvée dans .env", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(args.pdf):
        print(f"❌ Erreur : Fichier PDF introuvable : {args.pdf}", file=sys.stderr)
        sys.exit(1)

    print(f"📄 Extraction du document : {os.path.basename(args.pdf)}...")
    pdf_text = extract_pdf_text(args.pdf)
    if len(pdf_text) < 400:
        print("❌ Erreur : Document trop court ou scanné (non extractible)", file=sys.stderr)
        sys.exit(1)

    print(f"🤖 Appel DeepSeek pour structuration ({args.subject} / {args.level})...")
    system_prompt, user_prompt = build_prompt(args.subject, args.level, pdf_text, args.questions)
    raw_course = call_deepseek_api(api_key, api_base, model, system_prompt, user_prompt)

    validated = validate_and_format_course(raw_course, args.subject, args.level, args.slug)

    out_dir = os.path.join(root_dir, "src", "data", "courses", args.subject, args.level)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f"{args.slug}.json")

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(validated, f, ensure_ascii=False, indent=2)

    q_count = len(validated["questions"])
    print(f"✅ Cours généré avec succès dans : {out_file}")
    print(f"   Titre : {validated['title']}")
    print(f"   Questions validées : {q_count}")

if __name__ == "__main__":
    main()
