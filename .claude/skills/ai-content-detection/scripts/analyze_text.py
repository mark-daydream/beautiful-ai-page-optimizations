#!/usr/bin/env python3
"""Deterministic pre-scan for AI-detector risk signals. Stdlib only."""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
PHRASES_FILE = SKILL_ROOT / "references" / "phrase-patterns.md"

STOPWORDS = frozenset(
    "a an the and or but in on at to for of is are was were be been being "
    "it its this that with as by from".split()
)

UNICODE_PATTERNS: list[tuple[str, str, re.Pattern[str]]] = [
    ("nbsp", "Non-breaking space (U+00A0)", re.compile("\u00a0")),
    ("curly_double_open", "Left double quote (U+201C)", re.compile("\u201c")),
    ("curly_double_close", "Right double quote (U+201D)", re.compile("\u201d")),
    ("curly_single_open", "Left single quote (U+2018)", re.compile("\u2018")),
    ("curly_single_close", "Right single quote (U+2019)", re.compile("\u2019")),
    ("em_dash", "Em dash (U+2014)", re.compile("\u2014")),
    ("en_dash", "En dash (U+2013)", re.compile("\u2013")),
    ("zero_width_space", "Zero-width space (U+200B)", re.compile("\u200b")),
    ("zero_width_joiner", "Zero-width joiner (U+200D)", re.compile("\u200d")),
    ("soft_hyphen", "Soft hyphen (U+00AD)", re.compile("\u00ad")),
]

BURSTINESS_LOW_THRESHOLD = 0.35

CONTRAST_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("comma_not", re.compile(r",\s+not\s+[\w'\"“]", re.IGNORECASE)),
    ("comma_never", re.compile(r",\s+never\s+[\w'\"“]", re.IGNORECASE)),
    (
        "isnt_its",
        re.compile(
            r"\b(?:isn't|is not|aren't|are not)\s+(?:about\s+)?[^.;:!?]{2,40}?[,;]\s*"
            r"(?:it's|it is|they're|they are)\b",
            re.IGNORECASE,
        ),
    ),
    ("not_x_but_y", re.compile(r"\bnot\s+[^.;:!?]{2,40}?,\s*but\s+", re.IGNORECASE)),
    ("rather_than", re.compile(r"\brather than\b", re.IGNORECASE)),
]

COLON_PIVOT_MAX_SETUP_WORDS = 6
COLON_PIVOT_MIN_PAYOFF_WORDS = 4
COLON_PIVOT_DENSITY_THRESHOLD = 2.5  # payoff colons per 1,000 words
CONTRAST_DENSITY_THRESHOLD = 2.0  # contrast frames per 1,000 words


def load_phrases(path: Path) -> list[str]:
    if not path.exists():
        return []
    phrases: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("- "):
            phrases.append(line[2:].strip())
    return phrases


def split_sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text.strip())
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]


def word_count(sentence: str) -> int:
    return len(re.findall(r"\b[\w']+\b", sentence))


def analyze_burstiness(text: str) -> dict:
    sentences = split_sentences(text)
    counts = [word_count(s) for s in sentences]
    if not counts:
        return {
            "sentence_count": 0,
            "mean_words": 0,
            "stdev_words": 0,
            "coefficient_of_variation": 0,
            "min_words": 0,
            "max_words": 0,
            "low_burstiness": False,
            "uniform_runs": [],
        }

    mean = sum(counts) / len(counts)
    if len(counts) > 1:
        variance = sum((c - mean) ** 2 for c in counts) / len(counts)
        stdev = math.sqrt(variance)
    else:
        stdev = 0.0

    cv = stdev / mean if mean > 0 else 0.0

    uniform_runs: list[dict] = []
    run_start = 0
    for i in range(1, len(counts)):
        if abs(counts[i] - counts[i - 1]) <= 3:
            continue
        run_len = i - run_start
        if run_len >= 4:
            uniform_runs.append(
                {
                    "start_sentence": run_start + 1,
                    "length": run_len,
                    "avg_words": round(sum(counts[run_start:i]) / run_len, 1),
                }
            )
        run_start = i
    run_len = len(counts) - run_start
    if run_len >= 4:
        uniform_runs.append(
            {
                "start_sentence": run_start + 1,
                "length": run_len,
                "avg_words": round(sum(counts[run_start:]) / run_len, 1),
            }
        )

    return {
        "sentence_count": len(counts),
        "mean_words": round(mean, 2),
        "stdev_words": round(stdev, 2),
        "coefficient_of_variation": round(cv, 3),
        "min_words": min(counts),
        "max_words": max(counts),
        "low_burstiness": cv < BURSTINESS_LOW_THRESHOLD and len(counts) >= 4,
        "uniform_runs": uniform_runs,
    }


