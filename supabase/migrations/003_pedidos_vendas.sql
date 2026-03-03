CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL UNIQUE,
  cpf TEXT,
  instagram_id TEXT,
  pontos_fidelidade INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enderecos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  apelido TEXT DEFAULT 'Casa',
  logradouro TEXT NOT NULL,
  numero TEXT,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT DEFAULT 'Taubaté',
  estado TEXT DEFAULT 'SP',
  cep TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  principal BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canal TEXT NOT NULL DEFAULT 'pwa' CHECK (canal IN ('pwa', 'whatsapp', 'balcao')),
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'pago', 'em_preparo', 'saiu', 'entregue', 'cancelado')),
  cliente_id UUID REFERENCES clientes(id),
  endereco_id UUID REFERENCES enderecos(id),
  motoboy_id UUID,
  tipo_entrega TEXT DEFAULT 'delivery' CHECK (tipo_entrega IN ('delivery', 'retirada')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  taxa_entrega DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'cartao', 'dinheiro', 'fiado')),
  pagamento_id TEXT,
  pagamento_status TEXT DEFAULT 'pendente',
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  pago_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado ON pedidos(criado_em DESC);

CREATE TABLE IF NOT EXISTS pedidos_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  qtd INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (qtd * preco_unitario) STORED,
  observacao TEXT
);
