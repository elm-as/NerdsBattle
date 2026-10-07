"""Pipeline de conversion des cours Fomesoutra (PDF/DOCX) en cours NerdsBattle (JSON).

Étapes :
  1. Parcourt docs/fomesoutra_courses/ (niveaux 6eme → Terminale, matières de l'app).
  2. Écarte les non-leçons : sujets d'examen, devoirs, corrigés, guides, PDF scannés.
  3. Extrait, nettoie et structure le texte (course_text_extraction).
  4. Génère un résumé réel + leçon markdown. Questions volontairement vides :
     l'Edge Function `generate-questions` produit des questions IA de qualité
     à partir de la leçon — les questions embarquées la court-circuiteraient.
  5. Écrit src/data/courses/<subject>/<level>/<slug>.json + SQL Supabase.

Usage :
  python scripts/process_courses_pipeline.py [--limit N] [--purge]
    --limit N : ne traite que N documents (test)
    --purge   : supprime d'abord les anciens JSON taggés 'fomesoutra'
"""
import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from course_text_extraction import (
    build_markdown_lesson, build_summary, clean_lines, clean_title,
    estimate_minutes, extract_raw_text, slugify,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSES_INPUT_DIR = os.path.join(BASE_DIR, 'docs', 'fomesoutra_courses')
OUTPUT_COURSES_DIR = os.path.join(BASE_DIR, 'src', 'data', 'courses')
SQL_OUTPUT_FILE = os.path.join(BASE_DIR, 'docs', 'supabase_courses_insert.sql')

SUBJECT_MAPPING = {
    'Mathematiques': 'maths', 'Physique-Chimie': 'physique', 'SVT': 'svt',
    'Histoire-Geographie': 'histoire', 'Anglais': 'anglais',
    'Informatique-TIC': 'info', 'Francais': 'francais',
    'Philosophie': 'philosophie', 'Espagnol': 'espagnol', 'Allemand': 'allemand',
}
LEVEL_MAPPING = {
    '6eme': 'sixieme', '5eme': 'cinquieme', '4eme': 'quatrieme',
    '3eme': 'troisieme', '2nde': 'seconde', '1ere': 'premiere',
    'Terminale': 'terminale',
}
SUBJECT_LABELS = {
    'maths': 'Mathématiques', 'physique': 'Physique-Chimie', 'svt': 'SVT',
    'histoire': 'Histoire-Géographie', 'anglais': 'Anglais', 'info': 'Informatique',
    'francais': 'Français', 'philosophie': 'Philosophie',
    'espagnol': 'Espagnol', 'allemand': 'Allemand',
}
LEVEL_LABELS = {
    'sixieme': '6ème', 'cinquieme': '5ème', 'quatrieme': '4ème',
    'troisieme': '3ème', 'seconde': 'Seconde', 'premiere': 'Première',
    'terminale': 'Terminale',
}

# Fichiers qui ne sont pas des leçons (sujets, devoirs, corrigés, programmes…)
NON_LESSON_PATTERN = re.compile(
    r'bac[\s_-]|bepc|sujet|devoir|examen|composition|[ée]valuation|interro'
    r'|[ée]preuve|concours|corrig|programme[s]?[\s_-]*[ée]ducatif|guide'
    r"|situation[s]?[\s_-]*d[\s_'-]*[ée]valuation|emploi[\s_-]*du[\s_-]*temps",
    re.I,
)
MIN_TEXT_CHARS = 500       # en-dessous : PDF scanné ou vide
MIN_LESSON_CHARS = 400     # leçon markdown trop pauvre → rejet


def resolve_subject_level(relative_parts):
    """Déduit (subject_id, level_id) NerdsBattle depuis le chemin relatif."""
    subject = next((SUBJECT_MAPPING[p] for p in relative_parts if p in SUBJECT_MAPPING), None)
    level = next((LEVEL_MAPPING[p] for p in relative_parts if p in LEVEL_MAPPING), None)
    return subject, level


def iter_source_documents():
    """Itère (filepath, subject_id, level_id) pour chaque document exploitable."""
    for root, _dirs, files in os.walk(COURSES_INPUT_DIR):
        relative_parts = os.path.relpath(root, COURSES_INPUT_DIR).split(os.sep)
        for filename in sorted(files):
            if not filename.lower().endswith(('.pdf', '.docx')):
                continue
            if NON_LESSON_PATTERN.search(filename):
                continue
            subject, level = resolve_subject_level(relative_parts)
            if subject and level:
                yield os.path.join(root, filename), subject, level


def convert_document(filepath, subject, level):
    """Convertit un document en dict cours NerdsBattle, ou None si rejeté."""
    raw_text = extract_raw_text(filepath)
    if len(raw_text) < MIN_TEXT_CHARS:
        return None

    title = clean_title(os.path.basename(filepath))
    if not title:
        return None

    lines = clean_lines(raw_text)
    lesson = build_markdown_lesson(title, lines)
    if len(lesson) < MIN_LESSON_CHARS:
        return None

    slug = slugify(title)
    if not slug:
        return None

    summary = build_summary(lesson, title, SUBJECT_LABELS[subject], LEVEL_LABELS[level])
    return {
        'id': f'{subject}-{level}-{slug}'[:128],
        'title': title,
        'summary': summary[:512],
        'lesson': lesson[:16384],
        'estimatedMinutes': estimate_minutes(lesson),
        'tags': [subject, level, 'fomesoutra'],
        'questions': [],
        '_subject': subject,
        '_level': level,
        '_slug': slug,
    }


def purge_previous_output():
    """Supprime les anciens JSON générés (tag 'fomesoutra'), garde les manuels."""
    removed = 0
    for root, _dirs, files in os.walk(OUTPUT_COURSES_DIR):
        for filename in files:
            if not filename.endswith('.json'):
                continue
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, encoding='utf-8') as f:
                    course = json.load(f)
            except (json.JSONDecodeError, OSError):
                continue
            if 'fomesoutra' in course.get('tags', []):
                os.remove(filepath)
                removed += 1
    print(f'Purge : {removed} anciens cours fomesoutra supprimés.')


