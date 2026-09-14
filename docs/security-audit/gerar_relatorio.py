#!/usr/bin/env python3
"""
Gerador do Relatório de Auditoria de Segurança — A Bancada Evangélica
(React/Vite + API NestJS/Prisma/Postgres + serviço Python FastAPI de
clustering + cron sync-worker).

Rodar com o venv local (não instala nada globalmente):
    ./.venv/bin/python gerar_relatorio.py

Regenerar depois de nova auditoria: só editar FINDINGS/STRENGTHS/
RECOMMENDATIONS/ISSUES abaixo e rodar de novo — sobrescreve o PDF no
mesmo caminho.
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, Image, PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas as pdfcanvas

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(HERE, "relatorio-auditoria-seguranca.pdf")


def esc(text: str) -> str:
    """Escapa &, < e > pra texto dinâmico entrar num Paragraph do reportlab
    sem ser interpretado como tag XML."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ---------------------------------------------------------------- paleta ----
SEV_COLORS = {
    "Crítica": "#B91C1C",
    "Alta": "#EA580C",
    "Média": "#D97706",
    "Baixa": "#2563EB",
    "Informativa": "#64748B",
}
STRONG_COLOR = "#059669"
INK = "#1E2430"
MUTED = "#5B6472"
LINE = "#DDE3EA"
BG_SOFT = "#F4F6F8"

# ---------------------------------------------------------------- dados -----
PROJECT = "A Bancada Evangélica"
SCOPE = (
    "Repositório a-bancada-evangelica: frontend React/Vite (src/pages, "
    "src/components), API NestJS + Prisma/Postgres (src/api, 8 módulos: "
    "politicians, votes, parties, stats, methodology, contact, news, "
    "health), serviço Python FastAPI de clustering/ML (analysis/, "
    "psycopg2 + scikit-learn) e scripts de sincronização/seed que rodam "
    "via cron (sync-worker.ts). Escopo: todas as rotas dos dois backends, "
    "os DTOs de query, o guard de admin (news), o formulário de contato, "
    "as queries SQL brutas do serviço Python, config/env dos três "
    "subprojetos, e a superfície de renderização do frontend."
)
METHOD_NOTE = (
    "Mecanismo de isolamento equivalente a RLS: <b>não há conta de "
    "usuário final</b> — é uma plataforma de transparência com dado "
    "público por design (votos, gastos, scores de parlamentares). A "
    "fronteira de autorização real é o <b>status de curadoria</b> "
    "(NewsMention PENDING/APPROVED/REJECTED) — verificado que a rota "
    "pública só retorna status=APPROVED. \"Permissão no navegador\" "
    "mapeada pro único ponto privilegiado do produto: a área de "
    "curadoria de notícias, protegida por token (não é um flag de UI "
    "sem correspondência — o token em si é a credencial, validada com "
    "timingSafeEqual no backend a cada request, fail-closed sem "
    "ADMIN_TOKEN configurado). IDOR percorrido em toda rota com "
    "parâmetro de ID nos dois backends (politicians/:id, "
    "news/admin/:id, deputies/{id}/similar) — nenhum recurso pertence a "
    "um usuário, e as ações privilegiadas estão atrás do guard. Chaves "
    "expostas checado nos três subprojetos (Node, Python, scripts) + "
    "Docker/env. XSS mapeado pra stack real (React/Vite): "
    "dangerouslySetInnerHTML, markdown; SQL injection checado como o "
    "equivalente de \"input sem tratamento\" no serviço Python (único "
    "lugar do projeto com SQL bruto em vez de ORM parametrizado)."
)

