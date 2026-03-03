CREATE TABLE IF NOT EXISTS lancamentos_caixa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  origem TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'cartao', 'dinheiro')),
  descricao TEXT,
  usuario_id UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos_caixa(data DESC);

CREATE TABLE IF NOT EXISTS fechamentos_caixa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data DATE NOT NULL UNIQUE,
  total_pix DECIMAL(10,2) DEFAULT 0,
  total_cartao DECIMAL(10,2) DEFAULT 0,
  total_dinheiro DECIMAL(10,2) DEFAULT 0,
  total_entradas DECIMAL(10,2) DEFAULT 0,
  total_saidas DECIMAL(10,2) DEFAULT 0,
  saldo DECIMAL(10,2) DEFAULT 0,
  fechado_por UUID,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
