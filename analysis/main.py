from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os

from app.services.clustering import run_clustering, similar_deputies

app = FastAPI(
    title="Bancada Evangélica — Analysis API",
    description="Análise de padrões de votação de parlamentares brasileiros via clustering.",
    version="1.0.0",
)

allowed_origins = os.getenv("FRONTEND_URL", "http://localhost:8080").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