FINDINGS = [
    {
        "id": "AB1",
        "severity": "Informativa",
        "category": "Inputs sem tratamento (equiv. XSS) / housekeeping",
        "file": "src/components/ui/chart.tsx",
        "lines": "77–95",
        "title": "dangerouslySetInnerHTML em componente shadcn não utilizado",
        "desc": (
            "ChartStyle usa dangerouslySetInnerHTML pra gerar um <style> a "
            "partir de config.theme/config.color — o mesmo boilerplate "
            "padrão do shadcn/ui já encontrado em outros projetos deste "
            "autor (instalado via CLI, nunca importado de fato). Busca por "
            "<Chart em todo src/pages e src/components não encontrou "
            "nenhum uso. Sem exploração possível hoje: nenhum dado "
            "dinâmico do produto (scores, votos, notícias) alimenta esse "
            "config em lugar nenhum do código atual."
        ),
        "code": (
            "// src/components/ui/chart.tsx\n"
            "<style\n"
            "  dangerouslySetInnerHTML={{\n"
            "    __html: Object.entries(THEMES).map(([theme, prefix]) => `\n"
            "      ${prefix} [data-chart=${id}] { ... ${itemConfig.color} ... }\n"
            "    `).join('\\n'),\n"
            "  }}\n"
            "/>\n"
            "// nunca importado: grep por \"<Chart\" em src/pages e src/components → 0 resultados"
        ),
        "impact": (
            "Nenhum hoje. Se o componente Chart for adotado no futuro com "
            "config vindo de dado dinâmico (ex.: cor definida por partido "
            "ou por conteúdo vindo da API), o dangerouslySetInnerHTML "
            "atual injetaria isso sem sanitização numa tag <style> sem "
            "revisão adicional — é código morto com um padrão sensível "
            "embutido, não uma vulnerabilidade ativa."
        ),
        "fix": (
            "Remover o componente Chart não utilizado (e o import do "
            "pacote recharts associado, se não usado em outro lugar) — "
            "reduz superfície de código que precisaria ser reauditado se "
            "algum dia for religado por engano."
        ),
    },
]

STRENGTHS = [
    ("Fronteira de curadoria verificada de ponta a ponta",
     "GET /api/news/politicians/:id filtra explicitamente status: 'APPROVED' (news.service.ts) — "
     "menção pendente ou rejeitada nunca aparece na rota pública, mesmo com o id certo."),
    ("Token de admin é credencial real, não flag de UI",
     "AdminTokenGuard compara o header x-admin-token com crypto.timingSafeEqual (constant-time) "
     "contra ADMIN_TOKEN do ambiente, fail-closed (503) se a variável não existir. O frontend "
     "(NewsCuration.tsx) guarda o token em sessionStorage, nunca hardcoded — o \"gate\" da UI é "
     "só uma tela de login pro mesmo segredo que o backend exige de verdade."),
    ("Formulário de contato público falha fechado sem quebrar o resto",
     "ContactService lança ServiceUnavailableException se RESEND_API_KEY não estiver configurada "
     "— nunca finge sucesso silenciosamente (achado real documentado: o formulário antigo era "
     "decorativo e essa regressão foi corrigida)."),
    ("Rate limit real na única rota pública de escrita",
     "@Throttle({ default: { limit: 5, ttl: 900000 } }) em POST /api/contact — 5 envios por 15 "
     "minutos, defesa efetiva contra abuso num endpoint sem auth/captcha por design."),
    ("CORS aberto é seguro dado o modelo de auth escolhido",
     "app.enableCors({ origin: '*' }) é decisão deliberada (API pública de leitura) — não abre "
     "CSRF nas rotas admin porque o token não é cookie/credencial ambiente: um site de terceiro "
     "não tem como fazer o navegador da vítima enviar x-admin-token automaticamente."),
    ("Nenhuma SQL concatenada com input do usuário",
     "A API Node usa só o query builder do Prisma (0 ocorrências de $queryRaw/$executeRaw). O "
     "único SQL bruto do projeto (serviço Python, psycopg2) usa strings estáticas OU, no caso "
     "com f-string (clustering.py:98), os valores interpolados são politician_id vindos do "
     "próprio banco e forçados por int() antes — não há caminho de um valor de request chegar "
     "lá como string."),
    ("Parâmetros numéricos sempre limitados nas duas APIs",
     "FastAPI: k (2–20), n (1–50) validados via Query(ge=..., le=...) — Pydantic rejeita fora do "
     "intervalo antes do handler rodar. NestJS: ParseIntPipe em todo :id de rota."),
    ("Proxy de foto não aceita URL do cliente (sem SSRF)",
     "GET /api/politicians/:id/photo busca a URL só do campo photo_url já salvo no banco "
     "(photoUrlOf) — não existe rota de escrita pública pra esse campo; quem popula é só o "
     "sync-worker a partir da API oficial da Câmara/Senado."),
    ("Validação global de DTO com whitelist",
     "ValidationPipe({ transform: true, whitelist: true }) global no bootstrap — campo não "
     "esperado no body é descartado antes de chegar no service, em toda rota."),
    ("Scripts de sync/seed fora do runtime público",
     "sync-worker.ts e os scripts de scoring/seed rodam via cron, sem porta exposta nem rota de "
     "Traefik (confirmado no hetzner-infra) — não fazem parte da superfície de ataque HTTP."),
]

