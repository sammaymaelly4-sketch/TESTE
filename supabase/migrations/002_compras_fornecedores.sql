CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  contato TEXT,
  email TEXT,
  prazo_pagamento_dias INTEGER DEFAULT 30,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fornecedor_id UUID REFERENCES fornecedores(id),
  data_compra DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_nf TEXT,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'cancelada')),
  vencimento DATE,
  foto_nf_url TEXT,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  qtd DECIMAL(10,3) NOT NULL,
  custo_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (qtd * custo_unitario) STORED,
  validade DATE
);