def analyze_paragraph_structure(text: str) -> dict:
    """Flag runs of consecutive prose paragraphs with near-identical shape."""
    raw_paras = re.split(r"\n\s*\n", text)
    paras: list[dict] = []
    for raw in raw_paras:
        stripped = raw.strip()
        if not stripped or stripped.startswith(("#", "|", "```", "- ", "* ", ">")):
            continue
        sentences = split_sentences(stripped)
        if len(sentences) < 2:
            continue
        counts = [word_count(s) for s in sentences]
        opener_words = tokenize_words(sentences[0])
        paras.append(
            {
                "sentence_count": len(sentences),
                "mean_words": round(sum(counts) / len(counts), 1),
                "opener": opener_words[0] if opener_words else "",
                "preview": sentences[0][:60],
            }
        )

    uniform_runs: list[dict] = []
    run_start = 0
    for i in range(1, len(paras)):
        prev, cur = paras[i - 1], paras[i]
        if (
            abs(cur["sentence_count"] - prev["sentence_count"]) <= 1
            and abs(cur["mean_words"] - prev["mean_words"]) <= 4
        ):
            continue
        if i - run_start >= 3:
            uniform_runs.append(
                {
                    "start_paragraph": run_start + 1,
                    "length": i - run_start,
                    "previews": [p["preview"] for p in paras[run_start:i]][:5],
                }
            )
        run_start = i
    if len(paras) - run_start >= 3:
        uniform_runs.append(
            {
                "start_paragraph": run_start + 1,
                "length": len(paras) - run_start,
                "previews": [p["preview"] for p in paras[run_start:]][:5],
            }
        )

    opener_counts = Counter(p["opener"] for p in paras if p["opener"] not in STOPWORDS)
    repeated_openers = [
        {"word": word, "count": count}
        for word, count in opener_counts.most_common(5)
        if count >= 3
    ]

    return {
        "prose_paragraph_count": len(paras),
        "uniform_paragraph_runs": uniform_runs,
        "repeated_openers": repeated_openers,
    }


def analyze_contrast_frames(text: str) -> dict:
    """Detect 'X, not Y' style contrast frames — a stock LLM rhetorical move."""
    total_words = len(tokenize_words(text))
    instances: list[dict] = []
    counts: dict[str, int] = {}

    for key, pattern in CONTRAST_PATTERNS:
        matches = list(pattern.finditer(text))
        if not matches:
            continue
        counts[key] = len(matches)
        for m in matches[:5]:
            start = max(0, m.start() - 40)
            end = min(len(text), m.end() + 40)
            instances.append(
                {
                    "type": key,
                    "position": m.start(),
                    "context": text[start:end].replace("\n", " "),
                }
            )

    total = sum(counts.values())
    per_1000 = round(total / total_words * 1000, 2) if total_words else 0.0
    return {
        "total_hits": total,
        "counts_by_type": counts,
        "per_1000_words": per_1000,
        "instances": instances[:15],
        "high_density": total >= 3
        or (total >= 2 and per_1000 >= CONTRAST_DENSITY_THRESHOLD),
    }


def analyze_colon_pivots(text: str) -> dict:
    """Detect payoff colons: short setup clause + colon + prose payoff.

    The em-dash successor. Excludes list-introducing colons (nothing or a
    bullet after), URLs, times/ratios, headers, tables, and code blocks.
    """
    total_words = len(tokenize_words(text))
    instances: list[dict] = []
    header_colon_count = 0
    fragment_openers = 0
    in_code_fence = False

    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_fence = not in_code_fence
            continue
        if in_code_fence or not stripped or stripped.startswith(("|", ">")):
            continue
        if stripped.startswith("#"):
            if ": " in stripped:
                header_colon_count += 1
            continue

        for m in re.finditer(r":", line):
            pos = m.start()
            after_char = line[pos + 1] if pos + 1 < len(line) else ""
            if after_char == "/":  # URL
                continue
            if pos > 0 and line[pos - 1].isdigit() and after_char.isdigit():
                continue  # time or ratio
            setup_segment = re.split(r"[.!?;:]", line[:pos])[-1]
            setup_words = len(re.findall(r"\b[\w']+\b", setup_segment))
            payoff_words = len(re.findall(r"\b[\w']+\b", line[pos + 1 :]))
            if setup_words == 0 or setup_words > COLON_PIVOT_MAX_SETUP_WORDS:
                continue
            if payoff_words < COLON_PIVOT_MIN_PAYOFF_WORDS:
                continue  # list intro or trailing colon
            if setup_segment.strip() == line[:pos].strip():
                fragment_openers += 1  # whole sentence so far is the setup
            start = max(0, pos - 40)
            end = min(len(line), pos + 60)
            instances.append({"context": line[start:end].strip()})

    total = len(instances)
    per_1000 = round(total / total_words * 1000, 2) if total_words else 0.0
    return {
        "payoff_colon_count": total,
        "fragment_opener_count": fragment_openers,
        "header_colon_count": header_colon_count,
        "per_1000_words": per_1000,
        "instances": instances[:15],
        "high_density": total >= 3
        or (total >= 2 and per_1000 >= COLON_PIVOT_DENSITY_THRESHOLD),
    }


def tokenize_words(text: str) -> list[str]:
    return [w.lower() for w in re.findall(r"\b[\w']+\b", text)]