RECOMMENDATIONS = [
    ("P1", "(opcional, baixo esforço) Remover componente shadcn Chart não utilizado (AB1)",
     "chart.tsx nunca é importado — nenhuma fonte de dado dinâmico do produto o alimenta hoje, "
     "mas remover código morto com dangerouslySetInnerHTML é limpeza de baixo custo."),
]

ISSUES = [
    {
        "title": "[Housekeeping] Remover componente shadcn Chart não utilizado (dangerouslySetInnerHTML morto)",
        "labels": "security, severidade:informativa, housekeeping",
        "body": (
            "**Problema**\n\n"
            "`src/components/ui/chart.tsx:77-95` — `ChartStyle` usa "
            "`dangerouslySetInnerHTML` pra gerar um `<style>` a partir de "
            "`config.theme`/`config.color`. Boilerplate padrão do shadcn/ui, instalado "
            "mas **nunca importado** (`grep \"<Chart\"` em todo `src/pages` e "
            "`src/components` → 0 resultados).\n\n"
            "**Por que vale remover**\n\n"
            "Não é explorável hoje — nenhum dado dinâmico do produto (scores, votos, "
            "notícias, gastos) alimenta `config` em lugar nenhum do código atual. Mas é "
            "código morto com um padrão sensível (`dangerouslySetInnerHTML`) que passaria "
            "despercebido numa reintrodução futura.\n\n"
            "**Evidência**\n\n"
            "```tsx\n"
            "<style\n"
            "  dangerouslySetInnerHTML={{\n"
            "    __html: Object.entries(THEMES).map(([theme, prefix]) => `...`).join('\\n'),\n"
            "  }}\n"
            "/>\n"
            "```\n\n"
            "**Impacto**\n\n"
            "Nenhum hoje. Risco é só de reintrodução futura sem revisão.\n\n"
            "**Sugestão de correção**\n\n"
            "Remover `src/components/ui/chart.tsx` (e o import do pacote `recharts` "
            "associado, se não usado em outro lugar) caso nenhum gráfico esteja "
            "planejado no roadmap próximo.\n\n"
            "**Critérios de aceite**\n\n"
            "- [ ] `chart.tsx` removido ou sua geração de CSS deixa de usar "
            "`dangerouslySetInnerHTML`.\n"
            "- [ ] Build e testes do frontend continuam passando sem ele.\n"
        ),
    },
]

# ---------------------------------------------------------- gráficos --------

