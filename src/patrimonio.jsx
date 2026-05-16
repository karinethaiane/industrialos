import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { parsePdfPatrimonio, compararPdfPatrimonio } from './utils/patrimonioPdfParser'

const SITUACOES  = ['Em uso', 'Disponível', 'Em manutenção', 'Descartado']
const TIPOS_BEM  = ['Computador', 'Periférico', 'Móvel', 'Instrumento de Medição', 'Veículo', 'Outro']
const TIPOS_OCOR = ['Manutenção', 'Transferência', 'Empréstimo', 'Reimpressão de plaqueta', 'Outro']
const PERIODICIDADES = [{ value: 6, label: 'Semestral (6 meses)' }, { value: 12, label: 'Anual (12 meses)' }, { value: 24, label: 'Bienal (24 meses)' }]

const SIT_COR = {
  'Em uso': 'var(--green)', 'Disponível': 'var(--blue)',
  'Em manutenção': 'var(--amber)', 'Descartado': 'var(--red)',
}
const OCOR_COR = {
  'Manutenção': ['var(--amber-dim,rgba(245,158,11,.1))', 'var(--amber)'],
  'Transferência': ['var(--blue-dim)', 'var(--blue)'],
  'Empréstimo': ['rgba(167,139,250,.1)', '#a78bfa'],
  'Reimpressão de plaqueta': ['var(--red-dim)', 'var(--red)'],
  'Outro': ['var(--subtle)', 'var(--muted)'],
}

const formVazio = {
  codigo_barra: '', descricao: '', descricao_complementar: '',
  tipo_bem: '', situacao: 'Em uso', local: '', responsavel: '',
  usuario_patrimonio: '', unidade: '',
  data_aquisicao: '', valor_aquisicao: '', saldo_contabil: '',
  codigo_interno: '', requer_calibracao: false, periodicidade_calibracao: 12,
}
const ocorVazio = {
  tipo: 'Manutenção', descricao: '', chamado: '',
  status: 'Aberto', data_abertura: '', data_resolucao: '',
}
const pedidoVazio = {
  numero: '', chamado: '', data_abertura: '', fornecedor: '',
  numero_pedido: '', valor_global: '', observacoes: '',
}

