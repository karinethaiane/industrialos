from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule
from openpyxl.chart import BarChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.worksheet.properties import PageSetupProperties
from openpyxl.utils import get_column_letter
import math
import sys

"""
Formata o relatorio de alocacao de horas (layout corporativo).

Uso:
  python formatar_relatorio.py relatorio_bruto.xlsx relatorio_formatado.xlsx

Entrada esperada na 1a aba:
  Gerencia | Colaborador | Funcao | Planejado (h) | Alocado (h) | % Alocado | Situacao | S1..Sn | Nota
"""

SRC, OUT = sys.argv[1], sys.argv[2]

NAVY = '1F3864'
BLUE = '2F5597'
GRAY = '595959'
LINE = 'D9DEE7'
ZEBRA = 'F4F6FA'
CARD = 'EEF2F8'
F = 'Arial'

thin = Side(style='thin', color=LINE)
box = Border(left=thin, right=thin, top=thin, bottom=thin)


def norm(v):
    return str(v or '').strip().lower()


def find_col(headers, name):
    for i, h in enumerate(headers, start=1):
        if norm(h) == norm(name):
            return i
    return None


wb = load_workbook(SRC)
ws = wb.worksheets[0]
last = ws.max_row
last_col = ws.max_column
SN = "'" + ws.title + "'"
REF = ws.title.replace('Alocacao', '').replace('Alocação', '').strip()

headers = [ws.cell(1, c).value for c in range(1, last_col + 1)]

c_ger = find_col(headers, 'Gerência') or find_col(headers, 'Gerencia') or 1
c_nome = find_col(headers, 'Colaborador') or 2
c_func = find_col(headers, 'Função') or find_col(headers, 'Funcao') or 3
c_plan = find_col(headers, 'Planejado (h)') or 4
c_aloc = find_col(headers, 'Alocado (h)') or 5
c_pct = find_col(headers, '% Alocado') or 6
c_sit = find_col(headers, 'Situação') or find_col(headers, 'Situacao') or 7
c_nota = find_col(headers, 'Nota') or last_col

week_cols = [c for c in range(c_sit + 1, c_nota) if norm(ws.cell(1, c).value).startswith('s')]
num_cols = [c_plan, c_aloc, *week_cols]

# ---------- Aba de dados ----------
ws.sheet_view.showGridLines = False
ws.sheet_properties.tabColor = BLUE

for c in range(1, last_col + 1):
    L = get_column_letter(c)
    if c == c_ger:
        ws.column_dimensions[L].width = 17
    elif c == c_nome:
        ws.column_dimensions[L].width = 42
    elif c == c_func:
        ws.column_dimensions[L].width = 34
    elif c == c_sit:
        ws.column_dimensions[L].width = 24
    elif c == c_nota:
        ws.column_dimensions[L].width = 64
    elif c == c_pct:
        ws.column_dimensions[L].width = 12
    else:
        ws.column_dimensions[L].width = 13

hdr_fill = PatternFill('solid', fgColor=NAVY)
for c in ws[1]:
    c.font = Font(name=F, size=10, bold=True, color='FFFFFF')
    c.fill = hdr_fill
    eh_centro = c.column in [*num_cols, c_pct, c_sit]
    c.alignment = Alignment(horizontal='center' if eh_centro else 'left', vertical='center', wrap_text=True)
    c.border = Border(bottom=Side(style='medium', color=BLUE))
ws.row_dimensions[1].height = 34

numfmt = '#,##0.0;-#,##0.0;"–"'
for r in range(2, last + 1):
    fill = PatternFill('solid', fgColor=ZEBRA) if r % 2 == 1 else None
    note = ws.cell(r, c_nota).value or ''
    lines = max(1, math.ceil(len(str(note)) / 68))
    ws.row_dimensions[r].height = max(20, 12.5 * lines + 7)

    for col in range(1, last_col + 1):
        cell = ws.cell(r, col)
        cell.font = Font(name=F, size=9.5, color='262626')
        cell.border = box
        if fill:
            cell.fill = fill

        if col in (c_ger, c_nome, c_func):
            cell.alignment = Alignment(horizontal='left', vertical='center', indent=1 if col == c_nome else 0)
        elif col in num_cols:
            cell.number_format = numfmt
            cell.alignment = Alignment(horizontal='right', vertical='center', indent=1)
        elif col == c_pct:
            cell.number_format = '0.0%'
            cell.alignment = Alignment(horizontal='right', vertical='center', indent=1)
        elif col == c_sit:
            cell.alignment = Alignment(horizontal='center', vertical='center')
        elif col == c_nota:
            cell.font = Font(name=F, size=9, color=GRAY)
            cell.alignment = Alignment(horizontal='left', vertical='center', wrap_text=True)
        else:
            cell.alignment = Alignment(horizontal='left', vertical='center')

    ws.cell(r, c_nome).font = Font(name=F, size=9.5, bold=True, color='262626')

