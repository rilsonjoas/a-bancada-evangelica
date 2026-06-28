import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

    # Prefer DIRECT_URL (no pgbouncer) — psycopg2 doesn't support pgbouncer mode
    url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DIRECT_URL ou DATABASE_URL não estão definidas")

    # Strip surrounding quotes that may come from .env files
    url = url.strip().strip('"').strip("'")

    # Remove Prisma-only query params, keep sslmode
    parsed = urlparse(url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    params.pop("pgbouncer", None)
    params.pop("connect_timeout", None)
    if "sslmode" not in params:
        params["sslmode"] = ["require"]
    clean_query = urlencode({k: v[0] for k, v in params.items()})
    clean_url = urlunparse(parsed._replace(query=clean_query))

    return psycopg2.connect(clean_url)


def _query_df(sql: str, params=None) -> pd.DataFrame:
    """Executa SQL via psycopg2 e retorna DataFrame sem usar pd.read_sql (evita warning SQLAlchemy)."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
    return pd.DataFrame(rows, columns=cols)


def load_voting_matrix() -> pd.DataFrame:
    """
    Retorna a matriz de features para clustering.
    Primário: scores dos 5 critérios de politician_scores (sempre disponível).
    Secundário: pivot de votes × key_agendas (quando houver votos sincronizados).
    """
    votes_sql = """
        SELECT v.politician_id, v.key_agenda_id, v.applied_score
        FROM votes v
        INNER JOIN politicians p ON p.id = v.politician_id AND p.is_active = true
    """
    df_votes = _query_df(votes_sql)

    if not df_votes.empty:
        matrix = df_votes.pivot_table(
            index="politician_id",
            columns="key_agenda_id",
            values="applied_score",
            aggfunc="mean",
        )
        return matrix.fillna(0)

    # Fallback: 5 critérios como feature matrix quando não há votos individuais
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
    df_scores = _query_df(scores_sql)
    if df_scores.empty:
        return pd.DataFrame()
    return df_scores.set_index("id")


def load_politicians_info() -> pd.DataFrame:
    sql = """
        SELECT id, name, current_party, current_state, current_house
        FROM politicians
        WHERE is_active = true
    """
    return _query_df(sql)


def load_party_scores() -> pd.DataFrame:
    """
    Alinhamento médio por partido, calculado a partir das pontuações individuais.
    Requer dados na tabela politician_scores (populada após sync + scoring).
    """
    sql = """
        SELECT
            p.current_party                                          AS party,
            p.current_house                                         AS house,
            COUNT(*)                                                AS politician_count,
            ROUND(AVG(ps.overall_score)::numeric, 1)               AS avg_score,
            ROUND(AVG(ps.life_protection)::numeric, 1)             AS avg_life,
            ROUND(AVG(ps.family_values)::numeric, 1)               AS avg_family,
            ROUND(AVG(ps.moral_integrity)::numeric, 1)             AS avg_integrity,
            ROUND(AVG(ps.social_responsibility)::numeric, 1)       AS avg_social,
            ROUND(AVG(ps.religious_freedom)::numeric, 1)           AS avg_religious
        FROM politicians p
        INNER JOIN politician_scores ps ON ps.politician_id = p.id
        WHERE p.is_active = true
          AND p.current_party IS NOT NULL
          AND p.current_party != ''
        GROUP BY p.current_party, p.current_house
        HAVING COUNT(*) >= 3
        ORDER BY AVG(ps.overall_score) DESC NULLS LAST
    """
    return _query_df(sql)
