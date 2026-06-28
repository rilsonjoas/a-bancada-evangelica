from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os

from app.services.clustering import run_clustering, similar_deputies
from app.database import load_party_scores

app = FastAPI(
    title="Bancada Evangélica — Analysis API",
    description="Análise de padrões de votação de parlamentares brasileiros via clustering.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/clusters")
def clusters(
    k: int | None = Query(
        default=None,
        ge=2,
        le=20,
        description="Número de clusters. Se omitido, o valor ótimo é calculado automaticamente.",
    )
):
    """
    Agrupa parlamentares por similaridade de padrão de votação usando KMeans.

    O algoritmo:
    1. Constrói uma matriz (parlamentar × pauta) com os applied_scores
    2. Normaliza com StandardScaler
    3. Reduz dimensionalidade com PCA (95% de variância explicada)
    4. Aplica KMeans; se k não informado, escolhe pelo maior silhouette score
    5. Retorna clusters com coordenadas 2D para visualização
    """
    result = run_clustering(k=k)
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result


@app.get("/api/parties/alignment")
def party_alignment():
    """
    Alinhamento médio por partido com os 5 critérios evangélicos.
    Requer tabela politician_scores populada.
    """
    try:
        df = load_party_scores()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Erro ao carregar dados: {e}")

    if df.empty:
        return {"parties": [], "total_parties": 0, "note": "Pontuações ainda não calculadas"}

    def level(score: float) -> str:
        if score >= 70:
            return "alta"
        if score >= 50:
            return "moderada"
        return "baixa"

    parties = []
    for _, row in df.iterrows():
        avg = float(row["avg_score"]) if row["avg_score"] is not None else None
        parties.append({
            "party": row["party"],
            "house": row["house"],
            "politician_count": int(row["politician_count"]),
            "avg_score": avg,
            "alignment_level": level(avg) if avg is not None else "sem_dados",
            "criteria": {
                "life_protection":       float(row["avg_life"])      if row["avg_life"]      is not None else None,
                "family_values":         float(row["avg_family"])    if row["avg_family"]    is not None else None,
                "moral_integrity":       float(row["avg_integrity"]) if row["avg_integrity"] is not None else None,
                "social_responsibility": float(row["avg_social"])    if row["avg_social"]    is not None else None,
                "religious_freedom":     float(row["avg_religious"]) if row["avg_religious"] is not None else None,
            },
        })

    return {"parties": parties, "total_parties": len(parties)}


@app.get("/api/deputies/{politician_id}/similar")
def similar(
    politician_id: int,
    n: int = Query(default=10, ge=1, le=50),
):
    """
    Retorna os n parlamentares com padrão de votação mais próximo ao informado,
    ordenados por distância euclidiana no espaço de votações normalizado.
    """
    result = similar_deputies(politician_id=politician_id, n=n)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