def make_donut(path):
    order = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]
    counts = {s: 0 for s in order}
    for f in FINDINGS:
        counts[f["severity"]] += 1
    labels, values, colors_ = [], [], []
    for s in order:
        if counts[s] > 0:
            labels.append(f"{s} ({counts[s]})")
            values.append(counts[s])
            colors_.append(SEV_COLORS[s])

    fig, ax = plt.subplots(figsize=(4.6, 4.0), dpi=200)
    wedges, _ = ax.pie(
        values, colors=colors_, startangle=90, counterclock=False,
        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=2),
    )
    ax.legend(
        wedges, labels, loc="center left", bbox_to_anchor=(1.0, 0.5),
        frameon=False, fontsize=10, labelcolor=INK,
    )
    ax.text(0, 0.06, str(len(FINDINGS)), ha="center", va="center",
            fontsize=26, fontweight="bold", color=INK)
    ax.text(0, -0.18, "achado" if len(FINDINGS) == 1 else "achados",
            ha="center", va="center", fontsize=10, color=MUTED)
    ax.set_title("Achados por severidade", fontsize=12, color=INK, pad=14, loc="left")
    fig.tight_layout()
    fig.savefig(path, transparent=True, bbox_inches="tight")
    plt.close(fig)


def make_bars(path):
    cats = ["Isolamento\n/ tenant", "Permissão\nno navegador", "IDOR",
            "Chaves\nexpostas", "Inputs sem\ntratamento"]
    keymap = {
        "Isolamento\n/ tenant": [],
        "Permissão\nno navegador": [],
        "IDOR": [],
        "Chaves\nexpostas": [],
        "Inputs sem\ntratamento": ["Inputs sem tratamento (equiv. XSS) / housekeeping"],
    }
    counts = []
    bar_colors = []
    sev_order = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]
    for c in cats:
        cat_findings = [f for f in FINDINGS if f["category"] in keymap[c]]
        counts.append(len(cat_findings))
        if not cat_findings:
            bar_colors.append(STRONG_COLOR)
        else:
            worst = min(cat_findings, key=lambda f: sev_order.index(f["severity"]))
            bar_colors.append(SEV_COLORS[worst["severity"]])

    display_counts = [c if c > 0 else 0.06 for c in counts]

    fig, ax = plt.subplots(figsize=(7.4, 4.0), dpi=200)
    bars = ax.bar(cats, display_counts, color=bar_colors, width=0.55, zorder=3)
    for bar, real in zip(bars, counts):
        label = "0 (ok)" if real == 0 else str(real)
        color = STRONG_COLOR if real == 0 else INK
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05,
                 label, ha="center", va="bottom", fontsize=10, color=color, fontweight="bold")
    ax.set_ylim(0, max(counts + [1]) + 0.8)
    ax.set_yticks(range(0, max(counts + [1]) + 2))
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.spines["bottom"].set_color(LINE)
    ax.tick_params(axis="x", labelsize=9, colors=INK)
    ax.tick_params(axis="y", labelsize=9, colors=MUTED)
    ax.yaxis.grid(True, color=LINE, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)
    ax.set_title("Achados por categoria (verde = nenhum achado, categoria coberta)",
                  fontsize=11, color=INK, pad=12, loc="left")
    fig.tight_layout()
    fig.savefig(path, transparent=True, bbox_inches="tight")
    plt.close(fig)


donut_path = os.path.join(HERE, "_chart_donut.png")
bars_path = os.path.join(HERE, "_chart_bars.png")
make_donut(donut_path)
make_bars(bars_path)

