-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('cerveja', 'drink', 'kit', 'combo', 'outro')),
  unidade TEXT NOT NULL DEFAULT 'un',
  preco_venda DECIMAL(10,2) NOT NULL,
  preco_custo DECIMAL(10,2),
  foto_url TEXT,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  estoque_minimo INTEGER DEFAULT 5,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredientes para receitas de drinks
CREATE TABLE IF NOT EXISTS ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'ml',
  ativo BOOLEAN DEFAULT true
);

-- Receitas (composição de drinks e kits)
CREATE TABLE IF NOT EXISTS receitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  ingrediente_id UUID REFERENCES ingredientes(id),
  quantidade DECIMAL(10,3) NOT NULL
);

-- Lotes (FIFO)
CREATE TABLE IF NOT EXISTS lotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  qtd_inicial DECIMAL(10,3) NOT NULL,
  qtd_atual DECIMAL(10,3) NOT NULL,
  custo_unitario DECIMAL(10,2) NOT NULL,
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validade DATE,
  fornecedor_id UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lotes_produto_data ON lotes(produto_id, data_entrada);
CREATE INDEX IF NOT EXISTS idx_lotes_validade ON lotes(validade) WHERE validade IS NOT NULL;

-- Movimentações de estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id),
  lote_id UUID REFERENCES lotes(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'inventario')),
  qtd DECIMAL(10,3) NOT NULL,
  origem TEXT,
  usuario_id UUID,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