rng = f'{get_column_letter(c_sit)}2:{get_column_letter(c_sit)}{last}'
styles = {
    'Sem alocação': ('FBE0DE', '9C2B22'),
    'Abaixo do ritmo semanal': ('FFF0C9', '8A5A00'),
    'Abaixo do planejado': ('FFF0C9', '8A5A00'),
    'Estável': ('E5F6EE', '0F5132'),
    'Dentro do planejado': ('E5F6EE', '0F5132'),
    'Acima do ritmo semanal': ('DCE8F8', '1F4E8C'),
    'Acima do planejado': ('DCE8F8', '1F4E8C'),
    'Sem planejamento': ('E8E4F3', '4B3A8C'),
    'Afastado': ('E0F2F1', '0F766E'),
    'Desligado': ('E4E7EB', '4B5563'),
}
for txt, (bg, fg) in styles.items():
    ws.conditional_formatting.add(
        rng,
        CellIsRule(
            operator='equal',
            formula=[f'"{txt}"'],
            fill=PatternFill('solid', bgColor=bg, fgColor=bg),
            font=Font(name=F, bold=True, color=fg),
        ),
    )

# Linha de total (respeita filtros)
t = last + 1
ws.cell(t, 1, 'TOTAL (linhas visíveis)')
for col in num_cols:
    L = get_column_letter(col)
    ws.cell(t, col, f'=SUBTOTAL(109,{L}2:{L}{last})')

for col in range(1, last_col + 1):
    c = ws.cell(t, col)
    c.fill = PatternFill('solid', fgColor=CARD)
    c.font = Font(name=F, size=10, bold=True, color=NAVY)
    c.border = Border(top=Side(style='medium', color=NAVY), bottom=thin)
    c.alignment = Alignment(
        horizontal='right' if col in num_cols else 'left',
        vertical='center',
        indent=1 if col != 1 else 0,
    )
    if col in num_cols:
        c.number_format = '#,##0.0'
ws.row_dimensions[t].height = 24

last_col_letter = get_column_letter(last_col)
ws.freeze_panes = 'C2'
ws.auto_filter.ref = f'A1:{last_col_letter}{last}'
ws.page_setup.orientation = 'landscape'
ws.page_setup.paperSize = ws.PAPERSIZE_A4
ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
ws.page_setup.fitToWidth = 1
ws.page_setup.fitToHeight = 0
ws.print_title_rows = '1:1'
ws.print_area = f'A1:{last_col_letter}{t}'
ws.page_margins.left = ws.page_margins.right = 0.4
ws.oddFooter.center.text = 'Página &P de &N'
ws.oddFooter.center.size = 8

# ---------- Aba Resumo ----------
rs = wb.create_sheet('Resumo', 0)
rs.sheet_view.showGridLines = False
rs.sheet_properties.tabColor = NAVY
rs.column_dimensions['A'].width = 3
rs.column_dimensions['B'].width = 26
for L in 'CDEFGHI':
    rs.column_dimensions[L].width = 16
rs.column_dimensions['J'].width = 3

rs.merge_cells('B2:I2')
rs['B2'] = 'Alocação de Horas — Gerência TICs'
rs['B2'].font = Font(name=F, size=20, bold=True, color=NAVY)
rs['B2'].alignment = Alignment(vertical='center')
rs.row_dimensions[2].height = 34

rs.merge_cells('B3:I3')
rs['B3'] = f'Referência: {REF}  ·  Planejado (planilha PCP) × Alocado (relatório do sistema)'
rs['B3'].font = Font(name=F, size=10, color=GRAY)
for col in range(2, 10):
    rs.cell(4, col).border = Border(top=Side(style='medium', color=BLUE))
