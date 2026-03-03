'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

interface ProdutoCardProps {
  id: string
  nome: string
  categoria: string
  preco_venda: number
  foto_url?: string
  descricao?: string
  onAddCart: (produto: any) => void
}

export function ProdutoCard({
  id,
  nome,
  categoria,
  preco_venda,
  foto_url,
  descricao,
  onAddCart,
}: ProdutoCardProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      await onAddCart({ id, nome, preco_venda, categoria })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {foto_url && (
        <div className="relative w-full h-48 bg-gray-200">
          <Image
            src={foto_url}
            alt={nome}
            fill
            className="object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3C/svg%3E'
            }}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-semibold text-sm flex-1">{nome}</h3>
          <Badge variant="secondary" className="text-xs capitalize">{categoria}</Badge>
        </div>
        {descricao && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{descricao}</p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-[#0D2240]">{formatPrice(preco_venda)}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAdd}
            loading={isAdding}
          >
            +
          </Button>
        </div>
      </div>
    </div>
  )
}
