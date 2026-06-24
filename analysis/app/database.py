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
    Retorna uma matriz (deputado × pauta) com os valores de applied_score.
    Linhas = politician_id, Colunas = key_agenda_id, Valores = applied_score (NaN se ausente).
    """
    sql = """
        SELECT v.politician_id, v.key_agenda_id, v.applied_score
        FROM votes v
        INNER JOIN politicians p ON p.id = v.politician_id AND p.is_active = true
    """
    with get_connection() as conn:
        df = pd.read_sql(sql, conn)

    matrix = df.pivot_table(
        index="politician_id",
        columns="key_agenda_id",
        values="applied_score",
        aggfunc="mean",
    )
    # Preencher ausências com 0 (parlamentar não votou = neutro)
    return matrix.fillna(0)


def load_politicians_info() -> pd.DataFrame:
    sql = """
        SELECT id, name, current_party, current_state, current_house
        FROM politicians
        WHERE is_active = true
    """
    with get_connection() as conn:
        return pd.read_sql(sql, conn)