def is_stopword_heavy(ngram: tuple[str, ...]) -> bool:
    content = [w for w in ngram if w not in STOPWORDS]
    return len(content) < 2


def analyze_ngrams(text: str, min_n: int = 3, max_n: int = 5, min_count: int = 2) -> list[dict]:
    words = tokenize_words(text)
    found: list[dict] = []

    for n in range(min_n, max_n + 1):
        if len(words) < n:
            continue
        counter: Counter[tuple[str, ...]] = Counter()
        for i in range(len(words) - n + 1):
            ng = tuple(words[i : i + n])
            if is_stopword_heavy(ng):
                continue
            counter[ng] += 1

        for ng, count in counter.most_common(20):
            if count >= min_count:
                found.append(
                    {
                        "phrase": " ".join(ng),
                        "size": n,
                        "count": count,
                    }
                )

    found.sort(key=lambda x: (-x["count"], -x["size"]))
    return found[:15]


def analyze_unicode(text: str) -> dict:
    hits: list[dict] = []
    counts: dict[str, int] = {}

    for key, label, pattern in UNICODE_PATTERNS:
        matches = list(pattern.finditer(text))
        if matches:
            counts[key] = len(matches)
            for m in matches[:5]:
                start = max(0, m.start() - 20)
                end = min(len(text), m.end() + 20)
                hits.append(
                    {
                        "type": key,
                        "label": label,
                        "position": m.start(),
                        "context": text[start:end].replace("\n", " "),
                    }
                )

    return {
        "total_hits": sum(counts.values()),
        "counts_by_type": counts,
        "hits": hits[:20],
        "em_dash_count": counts.get("em_dash", 0),
    }


def analyze_phrases(text: str, phrases: list[str]) -> list[dict]:
    lower = text.lower()
    matches: list[dict] = []

    for phrase in phrases:
        pl = phrase.lower()
        start = 0
        occurrences: list[int] = []
        while True:
            idx = lower.find(pl, start)
            if idx == -1:
                break
            occurrences.append(idx)
            start = idx + 1

        if occurrences:
            matches.append(
                {
                    "phrase": phrase,
                    "count": len(occurrences),
                    "positions": occurrences[:10],
                }
            )

    matches.sort(key=lambda x: -x["count"])
    return matches


def analyze_vocabulary(text: str) -> dict:
    words = tokenize_words(text)
    if not words:
        return {"unique_ratio": 0, "total_words": 0, "unique_words": 0}

    unique = len(set(words))
    total = len(words)
    return {
        "total_words": total,
        "unique_words": unique,
        "unique_ratio": round(unique / total, 3),
    }


def analyze_text(text: str, phrases: list[str] | None = None) -> dict:
    if phrases is None:
        phrases = load_phrases(PHRASES_FILE)

    burstiness = analyze_burstiness(text)
    paragraph_structure = analyze_paragraph_structure(text)
    ngrams = analyze_ngrams(text)
    unicode_info = analyze_unicode(text)
    phrase_matches = analyze_phrases(text, phrases)
    contrast_frames = analyze_contrast_frames(text)
    colon_pivots = analyze_colon_pivots(text)
    vocabulary = analyze_vocabulary(text)

    high_phrase_hits = sum(1 for p in phrase_matches if p["count"] >= 1)
    risk_hints: list[str] = []
    if burstiness.get("low_burstiness"):
        risk_hints.append("low_burstiness")
    if burstiness.get("uniform_runs"):
        risk_hints.append("uniform_sentence_runs")
    if paragraph_structure.get("uniform_paragraph_runs"):
        risk_hints.append("uniform_paragraph_structure")
    if len(ngrams) >= 3:
        risk_hints.append("repeated_ngrams")
    if unicode_info["total_hits"] >= 2:
        risk_hints.append("unicode_artifacts")
    if high_phrase_hits >= 2:
        risk_hints.append("ai_phrase_patterns")
    if contrast_frames.get("high_density"):
        risk_hints.append("contrast_frames")
    if colon_pivots.get("high_density"):
        risk_hints.append("colon_pivots")
    if burstiness.get("low_burstiness") and high_phrase_hits >= 2:
        risk_hints.append("high_risk_combo")

    return {
        "burstiness": burstiness,
        "paragraph_structure": paragraph_structure,
        "ngrams": ngrams,
        "unicode": unicode_info,
        "phrase_matches": phrase_matches,
        "contrast_frames": contrast_frames,
        "colon_pivots": colon_pivots,
        "vocabulary": vocabulary,
        "risk_hints": risk_hints,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="AI-detector signal pre-scan")
    parser.add_argument("--input", "-i", help="Input file path (default: stdin)")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument(
        "--phrases-file",
        default=str(PHRASES_FILE),
        help="Path to phrase-patterns.md",
    )
    args = parser.parse_args()

    if args.input:
        text = Path(args.input).read_text(encoding="utf-8")
    else:
        text = sys.stdin.read()

    phrases = load_phrases(Path(args.phrases_file))
    result = analyze_text(text, phrases)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
