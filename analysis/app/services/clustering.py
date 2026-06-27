import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from app.database import load_voting_matrix, load_politicians_info


def _optimal_k(X: np.ndarray, k_min: int = 2, k_max: int = 10) -> int:
    """Escolhe k pelo maior silhouette score."""
    best_k, best_score = k_min, -1.0
    for k in range(k_min, min(k_max + 1, len(X))):
        labels = KMeans(n_clusters=k, random_state=42, n_init="auto").fit_predict(X)
        score = silhouette_score(X, labels)
        if score > best_score:
            best_k, best_score = k, score
    return best_k


def run_clustering(k: int | None = None) -> dict:
    """
    Agrupa deputados por padrão de votação.

    Retorna dict com:
      - clusters: lista de grupos, cada um com id, label, membros e centroide
      - pca_variance: variância explicada pelas 2 primeiras componentes (para o frontend)
      - silhouette: qualidade do agrupamento (0–1)
      - k_used: número de clusters efetivamente usado
    """
    matrix = load_voting_matrix()
    info = load_politicians_info().set_index("id")

    if matrix.empty or len(matrix) < 4:
        return {"error": "Dados insuficientes para clustering (mínimo 4 deputados com votos)"}

    X = StandardScaler().fit_transform(matrix.values)

    # Redução dimensional: preserva 95% da variância antes do KMeans
    n_components = min(X.shape[1], X.shape[0] - 1, 50)
    pca_full = PCA(n_components=n_components, random_state=42)
    X_pca = pca_full.fit_transform(X)

    k_used = k if k is not None else _optimal_k(X_pca)
    k_used = max(2, min(k_used, len(matrix) - 1))

    model = KMeans(n_clusters=k_used, random_state=42, n_init="auto")
    labels = model.fit_predict(X_pca)

    sil = float(silhouette_score(X_pca, labels))

    # 2 componentes para visualização no frontend
    pca_2d = PCA(n_components=2, random_state=42).fit_transform(X_pca)

    politician_ids = matrix.index.tolist()
    clusters = []
    for cluster_id in range(k_used):
        mask = labels == cluster_id
        members = []
        for idx, pol_id in enumerate(politician_ids):
            if not mask[idx]:
                continue
            pol = info.loc[pol_id] if pol_id in info.index else None
            members.append({
                "id": int(pol_id),
                "name": str(pol["name"]) if pol is not None else f"#{pol_id}",
                "party": str(pol["current_party"]) if pol is not None else "",
                "state": str(pol["current_state"]) if pol is not None else "",
                "house": str(pol["current_house"]) if pol is not None else "",
                "x": float(pca_2d[idx, 0]),
                "y": float(pca_2d[idx, 1]),
            })

        party_counts: dict[str, int] = {}
        for m in members:
            p = m["party"] or "?"
            party_counts[p] = party_counts.get(p, 0) + 1
        dominant_party = max(party_counts, key=lambda k: party_counts[k]) if party_counts else "?"
        dominant_pct = round(100 * party_counts.get(dominant_party, 0) / max(len(members), 1))

        centroid_scores = model.cluster_centers_[cluster_id].tolist()
        clusters.append({
            "id": cluster_id,
            "label": f"Grupo {cluster_id + 1}",
            "dominant_party": dominant_party,
            "dominant_party_pct": dominant_pct,
            "size": int(mask.sum()),
            "members": members,
            "centroid": centroid_scores[:5],
            "party_breakdown": dict(sorted(party_counts.items(), key=lambda x: x[1], reverse=True)[:8]),
        })

    # Ordenar por tamanho decrescente
    clusters.sort(key=lambda c: c["size"], reverse=True)
    for rank, c in enumerate(clusters):
        c["label"] = f"Grupo {rank + 1} — {c['dominant_party']} ({c['size']} membros)"

    return {
        "clusters": clusters,
        "k_used": k_used,
        "silhouette": round(sil, 4),
        "pca_variance_2d": float(PCA(n_components=2, random_state=42)
                                 .fit(X_pca).explained_variance_ratio_.sum()),
        "total_politicians": len(politician_ids),
    }


def similar_deputies(politician_id: int, n: int = 10) -> dict:
    """Retorna os n deputados com padrão de votação mais próximo."""
    matrix = load_voting_matrix()
    info = load_politicians_info().set_index("id")

    if politician_id not in matrix.index:
        return {"error": f"Parlamentar {politician_id} sem votos registrados"}

    X = StandardScaler().fit_transform(matrix.values)
    politician_ids = matrix.index.tolist()
    target_idx = politician_ids.index(politician_id)
    target_vec = X[target_idx]

    # Distância euclidiana para todos os outros
    distances = np.linalg.norm(X - target_vec, axis=1)
    distances[target_idx] = np.inf  # Excluir o próprio

    top_indices = np.argsort(distances)[:n]
    similar = []
    for idx in top_indices:
        pol_id = politician_ids[idx]
        pol = info.loc[pol_id] if pol_id in info.index else None
        similar.append({
            "id": int(pol_id),
            "name": str(pol["name"]) if pol is not None else f"#{pol_id}",
            "party": str(pol["current_party"]) if pol is not None else "",
            "state": str(pol["current_state"]) if pol is not None else "",
            "distance": round(float(distances[idx]), 4),
        })

    return {"politician_id": politician_id, "similar": similar}
