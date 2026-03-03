'use client'

import { Motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface ItemCarrinho {
  id: string
  nome: string
  preco_unitario: number
  qtd: number
}

interface CarrinhoDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: ItemCarrinho[]
  onUpdateQtd: (id: string, qtd: number) => void
  onRemove: (id: string) => void
  onCheckout: () => void
}

export function CarrinhoDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQtd,
  onRemove,
  onCheckout,
}: CarrinhoDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.preco_unitario * item.qtd, 0)

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-semibold text-[#0D2240]">Carrinho</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Carrinho vazio</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.nome}</p>
                  <p className="text-xs text-gray-500">
                    {formatPrice(item.preco_unitario)} x{item.qtd}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={() => onUpdateQtd(item.id, item.qtd - 1)}
                      className="px-2 py-1 text-sm hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="px-3 py-1 text-sm">{item.qtd}</span>
                    <button
                      onClick={() => onUpdateQtd(item.id, item.qtd + 1)}
                      className="px-2 py-1 text-sm hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t p-4 space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-[#0D2240]">{formatPrice(total)}</span>
            </div>
            <Button
              size="lg"
              variant="primary"
              onClick={onCheckout}
            >
              Ir para Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
