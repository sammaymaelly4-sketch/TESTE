CREATE TABLE IF NOT EXISTS motoboys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  cnh TEXT,
  telefone TEXT NOT NULL,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'em_entrega')),
  avaliacao_media DECIMAL(2,1) DEFAULT 5.0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS corridas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id),
  motoboy_id UUID REFERENCES motoboys(id),
  status TEXT DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'aceita', 'recusada', 'em_rota', 'entregue')),
  valor_taxa DECIMAL(10,2) DEFAULT 0,
  distancia_km DECIMAL(5,2),
  tempo_estimado_min INTEGER,
  aceito_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ,
  avaliacao INTEGER CHECK (avaliacao BETWEEN 1 AND 5),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
