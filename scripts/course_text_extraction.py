"""Extraction et nettoyage de texte des documents de cours Fomesoutra (PDF/DOCX).

Transforme le texte brut extrait en leçon markdown structurée + résumé lisible.
Module utilisé par process_courses_pipeline.py — aucune écriture disque ici.
"""
import logging
import re
from collections import Counter

import pypdf

logging.getLogger('pypdf').setLevel(logging.ERROR)

try:
    import docx
except ImportError:
    docx = None

MAX_LESSON_CHARS = 8000
MAX_SUMMARY_CHARS = 480

# ─── Extraction brute ─────────────────────────────────────────────────────────

def extract_raw_text(filepath):
    """Retourne le texte brut d'un PDF ou DOCX, '' si illisible/scanné."""
    lower = filepath.lower()
    if lower.endswith('.pdf'):
        return _extract_pdf(filepath)
    if lower.endswith('.docx') and docx is not None:
        return _extract_docx(filepath)
    return ''


def _extract_pdf(filepath):
    try:
        reader = pypdf.PdfReader(filepath)
        return '\n'.join(page.extract_text() or '' for page in reader.pages)
    except Exception:
        return ''


def _extract_docx(filepath):
    try:
        document = docx.Document(filepath)
        return '\n'.join(p.text for p in document.paragraphs)
    except Exception:
        return ''

# ─── Nettoyage ────────────────────────────────────────────────────────────────

NOISE_PATTERNS = [
    re.compile(r'fomesoutra', re.I),
    re.compile(r'https?://|www\.', re.I),
    re.compile(r'[ée]cole\s+num[ée]rique', re.I),
    re.compile(r'by\s+t[eé]hua', re.I),
    re.compile(r'^\s*\d{1,3}\s*$'),                      # numéro de page isolé
    re.compile(r'^\s*page\s+\d+\b', re.I),
    re.compile(r'^\s*code\s*:?\s*$', re.I),
    re.compile(r'^\s*dur[ée]e\s*:\s*\d+\s*(h|heures?)\s*$', re.I),
]


def clean_lines(raw_text):
    """Supprime filigranes, numéros de page et en-têtes/pieds répétés."""
    lines = [line.strip() for line in raw_text.split('\n')]
    lines = [line for line in lines if line == '' or not _is_noise(line)]
    return _drop_repeated_headers(lines)


def _is_noise(line):
    return any(pattern.search(line) for pattern in NOISE_PATTERNS)


def _drop_repeated_headers(lines):
    """Une ligne courte répétée >= 4 fois est un en-tête/pied de page."""
    counts = Counter(line for line in lines if line and len(line) < 80)
    repeated = {line for line, count in counts.items() if count >= 4}
    return [line for line in lines if line == '' or line not in repeated]

# ─── Structuration markdown ───────────────────────────────────────────────────

MAJOR_HEADING_PATTERNS = [
    re.compile(r'^[A-Z]\s*[./)-]\s+\S'),                 # A. / B) / C-
    re.compile(r'^[IVXL]{1,6}\s*[./)-]\s+\S'),           # I. / II) / IV-
    re.compile(r'^(LE[ÇC]ON|CHAPITRE|TH[ÈE]ME|MODULE|ACTIVIT[ÉE])\b', re.I),
]
MINOR_HEADING_PATTERNS = [
    re.compile(r'^\d{1,2}\s*[./)-]\s+\S'),               # 1. / 2)
    re.compile(r'^\d{1,2}\.\d{1,2}\b'),                  # 1.1
]


def _heading_level(line):
    """Retourne 2 (majeur), 3 (mineur) ou None."""
    if len(line) > 90:
        return None
    for pattern in MAJOR_HEADING_PATTERNS:
        if pattern.match(line):
            return 2
    for pattern in MINOR_HEADING_PATTERNS:
        if pattern.match(line):
            return 3
    letters = [c for c in line if c.isalpha()]
    if len(letters) >= 6 and sum(c.isupper() for c in letters) / len(letters) > 0.9:
        return 2
    return None


def _normalize_heading(line):
    """Adoucit une ligne de titre tout en majuscules."""
    letters = [c for c in line if c.isalpha()]
    if letters and sum(c.isupper() for c in letters) / len(letters) > 0.9:
        lowered = line.lower()
        return lowered[0].upper() + lowered[1:]
    return line


