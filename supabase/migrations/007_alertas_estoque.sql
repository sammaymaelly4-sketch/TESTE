CREATE TABLE IF NOT EXISTS alertas_estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id),
  tipo TEXT,
  resolvido BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id, tipo, resolvido)
);
