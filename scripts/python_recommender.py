"""
Job recommendation service (Python)

Основные принципы:
- Локальные эмбеддинги через TF-IDF (стабильно)
- Косинусная близость по навыкам/описаниям/опыту
- Весовая формула: 0.55*skills + 0.2*experience + 0.1*level + 0.1*location + 0.05*salary
- Объяснения простые, на русском

Пример запуска:
  python scripts/python_recommender.py
"""

from __future__ import annotations

import os
import json
import time
import uuid
from typing import Callable, Dict, List, Tuple, Any
import sys

import numpy as np


def _lower_set(items: List[str]) -> List[str]:
    return [str(x).strip().lower() for x in (items or []) if str(x).strip()]


def _join_skills(skills: List[str]) -> str:
    return ", ".join(_lower_set(skills))


def _experience_to_text(exp: Dict[str, Any]) -> str:
    parts = []
    for k, v in (exp or {}).items():
        parts.append(f"{str(k).strip()}:{int(v)}")
    return ", ".join(parts)


def embed_backend(texts: List[str]) -> np.ndarray:
    """
    Используем только TF-IDF для стабильности.
    """
    if os.getenv("RECO_DEBUG"):
        print("EMB_BACKEND=tfidf", file=sys.stderr)
    return _simple_tfidf_embeddings(texts)


def _simple_tfidf_embeddings(texts: List[str]) -> np.ndarray:
    import re
    from collections import Counter

    tokens_per_doc: List[List[str]] = [re.findall(r"[\w]+", (t or "").lower()) for t in texts]
    vocab_counter: Counter[str] = Counter()
    for toks in tokens_per_doc:
        for token in set(toks):
            vocab_counter[token] += 1
    vocab = {tok: idx for idx, (tok, _) in enumerate(vocab_counter.items())}
    n_docs = max(1, len(texts))
    idf = np.zeros((len(vocab),), dtype=np.float32)
    for tok, df in vocab_counter.items():
        idf[vocab[tok]] = float(np.log((n_docs + 1) / (df + 1)) + 1.0)
    X = np.zeros((len(texts), len(vocab)), dtype=np.float32)
    for i, toks in enumerate(tokens_per_doc):
        counts = Counter(toks)
        if not counts:
            continue
        max_tf = max(counts.values())
        for tok, tf in counts.items():
            j = vocab.get(tok)
            if j is None:
                continue
            tf_norm = 0.5 + 0.5 * (tf / max_tf)
            X[i, j] = tf_norm * idf[j]
    # L2 normalize rows
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return (X / norms).astype(np.float32)


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    a = a.reshape(-1)
    b = b.reshape(-1)
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    sim = float(np.dot(a, b) / denom)
    return float(max(0.0, min(1.0, sim)))


# --- Normalization helpers for skills ---
_SKILL_SYNONYMS: Dict[str, str] = {
    "js": "javascript",
    "nodejs": "node.js",
    "reactjs": "react",
    "ts": "typescript",
    "k8s": "kubernetes",
    "tf": "tensorflow",
    # Common aliases
    "python3": "python",
    "py": "python",
    "postgre": "postgresql",
    "postgres": "postgresql",
    "gcp": "google cloud",
    "aws": "aws",
    "azure": "azure",
    "ml": "machine learning",
    "dl": "deep learning",
    # RU → EN mappings
    "питон": "python",
    "реакт": "react",
    "тайпскрипт": "typescript",
    "джавскрипт": "javascript",
    "джавскрипт" : "javascript",
    "кубер": "kubernetes",
    "кубернетес": "kubernetes",
    "докер": "docker",
    "контейнеры": "docker",
    "яндекс облако": "yandex cloud",
    "гугл облако": "google cloud",
    "амазон облако": "aws",
    "постгрес": "postgresql",
    "постгр": "postgresql",
    "бд": "database",
    "линукс": "linux",
    "джанго": "django",
    "фласк": "flask",
    "машинное обучение": "machine learning",
    "нейросети": "deep learning",
    # Languages / stacks
    "golang": "go",
    "go language": "go",
    "c#": "csharp",
    "c-sharp": "csharp",
    "vuejs": "vue",
    "vue.js": "vue",
    "angularjs": "angular",
    "dotnet": ".net",
    ".net core": ".net",
    "pgsql": "postgresql",
    "mariadb": "mysql",
    "mongo": "mongodb",
    "mongo db": "mongodb",
    "ci/cd": "cicd",
    "ci-cd": "cicd",
    "gitlab ci": "cicd",
    "github actions": "cicd",
    # Tools
    "rabbit": "rabbitmq",
}