def build_markdown_lesson(title, lines):
    """Reconstruit une leçon markdown : titres détectés + paragraphes refluidifiés."""
    blocks = [f'# {title}']
    paragraph = []

    def flush():
        if paragraph:
            blocks.append(' '.join(paragraph))
            paragraph.clear()

    for line in lines:
        if not line:
            flush()
            continue
        level = _heading_level(line)
        if level is not None:
            flush()
            blocks.append(f'{"#" * level} {_normalize_heading(line)}')
            continue
        paragraph.append(line)
        joined = ' '.join(paragraph)
        if len(joined) > 300 and line[-1] in '.!?':
            flush()
    flush()

    return _truncate_blocks(blocks)


def _truncate_blocks(blocks):
    """Assemble les blocs sans dépasser MAX_LESSON_CHARS (coupe entre blocs)."""
    result, total = [], 0
    for block in blocks:
        if total + len(block) > MAX_LESSON_CHARS:
            break
        result.append(block)
        total += len(block) + 2
    return '\n\n'.join(result)

# ─── Résumé ───────────────────────────────────────────────────────────────────

SENTENCE_SPLIT = re.compile(r'(?<=[.!?])\s+')
SUMMARY_SECTION = re.compile(r'^#{2,3}\s.*(r[ée]sum[ée]|retenir|essentiel)', re.I)
# Paragraphes inutilisables comme résumé : mentions légales, préfaces d'éditeur
UNUSABLE_SUMMARY = re.compile(
    r'reproduction|ayants?[\s-]droits?|illicite|copyright|isbn|tous\s+droits'
    r'|autorisation\s+pr[ée]alable|manuel\s+scolaire|collection|maintes\s+fois',
    re.I,
)


def build_summary(markdown_lesson, title, subject_label, level_label):
    """Résumé : section 'résumé/à retenir' si présente, sinon 1er paragraphe utile."""
    blocks = markdown_lesson.split('\n\n')
    paragraph = _find_summary_section(blocks) or _first_substantive_paragraph(blocks)
    if paragraph:
        summary = _take_sentences(paragraph, MAX_SUMMARY_CHARS)
        if len(summary) >= 60:
            return summary
    return f'Leçon de {subject_label} pour la classe de {level_label} : {title}.'


def _find_summary_section(blocks):
    for i, block in enumerate(blocks):
        if SUMMARY_SECTION.match(block):
            for candidate in blocks[i + 1:i + 3]:
                if not candidate.startswith('#') and len(candidate) >= 60:
                    return candidate
    return None


def _first_substantive_paragraph(blocks):
    for block in blocks:
        if block.startswith('#') or UNUSABLE_SUMMARY.search(block):
            continue
        if len(block) >= 80 and any(c.islower() for c in block):
            return block
    return None


def _take_sentences(paragraph, max_chars):
    sentences = SENTENCE_SPLIT.split(paragraph)
    result = ''
    for sentence in sentences:
        if result and len(result) + len(sentence) + 1 > max_chars:
            break
        result = f'{result} {sentence}'.strip()
    return result[:max_chars].strip()

# ─── Titre et slug ────────────────────────────────────────────────────────────

def clean_title(raw_name):
    """Nettoie un nom de fichier ou titre de manifest en titre lisible."""
    title = re.sub(r'\.(pdf|docx?)$', '', raw_name, flags=re.I)
    title = title.replace('_', ' ')
    title = re.sub(r'by\s+t[eé]hua', '', title, flags=re.I)
    title = re.sub(r'\bedited\b', '', title, flags=re.I)
    title = re.sub(r'\d{6,}', '', title)                 # timestamps
    title = re.sub(r'\.docx?\b', '', title, flags=re.I)  # double extension
    title = re.sub(r'\s+', ' ', title).strip(' -–—')
    if title and title[0].islower():
        title = title[0].upper() + title[1:]
    return title[:128]


def slugify(text):
    text = text.lower()
    replacements = {
        'àáâãäå': 'a', 'èéêë': 'e', 'ìíîï': 'i',
        'òóôõö': 'o', 'ùúûü': 'u', 'ç': 'c', 'ñ': 'n',
    }
    for chars, repl in replacements.items():
        text = re.sub(f'[{chars}]', repl, text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')[:64]


def estimate_minutes(markdown_lesson):
    """Durée de lecture estimée (~180 mots/min), bornée [3, 20]."""
    words = len(markdown_lesson.split())
    return max(3, min(20, round(words / 180)))