# --------------------------------------------------------------- estilos ----
styles = {
    "cover_title": ParagraphStyle("cover_title", fontName="Helvetica-Bold", fontSize=26,
                                    leading=31, textColor=colors.HexColor(INK)),
    "cover_sub": ParagraphStyle("cover_sub", fontName="Helvetica", fontSize=13,
                                  leading=18, textColor=colors.HexColor(MUTED)),
    "cover_meta_label": ParagraphStyle("cover_meta_label", fontName="Helvetica-Bold", fontSize=9,
                                         leading=12, textColor=colors.HexColor(MUTED),
                                         spaceAfter=1),
    "cover_meta_val": ParagraphStyle("cover_meta_val", fontName="Helvetica", fontSize=10.5,
                                       leading=14, textColor=colors.HexColor(INK),
                                       spaceAfter=10),
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=17, leading=21,
                           textColor=colors.HexColor(INK), spaceBefore=4, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=16,
                           textColor=colors.HexColor(INK), spaceBefore=12, spaceAfter=6),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.6, leading=13.6,
                             textColor=colors.HexColor(INK), spaceAfter=6),
    "body_muted": ParagraphStyle("body_muted", fontName="Helvetica", fontSize=9, leading=12.6,
                                   textColor=colors.HexColor(MUTED), spaceAfter=6),
    "small": ParagraphStyle("small", fontName="Helvetica", fontSize=8.3, leading=11.5,
                              textColor=colors.HexColor(MUTED)),
    "code": ParagraphStyle("code", fontName="Courier", fontSize=7.6, leading=10.6,
                             textColor=colors.HexColor(INK), backColor=colors.HexColor(BG_SOFT),
                             borderPadding=(6, 8, 6, 8), spaceAfter=6),
    "issue_body": ParagraphStyle("issue_body", fontName="Courier", fontSize=7.4, leading=10.2,
                                   textColor=colors.HexColor(INK)),
}


def sev_chip(sev):
    color = SEV_COLORS.get(sev, MUTED)
    t = Table([[Paragraph(f'<font color="white"><b>{sev}</b></font>',
                           ParagraphStyle("chip", fontName="Helvetica-Bold", fontSize=7.6,
                                          textColor=colors.white, alignment=TA_CENTER))]],
               colWidths=[2.35 * cm], rowHeights=[0.48 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(color)),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [5, 5, 5, 5]),
    ]))
    return t


# --------------------------------------------------------------- doc --------
doc = BaseDocTemplate(OUT_PDF, pagesize=A4,
                       leftMargin=2 * cm, rightMargin=2 * cm,
                       topMargin=2.6 * cm, bottomMargin=2.2 * cm,
                       title=f"Relatório de Auditoria de Segurança — {PROJECT}")

REPORT_NAME = f"Auditoria de Segurança — {PROJECT}"


def header_footer(canv: pdfcanvas.Canvas, d):
    canv.saveState()
    page_num = canv.getPageNumber()
    if page_num > 1:
        canv.setStrokeColor(colors.HexColor(LINE))
        canv.setLineWidth(0.6)
        canv.line(2 * cm, A4[1] - 1.6 * cm, A4[0] - 2 * cm, A4[1] - 1.6 * cm)
        canv.setFont("Helvetica", 8.3)
        canv.setFillColor(colors.HexColor(MUTED))
        canv.drawString(2 * cm, A4[1] - 1.35 * cm, REPORT_NAME)
        canv.drawRightString(A4[0] - 2 * cm, A4[1] - 1.35 * cm, "2026-09-08")
    canv.setStrokeColor(colors.HexColor(LINE))
    canv.setLineWidth(0.6)
    canv.line(2 * cm, 1.7 * cm, A4[0] - 2 * cm, 1.7 * cm)
    canv.setFont("Helvetica", 8.3)
    canv.setFillColor(colors.HexColor(MUTED))
    canv.drawString(2 * cm, 1.35 * cm, REPORT_NAME)
    canv.drawRightString(A4[0] - 2 * cm, 1.35 * cm, f"Página {page_num}")
    canv.restoreState()


frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=header_footer)])

story = []

# ---- Capa -----------------------------------------------------------------
story.append(Spacer(1, 2.2 * cm))
story.append(Paragraph(f"Relatório de Auditoria de<br/>Segurança — {PROJECT}", styles["cover_title"]))
story.append(Spacer(1, 0.5 * cm))
story.append(Paragraph(
    "Isolamento de tenant, permissões, IDOR, segredos e inputs sem tratamento",
    styles["cover_sub"]))
story.append(Spacer(1, 1.6 * cm))

