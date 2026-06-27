import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL não está definida")
    return psycopg2.connect(url)


def load_voting_matrix() -> pd.DataFrame:
    """
    Retorna a matriz de features para clustering.
    Primário: scores dos 5 critérios de politician_scores (sempre disponível).
    Secundário: pivot de votes × key_agendas (quando houver votos sincronizados).
    """
    # Tentar votes primeiro (dados mais granulares)
    votes_sql = """
        SELECT v.politician_id, v.key_agenda_id, v.applied_score
        FROM votes v
        INNER JOIN politicians p ON p.id = v.politician_id AND p.is_active = true
    """
    with get_connection() as conn:
        df_votes = pd.read_sql(votes_sql, conn)

    if not df_votes.empty:
        matrix = df_votes.pivot_table(
            index="politician_id",
            columns="key_agenda_id",
            values="applied_score",
            aggfunc="mean",
        )
        return matrix.fillna(0)

    # Fallback: usar os 5 critérios de politician_scores como feature matrix
    scores_sql = """
        SELECT ps.politician_id AS id,
               ps.life_protection,
               ps.family_values,
               ps.moral_integrity,
               ps.social_responsibility,
               ps.religious_freedom
        FROM politician_scores ps
        INNER JOIN politicians p ON p.id = ps.politician_id AND p.is_active = true
    """
    with get_connection() as conn:
        df_scores = pd.read_sql(scores_sql, conn)

    if df_scores.empty:
        return pd.DataFrame()

    return df_scores.set_index("id")


def load_politicians_info() -> pd.DataFrame:
    sql = """
        SELECT id, name, current_party, current_state, current_house
        FROM politicians
        WHERE is_active = true
    """
    with get_connection() as conn:
        return pd.read_sql(sql, conn)


def load_party_scores() -> pd.DataFrame:
    """
    Alinhamento médio por partido, calculado a partir das pontuações individuais.
    Requer dados na tabela politician_scores (populada após sync + scoring).
    """
    sql = """
        SELECT
            p.current_party                         AS party,
            p.current_house                         AS house,
            COUNT(*)                                AS politician_count,
            ROUND(AVG(ps.overall_score)::numeric, 1)           AS avg_score,
            ROUND(AVG(ps.life_protection)::numeric, 1)         AS avg_life,
            ROUND(AVG(ps.family_values)::numeric, 1)           AS avg_family,
            ROUND(AVG(ps.moral_integrity)::numeric, 1)         AS avg_integrity,
            ROUND(AVG(ps.social_responsibility)::numeric, 1)   AS avg_social,
            ROUND(AVG(ps.religious_freedom)::numeric, 1)       AS avg_religious
        FROM politicians p
        INNER JOIN politician_scores ps ON ps.politician_id = p.id
        WHERE p.is_active = true
          AND p.current_party IS NOT NULL
          AND p.current_party != ''
        GROUP BY p.current_party, p.current_house
        HAVING COUNT(*) >= 3
        ORDER BY AVG(ps.overall_score) DESC NULLS LAST
    """
    with get_connection() as conn:
        return pd.read_sql(sql, conn)