rs.row_dimensions[4].height = 6

D = lambda c: f"{SN}!${get_column_letter(c)}$2:${get_column_letter(c)}${last}"
cards = [
    ('B', 'C', 'COLABORADORES NA BASE', f'=COUNTA({D(c_nome)})', '#,##0', 'PCP + sistema'),
    ('D', 'E', 'HORAS PLANEJADAS', f'=SUM({D(c_plan)})', '#,##0', 'total no PCP'),
    ('F', 'G', 'HORAS ALOCADAS', f'=SUM({D(c_aloc)})', '#,##0', 'total no sistema'),
    ('H', 'I', 'ADERÊNCIA AO PLANEJADO', f'=IFERROR(SUMIFS({D(c_aloc)},{D(c_plan)},">0")/SUM({D(c_plan)}),0)', '0.0%', 'só quem tem planejamento'),
]
for a, b, lab, fml, nf, cap in cards:
    for rr in (6, 7, 8):
        rs.merge_cells(f'{a}{rr}:{b}{rr}')
    rs[f'{a}6'] = lab
    rs[f'{a}7'] = fml
    rs[f'{a}8'] = cap
    rs[f'{a}6'].font = Font(name=F, size=8, bold=True, color=GRAY)
    rs[f'{a}7'].font = Font(name=F, size=22, bold=True, color=NAVY)
    rs[f'{a}7'].number_format = nf
    rs[f'{a}8'].font = Font(name=F, size=8, color=GRAY)
    for rr in (6, 7, 8):
        for col in (a, b):
            c = rs[f'{col}{rr}']
            c.fill = PatternFill('solid', fgColor=CARD)
            c.alignment = Alignment(horizontal='left', vertical='center', indent=1)
    for col in (a, b):
        rs[f'{col}6'].border = Border(top=Side(style='thick', color=BLUE))
rs.row_dimensions[6].height = 20
rs.row_dimensions[7].height = 36
rs.row_dimensions[8].height = 18

r0 = 11
rs.cell(r0 - 1, 2, 'Situação dos colaboradores').font = Font(name=F, size=12, bold=True, color=NAVY)
heads = ['Situação', 'Colaboradores', '% do total', 'Planejado (h)', 'Alocado (h)', '% Alocado']
for i, h in enumerate(heads):
    c = rs.cell(r0, 2 + i, h)
    c.font = Font(name=F, size=10, bold=True, color='FFFFFF')
    c.fill = hdr_fill
    c.alignment = Alignment(horizontal='left' if i == 0 else 'center', vertical='center', indent=1 if i == 0 else 0, wrap_text=True)
rs.row_dimensions[r0].height = 26

order = [
    'Sem alocação',
    'Abaixo do ritmo semanal',
    'Estável',
    'Acima do ritmo semanal',
    'Sem planejamento',
    'Afastado',
    'Desligado',
]
for i, s in enumerate(order):
    r = r0 + 1 + i
    rs.cell(r, 2, s)
    rs.cell(r, 3, f'=COUNTIF({D(c_sit)},B{r})')
    rs.cell(r, 4, f'=IFERROR(C{r}/C${r0 + len(order) + 1},0)')
    rs.cell(r, 5, f'=SUMIF({D(c_sit)},B{r},{D(c_plan)})')
    rs.cell(r, 6, f'=SUMIF({D(c_sit)},B{r},{D(c_aloc)})')
    rs.cell(r, 7, f'=IFERROR(F{r}/E{r},"–")')

    bg, fg = styles.get(s, ('E4E7EB', '4B5563'))
    for col in range(2, 8):
        c = rs.cell(r, col)
        c.border = box
        c.font = Font(name=F, size=10, color='262626')
        c.alignment = Alignment(horizontal='left' if col == 2 else 'right', vertical='center', indent=1)
    rs.cell(r, 2).fill = PatternFill('solid', fgColor=bg)
    rs.cell(r, 2).font = Font(name=F, size=10, bold=True, color=fg)
    rs.cell(r, 3).number_format = '#,##0'
    rs.cell(r, 4).number_format = '0.0%'
    rs.cell(r, 5).number_format = '#,##0.0;-#,##0.0;"–"'
    rs.cell(r, 6).number_format = '#,##0.0;-#,##0.0;"–"'
    rs.cell(r, 7).number_format = '0.0%'
    rs.row_dimensions[r].height = 22