meta_rows = [
    ("Data", "2026-09-08"),
    ("Repositório", "github.com/rilsonjoas/a-bancada-evangelica"),
    ("Escopo auditado", SCOPE),
    ("Nota metodológica", METHOD_NOTE),
]
for label, val in meta_rows:
    story.append(Paragraph(label.upper(), styles["cover_meta_label"]))
    story.append(Paragraph(val, styles["cover_meta_val"]))

story.append(Spacer(1, 1.0 * cm))
sev_counts = {}
for f in FINDINGS:
    sev_counts[f["severity"]] = sev_counts.get(f["severity"], 0) + 1
summary_line = "  ·  ".join(f"{v} {k}" for k, v in sev_counts.items())
story.append(Table([[Paragraph(
    f'<b>{len(FINDINGS)} achado</b>  —  {summary_line}  '
    f'—  <font color="{STRONG_COLOR}"><b>nenhuma vulnerabilidade explorável encontrada</b></font>',
    styles["body"])]], colWidths=[doc.width]))

story.append(PageBreak())

# ---- Resumo executivo -------------------------------------------------
story.append(Paragraph("Resumo executivo", styles["h1"]))
story.append(Paragraph(
    f'<font color="{STRONG_COLOR}"><b>Auditoria limpa.</b></font> '
    f"Apesar de ser o projeto mais complexo já auditado nesta série (2 "
    f"backends — NestJS/Prisma e Python/FastAPI — mais 1 frontend e um "
    f"cron de sincronização), as 5 categorias verificadas em código real "
    f"não encontraram vulnerabilidade explorável. O único item "
    f"registrado (AB1) é <b>informativo/housekeeping</b>: o mesmo "
    f"componente shadcn morto encontrado em outros projetos deste autor. "
    f"Pontos que mereciam atenção especial dado a complexidade — SQL "
    f"bruto no serviço Python, CORS totalmente aberto, token de admin "
    f"guardado no navegador — foram todos verificados individualmente e "
    f"vieram corretos.",
    styles["body"]))

story.append(Spacer(1, 0.3 * cm))
chart_table = Table([
    [Image(donut_path, width=8.6 * cm, height=7.4 * cm),
     Image(bars_path, width=8.6 * cm, height=7.4 * cm)]
], colWidths=[8.6 * cm, 8.6 * cm])
chart_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(chart_table)

story.append(Spacer(1, 0.4 * cm))
story.append(Paragraph("Pontos fortes (verificados, com evidência)", styles["h2"]))
for title, desc in STRENGTHS:
    story.append(Paragraph(f'<font color="{STRONG_COLOR}"><b>✓ {esc(title)}</b></font> — {esc(desc)}',
                            styles["body"]))

story.append(Paragraph("Pontos fracos", styles["h2"]))
story.append(Paragraph(
    "Nenhum risco de segurança identificado. O item AB1 é hardening "
    "preventivo de código morto — vale fazer por higiene de "
    "repositório, não porque exista exploração hoje.", styles["body"]))

story.append(PageBreak())

# ---- Tabela de achados ------------------------------------------------
story.append(Paragraph("Achados detalhados", styles["h1"]))

for f in FINDINGS:
    block = []
    head = Table([
        [sev_chip(f["severity"]),
         Paragraph(f'<b>{esc(f["id"])} · {esc(f["category"])}</b>', styles["body"]),
         Paragraph(f'<font face="Courier" size="8">{esc(f["file"])}:{esc(f["lines"])}</font>', styles["small"])]
    ], colWidths=[2.6 * cm, 6.0 * cm, doc.width - 8.6 * cm])
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    block.append(head)
    block.append(Paragraph(f'<b>{esc(f["title"])}</b>', styles["body"]))
    block.append(Paragraph(esc(f["desc"]), styles["body"]))
    code_escaped = esc(f["code"]).replace("\n", "<br/>")
    block.append(Paragraph(code_escaped, styles["code"]))
    block.append(Paragraph(f'<b>Impacto:</b> {esc(f["impact"])}', styles["body_muted"]))
    block.append(Paragraph(f'<b>Correção sugerida:</b> {esc(f["fix"])}', styles["body_muted"]))
    block.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor(LINE),
                              spaceBefore=8, spaceAfter=12))
    story.append(KeepTogether(block))