def write_course_json(course):
    target_dir = os.path.join(OUTPUT_COURSES_DIR, course['_subject'], course['_level'])
    os.makedirs(target_dir, exist_ok=True)
    target_file = os.path.join(target_dir, f"{course['_slug']}.json")
    payload = {k: v for k, v in course.items() if not k.startswith('_')}
    with open(target_file, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def build_sql_statement(course):
    def escape(value):
        return value.replace("'", "''")

    tags_sql = 'ARRAY[' + ', '.join(f"'{t}'" for t in course['tags']) + ']'
    return (
        'INSERT INTO public.courses '
        '(id, subject_id, level_id, slug, title, summary, lesson, '
        'estimated_minutes, tags, questions, source)\n'
        f"VALUES ('{course['id']}', '{course['_subject']}', '{course['_level']}', "
        f"'{course['_slug']}', '{escape(course['title'])}', "
        f"'{escape(course['summary'])}', '{escape(course['lesson'])}', "
        f"{course['estimatedMinutes']}, {tags_sql}, '[]'::jsonb, 'manual')\n"
        'ON CONFLICT (id) DO UPDATE SET '
        'title = EXCLUDED.title, summary = EXCLUDED.summary, '
        'lesson = EXCLUDED.lesson, questions = EXCLUDED.questions;'
    )


def process_all_courses(limit=None, purge=False):
    print('=== Pipeline Fomesoutra → NerdsBattle ===')
    if purge:
        purge_previous_output()

    converted, rejected = {}, 0
    for filepath, subject, level in iter_source_documents():
        course = convert_document(filepath, subject, level)
        if course is None:
            rejected += 1
            continue
        key = course['id']
        # Déduplication : on garde la leçon la plus riche
        if key in converted and len(converted[key]['lesson']) >= len(course['lesson']):
            continue
        converted[key] = course
        if limit and len(converted) >= limit:
            break

    sql_statements = []
    for course in converted.values():
        write_course_json(course)
        sql_statements.append(build_sql_statement(course))

    with open(SQL_OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('-- Script d\'insertion Supabase des cours Fomesoutra\n')
        f.write('-- Généré par scripts/process_courses_pipeline.py\n\n')
        f.write('\n\n'.join(sql_statements))

    print(f'Cours convertis : {len(converted)}')
    print(f'Documents rejetés (scannés, vides, non-leçons) : {rejected}')
    print(f'SQL Supabase : {SQL_OUTPUT_FILE}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit', type=int, default=None)
    parser.add_argument('--purge', action='store_true')
    args = parser.parse_args()
    process_all_courses(limit=args.limit, purge=args.purge)
