'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ItemCarrinho {
  id: string
  nome: string
  preco_venda: number
  foto_url?: string
  categoria?: string
  qtd: number
}

const LS_KEY = 'carrinho'

function getLocalCart(): ItemCarrinho[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

function setLocalCart(items: ItemCarrinho[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(items))
}

export function useCarrinho() {
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [loading, setLoading] = useState(true)

  // Sincronizar com Supabase quando usuário está logado
  const syncComSupabase = useCallback(async (localItems: ItemCarrinho[]) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (localItems.length === 0) {
      // Carregar do Supabase
      const { data } = await supabase
        .from('carrinho_temp')
        .select('produto_id, qtd, produtos(id, nome, preco_venda, foto_url, categoria)')
        .eq('user_id', user.id)

      if (data && data.length > 0) {
        const fromDB: ItemCarrinho[] = data.map((row: any) => ({
          id: row.produtos.id,
          nome: row.produtos.nome,
          preco_venda: row.produtos.preco_venda,
          foto_url: row.produtos.foto_url,
          categoria: row.produtos.categoria,
          qtd: row.qtd,
        }))
        setLocalCart(fromDB)
        setItens(fromDB)
      }
    } else {
      // Salvar localStorage no Supabase
      await supabase.from('carrinho_temp').delete().eq('user_id', user.id)
      if (localItems.length > 0) {
        await supabase.from('carrinho_temp').insert(
          localItems.map((item) => ({
            user_id: user.id,
            produto_id: item.id,
            qtd: item.qtd,
          }))
        )
      }
    }
  }, [])

  useEffect(() => {
    const local = getLocalCart()
    setItens(local)
    syncComSupabase(local).finally(() => setLoading(false))
  }, [syncComSupabase])

  const updateSupabase = useCallback(async (novosItens: ItemCarrinho[]) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('carrinho_temp').delete().eq('user_id', user.id)
    if (novosItens.length > 0) {
      await supabase.from('carrinho_temp').insert(
        novosItens.map((item) => ({
          user_id: user.id,
          produto_id: item.id,
          qtd: item.qtd,
        }))
      )
    }
  }, [])

  const adicionarItem = useCallback((produto: Omit<ItemCarrinho, 'qtd'>) => {
    setItens((prev) => {
      const existe = prev.find((i) => i.id === produto.id)
      const novo = existe
        ? prev.map((i) => (i.id === produto.id ? { ...i, qtd: i.qtd + 1 } : i))
        : [...prev, { ...produto, qtd: 1 }]
      setLocalCart(novo)
      updateSupabase(novo)
      return novo
    })
  }, [updateSupabase])

  const atualizarQtd = useCallback((id: string, qtd: number) => {
    if (qtd <= 0) {
      removerItem(id)
      return
    }
    setItens((prev) => {
      const novo = prev.map((i) => (i.id === id ? { ...i, qtd } : i))
      setLocalCart(novo)
      updateSupabase(novo)
      return novo
    })
  }, [updateSupabase])

  const removerItem = useCallback((id: string) => {
    setItens((prev) => {
      const novo = prev.filter((i) => i.id !== id)
      setLocalCart(novo)
      updateSupabase(novo)
      return novo
    })
  }, [updateSupabase])

  const limpar = useCallback(() => {
    setItens([])
    setLocalCart([])
    updateSupabase([])
  }, [updateSupabase])

  const total = itens.reduce((sum, i) => sum + i.preco_venda * i.qtd, 0)
  const quantidade = itens.reduce((sum, i) => sum + i.qtd, 0)

  return { itens, loading, total, quantidade, adicionarItem, atualizarQtd, removerItem, limpar }
}
