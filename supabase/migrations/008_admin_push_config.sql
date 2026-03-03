-- ============================================================
-- 008: admin_users, push_subscriptions, configuracoes
-- ============================================================

-- Tabela de usuários admin
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de inscrições push para notificações
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Tabela de configurações dinâmicas do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Valores padrão
INSERT INTO configuracoes (chave, valor, descricao)
VALUES
  ('taxa_entrega', '5.00', 'Taxa de entrega em R$'),
  ('pedido_minimo', '0.00', 'Valor mínimo de pedido em R$'),
  ('horario_abertura', '17:00', 'Horário de abertura do bar'),
  ('horario_fechamento', '23:00', 'Horário de fechamento do bar'),
  ('whatsapp_numero', '', 'Número WhatsApp do bar para contato'),
  ('pontos_por_real', '1', 'Pontos de fidelidade ganhos por real gasto')
ON CONFLICT (chave) DO NOTHING;

-- Tabela de carrinho temporário (persistência cross-device)
CREATE TABLE IF NOT EXISTS carrinho_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  qtd INTEGER NOT NULL DEFAULT 1 CHECK (qtd > 0),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_carrinho_user ON carrinho_temp(user_id);

-- RLS Policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrinho_temp ENABLE ROW LEVEL SECURITY;

-- admin_users: apenas admins podem ver
CREATE POLICY "admin_users_select" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- push_subscriptions: usuário gerencia suas próprias inscrições
CREATE POLICY "push_own" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- configuracoes: leitura pública, escrita apenas autenticado
CREATE POLICY "config_read" ON configuracoes
  FOR SELECT USING (true);

-- carrinho_temp: usuário gerencia seu próprio carrinho
CREATE POLICY "carrinho_own" ON carrinho_temp
  FOR ALL USING (auth.uid() = user_id);
