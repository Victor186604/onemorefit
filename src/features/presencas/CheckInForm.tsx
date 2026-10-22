'use client'

import { useState, useRef } from 'react'
import { Search, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { registrarPresenca } from './actions'
import { useRouter } from 'next/navigation'

interface Props { academiaId: string; slug: string; userId: string }

interface AlunoResult {
  id: string
  nome: string
  matriculaAtiva: boolean
  situacaoFinanceira: 'ok' | 'pendente' | 'inadimplente'
}

export function CheckInForm({ academiaId, slug, userId }: Props) {
  const router        = useRouter()
  const [busca, setBusca]   = useState('')
  const [alunos, setAlunos] = useState<AlunoResult[]>([])
  const [buscando, setBuscando] = useState(false)
  const [msg, setMsg]  = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  async function pesquisar(q: string) {
    setBusca(q)
    clearTimeout(timerRef.current)
    if (q.length < 2) { setAlunos([]); return }
    timerRef.current = setTimeout(async () => {
      setBuscando(true)
      const res = await fetch(`/api/a/${academiaId}/alunos-checkin?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setAlunos(data.alunos ?? [])
      setBuscando(false)
    }, 300)
  }

  async function fazerCheckin(alunoId: string, alunoNome: string) {
    setMsg(null)
    const res = await registrarPresenca({ academiaId, alunoId, userId })
    if (res.erro) {
      setMsg({ tipo: 'erro', texto: res.erro })
    } else {
      setMsg({ tipo: 'ok', texto: `Presença de ${alunoNome} registrada!` })
      setBusca('')
      setAlunos([])
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Registrar presença</h2>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={busca}
          onChange={e => pesquisar(e.target.value)}
          placeholder="Buscar aluno..."
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {buscando && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
      </div>

      {alunos.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {alunos.map(a => (
            <button
              key={a.id}
              onClick={() => fazerCheckin(a.id, a.nome)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
            >
              <div>
                <div className="font-medium text-sm text-gray-900">{a.nome}</div>
                <div className="text-xs text-gray-400">
                  {!a.matriculaAtiva
                    ? <span className="text-red-500">Sem matrícula ativa</span>
                    : a.situacaoFinanceira === 'inadimplente'
                    ? <span className="text-red-500">Inadimplente</span>
                    : a.situacaoFinanceira === 'pendente'
                    ? <span className="text-yellow-600">Pagamento pendente</span>
                    : <span className="text-green-600">Em dia</span>
                  }
                </div>
              </div>
              <CheckCircle size={18} className="text-brand-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {busca.length >= 2 && !buscando && alunos.length === 0 && (
        <p className="text-sm text-gray-400 mt-2 text-center">Nenhum aluno encontrado</p>
      )}

      {msg && (
        <div className={`mt-3 flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.tipo === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {msg.texto}
        </div>
      )}
    </div>
  )
}