const S = {
  wrap:        { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:       { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub:         { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  stats:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 22 },
  statCard:    { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' },
  statBar:     (c) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: c, opacity: .5 }),
  statVal:     (c) => ({ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 500, color: c, lineHeight: 1, marginBottom: 5 }),
  statLbl:     { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },
  toolbar:     { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' },
  toolbar2:    { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  search:      { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 260 },
  fselSm:      { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '5px 10px', color: 'var(--text2)', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', height: 30 },
  filtro:      (on) => ({ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'rgba(59,130,246,.25)' : 'var(--border2)'}`, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)', fontFamily: 'inherit' }),
  btn:         { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  btnSm:       { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger:   { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  btnLimpar:   { background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: '0 4px' },
  btnGhost:    { background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 },
  btnGreen:    { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 },
  tableWrap:   { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  td:          { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox:    { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle:  { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  modalSub:    { fontSize: 12, color: 'var(--muted)', marginBottom: 18 },
  field:       { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label:       { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input:       { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel:        { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  textarea:    { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', resize: 'vertical', minHeight: 72 },
  row:         { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro:        { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  sectionLabel:{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
  chip:        (bg, color) => ({ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: bg, color, marginRight: 4 }),
  abas:        { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 },
  aba:         (on) => ({ padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: `2px solid ${on ? 'var(--blue)' : 'transparent'}`, fontFamily: 'inherit', marginBottom: -1 }),
  abaMain:     (on) => ({ padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: `2px solid ${on ? 'var(--blue)' : 'transparent'}`, fontFamily: 'inherit', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6 }),
  abaCount:    (on) => ({ padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)' }),
  ocorRow:     { display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' },
  ocorDot:     (c) => ({ width: 8, height: 8, borderRadius: '50%', background: c, marginTop: 6, flexShrink: 0 }),
  histRow:     { display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' },
  histDot:     { width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', marginTop: 5, flexShrink: 0 },
  infoBox:     { background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--blue)' },
  infoGreen:   { background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--green)' },
  infoAmber:   { background: 'var(--amber-dim)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--amber)' },
  infoPurple:  { background: 'rgba(167,139,250,.06)', border: '1px solid rgba(167,139,250,.15)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#a78bfa' },
  alerta:      { background: 'linear-gradient(135deg,rgba(248,113,113,.08),rgba(239,68,68,.04))', border: '1px solid rgba(248,113,113,.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 12 },
  alertaAmb:   { background: 'linear-gradient(135deg,rgba(251,191,36,.08),rgba(245,158,11,.04))', border: '1px solid rgba(251,191,36,.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 12 },
  progBar:     { height: 4, borderRadius: 2, background: 'var(--border2)', overflow: 'hidden', marginTop: 5, width: 110 },
  pedidoCard:  { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 14 },
  equipCheckList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '10px 12px' },
}

function fmtData(d) { if (!d) return '—'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') }
function diasAte(d) { if (!d) return null; return Math.ceil((new Date(d + 'T00:00:00') - new Date()) / 86400000) }
function addMeses(dateStr, meses) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + meses)
  return d.toISOString().split('T')[0]
}

function statusCalib(item) {
  if (!item.requer_calibracao) return null
  if (!item.proxima_calibracao) return 'pendente'
  const dias = diasAte(item.proxima_calibracao)
  if (dias < 0) return 'vencida'
  if (dias <= 30) return 'a_vencer'
  return 'em_dia'
}

function BadgeCalib({ st }) {
  if (!st) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>N/A</span>
  const map = {
    em_dia:   ['var(--green-dim)', 'var(--green)', '● Em dia'],
    a_vencer: ['var(--amber-dim)', 'var(--amber)', '● A vencer'],
    vencida:  ['var(--red-dim)',   'var(--red)',   '● Vencida'],
    pendente: ['var(--subtle)',    'var(--muted)', 'Pendente'],
  }
  const [bg, cor, label] = map[st] || map.pendente
  return <span style={{ background: bg, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{label}</span>
}

function ProgBar({ pct, st }) {
  const cor = st === 'em_dia' ? 'var(--green)' : st === 'a_vencer' ? 'var(--amber)' : 'var(--red)'
  return (
    <div style={S.progBar}>
      <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(100, pct)}%`, background: cor }} />

      {/* ── MODAL MARCAR ITEM CALIBRADO ── */}
      {modalItemCalib && (
        <div style={{ ...S.modal, zIndex:120 }} onClick={e => e.target === e.currentTarget && setModalItemCalib(null)}>
          <div style={{ ...S.modalBox, maxWidth:420 }}>
            <div style={S.modalTitle}>Marcar como Calibrado</div>
            <div style={S.modalSub}>
              {modalItemCalib.pi.patrimonios?.codigo_interno || modalItemCalib.pi.patrimonios?.codigo_barra}
              {' · '}{modalItemCalib.pi.patrimonios?.descricao?.split(' ').slice(0,5).join(' ')}
            </div>
            <div style={S.infoAmber}>
              Isso vai atualizar as datas de calibração deste equipamento sem encerrar o pedido.
              Os outros equipamentos do pedido permanecem inalterados.
            </div>
            <div style={S.field}>
              <label style={S.label}>Data da calibração *</label>
              <input type="date" style={S.input} value={dataItemCalib} onChange={e => setDataItemCalib(e.target.value)} />
            </div>
            {dataItemCalib && (() => {
              const per     = modalItemCalib.pi.patrimonios?.periodicidade_calibracao || 12
              const proxima = addMeses(dataItemCalib, per)
              return (
                <div style={{ background:'var(--green-dim)', border:'1px solid rgba(5,150,105,.2)', borderRadius:7, padding:'10px 14px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'var(--green)', fontWeight:600 }}>Próxima calibração</span>
                  <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:13, color:'var(--green)', fontWeight:600 }}>{fmtData(proxima)}</span>
                </div>
              )
            })()}
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalItemCalib(null)}>Cancelar</button>
              <button style={{ ...S.btnGreen, padding:'7px 16px', fontSize:13 }} onClick={marcarItemCalibrado} disabled={!dataItemCalib || salvandoItemCalib}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {salvandoItemCalib ? 'Salvando...' : 'Confirmar calibração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DIFF ── */}
      {modalDiff && diffResult && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalDiff(false)}>
          <div style={{ ...S.modalBox, maxWidth: 680 }}>
            <div style={S.modalTitle}>Comparação de arquivos</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
              Comparativo por código de barras — novos bens e removidos. Alterações de valor e saldo são ignoradas.
            </div>

            {/* Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(5,150,105,.2)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: 'var(--green)', lineHeight: 1, marginBottom: 4 }}>{diffResult.novos.length}</div>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>Novos bens</div>
              </div>
              <div style={{ background: 'var(--amber-dim)', border: '1px solid rgba(217,119,6,.2)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: 'var(--amber)', lineHeight: 1, marginBottom: 4 }}>{diffResult.alterados.length}</div>
                <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>Com alterações</div>
              </div>
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: 'var(--red)', lineHeight: 1, marginBottom: 4 }}>{diffResult.removidos.length}</div>
                <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>Removidos</div>
              </div>
            </div>

            {/* Bens novos */}
            {diffResult.novos.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}></span>
                  Novos bens ({diffResult.novos.length})
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 160, overflowY: 'auto' }}>
                  {diffResult.novos.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{b.descricao}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--green)', fontSize: 11 }}>{b.codigo_barra}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bens alterados */}
            {diffResult.alterados.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }}></span>
                  Alterados ({diffResult.alterados.length})
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 180, overflowY: 'auto' }}>
                  {diffResult.alterados.map((b, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{b.descricao}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--muted)', fontSize: 11 }}>{b.codigo_barra}</span>
                      </div>
                      {b._diffs.map((d, j) => (
                        <div key={j} style={{ display: 'flex', gap: 8, fontSize: 11, marginBottom: 3, alignItems: 'center' }}>
                          <span style={{ color: 'var(--muted)', width: 100, flexShrink: 0, textTransform: 'capitalize' }}>{d.campo.replace(/_/g,' ')}</span>
                          <span style={{ color: 'var(--red)', textDecoration: 'line-through', flex: 1 }}>{d.anterior}</span>
                          <span style={{ color: 'var(--mu)', margin: '0 4px' }}>→</span>
                          <span style={{ color: 'var(--green)', flex: 1, fontWeight: 600 }}>{d.novo}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bens removidos */}
            {diffResult.removidos.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }}></span>
                  Removidos do novo arquivo ({diffResult.removidos.length})
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 140, overflowY: 'auto' }}>
                  {diffResult.removidos.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text)', opacity: .6, textDecoration: 'line-through' }}>{b.descricao}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--red)', fontSize: 11 }}>{b.codigo_barra}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diffResult.novos.length === 0 && diffResult.alterados.length === 0 && diffResult.removidos.length === 0 && (
              <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(5,150,105,.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: 'var(--green)', fontWeight: 600, textAlign: 'center' }}>
                Nenhuma diferença encontrada — o arquivo está idêntico ao banco.
              </div>
            )}

            <div style={{ ...S.row, gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button style={S.btnSm} onClick={() => setModalDiff(false)}>Cancelar</button>
              {(diffResult.novos.length > 0 || diffResult.alterados.length > 0) && (
                <button
                  style={{ ...S.btn, background: 'var(--amber)', opacity: aplicando ? .6 : 1 }}
                  disabled={aplicando}
                  onClick={() => aplicarDiff({ novos: true, alterados: true, removidos: false })}
                >
                  {aplicando ? 'Aplicando...' : `Aplicar novos + alterados (${diffResult.novos.length + diffResult.alterados.length})`}
                </button>
              )}
              {diffResult.removidos.length > 0 && (
                <button
                  style={{ ...S.btn, background: 'var(--red)', opacity: aplicando ? .6 : 1 }}
                  disabled={aplicando}
                  onClick={() => aplicarDiff({ novos: true, alterados: true, removidos: true })}
                >
                  {aplicando ? 'Aplicando...' : 'Aplicar tudo (incluir remoções)'}
                </button>
              )}
              {(diffResult.novos.length > 0 || diffResult.alterados.length > 0 || diffResult.removidos.length > 0) && (
                <button
                  style={{ ...S.btn, background: 'var(--green)', opacity: aplicando ? .6 : 1 }}
                  disabled={aplicando}
                  onClick={() => aplicarDiff({ novos: true, alterados: true, removidos: false })}
                >
                  {aplicando ? 'Aplicando...' : 'Sincronizar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function Patrimonio({ isAdmin = false }) {
  const [aba, setAba]               = useState('bens')
  const [abaCalib, setAbaCalib]     = useState('equipamentos')
  const [itens, setItens]           = useState([])
  const [todasOcor, setTodasOcor]   = useState([])
  const [pedidos, setPedidos]       = useState([])
  const [pedidoItens, setPedidoItens] = useState([])
  const [filtroOcorTipo, setFiltroOcorTipo] = useState('')
  const [filtroOcorStatus, setFiltroOcorStatus] = useState('')
  const [filtroCalibSt, setFiltroCalibSt] = useState('')
  const [filtroPedidoSt, setFiltroPedidoSt] = useState('')
  const [loading, setLoading]       = useState(true)
  const [busca, setBusca]           = useState('')
  const [buscaCalib, setBuscaCalib] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSit, setFiltroSit]   = useState('')
  const [filtroLocal, setFiltroLocal] = useState('')
  const [filtroResp, setFiltroResp] = useState('')
  const [filtroUser, setFiltroUser] = useState('')
  const [modal, setModal]           = useState(false)
  const [itemSel, setItemSel]       = useState(null)
  const [form, setForm]             = useState(formVazio)
  const [historico, setHistorico]   = useState([])
  const [ocorrencias, setOcorrencias] = useState([])
  const [abaModal, setAbaModal]     = useState('ocorrencias')
  const [formOcor, setFormOcor]     = useState(ocorVazio)
  const [modalOcor, setModalOcor]   = useState(false)
  const [ocorSel, setOcorSel]       = useState(null)
  const [ocorDetalhe, setOcorDetalhe] = useState(null)
  const [salvando, setSalvando]     = useState(false)
  const [salvandoOcor, setSalvandoOcor] = useState(false)
  const [erro, setErro]             = useState('')
  const [erroOcor, setErroOcor]     = useState('')
  const [importando, setImportando] = useState(false)
  const [erroImport, setErroImport] = useState('')
  const [limpando, setLimpando]     = useState(false)
  const [showOcorPainel, setShowOcorPainel] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [modalDiff, setModalDiff]   = useState(false)
  const [diffResult, setDiffResult] = useState(null)   // { novos, alterados, removidos }
  const [aplicando, setAplicando]   = useState(false)

  const [modalPedido, setModalPedido]       = useState(false)
  const [editandoPedido, setEditandoPedido] = useState(null)
  const [formPedido, setFormPedido]         = useState(pedidoVazio)
  const [pedidoEquips, setPedidoEquips]     = useState([])
  const [salvandoPedido, setSalvandoPedido] = useState(false)
  const [erroPedido, setErroPedido]         = useState('')

  const [modalConcluir, setModalConcluir]   = useState(false)
  const [pedidoConcluindo, setPedidoConcluindo] = useState(null)
  const [dataConclusao, setDataConclusao]   = useState('')
  const [proximaAuto, setProximaAuto]       = useState('')
  const [enviarFinanceiro, setEnviarFinanceiro] = useState(false)
  const [salvandoConcluir, setSalvandoConcluir] = useState(false)

  const [colaboradoresLista, setColaboradoresLista] = useState([])
  const [modalItemCalib, setModalItemCalib] = useState(null)   // { pi, pedido }
  const [dataItemCalib, setDataItemCalib]   = useState('')
  const [salvandoItemCalib, setSalvandoItemCalib] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const [{ data: patrimonios }, { data: ocor }, { data: peds }, { data: pItens }, { data: colabs }] = await Promise.all([
      supabase.from('patrimonios').select('*').order('descricao'),
      supabase.from('patrimonio_ocorrencias').select('*, patrimonios(codigo_barra, descricao, local, usuario_patrimonio)').order('created_at', { ascending: false }),
      supabase.from('calibracao_pedidos').select('*').order('created_at', { ascending: false }),
      supabase.from('calibracao_pedido_itens').select('*, patrimonios(id, codigo_barra, descricao, codigo_interno, periodicidade_calibracao)').order('created_at'),
      supabase.from('colaboradores').select('id, nome').eq('ativo', true).order('nome'),
    ])
    setItens(patrimonios || [])
    setTodasOcor(ocor || [])
    setPedidos(peds || [])
    setPedidoItens(pItens || [])
    setColaboradoresLista(colabs || [])
    setLoading(false)
  }

  const locais   = [...new Set(itens.map(i => i.local).filter(Boolean))].sort()
  const resps    = [...new Set(itens.map(i => i.responsavel).filter(Boolean))].sort()
  const usuarios = [...new Set(itens.map(i => i.usuario_patrimonio).filter(Boolean))].sort()
  const temFiltro = filtroTipo || filtroSit || filtroLocal || filtroResp || filtroUser
  const equipCalib = itens.filter(i => i.requer_calibracao)

  function pedidoAtivoPorEquip(patrimonioId) {
    const item = pedidoItens.find(pi => pi.patrimonio_id === patrimonioId)
    if (!item) return null
    return pedidos.find(p => p.id === item.pedido_id && p.status === 'em_andamento') || null
  }

  function pctCalib(item) {
    if (!item.ultima_calibracao || !item.proxima_calibracao) return 0
    const total = new Date(item.proxima_calibracao + 'T00:00:00') - new Date(item.ultima_calibracao + 'T00:00:00')
    return Math.min(100, Math.max(0, Math.round(((new Date() - new Date(item.ultima_calibracao + 'T00:00:00')) / total) * 100)))
  }

  const filtrados = itens.filter(i => {
    if (filtroTipo  && i.tipo_bem          !== filtroTipo)  return false
    if (filtroSit   && i.situacao          !== filtroSit)   return false
    if (filtroLocal && i.local             !== filtroLocal) return false
    if (filtroResp  && i.responsavel       !== filtroResp)  return false
    if (filtroUser  && i.usuario_patrimonio !== filtroUser)  return false
    if (busca) {
      const b = busca.toLowerCase()
      return i.codigo_barra?.toLowerCase().includes(b) || i.descricao?.toLowerCase().includes(b) || i.local?.toLowerCase().includes(b) || i.responsavel?.toLowerCase().includes(b) || i.usuario_patrimonio?.toLowerCase().includes(b)
    }
    return true
  })

  const equipFiltrados = equipCalib.filter(e => {
    if (filtroCalibSt && statusCalib(e) !== filtroCalibSt) return false
    if (buscaCalib) {
      const b = buscaCalib.toLowerCase()
      return e.descricao?.toLowerCase().includes(b) || (e.codigo_interno || '').toLowerCase().includes(b)
    }
    return true
  })

  const pedidosFiltrados = pedidos.filter(p => !filtroPedidoSt || p.status === filtroPedidoSt)

  function limparFiltros() { setFiltroTipo(''); setFiltroSit(''); setFiltroLocal(''); setFiltroResp(''); setFiltroUser(''); setBusca('') }

  const totalEmUso      = itens.filter(i => i.situacao === 'Em uso').length
  const totalDisponivel = itens.filter(i => i.situacao === 'Disponível').length
  const totalManutencao = itens.filter(i => i.situacao === 'Em manutenção').length
  const ocorAbertas       = todasOcor.filter(o => o.status === 'Aberto')
  const bensComOcorAberta = new Set(ocorAbertas.map(o => o.patrimonio_id))
  const bensComOcorAberta = new Set(ocorAbertas.map(o => o.patrimonio_id))
  const resumoOcor = {
    'Manutenção':             ocorAbertas.filter(o => o.tipo === 'Manutenção').length,
    'Reimpressão de plaqueta':ocorAbertas.filter(o => o.tipo === 'Reimpressão de plaqueta').length,
    'Empréstimo':             ocorAbertas.filter(o => o.tipo === 'Empréstimo').length,
    'Transferência':          ocorAbertas.filter(o => o.tipo === 'Transferência').length,
  }
  const OCOR_RESUMO_COR = {
    'Manutenção':              ['rgba(245,158,11,.1)', 'var(--amber)'],
    'Reimpressão de plaqueta': ['var(--red-dim)',      'var(--red)'],
    'Empréstimo':              ['rgba(167,139,250,.1)','#a78bfa'],
    'Transferência':           ['var(--blue-dim)',     'var(--blue)'],
  }
  const ocorFiltradas = todasOcor.filter(o => {
    if (filtroOcorTipo   && o.tipo   !== filtroOcorTipo)   return false
    if (filtroOcorStatus && o.status !== filtroOcorStatus) return false
    return true
  })
  const calibStats = {
    total:    equipCalib.length,
    em_dia:   equipCalib.filter(e => statusCalib(e) === 'em_dia').length,
    a_vencer: equipCalib.filter(e => statusCalib(e) === 'a_vencer').length,
    vencida:  equipCalib.filter(e => statusCalib(e) === 'vencida').length,
    pendente: equipCalib.filter(e => statusCalib(e) === 'pendente').length,
  }
  const pedidoStats = {
    total:       pedidos.length,
    em_andamento:pedidos.filter(p => p.status === 'em_andamento').length,
    concluido:   pedidos.filter(p => p.status === 'concluido').length,
    pag_sol:     pedidos.filter(p => p.status === 'pag_solicitado').length,
  }

  function abrirNovo() { setItemSel(null); setErro(''); setForm(formVazio); setModal('form') }
  function abrirEditar(item) {
    setItemSel(item); setErro('')
    setForm({
      codigo_barra: item.codigo_barra || '', descricao: item.descricao || '',
      descricao_complementar: item.descricao_complementar || '',
      tipo_bem: item.tipo_bem || '', situacao: item.situacao || 'Em uso',
      local: item.local || '', responsavel: item.responsavel || '',
      usuario_patrimonio: item.usuario_patrimonio || '', unidade: item.unidade || '',
      data_aquisicao: item.data_aquisicao || '', valor_aquisicao: item.valor_aquisicao || '',
      saldo_contabil: item.saldo_contabil || '',
      codigo_interno: item.codigo_interno || '',
      requer_calibracao: item.requer_calibracao || false,
      periodicidade_calibracao: item.periodicidade_calibracao || 12,
    })
    setModal('form')
  }

  async function abrirOcorrencias(item) {
    setItemSel(item); setAbaModal('ocorrencias')
    const [{ data: ocor }, { data: hist }] = await Promise.all([
      supabase.from('patrimonio_ocorrencias').select('*').eq('patrimonio_id', item.id).order('created_at', { ascending: false }),
      supabase.from('patrimonio_historico').select('*').eq('patrimonio_id', item.id).order('created_at', { ascending: false }),
    ])
    setOcorrencias(ocor || [])
    setHistorico(hist || [])
    setModal('ocorrencias')
  }

  async function salvar() {
    if (!form.codigo_barra.trim() || !form.descricao.trim()) { setErro('Código de barra e Descrição são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const dados = {
      codigo_barra: form.codigo_barra.trim(), descricao: form.descricao.trim(),
      descricao_complementar: form.descricao_complementar.trim() || null,
      tipo_bem: form.tipo_bem || null, situacao: form.situacao || 'Em uso',
      local: form.local.trim() || null, responsavel: form.responsavel.trim() || null,
      usuario_patrimonio: form.usuario_patrimonio.trim() || null,
      unidade: form.unidade.trim() || null, data_aquisicao: form.data_aquisicao || null,
      valor_aquisicao: form.valor_aquisicao.trim() || null, saldo_contabil: form.saldo_contabil.trim() || null,
      codigo_interno: form.codigo_interno.trim() || null,
      requer_calibracao: form.requer_calibracao,
      periodicidade_calibracao: form.requer_calibracao ? (parseInt(form.periodicidade_calibracao) || 12) : null,
    }
    let error
    if (modal === 'form' && itemSel) {
      for (const campo of Object.keys(dados)) {
        const ant = itemSel[campo]; const nov = dados[campo]
        if (String(ant ?? '') !== String(nov ?? '')) {
          await supabase.from('patrimonio_historico').insert({ patrimonio_id: itemSel.id, campo_alterado: campo, valor_anterior: ant ?? null, valor_novo: nov ?? null })
        }
      }
      ;({ error } = await supabase.from('patrimonios').update(dados).eq('id', itemSel.id))
    } else {
      ;({ error } = await supabase.from('patrimonios').insert(dados))
    }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModal(false); carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir este patrimônio?')) return
    await supabase.from('patrimonio_ocorrencias').delete().eq('patrimonio_id', id)
    await supabase.from('patrimonio_historico').delete().eq('patrimonio_id', id)
    await supabase.from('calibracao_pedido_itens').delete().eq('patrimonio_id', id)
    await supabase.from('patrimonios').delete().eq('id', id)
    carregar()
  }

  function abrirNovaOcor() { setOcorSel(null); setErroOcor(''); setFormOcor({ ...ocorVazio, data_abertura: new Date().toISOString().split('T')[0] }); setModalOcor(true) }
  function abrirEditarOcor(ocor) {
    setOcorSel(ocor); setErroOcor('')
    setFormOcor({ tipo: ocor.tipo, descricao: ocor.descricao, chamado: ocor.chamado || '', status: ocor.status, data_abertura: ocor.data_abertura || '', data_resolucao: ocor.data_resolucao || '' })
    setModalOcor(true)
  }
  async function salvarOcor() {
    if (!formOcor.descricao.trim()) { setErroOcor('Descrição é obrigatória.'); return }
    setSalvandoOcor(true); setErroOcor('')
    const dados = { patrimonio_id: itemSel.id, tipo: formOcor.tipo, descricao: formOcor.descricao.trim(), chamado: formOcor.chamado.trim() || null, status: formOcor.status, data_abertura: formOcor.data_abertura || null, data_resolucao: formOcor.status === 'Resolvido' ? (formOcor.data_resolucao || null) : null }
    let error
    if (ocorSel) { ({ error } = await supabase.from('patrimonio_ocorrencias').update(dados).eq('id', ocorSel.id)) }
    else         { ({ error } = await supabase.from('patrimonio_ocorrencias').insert(dados)) }
    setSalvandoOcor(false)
    if (error) { setErroOcor('Erro: ' + error.message); return }
    setModalOcor(false)
    const [{ data: ocorItem }, { data: ocorTodas }] = await Promise.all([
      supabase.from('patrimonio_ocorrencias').select('*').eq('patrimonio_id', itemSel.id).order('created_at', { ascending: false }),
      supabase.from('patrimonio_ocorrencias').select('*, patrimonios(codigo_barra, descricao, local, usuario_patrimonio)').order('created_at', { ascending: false }),
    ])
    setOcorrencias(ocorItem || [])
    setTodasOcor(ocorTodas || [])
  }
  async function excluirOcor(id) {
    if (!confirm('Excluir esta ocorrência?')) return
    await supabase.from('patrimonio_ocorrencias').delete().eq('id', id)
    const [{ data: ocorItem }, { data: ocorTodas }] = await Promise.all([
      supabase.from('patrimonio_ocorrencias').select('*').eq('patrimonio_id', itemSel.id).order('created_at', { ascending: false }),
      supabase.from('patrimonio_ocorrencias').select('*, patrimonios(codigo_barra, descricao, local, usuario_patrimonio)').order('created_at', { ascending: false }),
    ])
    setOcorrencias(ocorItem || [])
    setTodasOcor(ocorTodas || [])
  }
  async function excluirOcorGlobal(o) {
    if (!confirm('Excluir esta ocorrência?')) return
    await supabase.from('patrimonio_ocorrencias').delete().eq('id', o.id)
    const { data } = await supabase.from('patrimonio_ocorrencias').select('*, patrimonios(codigo_barra, descricao, local, usuario_patrimonio)').order('created_at', { ascending: false })
    setTodasOcor(data || [])
  }

  function abrirNovoPedido() {
    setEditandoPedido(null); setErroPedido('')
    setFormPedido({ ...pedidoVazio, numero: `PED-${new Date().getFullYear()}-${String(pedidos.length + 1).padStart(3, '0')}` })
    setPedidoEquips([])
    setModalPedido(true)
  }
  function abrirEditarPedido(pedido) {
    setEditandoPedido(pedido); setErroPedido('')
    setFormPedido({ numero: pedido.numero, chamado: pedido.chamado || '', data_abertura: pedido.data_abertura || '', fornecedor: pedido.fornecedor || '', numero_pedido: pedido.numero_pedido || '', valor_global: pedido.valor_global || '', observacoes: pedido.observacoes || '' })
    setPedidoEquips(pedidoItens.filter(pi => pi.pedido_id === pedido.id).map(pi => pi.patrimonio_id))
    setModalPedido(true)
  }
  async function salvarPedido() {
    if (!formPedido.fornecedor.trim()) { setErroPedido('Fornecedor é obrigatório.'); return }
    if (pedidoEquips.length === 0) { setErroPedido('Selecione ao menos um equipamento.'); return }
    setSalvandoPedido(true); setErroPedido('')
    const dados = {
      numero: formPedido.chamado ? `CAL-${formPedido.chamado}` : `CAL-${new Date().getFullYear()}-${String(pedidos.length + 1).padStart(3, '0')}`,
      chamado: formPedido.chamado.trim() || null, data_abertura: formPedido.data_abertura || null, fornecedor: formPedido.fornecedor.trim(), numero_pedido: formPedido.numero_pedido.trim() || null, valor_global: parseFloat(formPedido.valor_global) || null, observacoes: formPedido.observacoes.trim() || null, status: 'em_andamento' }
    let pedidoId
    if (editandoPedido) {
      const { error } = await supabase.from('calibracao_pedidos').update(dados).eq('id', editandoPedido.id)
      if (error) { setErroPedido('Erro: ' + error.message); setSalvandoPedido(false); return }
      pedidoId = editandoPedido.id
      await supabase.from('calibracao_pedido_itens').delete().eq('pedido_id', pedidoId)
    } else {
      const { data, error } = await supabase.from('calibracao_pedidos').insert(dados).select().single()
      if (error) { setErroPedido('Erro: ' + error.message); setSalvandoPedido(false); return }
      pedidoId = data.id
    }
    await supabase.from('calibracao_pedido_itens').insert(pedidoEquips.map(id => ({ pedido_id: pedidoId, patrimonio_id: id })))
    setSalvandoPedido(false); setModalPedido(false); carregar()
  }
  async function excluirPedido(id) {
    if (!confirm('Excluir este pedido?')) return
    await supabase.from('calibracao_pedido_itens').delete().eq('pedido_id', id)
    await supabase.from('calibracao_pedidos').delete().eq('id', id)
    carregar()
  }
  function toggleEquip(id) { setPedidoEquips(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  function abrirConcluir(pedido) {
    setPedidoConcluindo(pedido); setDataConclusao(''); setProximaAuto(''); setEnviarFinanceiro(false); setModalConcluir(true)
  }
  function aoMudarDataConclusao(data) {
    setDataConclusao(data)
    if (!data) return
    const itensP = pedidoItens.filter(pi => pi.pedido_id === pedidoConcluindo.id)
    const per = itensP[0]?.patrimonios?.periodicidade_calibracao || 12
    setProximaAuto(addMeses(data, per))
  }
  async function concluirPedido() {
    if (!dataConclusao) { alert('Informe a data de conclusão.'); return }
    setSalvandoConcluir(true)
    await supabase.from('calibracao_pedidos').update({ status: 'concluido', data_conclusao: dataConclusao }).eq('id', pedidoConcluindo.id)
    const itensP = pedidoItens.filter(pi => pi.pedido_id === pedidoConcluindo.id)
    for (const pi of itensP) {
      const per = pi.patrimonios?.periodicidade_calibracao || 12
      const proxima = addMeses(dataConclusao, per)
      await supabase.from('patrimonios').update({ ultima_calibracao: dataConclusao, proxima_calibracao: proxima }).eq('id', pi.patrimonio_id)
      await supabase.from('calibracao_pedido_itens').update({ data_calibracao: dataConclusao }).eq('id', pi.id)
    }
    if (enviarFinanceiro) {
      const dadosPag = {
        numero_chamado:      null,                            // chamado ainda não aberto
        tipo_tarefa:         'Solicitação de Pagamento',
        solicitante:         'IST - MPP - ENERGIA',
        numero_nf_boleto_al: null,                            // preenchido depois no Financeiro
        razao_social:        pedidoConcluindo.fornecedor,     // puxado do pedido
        descricao:           `Serviço de calibração · Pedido ${pedidoConcluindo.numero}`,
        status:              'aguardando_abertura_chamado',   // novo status
        valor:               pedidoConcluindo.valor_global || null,
        origem:              'calibracao',
        calibracao_pedido_id: pedidoConcluindo.id,
      }
      const { error: errPag } = await supabase.from('solicitacoes_pagamento').insert(dadosPag)
      if (errPag) { alert('Erro ao enviar para o Financeiro: ' + errPag.message); setSalvandoConcluir(false); return }
      await supabase.from('calibracao_pedidos').update({ status: 'pag_solicitado' }).eq('id', pedidoConcluindo.id)
    }
    setSalvandoConcluir(false); setModalConcluir(false); carregar()
  }

  async function exportarExcel() {
    setExportando(true)
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')

      // ── Aba 1: Bens ──
      const { data: bens } = await supabase.from('patrimonios').select('*').order('descricao')
      const rowsBens = (bens || []).map(b => ({
        'Código de Barras':        b.codigo_barra || '',
        'Descrição':               b.descricao || '',
        'Descrição Complementar':  b.descricao_complementar || '',
        'Tipo':                    b.tipo_bem || '',
        'Situação':                b.situacao || '',
        'Local':                   b.local || '',
        'Responsável':             b.responsavel || '',
        'Usuário':                 b.usuario_patrimonio || '',
        'Unidade':                 b.unidade || '',
        'Data Aquisição':          b.data_aquisicao || '',
        'Valor Aquisição':         b.valor_aquisicao || '',
        'Saldo Contábil':          b.saldo_contabil || '',
        'Código Interno':          b.codigo_interno || '',
        'Requer Calibração':       b.requer_calibracao ? 'Sim' : 'Não',
        'Periodicidade Calibração':b.periodicidade_calibracao || '',
        'Última Calibração':       b.ultima_calibracao || '',
        'Próxima Calibração':      b.proxima_calibracao || '',
      }))

      // ── Aba 2: Ocorrências ──
      const { data: ocors } = await supabase
        .from('patrimonio_ocorrencias')
        .select('*, patrimonios(codigo_barra, descricao)')
        .order('created_at', { ascending: false })
      const rowsOcor = (ocors || []).map(o => ({
        'Código de Barras': o.patrimonios?.codigo_barra || '',
        'Bem':              o.patrimonios?.descricao || '',
        'Tipo':             o.tipo || '',
        'Status':           o.status || '',
        'Descrição':        o.descricao || '',
        'Data Abertura':    o.data_abertura || '',
        'Data Resolução':   o.data_resolucao || '',
        'Responsável':      o.responsavel || '',
        'Observações':      o.observacoes || '',
      }))

      // ── Aba 3: Calibrações ──
      const { data: peds } = await supabase
        .from('calibracao_pedidos')
        .select('*, calibracao_pedido_itens(*, patrimonios(codigo_barra, descricao, codigo_interno))')
        .order('created_at', { ascending: false })
      const rowsCalib = []
      ;(peds || []).forEach(p => {
        ;(p.calibracao_pedido_itens || []).forEach(item => {
          rowsCalib.push({
            'Nº Pedido':          p.numero_pedido || '',
            'Chamado':            p.numero_chamado || '',
            'Fornecedor':         p.fornecedor || '',
            'Status Pedido':      p.status || '',
            'Data Pedido':        p.created_at ? p.created_at.slice(0,10) : '',
            'Código de Barras':   item.patrimonios?.codigo_barra || '',
            'Código Interno':     item.patrimonios?.codigo_interno || '',
            'Bem':                item.patrimonios?.descricao || '',
            'Status Item':        item.status || '',
            'Dt. Prev. Retorno':  item.data_prevista_retorno || '',
            'Dt. Real Retorno':   item.data_retorno || '',
            'Nova Calibração':    item.nova_data_calibracao || '',
          })
        })
      })

      // Montar workbook
      const wb = XLSX.utils.book_new()

      const wsBens = XLSX.utils.json_to_sheet(rowsBens.length ? rowsBens : [{}])
      const wsOcor = XLSX.utils.json_to_sheet(rowsOcor.length ? rowsOcor : [{}])
      const wsCalib = XLSX.utils.json_to_sheet(rowsCalib.length ? rowsCalib : [{}])

      // Larguras automáticas
      const autoWidth = (ws, rows) => {
        if (!rows.length) return
        const cols = Object.keys(rows[0])
        ws['!cols'] = cols.map(col => ({
          wch: Math.min(40, Math.max(col.length, ...rows.map(r => String(r[col] || '').length)))
        }))
      }
      autoWidth(wsBens, rowsBens)
      autoWidth(wsOcor, rowsOcor)
      autoWidth(wsCalib, rowsCalib)

      XLSX.utils.book_append_sheet(wb, wsBens,  'Bens')
      XLSX.utils.book_append_sheet(wb, wsOcor,  'Ocorrências')
      XLSX.utils.book_append_sheet(wb, wsCalib, 'Calibrações')

      const data = new Date()
      const stamp = `${data.getFullYear()}${String(data.getMonth()+1).padStart(2,'0')}${String(data.getDate()).padStart(2,'0')}`
      XLSX.writeFile(wb, `Patrimônio_${stamp}.xlsx`)
    } catch (err) {
      alert('Erro ao exportar: ' + err.message)
    }
    setExportando(false)
  }

  async function limparTudo() {
    if (!confirm('Isso vai excluir TODOS os bens patrimoniais, ocorrências e histórico. Confirma?')) return
    setLimpando(true)
    // Deletar na ordem certa (FK)
    await supabase.from('patrimonio_historico').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('ocorrencias_patrimonio').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('calibracao_pedido_itens').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('calibracao_pedidos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('patrimonios').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setLimpando(false)
    setErroImport('Todos os registros foram excluídos.')
    carregar()
  }

  async function importarPdf(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true); setErroImport('')
    try {
      const bens = await parsePdfPatrimonio(file)
      if (bens.length === 0) {
        setErroImport('Nenhum bem encontrado nos locais filtrados. Verifique se o PDF é o relatório correto.')
        setImportando(false); e.target.value = ''; return
      }
      let inseridos = 0, erros = 0
      for (const dados of bens) {
        const { error } = await supabase.from('patrimonios').upsert(dados, { onConflict: 'codigo_barra' })
        if (error) erros++; else inseridos++
      }
      setErroImport(`Importação concluída: ${inseridos} registros dos locais filtrados.${erros > 0 ? ` ${erros} erros.` : ''}`)
      carregar()
    } catch (err) { setErroImport('Erro ao importar PDF: ' + err.message) }
    setImportando(false); e.target.value = ''
  }

  async function compararPdf(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true); setErroImport('')
    try {
      const { data: atual } = await supabase.from('patrimonios').select('*')
      const { novos, removidos } = await compararPdfPatrimonio(file, atual || [])
      setDiffResult({ novos, alterados: [], removidos })
      setModalDiff(true)
    } catch (err) { setErroImport('Erro ao comparar PDF: ' + err.message) }
    setImportando(false); e.target.value = ''
  }



  async function aplicarDiff(opcoes) {
    // opcoes: { novos: bool, alterados: bool, removidos: bool }
    if (!diffResult) return
    setAplicando(true)
    let ok = 0, erros = 0

    if (opcoes.novos) {
      for (const item of diffResult.novos) {
        const { error } = await supabase.from('patrimonios').insert(item)
        error ? erros++ : ok++
      }
    }
    if (opcoes.alterados) {
      for (const item of diffResult.alterados) {
        const { _diffs, _id, ...dados } = item
        const { error } = await supabase.from('patrimonios').update(dados).eq('id', _id)
        error ? erros++ : ok++
      }
    }
    if (opcoes.removidos) {
      for (const item of diffResult.removidos) {
        await supabase.from('patrimonios').delete().eq('id', item.id)
        ok++
      }
    }

    setAplicando(false)
    setModalDiff(false)
    setDiffResult(null)
    setErroImport(`Sincronização concluída: ${ok} alterações aplicadas.${erros > 0 ? ` ${erros} erros.` : ''}`)
    carregar()
  }

  async function marcarItemCalibrado() {
    if (!modalItemCalib || !dataItemCalib) return
    setSalvandoItemCalib(true)
    const { pi, pedido } = modalItemCalib
    const per = pi.patrimonios?.periodicidade_calibracao || 12
    const proxima = addMeses(dataItemCalib, per)
    // Atualiza item do pedido
    await supabase.from('calibracao_pedido_itens')
      .update({ data_calibracao: dataItemCalib })
      .eq('id', pi.id)
    // Atualiza datas do patrimônio
    await supabase.from('patrimonios')
      .update({ ultima_calibracao: dataItemCalib, proxima_calibracao: proxima })
      .eq('id', pi.patrimonio_id)
    setSalvandoItemCalib(false)
    setModalItemCalib(null)
    setDataItemCalib('')
    carregar()
  }

  const trHover = { onMouseEnter: e => e.currentTarget.style.background='var(--subtle)', onMouseLeave: e => e.currentTarget.style.background='transparent' }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div><div style={S.title}>Patrimônio</div><div style={S.sub}>Gestão e controle de bens patrimoniais</div></div>
        {isAdmin && (
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={exportarExcel}
              disabled={exportando}
              style={{ ...S.btn, background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(5,150,105,.2)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {exportando ? 'Exportando...' : 'Exportar Excel'}
            </button>
            <button
              onClick={limparTudo}
              disabled={limpando}
              style={{ ...S.btn, background:'var(--red-dim)', color:'var(--red)', border:'1px solid rgba(239,68,68,.2)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              {limpando ? 'Limpando...' : 'Limpar tudo'}
            </button>
            <label style={{ ...S.btn, background:'rgba(99,102,241,.1)', color:'var(--blue)', border:'1px solid rgba(99,102,241,.2)', cursor:'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
              {importando ? 'Comparando...' : 'Comparar PDF'}
              <input type="file" accept=".pdf" style={{ display:'none' }} onChange={compararPdf} disabled={importando} />
            </label>
            <label style={{ ...S.btn, background:'var(--subtle)', color:'var(--text2)', border:'1px solid var(--border2)', cursor:'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {importando ? 'Importando...' : 'Importar PDF'}
              <input type="file" accept=".pdf" style={{ display:'none' }} onChange={importarPdf} disabled={importando} />
            </label>
            <button style={S.btn} onClick={abrirNovo}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo Bem
            </button>
          </div>
        )}
      </div>

      {erroImport && <div style={{ ...S.erro, marginBottom:16, color: erroImport.startsWith('Erro')?'var(--red)':'var(--green)', background: erroImport.startsWith('Erro')?'var(--red-dim)':'var(--green-dim)' }}>{erroImport}</div>}

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:20 }}>
        <button style={S.abaMain(aba==='bens')} onClick={()=>setAba('bens')}>Bens</button>
        <button style={S.abaMain(aba==='ocorrencias')} onClick={()=>setAba('ocorrencias')}>
          Ocorrências
          {ocorAbertas.length > 0 && <span style={{ marginLeft:4, background:'rgba(245,158,11,.15)', color:'var(--amber)', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{ocorAbertas.length} {ocorAbertas.length===1?'aberta':'abertas'}</span>}
        </button>
        <button style={S.abaMain(aba==='calibracoes')} onClick={()=>setAba('calibracoes')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Calibrações <span style={S.abaCount(aba==='calibracoes')}>{equipCalib.length}</span>
        </button>
      </div>

      {aba === 'bens' && (<>
        {ocorAbertas.length > 0 && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:18, overflow:'hidden' }}>
            {/* Header recolhível */}
            <div
              onClick={() => setShowOcorPainel(v => !v)}
              style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 18px', cursor:'pointer', userSelect:'none' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em' }}>
                  Ocorrências abertas
                </span>
                <span style={{ background:'rgba(245,158,11,.12)', color:'var(--amber)', borderRadius:10, padding:'1px 8px', fontSize:11, fontWeight:700 }}>
                  {ocorAbertas.length}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button style={{ ...S.btnSm, fontSize:11 }} onClick={e=>{e.stopPropagation();setAba('ocorrencias')}}>Ver todas →</button>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
                  style={{ transform: showOcorPainel ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform .2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
            {/* Conteúdo recolhível */}
            {showOcorPainel && (
              <div style={{ padding:'0 18px 16px', borderTop:'1px solid var(--border)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12, marginTop:12 }}>
                  {Object.entries(resumoOcor).map(([tipo, qtd]) => {
                    const [bg, cor] = OCOR_RESUMO_COR[tipo] || ['var(--subtle)','var(--muted)']
                    return <div key={tipo} style={{ background:qtd>0?bg:'var(--subtle)', borderRadius:8, padding:'10px 12px', opacity:qtd===0?.4:1 }}><div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:20, fontWeight:500, color:qtd>0?cor:'var(--muted)', lineHeight:1, marginBottom:3 }}>{qtd}</div><div style={{ fontSize:10, color:qtd>0?cor:'var(--muted)', fontWeight:600 }}>{tipo}</div></div>
                  })}
                </div>
                <div style={{ borderTop:'1px solid var(--border)', paddingTop:10 }}>
                  {ocorAbertas.slice(0,6).map(o => {
                    const [,cor] = OCOR_RESUMO_COR[o.tipo]||['var(--subtle)','var(--muted)']
                    return (
                      <div key={o.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                        <span style={{ ...S.chip('var(--subtle)',cor), flexShrink:0 }}>{o.tipo}</span>
                        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:'var(--blue)', flexShrink:0, width:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.patrimonios?.codigo_barra||'—'}</span>
                        <span style={{ fontSize:12, color:'var(--text)', fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.patrimonios?.descricao||'—'}</span>
                        <span style={{ fontSize:11, color:'var(--muted)', flexShrink:0 }}>{o.data_abertura?new Date(o.data_abertura+'T00:00:00').toLocaleDateString('pt-BR'):'—'}</span>
                      </div>
                    )
                  })}
                  {ocorAbertas.length>6&&<div style={{ paddingTop:8, fontSize:11, color:'var(--muted)', textAlign:'center' }}>+ {ocorAbertas.length-6} outras — ver todas na aba Ocorrências</div>}
                </div>
              </div>
            )}
          </div>
        )}
        <div style={S.stats}>
          {[['var(--blue)',itens.length,'Total'],['var(--green)',totalEmUso,'Em uso'],['var(--blue)',totalDisponivel,'Disponível'],['var(--amber)',totalManutencao,'Manutenção'],['var(--red)',itens.filter(i=>i.situacao==='Descartado').length,'Descartados']].map(([cor,val,lbl])=>(
            <div key={lbl} style={S.statCard}><div style={S.statVal(cor)}>{val}</div><div style={S.statLbl}>{lbl}</div><div style={S.statBar(cor)}/></div>
          ))}
        </div>
        <div style={S.toolbar}>
          <input style={S.search} placeholder="Buscar código, descrição, local, usuário..." value={busca} onChange={e=>setBusca(e.target.value)}/>
          {temFiltro && <button style={S.btnLimpar} onClick={limparFiltros}>limpar filtros</button>}
        </div>
        <div style={S.toolbar2}>
          <span style={{ fontSize:11, color:'var(--muted)', fontWeight:500 }}>Filtrar:</span>
          <select style={S.fselSm} value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}><option value="">Tipo — todos</option>{TIPOS_BEM.map(t=><option key={t}>{t}</option>)}</select>
          <select style={S.fselSm} value={filtroSit} onChange={e=>setFiltroSit(e.target.value)}><option value="">Situação — todas</option>{SITUACOES.map(s=><option key={s}>{s}</option>)}</select>
          <select style={S.fselSm} value={filtroLocal} onChange={e=>setFiltroLocal(e.target.value)}><option value="">Local — todos</option>{locais.map(l=><option key={l}>{l}</option>)}</select>
          <select style={S.fselSm} value={filtroResp} onChange={e=>setFiltroResp(e.target.value)}><option value="">Responsável — todos</option>{resps.map(r=><option key={r}>{r}</option>)}</select>
          <select style={S.fselSm} value={filtroUser} onChange={e=>setFiltroUser(e.target.value)}><option value="">Usuário — todos</option>{usuarios.map(u=><option key={u}>{u}</option>)}</select>
          <span style={{ fontSize:11, color:'var(--muted)', marginLeft:'auto' }}>{filtrados.length} de {itens.length} registros</span>
        </div>
        <div style={S.tableWrap}><table style={S.table}>
          <thead><tr><th style={S.th}>Código</th><th style={S.th}>Descrição</th><th style={S.th}>Tipo</th><th style={S.th}>Local</th><th style={S.th}>Responsável</th><th style={S.th}>Usuário</th><th style={S.th}>Situação</th><th style={S.th}>Calibração</th><th style={S.th}></th></tr></thead>
          <tbody>
            {filtrados.map(item => {
              const cor = SIT_COR[item.situacao]||'var(--muted)'
              const st  = statusCalib(item)
              return (
                <tr key={item.id} {...trHover} style={bensComOcorAberta.has(item.id) ? { borderLeft:'3px solid var(--amber)', background:'rgba(245,158,11,.02)' } : {}}>
                  <td style={{ ...S.td, fontFamily:"'JetBrains Mono', monospace", color:'var(--blue)', fontWeight:500, fontSize:12 }}>{item.codigo_barra}</td>
                  <td style={{ ...S.td, color:'var(--text)', fontWeight:500, maxWidth:220 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.descricao}</span>
                      {bensComOcorAberta.has(item.id) && (
                        <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:3, background:'var(--amber-dim)', color:'var(--amber)', border:'1px solid rgba(245,158,11,.25)', borderRadius:4, padding:'1px 6px', fontSize:10, fontWeight:700 }}>⚠ ocorrência</span>
                      )}
                    </div>
                    {item.codigo_interno && <div style={{ fontSize:11, color:'var(--purple)', marginTop:2, fontFamily:"'JetBrains Mono', monospace" }}>{item.codigo_interno}</div>}
                    {item.descricao_complementar && <div style={{ fontSize:11, color:'var(--muted)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.descricao_complementar}</div>}
                  </td>
                  <td style={S.td}>{item.tipo_bem?<span style={S.chip('var(--blue-dim)','var(--blue)')}>{item.tipo_bem}</span>:<span style={{ color:'var(--border2)' }}>—</span>}</td>
                  <td style={{ ...S.td, fontSize:12 }}>{item.local||<span style={{ color:'var(--border2)' }}>—</span>}</td>
                  <td style={{ ...S.td, fontSize:12 }}>{item.responsavel?<span style={S.chip('rgba(167,139,250,.1)','#a78bfa')}>{item.responsavel}</span>:<span style={{ color:'var(--border2)' }}>—</span>}</td>
                  <td style={{ ...S.td, fontSize:12 }}>{item.usuario_patrimonio?<span style={S.chip('var(--green-dim)','var(--green)')}>{item.usuario_patrimonio}</span>:<span style={{ color:'var(--border2)' }}>—</span>}</td>
                  <td style={S.td}><span style={{ background:`${cor}18`, color:cor, padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600 }}>● {item.situacao||'—'}</span></td>
                  <td style={S.td}><BadgeCalib st={st}/></td>
                  <td style={S.td}><div style={{ display:'flex', gap:4 }}>
                    <button style={S.btnGhost} onClick={()=>abrirOcorrencias(item)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Ocorrências</button>
                    {isAdmin && <button style={S.btnSm} onClick={()=>abrirEditar(item)}>Editar</button>}
                    {isAdmin && <button style={S.btnDanger} onClick={()=>excluir(item.id)}>✕</button>}
                  </div></td>
                </tr>
              )
            })}
            {filtrados.length===0&&<tr><td colSpan={9} style={{ ...S.td, textAlign:'center', padding:40, color:'var(--muted)' }}>{loading?'Carregando...':'Nenhum patrimônio encontrado.'}</td></tr>}
          </tbody>
        </table></div>
      </>)}

      {aba === 'ocorrencias' && (
        <div>
          <div style={S.toolbar2}>
            <span style={{ fontSize:11, color:'var(--muted)', fontWeight:500 }}>Filtrar:</span>
            <select style={S.fselSm} value={filtroOcorTipo} onChange={e=>setFiltroOcorTipo(e.target.value)}><option value="">Tipo — todos</option>{TIPOS_OCOR.map(t=><option key={t}>{t}</option>)}</select>
            <select style={S.fselSm} value={filtroOcorStatus} onChange={e=>setFiltroOcorStatus(e.target.value)}><option value="">Status — todos</option><option>Aberto</option><option>Resolvido</option></select>
            {(filtroOcorTipo||filtroOcorStatus)&&<button style={S.btnLimpar} onClick={()=>{setFiltroOcorTipo('');setFiltroOcorStatus('')}}>limpar</button>}
            <span style={{ fontSize:11, color:'var(--muted)', marginLeft:'auto' }}>{ocorFiltradas.length} de {todasOcor.length} ocorrências</span>
          </div>
          <div style={S.tableWrap}><table style={S.table}>
            <thead><tr><th style={S.th}>Data</th><th style={S.th}>Tipo</th><th style={S.th}>Código</th><th style={S.th}>Bem</th><th style={S.th}>Local · Usuário</th><th style={S.th}>Descrição</th><th style={S.th}>Chamado</th><th style={S.th}>Status</th><th style={S.th}></th></tr></thead>
            <tbody>
              {ocorFiltradas.map(o => {
                const [bg,cor] = OCOR_COR[o.tipo]||OCOR_COR['Outro']
                return (
                  <tr key={o.id} {...trHover}>
                    <td style={{ ...S.td, fontFamily:"'JetBrains Mono', monospace", fontSize:11, whiteSpace:'nowrap' }}>{fmtData(o.data_abertura)}</td>
                    <td style={S.td}><span style={S.chip(bg,cor)}>{o.tipo}</span></td>
                    <td style={{ ...S.td, fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:'var(--blue)', fontWeight:500 }}>{o.patrimonios?.codigo_barra||'—'}</td>
                    <td style={{ ...S.td, color:'var(--text)', fontWeight:500, maxWidth:180 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.patrimonios?.descricao||'—'}</div></td>
                    <td style={{ ...S.td, fontSize:11 }}><div style={{ color:'var(--text2)' }}>{o.patrimonios?.local||<span style={{ color:'var(--border2)' }}>—</span>}</div>{o.patrimonios?.usuario_patrimonio&&<div style={{ marginTop:2 }}><span style={S.chip('var(--green-dim)','var(--green)')}>{o.patrimonios.usuario_patrimonio}</span></div>}</td>
                    <td style={{ ...S.td, maxWidth:200 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.descricao}</div></td>
                    <td style={{ ...S.td, fontFamily:"'JetBrains Mono', monospace", fontSize:11 }}>{o.chamado||<span style={{ color:'var(--border2)' }}>—</span>}</td>
                    <td style={S.td}><span style={{ background:o.status==='Aberto'?'rgba(245,158,11,.1)':'var(--green-dim)', color:o.status==='Aberto'?'var(--amber)':'var(--green)', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>{o.status}</span></td>
                    <td style={S.td}><div style={{ display:'flex', gap:4 }}>
                      <button style={S.btnGhost} onClick={()=>setOcorDetalhe(o)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></button>
                      {isAdmin&&<button style={S.btnSm} onClick={()=>{setItemSel(itens.find(i=>i.id===o.patrimonio_id)||{id:o.patrimonio_id,descricao:o.patrimonios?.descricao});abrirEditarOcor(o)}}>Editar</button>}
                      {isAdmin&&<button style={S.btnDanger} onClick={()=>excluirOcorGlobal(o)}>✕</button>}
                    </div></td>
                  </tr>
                )
              })}
              {ocorFiltradas.length===0&&<tr><td colSpan={9} style={{ ...S.td, textAlign:'center', padding:40, color:'var(--muted)' }}>Nenhuma ocorrência encontrada.</td></tr>}
            </tbody>
          </table></div>
        </div>
      )}

      {aba === 'calibracoes' && (<>
        <div style={S.abas}>
          <button style={S.aba(abaCalib==='equipamentos')} onClick={()=>setAbaCalib('equipamentos')}>Equipamentos</button>
          <button style={S.aba(abaCalib==='pedidos')} onClick={()=>setAbaCalib('pedidos')}>
            Pedidos <span style={{ marginLeft:4, background:'var(--blue-dim)', color:'var(--blue)', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{pedidos.length}</span>
          </button>
          <button style={S.aba(abaCalib==='historico')} onClick={()=>setAbaCalib('historico')}>Histórico</button>
        </div>

        {abaCalib === 'equipamentos' && (<>
          <div style={S.stats}>
            {[['var(--blue)',calibStats.total,'Total'],['var(--green)',calibStats.em_dia,'Em dia'],['var(--amber)',calibStats.a_vencer,'A vencer'],['var(--red)',calibStats.vencida,'Vencida'],['var(--muted)',calibStats.pendente,'Pendente']].map(([cor,val,lbl])=>(
              <div key={lbl} style={S.statCard}><div style={S.statVal(cor)}>{val}</div><div style={S.statLbl}>{lbl}</div><div style={S.statBar(cor)}/></div>
            ))}
          </div>
          {calibStats.vencida > 0 && (
            <div style={S.alerta}>
              <div style={{ width:36, height:36, borderRadius:9, background:'rgba(248,113,113,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:3 }}>{calibStats.vencida} calibração{calibStats.vencida>1?'ões':''} vencida{calibStats.vencida>1?'s':''}</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Verifique se já há um pedido em andamento</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {equipCalib.filter(e=>statusCalib(e)==='vencida').map(e=><span key={e.id} style={{ background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.2)', borderRadius:6, padding:'3px 10px', fontSize:12, color:'var(--red)', fontWeight:500 }}>{e.codigo_interno||e.descricao.slice(0,15)} · {Math.abs(diasAte(e.proxima_calibracao)||0)}d atraso</span>)}
                </div>
              </div>
            </div>
          )}
          {calibStats.a_vencer > 0 && (
            <div style={S.alertaAmb}>
              <div style={{ width:36, height:36, borderRadius:9, background:'rgba(251,191,36,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--amber)', marginBottom:3 }}>{calibStats.a_vencer} a vencer em até 30 dias</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                  {equipCalib.filter(e=>statusCalib(e)==='a_vencer').map(e=><span key={e.id} style={{ background:'rgba(251,191,36,.1)', border:'1px solid rgba(251,191,36,.2)', borderRadius:6, padding:'3px 10px', fontSize:12, color:'var(--amber)', fontWeight:500 }}>{e.codigo_interno||e.descricao.slice(0,15)} · {diasAte(e.proxima_calibracao)}d</span>)}
                </div>
              </div>
            </div>
          )}
          <div style={S.toolbar}>
            <input style={S.search} placeholder="Buscar equipamento, código interno..." value={buscaCalib} onChange={e=>setBuscaCalib(e.target.value)}/>
            {['','em_dia','a_vencer','vencida','pendente'].map((f,i)=>(
              <button key={f} style={S.filtro(filtroCalibSt===f)} onClick={()=>setFiltroCalibSt(f)}>{['Todos','Em dia','A vencer','Vencida','Pendente'][i]}</button>
            ))}
          </div>
          <div style={S.tableWrap}><table style={S.table}>
            <thead><tr><th style={S.th}>Código Interno</th><th style={S.th}>Bem / Modelo</th><th style={S.th}>Tipo</th><th style={S.th}>Última Calibração</th><th style={S.th}>Próxima</th><th style={S.th}>Prazo</th><th style={S.th}>Status</th><th style={S.th}>Pedido Ativo</th></tr></thead>
            <tbody>
              {equipFiltrados.map(e => {
                const st   = statusCalib(e)
                const dias = diasAte(e.proxima_calibracao)
                const pct  = pctCalib(e)
                const pedAtivo = pedidoAtivoPorEquip(e.id)
                const diasEl = dias === null ? <span style={{ color:'var(--muted)' }}>—</span> :
                  dias < 0  ? <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:'var(--red)' }}>{Math.abs(dias)}d atraso</span> :
                  dias <= 30 ? <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:'var(--amber)' }}>{dias}d</span> :
                               <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:'var(--green)' }}>{dias}d</span>
                return (
                  <tr key={e.id} {...trHover}>
                    <td><span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--purple)', fontWeight:500, fontSize:12 }}>{e.codigo_interno||'—'}</span></td>
                    <td style={{ color:'var(--text)', fontWeight:500 }}>{e.descricao}<div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:'var(--muted)', marginTop:2 }}>{e.codigo_barra}</div></td>
                    <td>{e.tipo_bem?<span style={S.chip('var(--blue-dim)','var(--blue)')}>{e.tipo_bem}</span>:null}</td>
                    <td style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12 }}>{fmtData(e.ultima_calibracao)}</td>
                    <td><div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12, color:st==='vencida'?'var(--red)':undefined }}>{fmtData(e.proxima_calibracao)}</div>{e.ultima_calibracao&&e.proxima_calibracao&&<ProgBar pct={pct} st={st}/>}</td>
                    <td>{diasEl}</td>
                    <td><BadgeCalib st={st}/></td>
                    <td>{pedAtivo?<span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:'var(--purple)', fontWeight:600 }}>{pedAtivo.numero}</span>:<span style={{ color:'var(--border2)' }}>—</span>}</td>
                  </tr>
                )
              })}
              {equipFiltrados.length===0&&<tr><td colSpan={8} style={{ ...S.td, textAlign:'center', padding:40, color:'var(--muted)' }}>Nenhum equipamento encontrado.</td></tr>}
            </tbody>
          </table></div>
        </>)}

        {abaCalib === 'pedidos' && (<>
          <div style={S.stats}>
            {[['var(--blue)',pedidoStats.total,'Total'],['var(--amber)',pedidoStats.em_andamento,'Em andamento'],['var(--green)',pedidoStats.concluido,'Concluídos'],['var(--muted)',pedidoStats.pag_sol,'Pag. Solicitado']].map(([cor,val,lbl])=>(
              <div key={lbl} style={S.statCard}><div style={S.statVal(cor)}>{val}</div><div style={S.statLbl}>{lbl}</div><div style={S.statBar(cor)}/></div>
            ))}
          </div>
          <div style={S.toolbar}>
            {isAdmin && <button style={S.btn} onClick={abrirNovoPedido}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Novo Pedido</button>}
            {['','em_andamento','concluido','pag_solicitado'].map((f,i)=>(
              <button key={f} style={S.filtro(filtroPedidoSt===f)} onClick={()=>setFiltroPedidoSt(f)}>{['Todos','Em andamento','Concluído','Pag. Solicitado'][i]}</button>
            ))}
          </div>
          {pedidosFiltrados.map(pedido => {
            const itensP = pedidoItens.filter(pi => pi.pedido_id === pedido.id)
            const stMap = { em_andamento:['var(--amber-dim)','var(--amber)','Em andamento'], concluido:['var(--green-dim)','var(--green)','Concluído'], pag_solicitado:['var(--subtle)','var(--muted)','Pag. Solicitado'] }
            const [stBg,stCor,stLabel] = stMap[pedido.status]||stMap.em_andamento
            return (
              <div key={pedido.id} style={S.pedidoCard}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--blue)', fontWeight:600, fontSize:14 }}>{pedido.numero}</span>
                      <span style={{ background:stBg, color:stCor, padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600 }}>● {stLabel}</span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text)', fontWeight:500, marginBottom:3 }}>{pedido.fornecedor}</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>
                      {pedido.chamado&&<>Chamado: <span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--purple)' }}>#{pedido.chamado}</span>{' · '}</>}
                      {pedido.numero_pedido&&<>Pedido: <span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--purple)' }}>{pedido.numero_pedido}</span>{' · '}</>}
                      {pedido.data_abertura&&<>Abertura: {fmtData(pedido.data_abertura)}</>}
                      {pedido.data_conclusao&&<> · Concluído: {fmtData(pedido.data_conclusao)}</>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>Valor global</div>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:18, fontWeight:500, color:'var(--green)' }}>{pedido.valor_global?Number(pedido.valor_global).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—'}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em' }}>Equipamentos neste pedido</span>
                  {(() => {
                    const total = itensP.length
                    const done  = itensP.filter(pi => pi.data_calibracao).length
                    if (total === 0) return null
                    return (
                      <span style={{ fontSize:11, fontWeight:600, color: done === total ? 'var(--green)' : done > 0 ? 'var(--amber)' : 'var(--muted)', background: done === total ? 'var(--green-dim)' : done > 0 ? 'var(--amber-dim)' : 'var(--subtle)', padding:'1px 8px', borderRadius:4 }}>
                        {done}/{total} calibrados
                      </span>
                    )
                  })()}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  {itensP.map(pi => {
                    const calibrado = !!pi.data_calibracao
                    const equip     = itens.find(i => i.id === pi.patrimonio_id)
                    return (
                      <div key={pi.id} style={{ display:'flex', alignItems:'center', gap:10, background: calibrado ? 'rgba(5,150,105,.04)' : 'var(--surface2)', border: `1px solid ${calibrado ? 'rgba(5,150,105,.2)' : 'var(--border2)'}`, borderRadius:8, padding:'8px 12px' }}>
                        {/* Ícone status */}
                        <div style={{ width:22, height:22, borderRadius:'50%', background: calibrado ? 'var(--green-dim)' : 'var(--subtle)', border: `1px solid ${calibrado ? 'rgba(5,150,105,.3)' : 'var(--border2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, color: calibrado ? 'var(--green)' : 'var(--muted)' }}>
                          {calibrado ? '✓' : '○'}
                        </div>
                        {/* Info do equipamento */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--purple)', fontSize:11, fontWeight:600 }}>{pi.patrimonios?.codigo_interno||pi.patrimonios?.codigo_barra}</span>
                            <span style={{ fontSize:12, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pi.patrimonios?.descricao?.split(' ').slice(0,4).join(' ')}</span>
                          </div>
                          {calibrado && (
                            <div style={{ fontSize:11, color:'var(--green)', marginTop:2 }}>
                              Calibrado em {fmtData(pi.data_calibracao)}
                              {equip?.proxima_calibracao && <> · Próxima: {fmtData(equip.proxima_calibracao)}</>}
                            </div>
                          )}
                        </div>
                        {/* Botão marcar */}
                        {isAdmin && pedido.status === 'em_andamento' && !calibrado && (
                          <button
                            style={{ ...S.btnGreen, fontSize:11, padding:'3px 10px', flexShrink:0 }}
                            onClick={() => { setModalItemCalib({ pi, pedido }); setDataItemCalib('') }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Marcar calibrado
                          </button>
                        )}
                        {calibrado && (
                          <span style={{ background:'var(--green-dim)', color:'var(--green)', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700, flexShrink:0 }}>Concluído</span>
                        )}
                      </div>
                    )
                  })}
                  {itensP.length===0&&<span style={{ color:'var(--muted)', fontSize:12 }}>Nenhum equipamento vinculado</span>}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:'1px solid var(--border)' }}>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{itensP.length} equipamento{itensP.length!==1?'s':''}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {isAdmin && pedido.status==='em_andamento' && (
                      <button style={S.btnGreen} onClick={()=>abrirConcluir(pedido)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Concluir serviço</button>
                    )}
                    {isAdmin && pedido.status==='concluido' && (
                      <button style={S.btnGreen} onClick={()=>abrirConcluir(pedido)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Solicitar Pagamento</button>
                    )}
                    {isAdmin && <button style={S.btnSm} onClick={()=>abrirEditarPedido(pedido)}>Editar</button>}
                    {isAdmin && <button style={S.btnDanger} onClick={()=>excluirPedido(pedido.id)}>✕</button>}
                  </div>
                </div>
              </div>
            )
          })}
          {pedidosFiltrados.length===0&&<div style={{ textAlign:'center', padding:40, color:'var(--muted)', fontSize:13 }}>Nenhum pedido encontrado.</div>}
        </>)}

        {abaCalib === 'historico' && (<>
          <div style={S.toolbar2}>
            <span style={{ fontSize:11, color:'var(--muted)', fontWeight:500 }}>Filtrar:</span>
            <select style={S.fselSm}><option value="">Equipamento — todos</option>{equipCalib.map(e=><option key={e.id} value={e.id}>{e.codigo_interno||e.codigo_barra}</option>)}</select>
            <select style={S.fselSm}><option value="">Pedido — todos</option>{pedidos.map(p=><option key={p.id} value={p.id}>{p.numero}</option>)}</select>
          </div>
          <div style={S.tableWrap}><table style={S.table}>
            <thead><tr><th style={S.th}>Data</th><th style={S.th}>Código</th><th style={S.th}>Equipamento</th><th style={S.th}>Pedido</th><th style={S.th}>Fornecedor</th><th style={S.th}>Nº Pedido</th><th style={S.th}>Próxima</th></tr></thead>
            <tbody>
              {pedidoItens.filter(pi=>pi.data_calibracao).map(pi => {
                const pedido = pedidos.find(p=>p.id===pi.pedido_id)
                const equip  = itens.find(i=>i.id===pi.patrimonio_id)
                return (
                  <tr key={pi.id} {...trHover}>
                    <td style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12 }}>{fmtData(pi.data_calibracao)}</td>
                    <td><span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--purple)', fontSize:12, fontWeight:500 }}>{equip?.codigo_interno||equip?.codigo_barra||'—'}</span></td>
                    <td style={{ color:'var(--text)', fontWeight:500 }}>{equip?.descricao||'—'}</td>
                    <td><span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--blue)', fontSize:12 }}>{pedido?.numero||'—'}</span></td>
                    <td style={{ fontSize:12 }}>{pedido?.fornecedor||'—'}</td>
                    <td><span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--purple)', fontSize:12 }}>{pedido?.numero_pedido||'—'}</span></td>
                    <td style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12 }}>{equip?.proxima_calibracao?fmtData(equip.proxima_calibracao):'—'}</td>
                  </tr>
                )
              })}
              {pedidoItens.filter(pi=>pi.data_calibracao).length===0&&<tr><td colSpan={7} style={{ ...S.td, textAlign:'center', padding:40, color:'var(--muted)' }}>Nenhuma calibração registrada ainda.</td></tr>}
            </tbody>
          </table></div>
        </>)}
      </>)}

      {modal === 'form' && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{itemSel?'Editar Patrimônio':'Novo Patrimônio'}</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.sectionLabel}>Identificação</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Código de Barra *</label><input style={S.input} value={form.codigo_barra} onChange={e=>setForm({...form,codigo_barra:e.target.value})} placeholder="Ex: 001234567"/></div>
              <div style={S.field}><label style={S.label}>Tipo de Bem</label><select style={S.fsel} value={form.tipo_bem} onChange={e=>setForm({...form,tipo_bem:e.target.value})}><option value="">Selecione...</option>{TIPOS_BEM.map(t=><option key={t}>{t}</option>)}</select></div>
            </div>
            <div style={S.field}><label style={S.label}>Descrição *</label><textarea style={S.textarea} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} placeholder="Ex: Notebook Dell Inspiron 15" rows={2}/></div>
            <div style={S.field}><label style={S.label}>Descrição Complementar</label><input style={S.input} value={form.descricao_complementar} onChange={e=>setForm({...form,descricao_complementar:e.target.value})} placeholder="Informações adicionais"/></div>
            <div style={S.sectionLabel}>Localização e Responsabilidade</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Local</label><input style={S.input} value={form.local} onChange={e=>setForm({...form,local:e.target.value})} placeholder="Ex: Depósito EE"/></div>
              <div style={S.field}><label style={S.label}>Unidade</label><input style={S.input} value={form.unidade} onChange={e=>setForm({...form,unidade:e.target.value})} placeholder="Ex: Sede Recife"/></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Responsável</label><input style={S.input} value={form.responsavel} onChange={e=>setForm({...form,responsavel:e.target.value})} placeholder="Quem responde pelo bem"/></div>
              <div style={S.field}>
                <label style={S.label}>Usuário do Patrimônio</label>
                <input list="lista-colaboradores-pat" style={S.input} value={form.usuario_patrimonio} onChange={e => setForm({...form, usuario_patrimonio: e.target.value})} placeholder="Selecione ou digite..." />
                <datalist id="lista-colaboradores-pat">
                  {colaboradoresLista.map(c => <option key={c.id} value={c.nome} />)}
                </datalist>
              </div>
            </div>
            <div style={S.sectionLabel}>Status e Aquisição</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Situação</label><select style={S.fsel} value={form.situacao} onChange={e=>setForm({...form,situacao:e.target.value})}>{SITUACOES.map(s=><option key={s}>{s}</option>)}</select></div>
              <div style={S.field}><label style={S.label}>Data de Aquisição</label><input type="date" style={S.input} value={form.data_aquisicao} onChange={e=>setForm({...form,data_aquisicao:e.target.value})}/></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Valor de Aquisição</label><input style={S.input} value={form.valor_aquisicao} onChange={e=>setForm({...form,valor_aquisicao:e.target.value})} placeholder="Ex: 2.500,00"/></div>
              <div style={S.field}><label style={S.label}>Saldo Contábil</label><input style={S.input} value={form.saldo_contabil} onChange={e=>setForm({...form,saldo_contabil:e.target.value})} placeholder="Ex: 1.800,00"/></div>
            </div>
            <div style={S.sectionLabel}>Calibração</div>
            <div style={S.infoPurple}>Se este bem requer calibração periódica, configure abaixo. Ele aparecerá automaticamente na aba Calibrações.</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Código Interno</label><input style={S.input} value={form.codigo_interno} onChange={e=>setForm({...form,codigo_interno:e.target.value})} placeholder="Ex: AQE1 435, CAM1 FLIR"/></div>
              <div style={S.field}><label style={S.label}>Requer calibração?</label><select style={S.fsel} value={form.requer_calibracao?'sim':'nao'} onChange={e=>setForm({...form,requer_calibracao:e.target.value==='sim'})}><option value="nao">Não</option><option value="sim">Sim</option></select></div>
            </div>
            {form.requer_calibracao && (
              <div style={S.field}><label style={S.label}>Periodicidade</label><select style={S.fsel} value={form.periodicidade_calibracao} onChange={e=>setForm({...form,periodicidade_calibracao:parseInt(e.target.value)})}>{PERIODICIDADES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
            )}
            <div style={S.row}><button style={S.btnSm} onClick={()=>setModal(false)}>Cancelar</button><button style={S.btn} onClick={salvar} disabled={salvando}>{salvando?'Salvando...':'Salvar'}</button></div>
          </div>
        </div>
      )}

      {modal === 'ocorrencias' && itemSel && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ ...S.modalBox, maxWidth:560 }}>
            <div style={S.modalTitle}>{itemSel.descricao}</div>
            <div style={S.modalSub}>{itemSel.codigo_barra}{itemSel.local?` · ${itemSel.local}`:''}</div>
            <div style={S.abas}>
              <button style={S.aba(abaModal==='ocorrencias')} onClick={()=>setAbaModal('ocorrencias')}>Ocorrências</button>
              <button style={S.aba(abaModal==='historico')} onClick={()=>setAbaModal('historico')}>Histórico de edições</button>
            </div>
            {abaModal === 'ocorrencias' && (<>
              {isAdmin&&<button style={{ ...S.btnGreen, marginBottom:14, fontSize:12 }} onClick={abrirNovaOcor}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Nova ocorrência</button>}
              {ocorrencias.length===0?<div style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'24px 0' }}>Nenhuma ocorrência registrada.</div>
                :ocorrencias.map(o=>{const [bg,cor]=OCOR_COR[o.tipo]||OCOR_COR['Outro'];return(<div key={o.id} style={S.ocorRow}><div style={S.ocorDot(cor)}/><div style={{ flex:1 }}><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}><div><span style={S.chip(bg,cor)}>{o.tipo}</span><span style={S.chip(o.status==='Aberto'?'rgba(245,158,11,.1)':'var(--green-dim)',o.status==='Aberto'?'var(--amber)':'var(--green)')}>{o.status}</span></div><div style={{ display:'flex', gap:4, alignItems:'center' }}><span style={{ fontSize:11, color:'var(--muted)' }}>{fmtData(o.data_abertura)}</span>{isAdmin&&<><button style={S.btnSm} onClick={()=>abrirEditarOcor(o)}>Editar</button><button style={S.btnDanger} onClick={()=>excluirOcor(o.id)}>✕</button></>}</div></div><div style={{ fontSize:13, color:'var(--text)', marginBottom:4 }}>{o.descricao}</div>{o.chamado&&<div style={{ fontSize:11, color:'var(--muted)' }}>Chamado: <span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--text2)' }}>{o.chamado}</span></div>}{o.data_resolucao&&<div style={{ fontSize:11, color:'var(--muted)' }}>Resolvido em: {fmtData(o.data_resolucao)}</div>}</div></div>)})}
            </>)}
            {abaModal === 'historico' && (<>
              {historico.length===0?<div style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'24px 0' }}>Nenhuma alteração registrada.</div>
                :historico.map(h=><div key={h.id} style={S.histRow}><div style={S.histDot}/><div style={{ flex:1, fontSize:12, color:'var(--text2)', lineHeight:1.6 }}><strong style={{ color:'var(--text)' }}>{h.campo_alterado}</strong><span style={{ color:'var(--muted)' }}> · {new Date(h.created_at).toLocaleString('pt-BR')}</span><div><span style={{ color:'var(--red)', textDecoration:'line-through' }}>{h.valor_anterior||'(vazio)'}</span>{' → '}<span style={{ color:'var(--green)' }}>{h.valor_novo||'(vazio)'}</span></div></div></div>)}
            </>)}
            <div style={S.row}><button style={S.btnSm} onClick={()=>setModal(false)}>Fechar</button></div>
          </div>
        </div>
      )}

      {modalOcor && (
        <div style={{ ...S.modal, zIndex:110 }} onClick={e=>e.target===e.currentTarget&&setModalOcor(false)}>
          <div style={{ ...S.modalBox, maxWidth:480 }}>
            <div style={S.modalTitle}>{ocorSel?'Editar Ocorrência':'Nova Ocorrência'}</div>
            <div style={S.modalSub}>{itemSel?.descricao}</div>
            {erroOcor&&<div style={S.erro}>{erroOcor}</div>}
            <div style={S.field}><label style={S.label}>Tipo de ocorrência</label><select style={S.fsel} value={formOcor.tipo} onChange={e=>setFormOcor({...formOcor,tipo:e.target.value})}>{TIPOS_OCOR.map(t=><option key={t}>{t}</option>)}</select></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data de abertura</label><input type="date" style={S.input} value={formOcor.data_abertura} onChange={e=>setFormOcor({...formOcor,data_abertura:e.target.value})}/></div>
              <div style={S.field}><label style={S.label}>Nº do chamado (opcional)</label><input style={S.input} value={formOcor.chamado} onChange={e=>setFormOcor({...formOcor,chamado:e.target.value})} placeholder="Ex: CHM-2026-0042"/></div>
            </div>
            <div style={S.field}><label style={S.label}>Descrição *</label><textarea style={S.textarea} value={formOcor.descricao} onChange={e=>setFormOcor({...formOcor,descricao:e.target.value})} placeholder="Descreva a ocorrência..."/></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Status</label><select style={S.fsel} value={formOcor.status} onChange={e=>setFormOcor({...formOcor,status:e.target.value})}><option>Aberto</option><option>Resolvido</option></select></div>
              <div style={{ ...S.field, opacity:formOcor.status==='Resolvido'?1:.4 }}><label style={S.label}>Data de resolução</label><input type="date" style={S.input} value={formOcor.data_resolucao} disabled={formOcor.status!=='Resolvido'} onChange={e=>setFormOcor({...formOcor,data_resolucao:e.target.value})}/></div>
            </div>
            <div style={S.row}><button style={S.btnSm} onClick={()=>setModalOcor(false)}>Cancelar</button><button style={S.btn} onClick={salvarOcor} disabled={salvandoOcor}>{salvandoOcor?'Salvando...':'Salvar'}</button></div>
          </div>
        </div>
      )}

      {modalPedido && (
        <div style={{ ...S.modal, zIndex:110 }} onClick={e=>e.target===e.currentTarget&&setModalPedido(false)}>
          <div style={{ ...S.modalBox, maxWidth:540 }}>
            <div style={S.modalTitle}>{editandoPedido?'Editar Pedido':'Novo Pedido de Calibração'}</div>
            <div style={S.modalSub}>Preencha os dados do processo de compras e selecione os equipamentos</div>
            {erroPedido&&<div style={S.erro}>{erroPedido}</div>}
            <div style={S.field}><label style={S.label}>Fornecedor *</label><input style={S.input} value={formPedido.fornecedor} onChange={e=>setFormPedido({...formPedido,fornecedor:e.target.value})} placeholder="Nome da empresa executora"/></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Nº Chamado (Compras)</label><input style={S.input} value={formPedido.chamado} onChange={e=>setFormPedido({...formPedido,chamado:e.target.value})} placeholder="Ex: 1420100"/></div>
              <div style={S.field}><label style={S.label}>Data de Abertura</label><input type="date" style={S.input} value={formPedido.data_abertura} onChange={e=>setFormPedido({...formPedido,data_abertura:e.target.value})}/></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Nº do Pedido <span style={{ color:'var(--muted)', fontWeight:400 }}>(após adjudicação)</span></label><input style={S.input} value={formPedido.numero_pedido} onChange={e=>setFormPedido({...formPedido,numero_pedido:e.target.value})} placeholder="Preenchido quando compras devolver"/></div>
              <div style={S.field}><label style={S.label}>Valor Global (R$)</label><input type="number" style={S.input} value={formPedido.valor_global} onChange={e=>setFormPedido({...formPedido,valor_global:e.target.value})} placeholder="Ex: 4200.00"/></div>
            </div>
            <div style={S.sectionLabel}>Equipamentos</div>
            <div style={S.infoBox}>Selecione os bens que serão calibrados. As datas serão atualizadas ao concluir.</div>
            <div style={S.field}><label style={S.label}>Equipamentos calibráveis</label>
              <div style={S.equipCheckList}>
                {equipCalib.map(e=>(
                  <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px', borderRadius:6, cursor:'pointer', background:pedidoEquips.includes(e.id)?'rgba(79,142,247,.06)':'transparent' }} onClick={()=>toggleEquip(e.id)}>
                    <input type="checkbox" checked={pedidoEquips.includes(e.id)} onChange={()=>toggleEquip(e.id)} style={{ width:14, height:14, accentColor:'var(--blue)', cursor:'pointer' }}/>
                    <span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--purple)', fontSize:12, fontWeight:600 }}>{e.codigo_interno||e.codigo_barra}</span>
                    <span style={{ fontSize:12, color:'var(--text2)' }}>{e.descricao}</span>
                    <BadgeCalib st={statusCalib(e)}/>
                  </div>
                ))}
                {equipCalib.length===0&&<div style={{ color:'var(--muted)', fontSize:12, padding:'8px 0', textAlign:'center' }}>Nenhum equipamento com calibração ativa. Configure em Bens.</div>}
              </div>
            </div>
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={{ ...S.textarea, minHeight:60 }} value={formPedido.observacoes} onChange={e=>setFormPedido({...formPedido,observacoes:e.target.value})} placeholder="TR, observações sobre o processo..."/></div>
            <div style={S.row}><button style={S.btnSm} onClick={()=>setModalPedido(false)}>Cancelar</button><button style={S.btn} onClick={salvarPedido} disabled={salvandoPedido}>{salvandoPedido?'Salvando...':'Salvar Pedido'}</button></div>
          </div>
        </div>
      )}

      {modalConcluir && pedidoConcluindo && (
        <div style={{ ...S.modal, zIndex:110 }} onClick={e=>e.target===e.currentTarget&&setModalConcluir(false)}>
          <div style={{ ...S.modalBox, maxWidth:520 }}>
            <div style={S.modalTitle}>Concluir Serviço</div>
            <div style={S.modalSub}>{pedidoConcluindo.numero} · {pedidoConcluindo.fornecedor}</div>
            <div style={S.infoAmber}>Ao concluir, as datas de calibração de todos os equipamentos vinculados serão atualizadas automaticamente.</div>
            <div style={S.sectionLabel}>Data de conclusão</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data em que os equipamentos foram entregues</label><input type="date" style={S.input} value={dataConclusao} onChange={e=>aoMudarDataConclusao(e.target.value)}/></div>
              <div style={S.field}><label style={S.label}>Próxima calibração (auto)</label><input type="date" style={S.input} value={proximaAuto} onChange={e=>setProximaAuto(e.target.value)}/></div>
            </div>
            <div style={S.sectionLabel}>Equipamentos que serão atualizados</div>
            <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', marginBottom:14 }}>
              {pedidoItens.filter(pi=>pi.pedido_id===pedidoConcluindo.id).map((pi,i,arr)=>(
                <div key={pi.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:i<arr.length-1?'1px solid var(--border)':'none' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--purple)', fontSize:12, fontWeight:600 }}>{pi.patrimonios?.codigo_interno||pi.patrimonios?.codigo_barra}</span>
                    <span style={{ fontSize:12, color:'var(--text2)' }}>{pi.patrimonios?.descricao?.split(' ').slice(0,4).join(' ')}</span>
                  </div>
                  <span style={{ background:'var(--green-dim)', color:'var(--green)', padding:'1px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>✓ Será atualizado</span>
                </div>
              ))}
              {pedidoItens.filter(pi=>pi.pedido_id===pedidoConcluindo.id).length===0&&<div style={{ color:'var(--muted)', fontSize:12, textAlign:'center' }}>Nenhum equipamento vinculado</div>}
            </div>
            {pedidoConcluindo.status !== 'pag_solicitado' && (<>
              <div style={S.sectionLabel}>Solicitação de pagamento</div>
              <div style={S.infoGreen}><strong>Integração com Financeiro:</strong> Envie uma solicitação com os dados deste pedido pré-preenchidos.</div>
              <div style={{ background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, padding:'14px', marginBottom:14 }}>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10, fontWeight:600 }}>Enviar solicitação de pagamento ao Financeiro?</div>
                <div style={{ display:'flex', gap:16 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:'var(--text2)' }}><input type="radio" name="enviar-fin" checked={enviarFinanceiro} onChange={()=>setEnviarFinanceiro(true)} style={{ accentColor:'var(--green)' }}/> Sim, enviar agora</label>
                  <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:'var(--text2)' }}><input type="radio" name="enviar-fin" checked={!enviarFinanceiro} onChange={()=>setEnviarFinanceiro(false)} style={{ accentColor:'var(--green)' }}/> Não, enviarei depois</label>
                </div>
              </div>
            </>)}
            <div style={S.row}>
              <button style={S.btnSm} onClick={()=>setModalConcluir(false)}>Cancelar</button>
              <button style={S.btnGreen} onClick={concluirPedido} disabled={salvandoConcluir}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {salvandoConcluir?'Salvando...':'Concluir e atualizar equipamentos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ocorDetalhe && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setOcorDetalhe(null)}>
          <div style={{ ...S.modalBox, maxWidth:460 }}>
            <div style={S.modalTitle}>Detalhes da Ocorrência</div>
            <div style={S.modalSub}>{ocorDetalhe.patrimonios?.descricao} · <span style={{ fontFamily:"'JetBrains Mono', monospace", color:'var(--blue)' }}>{ocorDetalhe.patrimonios?.codigo_barra}</span></div>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>{(()=>{const [bg,cor]=OCOR_COR[ocorDetalhe.tipo]||OCOR_COR['Outro'];return<span style={S.chip(bg,cor)}>{ocorDetalhe.tipo}</span>})()}<span style={{ background:ocorDetalhe.status==='Aberto'?'rgba(245,158,11,.1)':'var(--green-dim)', color:ocorDetalhe.status==='Aberto'?'var(--amber)':'var(--green)', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>{ocorDetalhe.status}</span></div>
            <div style={S.sectionLabel}>Bem patrimonial</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div><div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Local</div><div style={{ fontSize:13, color:'var(--text)' }}>{ocorDetalhe.patrimonios?.local||'—'}</div></div>
              <div><div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Usuário</div><div style={{ fontSize:13 }}>{ocorDetalhe.patrimonios?.usuario_patrimonio?<span style={S.chip('var(--green-dim)','var(--green)')}>{ocorDetalhe.patrimonios.usuario_patrimonio}</span>:'—'}</div></div>
            </div>
            <div style={S.sectionLabel}>Ocorrência</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Data de abertura</div><div style={{ fontSize:13, color:'var(--text)' }}>{fmtData(ocorDetalhe.data_abertura)}</div></div>
              {ocorDetalhe.chamado&&<div><div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Nº do chamado</div><div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:13, color:'var(--text)' }}>{ocorDetalhe.chamado}</div></div>}
              {ocorDetalhe.data_resolucao&&<div><div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Resolvido em</div><div style={{ fontSize:13, color:'var(--green)' }}>{fmtData(ocorDetalhe.data_resolucao)}</div></div>}
            </div>
            <div style={{ marginBottom:18 }}><div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:6 }}>Descrição</div><div style={{ fontSize:13, color:'var(--text)', lineHeight:1.6, background:'var(--surface2)', borderRadius:7, padding:'10px 12px' }}>{ocorDetalhe.descricao}</div></div>
            <div style={S.row}>
              {isAdmin&&<button style={S.btnSm} onClick={()=>{setItemSel(itens.find(i=>i.id===ocorDetalhe.patrimonio_id)||{id:ocorDetalhe.patrimonio_id,descricao:ocorDetalhe.patrimonios?.descricao});abrirEditarOcor(ocorDetalhe);setOcorDetalhe(null)}}>Editar</button>}
              <button style={S.btnSm} onClick={()=>setOcorDetalhe(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DIFF ── */}
      {modalDiff && diffResult && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalDiff(false)}>
          <div style={{ ...S.modalBox, maxWidth: 680 }}>
            <div style={S.modalTitle}>Comparação de arquivos</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
              Revise as diferenças detectadas e escolha o que aplicar.
            </div>

            {/* Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(5,150,105,.2)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: 'var(--green)', lineHeight: 1, marginBottom: 4 }}>{diffResult.novos.length}</div>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>Novos bens</div>
              </div>
              <div style={{ background: 'var(--amber-dim)', border: '1px solid rgba(217,119,6,.2)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: 'var(--amber)', lineHeight: 1, marginBottom: 4 }}>{diffResult.alterados.length}</div>
                <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>Com alterações</div>
              </div>
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: 'var(--red)', lineHeight: 1, marginBottom: 4 }}>{diffResult.removidos.length}</div>
                <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>Removidos</div>
              </div>
            </div>

            {/* Bens novos */}
            {diffResult.novos.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}></span>
                  Novos bens ({diffResult.novos.length})
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 160, overflowY: 'auto' }}>
                  {diffResult.novos.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{b.descricao}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--green)', fontSize: 11 }}>{b.codigo_barra}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bens alterados */}
            {diffResult.alterados.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }}></span>
                  Alterados ({diffResult.alterados.length})
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 180, overflowY: 'auto' }}>
                  {diffResult.alterados.map((b, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{b.descricao}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--muted)', fontSize: 11 }}>{b.codigo_barra}</span>
                      </div>
                      {b._diffs.map((d, j) => (
                        <div key={j} style={{ display: 'flex', gap: 8, fontSize: 11, marginBottom: 3, alignItems: 'center' }}>
                          <span style={{ color: 'var(--muted)', width: 100, flexShrink: 0, textTransform: 'capitalize' }}>{d.campo.replace(/_/g,' ')}</span>
                          <span style={{ color: 'var(--red)', textDecoration: 'line-through', flex: 1 }}>{d.anterior}</span>
                          <span style={{ color: 'var(--mu)', margin: '0 4px' }}>→</span>
                          <span style={{ color: 'var(--green)', flex: 1, fontWeight: 600 }}>{d.novo}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bens removidos */}
            {diffResult.removidos.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }}></span>
                  Removidos do novo arquivo ({diffResult.removidos.length})
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 140, overflowY: 'auto' }}>
                  {diffResult.removidos.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text)', opacity: .6, textDecoration: 'line-through' }}>{b.descricao}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--red)', fontSize: 11 }}>{b.codigo_barra}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diffResult.novos.length === 0 && diffResult.alterados.length === 0 && diffResult.removidos.length === 0 && (
              <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(5,150,105,.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: 'var(--green)', fontWeight: 600, textAlign: 'center' }}>
                Nenhuma diferença encontrada — o arquivo está idêntico ao banco.
              </div>
            )}

            <div style={{ ...S.row, gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button style={S.btnSm} onClick={() => setModalDiff(false)}>Cancelar</button>
              {(diffResult.novos.length > 0 || diffResult.alterados.length > 0) && (
                <button
                  style={{ ...S.btn, background: 'var(--amber)', opacity: aplicando ? .6 : 1 }}
                  disabled={aplicando}
                  onClick={() => aplicarDiff({ novos: true, alterados: true, removidos: false })}
                >
                  {aplicando ? 'Aplicando...' : `Aplicar novos + alterados (${diffResult.novos.length + diffResult.alterados.length})`}
                </button>
              )}
              {diffResult.removidos.length > 0 && (
                <button
                  style={{ ...S.btn, background: 'var(--red)', opacity: aplicando ? .6 : 1 }}
                  disabled={aplicando}
                  onClick={() => aplicarDiff({ novos: true, alterados: true, removidos: true })}
                >
                  {aplicando ? 'Aplicando...' : 'Aplicar tudo (incluir remoções)'}
                </button>
              )}
              {(diffResult.novos.length > 0 || diffResult.alterados.length > 0 || diffResult.removidos.length > 0) && (
                <button
                  style={{ ...S.btn, background: 'var(--green)', opacity: aplicando ? .6 : 1 }}
                  disabled={aplicando}
                  onClick={() => aplicarDiff({ novos: true, alterados: true, removidos: false })}
                >
                  {aplicando ? 'Aplicando...' : 'Sincronizar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
