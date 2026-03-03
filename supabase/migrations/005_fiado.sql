CREATE TABLE IF NOT EXISTS fiados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'quitado', 'vencido')),
  data_abertura DATE DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fiados_lancamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fiado_id UUID REFERENCES fiados(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'pagamento')),
  valor DECIMAL(10,2) NOT NULL,
  origem TEXT,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fiados_ocr_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fiado_id UUID REFERENCES fiados(id),
  imagem_url TEXT NOT NULL,
  texto_extraido TEXT,
  dados_json JSONB,
  confianca DECIMAL(3,2),
  confirmado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
