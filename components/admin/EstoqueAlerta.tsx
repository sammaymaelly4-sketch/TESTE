import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface EstoqueAlertaProps {
  produto_nome: string
  qtd_atual: number
  estoque_minimo: number
  urgente?: boolean
}

export function EstoqueAlerta({
  produto_nome,
  qtd_atual,
  estoque_minimo,
  urgente = false,
}: EstoqueAlertaProps) {
  return (
    <Card className={urgente ? 'border-l-4 border-red-500' : ''}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm">{produto_nome}</h3>
          <p className="text-xs text-gray-500 mt-1">
            Estoque: {qtd_atual} un (mínimo: {estoque_minimo})
          </p>
        </div>
        <Badge variant={urgente ? 'danger' : 'warning'}>
          {urgente ? 'Crítico' : 'Baixo'}
        </Badge>
      </div>
    </Card>
  )
}
