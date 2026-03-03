import { Badge } from '@/components/ui/Badge'
import { formatPrice, formatDateTime } from '@/lib/utils'

interface PedidoRowProps {
  id: string
  cliente_nome?: string
  total: number
  status: 'novo' | 'pago' | 'em_preparo' | 'saiu' | 'entregue' | 'cancelado'
  criado_em: string
  onStatusChange?: (status: string) => void
}

const statusConfig = {
  novo: { label: 'Novo', variant: 'warning' as const },
  pago: { label: 'Pago', variant: 'success' as const },
  em_preparo: { label: 'Em Preparo', variant: 'default' as const },
  saiu: { label: 'Saiu', variant: 'default' as const },
  entregue: { label: 'Entregue', variant: 'success' as const },
  cancelado: { label: 'Cancelado', variant: 'danger' as const },
}

export function PedidoRow({
  id,
  cliente_nome = 'Cliente',
  total,
  status,
  criado_em,
  onStatusChange,
}: PedidoRowProps) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium">{id.slice(0, 8)}</td>
      <td className="px-4 py-3 text-sm">{cliente_nome}</td>
      <td className="px-4 py-3 text-sm">{formatPrice(total)}</td>
      <td className="px-4 py-3 text-sm">
        <Badge variant={statusConfig[status].variant}>
          {statusConfig[status].label}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(criado_em)}</td>
      {onStatusChange && (
        <td className="px-4 py-3 text-right">
          <button
            onClick={() => onStatusChange(status)}
            className="text-[#E6A817] hover:text-[#F5C842] font-medium text-sm"
          >
            Atualizar
          </button>
        </td>
      )}
    </tr>
  )
}
