export type Database = {
  public: {
    Tables: {
      produtos: {
        Row: {
          id: string
          nome: string
          categoria: 'cerveja' | 'drink' | 'kit' | 'combo' | 'outro'
          unidade: string
          preco_venda: number
          preco_custo: number | null
          foto_url: string | null
          descricao: string | null
          ativo: boolean
          estoque_minimo: number
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['produtos']['Row'], 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Database['public']['Tables']['produtos']['Insert']>
      }
      lotes: {
        Row: {
          id: string
          produto_id: string
          qtd_inicial: number
          qtd_atual: number
          custo_unitario: number
          data_entrada: string
          validade: string | null
          fornecedor_id: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['lotes']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['lotes']['Insert']>
      }
      clientes: {
        Row: {
          id: string
          user_id: string | null
          nome: string
          telefone: string
          cpf: string | null
          instagram_id: string | null
          pontos_fidelidade: number
          ativo: boolean
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>
      }
      pedidos: {
        Row: {
          id: string
          canal: 'pwa' | 'whatsapp' | 'balcao'
          status: 'novo' | 'pago' | 'em_preparo' | 'saiu' | 'entregue' | 'cancelado'
          cliente_id: string | null
          endereco_id: string | null
          motoboy_id: string | null
          tipo_entrega: 'delivery' | 'retirada'
          subtotal: number
          taxa_entrega: number
          desconto: number
          total: number
          forma_pagamento: 'pix' | 'cartao' | 'dinheiro' | 'fiado' | null
          pagamento_id: string | null
          pagamento_status: string
          observacao: string | null
          criado_em: string
          pago_em: string | null
          entregue_em: string | null
        }
        Insert: Omit<Database['public']['Tables']['pedidos']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['pedidos']['Insert']>
      }
      pedidos_itens: {
        Row: {
          id: string
          pedido_id: string
          produto_id: string | null
          qtd: number
          preco_unitario: number
          subtotal: number
          observacao: string | null
        }
        Insert: Omit<Database['public']['Tables']['pedidos_itens']['Row'], 'id' | 'subtotal'>
        Update: Partial<Database['public']['Tables']['pedidos_itens']['Insert']>
      }
      fiados: {
        Row: {
          id: string
          cliente_id: string | null
          valor_total: number
          status: 'aberto' | 'quitado' | 'vencido'
          data_abertura: string
          data_vencimento: string | null
          observacao: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['fiados']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['fiados']['Insert']>
      }
      lancamentos_caixa: {
        Row: {
          id: string
          tipo: 'receita' | 'despesa'
          categoria: string
          valor: number
          origem: string | null
          data: string
          forma_pagamento: 'pix' | 'cartao' | 'dinheiro' | null
          descricao: string | null
          usuario_id: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['lancamentos_caixa']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['lancamentos_caixa']['Insert']>
      }
      motoboys: {
        Row: {
          id: string
          user_id: string | null
          nome: string
          cpf: string
          cnh: string | null
          telefone: string
          status: 'online' | 'offline' | 'em_entrega'
          avaliacao_media: number
          ativo: boolean
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['motoboys']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['motoboys']['Insert']>
      }
    }
  }
}