rt = r0 + len(order) + 1
rs.cell(rt, 2, 'Total')
rs.cell(rt, 3, f'=SUM(C{r0 + 1}:C{rt - 1})')
rs.cell(rt, 4, f'=SUM(D{r0 + 1}:D{rt - 1})')
rs.cell(rt, 5, f'=SUM(E{r0 + 1}:E{rt - 1})')
rs.cell(rt, 6, f'=SUM(F{r0 + 1}:F{rt - 1})')
rs.cell(rt, 7, None)
for col in range(2, 8):
    c = rs.cell(rt, col)
    c.fill = PatternFill('solid', fgColor=CARD)
    c.font = Font(name=F, size=10, bold=True, color=NAVY)
    c.border = Border(top=Side(style='medium', color=NAVY), bottom=thin)
    c.alignment = Alignment(horizontal='left' if col == 2 else 'right', vertical='center', indent=1)
rs.cell(rt, 3).number_format = '#,##0'
rs.cell(rt, 4).number_format = '0.0%'
rs.cell(rt, 5).number_format = '#,##0.0'
rs.cell(rt, 6).number_format = '#,##0.0'
rs.row_dimensions[rt].height = 24

a0 = rt + 3
rs.cell(a0 - 1, 2, 'Pontos de atenção').font = Font(name=F, size=12, bold=True, color=NAVY)
items = [
    ('Divergências PCP × sistema', f'=COUNTIF({D(c_nota)},"*Divergência*")'),
    ('Não localizados no sistema', f'=COUNTIF({D(c_nota)},"*Não localizado*")'),
    ('Alocaram horas sem planejamento', f'=COUNTIF({D(c_nota)},"*Alocou horas sem planejamento*")'),
    ('Nome diferente entre PCP e sistema', f'=COUNTIF({D(c_nota)},"*Nome no sistema*")'),
    ('Gerência não identificada', f'=COUNTIF({D(c_ger)},"Não identificada")'),
]
for i, (lab, fml) in enumerate(items):
    r = a0 + i
    rs.merge_cells(f'B{r}:D{r}')
    rs.cell(r, 2, lab)
    rs.cell(r, 5, fml)
    for col in range(2, 6):
        c = rs.cell(r, col)
        c.border = box
        c.font = Font(name=F, size=10, color='262626')
        c.alignment = Alignment(horizontal='left' if col < 5 else 'center', vertical='center', indent=1 if col < 5 else 0)
    rs.cell(r, 5).font = Font(name=F, size=11, bold=True, color=NAVY)
    rs.cell(r, 5).number_format = '#,##0'
    rs.row_dimensions[r].height = 22

ch = BarChart()
ch.type = 'bar'
ch.style = 10
ch.title = 'Colaboradores por situação'
data = Reference(rs, min_col=3, min_row=r0, max_row=rt - 1)
cats = Reference(rs, min_col=2, min_row=r0 + 1, max_row=rt - 1)
ch.add_data(data, titles_from_data=True)
ch.set_categories(cats)
ch.legend = None
ch.y_axis.delete = True
ch.x_axis.scaling.orientation = 'maxMin'
ch.dataLabels = DataLabelList()
ch.dataLabels.showVal = True
ch.dataLabels.showSerName = False
ch.dataLabels.showCatName = False
ch.dataLabels.showLegendKey = False
ch.dataLabels.showPercent = False
ch.series[0].graphicalProperties.solidFill = BLUE
ch.gapWidth = 55
ch.height = 7.2
ch.width = 12.5
rs.add_chart(ch, f'F{a0 - 1}')

rs.cell(a0 + len(items) + 1, 2, f'Valores calculados por fórmula a partir da aba "{ws.title}"; atualizam se a base mudar.').font = Font(name=F, size=8, italic=True, color=GRAY)

rs.page_setup.orientation = 'landscape'
rs.page_setup.paperSize = rs.PAPERSIZE_A4
rs.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
rs.page_setup.fitToWidth = 1
rs.page_setup.fitToHeight = 1

wb.active = 0
for s in wb:
    s.sheet_view.tabSelected = (s.title == 'Resumo')

wb.save(OUT)
print('Arquivo gerado:', OUT)
