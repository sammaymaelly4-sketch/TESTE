'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useCallback } from 'react'

export function RealtimePedidos({ onUpdate }: { onUpdate: () => void }) {
  const handleUpdate = useCallback(() => {
    onUpdate()
  }, [onUpdate])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('pedidos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        handleUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [handleUpdate])

  return null
}

export function RealtimeEstoque({ onUpdate }: { onUpdate: () => void }) {
  const handleUpdate = useCallback(() => {
    onUpdate()
  }, [onUpdate])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('estoque-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lotes' },
        handleUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [handleUpdate])

  return null
}