story.append(Spacer(1, 0.4 * cm))
story.append(Paragraph(
    "Categorias sem achado (verificadas explicitamente)", styles["h2"]))
no_finding_rows = [
    ("1 — Isolamento de tenant / RLS",
     "Sem conta de usuário final — dado é público por design. Equivalente real "
     "(status APPROVED de NewsMention) verificado na rota pública de notícias."),
    ("2 — Permissão definida no navegador",
     "Único ponto privilegiado (curadoria) usa um token real validado no "
     "backend com timingSafeEqual — não é um flag de UI sem correspondência."),
    ("3 — IDOR",
     "Toda rota com :id revisada nos dois backends (politicians, news, "
     "deputies/similar). Nenhum recurso pertence a um usuário; ações "
     "privilegiadas estão atrás do AdminTokenGuard."),
    ("4 — Chaves expostas",
     "Nenhum hardcode nos três subprojetos. ADMIN_TOKEN e RESEND_API_KEY "
     "falham fechado (503) sem valor configurado; APIs governamentais "
     "(Câmara/Senado/TSE) são públicas, sem chave."),
]
for title, desc in no_finding_rows:
    story.append(Paragraph(f'<font color="{STRONG_COLOR}"><b>✓ {esc(title)}</b></font> — {esc(desc)}',
                            styles["body"]))

story.append(PageBreak())

# ---- Recomendações ------------------------------------------------------
story.append(Paragraph("Recomendações priorizadas", styles["h1"]))
rec_rows = [[Paragraph("<b>Prior.</b>", styles["small"]),
             Paragraph("<b>Ação</b>", styles["small"]),
             Paragraph("<b>Por quê</b>", styles["small"])]]
for prio, action, why in RECOMMENDATIONS:
    rec_rows.append([Paragraph(f"<b>{esc(prio)}</b>", styles["body"]),
                      Paragraph(esc(action), styles["body"]),
                      Paragraph(esc(why), styles["body_muted"])])
rec_table = Table(rec_rows, colWidths=[1.6 * cm, 6.4 * cm, doc.width - 8.0 * cm])
rec_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(BG_SOFT)),
    ("LINEBELOW", (0, 0), (-1, 0), 0.8, colors.HexColor(LINE)),
    ("LINEBELOW", (0, 1), (-1, -1), 0.4, colors.HexColor(LINE)),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(rec_table)
story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph(
    "Sem P2/P3 — não há mais nenhuma ação de segurança pendente identificada "
    "nesta auditoria.", styles["body_muted"]))

story.append(PageBreak())

# ---- Issues pro GitHub --------------------------------------------------
story.append(Paragraph("Issues para o GitHub", styles["h1"]))
story.append(Paragraph(
    "Texto completo em Markdown, pronto para copiar e colar. Só 1 issue "
    "aqui, de housekeeping — não há achado de segurança acionável que "
    "justifique uma issue de correção urgente.",
    styles["body_muted"]))

for i, issue in enumerate(ISSUES, start=1):
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(f"--- ISSUE {i} ---", styles["small"]))
    story.append(Paragraph(f'<b>{esc(issue["title"])}</b>', styles["h2"]))
    story.append(Paragraph(f'<b>Labels:</b> {esc(issue["labels"])}', styles["body_muted"]))
    body_escaped = esc(issue["body"]).replace("\n", "<br/>")
    story.append(Paragraph(body_escaped, styles["issue_body"]))
    story.append(Paragraph(f"--- FIM ISSUE {i} ---", styles["small"]))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor(LINE),
                              spaceBefore=10, spaceAfter=10))

doc.build(story)
print(f"PDF gerado: {OUT_PDF}")