def _normalize_skills_list(skills: List[str]) -> List[str]:
    out: List[str] = []
    for s in _lower_set(skills):
        s = s.strip()
        # Fast substring-based RU→EN hints
        if "питон" in s:
            s = "python"
        elif "ява" in s or "джава" in s or "жава" in s:
            s = "java"
        elif "го " in s or s == "го":
            s = "go"
        elif "си шарп" in s:
            s = "csharp"
        elif "реакт" in s:
            s = "react"
        elif "тайпскрип" in s:
            s = "typescript"
        elif "вью" in s:
            s = "vue"
        elif "ангуляр" in s:
            s = "angular"
        elif "кубер" in s:
            s = "kubernetes"
        elif "докер" in s:
            s = "docker"
        elif "постгр" in s or "постгрес" in s:
            s = "postgresql"
        elif "яндекс" in s and "обла" in s:
            s = "yandex cloud"
        elif ("гугл" in s or "google" in s) and "обла" in s:
            s = "google cloud"
        elif ("амазон" in s or "aws" in s) and "обла" in s:
            s = "aws"
        elif "машинн" in s and "обуч" in s:
            s = "machine learning"
        elif "нейросет" in s:
            s = "deep learning"
        elif "тест" in s or "qa" in s:
            s = "qa"
        elif "девопс" in s:
            s = "devops"
        elif "терраформ" in s:
            s = "terraform"
        elif "ансибл" in s:
            s = "ansible"
        elif "джанго" in s:
            s = "django"
        elif "фастапи" in s:
            s = "fastapi"
        # Dictionary exact map
        s = _SKILL_SYNONYMS.get(s, s)
        out.append(s)
    # unique, preserve order
    seen: set = set()
    uniq: List[str] = []
    for s in out:
        if s not in seen:
            uniq.append(s)
            seen.add(s)
    return uniq


def _overlap_ratio(user_skills: List[str], job_skills: List[str]) -> float:
    if not user_skills or not job_skills:
        return 0.0
    u = set(_normalize_skills_list(user_skills))
    j = set(_normalize_skills_list(job_skills))
    inter = u.intersection(j)
    denom = max(len(u), len(j))
    if denom == 0:
        return 0.0
    return float(len(inter) / denom)


def calculate_similarity(user: Dict[str, Any], vacancy: Dict[str, Any], embed_func: Callable[[List[str]], np.ndarray]) -> Tuple[float, Dict[str, float]]:
    """
    Compute weighted score and per-factor details.
    Factors and weights:
      skills (0.5), experience (0.2), level (0.1), location (0.1), salary (0.1)
    """
    # Prepare texts to embed
    user_skills_text = _join_skills(user.get("skills", []))
    job_skills_text = _join_skills(vacancy.get("skills", []))

    user_exp_text = _experience_to_text(user.get("experience", {}))
    job_exp_text = _experience_to_text({s: 1 for s in vacancy.get("skills", [])})  # proxy: skills as presence

    user_desc_text = f"{user.get('position','')} | {user_skills_text} | {user_exp_text}"
    job_desc_text = f"{vacancy.get('title','')} | {vacancy.get('description','')} | {job_skills_text}"

    embeds = embed_func([user_skills_text, job_skills_text, user_exp_text, job_exp_text, user_desc_text, job_desc_text])
    u_sk, j_sk, u_exp, j_exp, u_desc, j_desc = embeds

    # Skills similarity: semantic + discrete overlap boost
    semantic_sk = _cosine(u_sk, j_sk) * 0.6 + _cosine(u_desc, j_desc) * 0.4
    overlap_sk = _overlap_ratio(user.get("skills", []), vacancy.get("skills", []))
    skills_sim = 0.7 * semantic_sk + 0.3 * overlap_sk

    # Experience similarity (semantic via textual representation)
    exp_sim = _cosine(u_exp, j_exp)

    # Level
    level_u = str(user.get("level", "")).strip().lower()
    level_j = str(vacancy.get("level", "")).strip().lower()
    level_sim = 1.0 if level_u and level_u == level_j else 0.0

    # Location (remote/office/city match, partial contains → 0.5)
    loc_u = str(user.get("location", "")).strip().lower()
    loc_j = str(vacancy.get("location", "")).strip().lower()
    if not loc_u or not loc_j:
        location_sim = 0.0
    elif loc_u == "remote" and loc_j == "remote":
        location_sim = 1.0
    else:
        if loc_u == loc_j:
            location_sim = 1.0
        elif loc_u in loc_j or loc_j in loc_u:
            location_sim = 0.5
        else:
            location_sim = 0.0

    # Salary: if job >= expected -> 1; else ratio (min 0.2 if not указано)
    sal_expected = float(user.get("salary_expectation") or 0)
    sal_job = float(vacancy.get("salary") or 0)
    salary_sim = 0.2
    if sal_expected > 0 and sal_job > 0:
        salary_sim = min(1.0, sal_job / sal_expected)

    # Freshness similarity based on posting time (in seconds since epoch)
    freshness_sim = 0.3
    try:
        posted_ts = float(vacancy.get("posted_ts") or 0)
        if posted_ts > 0:
            days = max(0.0, (time.time() - posted_ts) / 86400.0)
            if days <= 3:
                freshness_sim = 1.0
            elif days <= 7:
                freshness_sim = 0.8
            elif days <= 30:
                freshness_sim = 0.6
            else:
                freshness_sim = 0.3
    except Exception:
        freshness_sim = 0.3

    # Weights (increase skills and freshness influence)
    weights = {
        "skills": 0.60,
        "experience": 0.15,
        "level": 0.07,
        "location": 0.06,
        "salary": 0.02,
        "freshness": 0.10,
    }

    score = (
        skills_sim * weights["skills"]
        + exp_sim * weights["experience"]
        + level_sim * weights["level"]
        + location_sim * weights["location"]
        + salary_sim * weights["salary"]
        + freshness_sim * weights["freshness"]
    )

    details = {
        "skills_sim": skills_sim,
        "exp_sim": exp_sim,
        "level_sim": level_sim,
        "location_sim": location_sim,
        "salary_sim": salary_sim,
        "score": score,
        "freshness_sim": freshness_sim,
    }
    return float(score), details


