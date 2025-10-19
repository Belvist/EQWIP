from __future__ import annotations

import os
import json
import time
import uuid
from typing import Callable, Dict, List, Tuple, Any, Optional
import sys
import re
from collections import Counter

import numpy as np

# Optional HTTP client (fallback to urllib if requests is missing)
try:  # pragma: no cover - optional dep
    import requests  # type: ignore
    _HAVE_REQUESTS = True
except Exception:  # pragma: no cover
    import urllib.request
    _HAVE_REQUESTS = False


def _normalize_text(text: str) -> str:
    """Normalize text for processing"""
    if not text:
        return ""
    return re.sub(r'[^\w\s]', ' ', str(text).lower()).strip()


def _normalize_genres(genres: List[str]) -> List[str]:
    """Normalize genre names"""
    if not genres:
        return []
    
    genre_mapping = {
        # Russian to English
        "боевик": "action",
        "комедия": "comedy", 
        "драма": "drama",
        "ужасы": "horror",
        "фантастика": "sci-fi",
        "фэнтези": "fantasy",
        "триллер": "thriller",
        "детектив": "mystery",
        "криминал": "crime",
        "мелодрама": "romance",
        "приключения": "adventure",
        "семейный": "family",
        "мультфильм": "animation",
        "документальный": "documentary",
        "биография": "biography",
        "история": "history",
        "военный": "war",
        "вестерн": "western",
        "музыка": "music",
        "спорт": "sport",
        # Common variations
        "sci fi": "sci-fi",
        "sci-fi": "sci-fi",
        "sci_fi": "sci-fi",
        "rom-com": "romance",
        "rom com": "romance",
        "romcom": "romance",
    }
    
    normalized = []
    for genre in genres:
        genre_lower = _normalize_text(genre)
        mapped_genre = genre_mapping.get(genre_lower, genre_lower)
        normalized.append(mapped_genre)
    
    return list(set(normalized))  # Remove duplicates


def _calculate_genre_similarity(user_genres: List[str], movie_genres: List[str]) -> float:
    """Calculate genre similarity between user preferences and movie genres"""
    if not user_genres or not movie_genres:
        return 0.0
    
    user_set = set(_normalize_genres(user_genres))
    movie_set = set(_normalize_genres(movie_genres))
    
    if not user_set or not movie_set:
        return 0.0
    
    intersection = user_set.intersection(movie_set)
    union = user_set.union(movie_set)
    
    # Jaccard similarity
    return len(intersection) / len(union) if union else 0.0


def _calculate_rating_similarity(user_rating_pref: float, movie_rating: float) -> float:
    """Calculate rating similarity"""
    if not user_rating_pref or not movie_rating:
        return 0.5  # Neutral score if no rating data
    
    # Normalize ratings to 0-1 scale (assuming 0-10 scale)
    user_norm = min(1.0, max(0.0, user_rating_pref / 10.0))
    movie_norm = min(1.0, max(0.0, movie_rating / 10.0))
    
    # Calculate similarity (closer ratings = higher similarity)
    diff = abs(user_norm - movie_norm)
    return max(0.0, 1.0 - diff)


def _calculate_year_similarity(user_year_pref: int, movie_year: int) -> float:
    """Calculate year similarity (prefer movies from preferred decade)"""
    if not user_year_pref or not movie_year:
        return 0.5  # Neutral score if no year data
    
    # Calculate decade difference
    user_decade = user_year_pref // 10 * 10
    movie_decade = movie_year // 10 * 10
    
    decade_diff = abs(user_decade - movie_decade) / 10
    
    # Higher similarity for same decade, decreasing for further decades
    return max(0.0, 1.0 - (decade_diff * 0.2))