def generate_explanation(user: Dict[str, Any], vacancy: Dict[str, Any], details: Dict[str, float]) -> str:
    user_pos = str(user.get("position", "")).strip()
    job_title = str(vacancy.get("title", "")).strip()

    # Skills overlap list
    u_skills = set(_normalize_skills_list(user.get("skills", [])))
    j_skills = set(_normalize_skills_list(vacancy.get("skills", [])))
    overlap = sorted(list(j_skills.intersection(u_skills)))
    missing = sorted(list(j_skills.difference(u_skills)))
    overlap_str = ", ".join(overlap) if overlap else "—"

    # Level
    level_u = str(user.get("level", "")).strip().capitalize() or "—"
    level_j = str(vacancy.get("level", "")).strip().capitalize() or "—"

    # Location and salary
    loc_j = str(vacancy.get("location", "")).strip().capitalize()
    sal_expected = user.get("salary_expectation")
    sal_job = vacancy.get("salary")
    salary_note = ""
    if isinstance(sal_expected, (int, float)) and isinstance(sal_job, (int, float)):
        if sal_job >= sal_expected:
            salary_note = " Зарплата выше ваших ожиданий."
        elif sal_job > 0 and sal_expected > 0:
            salary_note = " Зарплата ниже ваших ожиданий."

    parts = []
    if user_pos and job_title and user_pos.lower() in job_title.lower():
        parts.append(f"Ваша позиция совпадает: {job_title}.")
    else:
        parts.append(f"Позиция: {job_title}.")

    parts.append(f"Совпадение по навыкам: {overlap_str}.")
    # Add missing key skills (top 2)
    if missing:
        parts.append(f"Рекомендуем подтянуть: {', '.join(missing[:2])}.")
    parts.append(f"Уровень: {level_j}.")
    if loc_j:
        if loc_j.lower() == "remote":
            parts.append("Работа удалённая.")
        else:
            parts.append(f"Локация: {loc_j}.")
    if salary_note:
        parts.append(salary_note.strip())

    text = " ".join(parts)
    return text


def recommend_jobs(user_json: Dict[str, Any], vacancies_json: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    embed = embed_backend  # choose embedding backend

    results: List[Dict[str, Any]] = []
    for vac in vacancies_json:
        score, details = calculate_similarity(user_json, vac, embed)
        explanation = generate_explanation(user_json, vac, details)
        results.append({
            "vacancy_id": vac.get("id"),
            "score": round(float(score), 4),
            "explanation": explanation,
        })

    # Sort by score desc
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


if __name__ == "__main__":
    payload = os.getenv("RECO_PAYLOAD")
    if payload:
        try:
            data = json.loads(payload)
            user = data.get("user", {})
            vacancies = data.get("vacancies", [])
            out = recommend_jobs(user, vacancies)
            # Print compact JSON for the Node caller
            print(json.dumps(out, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)
            raise
    else:
        # Demo
        user = {
            "id": "u1",
            "skills": ["Python", "Docker", "AWS"],
            "position": "Backend Developer",
            "experience": {"Python": 3, "Docker": 2, "AWS": 1},
            "level": "middle",
            "location": "Remote",
            "salary_expectation": 150000,
        }

        vacancies = [
            {
                "id": "v1",
                "title": "Backend Developer",
                "description": "Работа с Python, AWS, Kubernetes.",
                "skills": ["Python", "AWS", "Kubernetes"],
                "level": "middle",
                "location": "Remote",
                "salary": 160000,
            }
        ]

        out = recommend_jobs(user, vacancies)
        print(json.dumps(out, ensure_ascii=False, indent=2))