def embed_backend(texts: List[str]) -> np.ndarray:
    """
    Эмбеддинги через GigaChat API, затем фолбэк TF‑IDF.
    Можно принудительно выключить GigaChat, выставив
      RECO_EMBED_BACKEND=tfidf  ИЛИ  GIGACHAT_EMBED_MODEL=off|disabled|none|0
    """
    # Принудительно используем TF‑IDF, если так указано в env
    force_backend = (os.getenv("RECO_EMBED_BACKEND", "").strip().lower())
    gigachat_model_raw = os.getenv("GIGACHAT_EMBED_MODEL", "GigaChat:latest")
    gigachat_model = (gigachat_model_raw or "").strip().lower()
    if force_backend in ("tfidf", "off", "disabled", "none", "0") or gigachat_model in ("off", "disabled", "none", "0"):
        if os.getenv("RECO_DEBUG"):
            print("EMB_BACKEND=tfidf(force)", file=sys.stderr)
        return _simple_tfidf_embeddings(texts)

    # Эмбеддинги через GigaChat API
    def _try_gigachat(txs: List[str]):
        base = os.getenv("GIGACHAT_BASE_URL", "https://ngw.devices.sberbank.ru:9443/api/v2").strip().rstrip("/")
        api_key = os.getenv("GIGACHAT_API_KEY", "").strip()
        model = gigachat_model_raw or "GigaChat:latest"
        timeout_s = float(os.getenv("GIGACHAT_EMBED_TIMEOUT_S", "8"))
        
        if not api_key:
            return None
            
        try:
            # Получаем токен доступа
            token_response = requests.post(f"{base}/oauth", 
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'RqUID': str(uuid.uuid4()),
                    'Authorization': f'Basic {api_key}'
                },
                data='scope=GIGACHAT_API_PERS',
                timeout=timeout_s
            )
            
            if token_response.status_code >= 400:
                return None
                
            token_data = token_response.json()
            access_token = token_data.get('access_token')
            
            if not access_token:
                return None
            
            # Получаем эмбеддинги
            vectors: List[np.ndarray] = []
            for s in txs:
                embed_response = requests.post(f"{base}/embeddings",
                    headers={
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': f'Bearer {access_token}'
                    },
                    json={
                        'model': model,
                        'input': s
                    },
                    timeout=timeout_s
                )
                
                if embed_response.status_code >= 400:
                    return None
                    
                data = embed_response.json()
                vec = None
                
                # Разбор возможных форматов ответа GigaChat
                if isinstance(data, dict):
                    if "data" in data and isinstance(data["data"], list) and len(data["data"]) > 0:
                        emb_list = data["data"][0].get("embedding")
                        if isinstance(emb_list, list) and len(emb_list) > 0 and isinstance(emb_list[0], (float, int)):
                            vec = np.array(emb_list, dtype=np.float32)
                    elif "embedding" in data and isinstance(data["embedding"], list):
                        if len(data["embedding"]) > 0 and isinstance(data["embedding"][0], (float, int)):
                            vec = np.array(data["embedding"], dtype=np.float32)
                
                if vec is None or vec.size == 0:
                    if os.getenv("RECO_DEBUG"):
                        print("EMB_GIGACHAT_EMPTY", file=sys.stderr)
                    return None
                    
                vectors.append(vec)
            
            if len(vectors) == len(txs):
                if os.getenv("RECO_DEBUG"):
                    print(f"EMB_BACKEND=gigachat;MODEL={model}", file=sys.stderr)
                return np.vstack(vectors)
                
        except Exception as e:
            if os.getenv("RECO_DEBUG"):
                print(f"EMB_GIGACHAT_ERR {str(e)[:200]}", file=sys.stderr)
            return None

    # Локальные эмбеддинги через Ollama (используем env или дефолт 127.0.0.1)
    def _try_ollama(txs: List[str]):
        base = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").strip().rstrip("/")
        model = os.getenv("OLLAMA_EMBED_MODEL", "bge-m3")
        timeout_s = float(os.getenv("OLLAMA_EMBED_TIMEOUT_S", "8"))
        try:
            vectors: List[np.ndarray] = []
            for s in txs:
                payload = {"model": model, "prompt": s}
                if _HAVE_REQUESTS:
                    r = requests.post(f"{base}/api/embeddings", json=payload, timeout=timeout_s)
                    if r.status_code >= 400:
                        return None
                    data = r.json()
                else:  # pragma: no cover
                    req = urllib.request.Request(f"{base}/api/embeddings", data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")  # type: ignore
                    with urllib.request.urlopen(req, timeout=timeout_s) as rr:  # type: ignore
                        data = json.loads(rr.read().decode("utf-8"))
                # Разбор возможных форматов ответа Ollama
                vec = None
                if isinstance(data, dict):
                    if "embedding" in data and isinstance(data["embedding"], list):
                        # Один вход → один вектор
                        if len(data["embedding"]) > 0 and isinstance(data["embedding"][0], (float, int)):
                            vec = np.array(data["embedding"], dtype=np.float32)
                    elif "embeddings" in data and isinstance(data["embeddings"], list):
                        # На всякий случай: некоторые билды могут класть вектор сюда
                        if len(data["embeddings"]) == 1 and isinstance(data["embeddings"][0], list) and len(data["embeddings"][0]) > 0:
                            vec = np.array(data["embeddings"][0], dtype=np.float32)
                        elif len(data["embeddings"]) > 0 and isinstance(data["embeddings"][0], (float, int)):
                            vec = np.array(data["embeddings"][0], dtype=np.float32)
                    elif "data" in data and isinstance(data["data"], list):
                        # OpenAI‑подобный формат: [{ embedding: [...] }]
                        items = data["data"]
                        if len(items) == 1 and isinstance(items[0], dict):
                            emb_list = items[0].get("embedding")
                            if isinstance(emb_list, list) and len(emb_list) > 0 and isinstance(emb_list[0], (float, int)):
                                vec = np.array(emb_list, dtype=np.float32)
                if vec is None or vec.size == 0:
                    if os.getenv("RECO_DEBUG"):
                        print("EMB_OLLAMA_EMPTY", file=sys.stderr)
                    return None
                vectors.append(vec)
            if len(vectors) == len(txs):
                if os.getenv("RECO_DEBUG"):
                    print(f"EMB_BACKEND=ollama;MODEL={model}", file=sys.stderr)
                return np.vstack(vectors)
        except Exception as e:
            if os.getenv("RECO_DEBUG"):
                print(f"EMB_OLLAMA_ERR {str(e)[:200]}", file=sys.stderr)
            return None

    # 1) GigaChat API
    arr = _try_gigachat(texts)
    if arr is not None:
        return arr

    # 2) Ollama (fallback)
    arr = _try_ollama(texts)
    if arr is not None:
        return arr

    # 3) Фолбэк TF‑IDF (без внешних API)
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


def calculate_movie_similarity(user: Dict[str, Any], movie: Dict[str, Any], embed_func: Callable[[List[str]], np.ndarray]) -> Tuple[float, Dict[str, float]]:
    """
    Compute weighted score and per-factor details for movie recommendation.
    Factors and weights:
      genre (0.4), plot (0.3), rating (0.15), year (0.1), cast (0.05)
    """
    
    # Genre similarity
    user_genres = user.get("preferred_genres", [])
    movie_genres = movie.get("genres", [])
    genre_sim = _calculate_genre_similarity(user_genres, movie_genres)
    
    # Rating similarity
    user_rating_pref = user.get("preferred_rating", 0)
    movie_rating = movie.get("rating", 0)
    rating_sim = _calculate_rating_similarity(user_rating_pref, movie_rating)
    
    # Year similarity
    user_year_pref = user.get("preferred_year", 0)
    movie_year = movie.get("year", 0)
    year_sim = _calculate_year_similarity(user_year_pref, movie_year)
    
    # Plot similarity (semantic)
    user_preferences_text = f"{user.get('preferred_genres', [])} {user.get('preferred_themes', [])}"
    movie_plot_text = f"{movie.get('title', '')} {movie.get('plot', '')} {movie.get('genres', [])}"
    
    try:
        embeds = embed_func([user_preferences_text, movie_plot_text])
        plot_sim = _cosine(embeds[0], embeds[1])
    except Exception:
        plot_sim = 0.5  # Neutral score if embedding fails
    
    # Cast similarity (simple keyword matching)
    user_favorite_actors = user.get("favorite_actors", [])
    movie_cast = movie.get("cast", [])
    cast_sim = 0.0
    if user_favorite_actors and movie_cast:
        user_actors_lower = [actor.lower() for actor in user_favorite_actors]
        movie_cast_lower = [actor.lower() for actor in movie_cast]
        matches = sum(1 for actor in user_actors_lower if any(actor in cast_member for cast_member in movie_cast_lower))
        cast_sim = min(1.0, matches / len(user_favorite_actors))
    
    # Weights
    weights = {
        "genre": 0.40,
        "plot": 0.30,
        "rating": 0.15,
        "year": 0.10,
        "cast": 0.05,
    }
    
    score = (
        genre_sim * weights["genre"]
        + plot_sim * weights["plot"]
        + rating_sim * weights["rating"]
        + year_sim * weights["year"]
        + cast_sim * weights["cast"]
    )
    
    details = {
        "genre_sim": genre_sim,
        "plot_sim": plot_sim,
        "rating_sim": rating_sim,
        "year_sim": year_sim,
        "cast_sim": cast_sim,
        "score": score,
    }
    
    return float(score), details


def generate_movie_explanation(user: Dict[str, Any], movie: Dict[str, Any], details: Dict[str, float]) -> str:
    """Generate explanation for movie recommendation"""
    
    movie_title = movie.get("title", "Неизвестный фильм")
    movie_genres = movie.get("genres", [])
    movie_rating = movie.get("rating", 0)
    movie_year = movie.get("year", 0)
    
    # Genre explanation
    user_genres = set(_normalize_genres(user.get("preferred_genres", [])))
    movie_genres_norm = set(_normalize_genres(movie_genres))
    common_genres = user_genres.intersection(movie_genres_norm)
    
    genre_text = ""
    if common_genres:
        genre_text = f"Жанры: {', '.join(common_genres)}."
    elif movie_genres:
        genre_text = f"Жанры: {', '.join(movie_genres[:3])}."
    
    # Rating explanation
    rating_text = ""
    if movie_rating > 0:
        rating_text = f"Рейтинг: {movie_rating:.1f}/10."
    
    # Year explanation
    year_text = ""
    if movie_year > 0:
        year_text = f"Год: {movie_year}."
    
    # Cast explanation
    cast_text = ""
    user_actors = user.get("favorite_actors", [])
    movie_cast = movie.get("cast", [])
    if user_actors and movie_cast:
        matching_actors = []
        for actor in user_actors:
            for cast_member in movie_cast:
                if actor.lower() in cast_member.lower():
                    matching_actors.append(cast_member)
                    break
        if matching_actors:
            cast_text = f"В ролях: {', '.join(matching_actors[:2])}."
    
    # Combine explanations
    parts = [f"Фильм: {movie_title}."]
    if genre_text:
        parts.append(genre_text)
    if rating_text:
        parts.append(rating_text)
    if year_text:
        parts.append(year_text)
    if cast_text:
        parts.append(cast_text)
    
    # Add recommendation reason
    if details["genre_sim"] > 0.7:
        parts.append("Отлично подходит по жанрам!")
    elif details["plot_sim"] > 0.7:
        parts.append("Интересный сюжет по вашим предпочтениям.")
    elif details["rating_sim"] > 0.8:
        parts.append("Высокий рейтинг, как вы предпочитаете.")
    
    return " ".join(parts)


def recommend_movies(user_json: Dict[str, Any], movies_json: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Main recommendation function"""
    embed = embed_backend  # choose embedding backend
    
    results: List[Dict[str, Any]] = []
    for movie in movies_json:
        score, details = calculate_movie_similarity(user_json, movie, embed)
        explanation = generate_movie_explanation(user_json, movie, details)
        results.append({
            "movie_id": movie.get("id"),
            "title": movie.get("title"),
            "score": round(float(score), 4),
            "explanation": explanation,
            "details": details,
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
            movies = data.get("movies", [])
            out = recommend_movies(user, movies)
            # Print compact JSON for the Node caller
            print(json.dumps(out, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)
            raise
    else:
        # Demo
        user = {
            "id": "u1",
            "preferred_genres": ["action", "comedy", "drama"],
            "preferred_rating": 7.5,
            "preferred_year": 2010,
            "favorite_actors": ["Leonardo DiCaprio", "Tom Hanks"],
            "preferred_themes": ["adventure", "friendship", "heroism"]
        }

        movies = [
            {
                "id": "m1",
                "title": "Inception",
                "plot": "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
                "genres": ["action", "sci-fi", "thriller"],
                "rating": 8.8,
                "year": 2010,
                "cast": ["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy"]
            },
            {
                "id": "m2", 
                "title": "The Dark Knight",
                "plot": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
                "genres": ["action", "crime", "drama"],
                "rating": 9.0,
                "year": 2008,
                "cast": ["Christian Bale", "Heath Ledger", "Aaron Eckhart"]
            },
            {
                "id": "m3",
                "title": "Forrest Gump",
                "plot": "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.",
                "genres": ["drama", "romance"],
                "rating": 8.8,
                "year": 1994,
                "cast": ["Tom Hanks", "Robin Wright", "Gary Sinise"]
            }
        ]

        out = recommend_movies(user, movies)
        print(json.dumps(out, ensure_ascii=False, indent=2))
