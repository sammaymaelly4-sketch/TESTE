# Bar da Carmen - Sistema de Delivery, Gestão e Fidelização

Sistema completo para um bar com funcionalidades de delivery, gestão de estoque (FIFO), caixa, fiado e programa de fidelização.

## Stack

- **Frontend**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Payments**: Mercado Pago (PIX)
- **OCR**: Google Vision API
- **Hosting**: Vercel
- **Animations**: Framer Motion

## Estrutura do Projeto

```
bar-da-carmen/
├── app/
│   ├── (cliente)/          # Rotas do cliente (PWA)
│   │   ├── page.tsx        # Home
│   │   ├── cardapio/       # Cardápio com busca e filtros
│   │   ├── carrinho/       # Carrinho de compras
│   │   ├── checkout/       # Checkout com formas de pagamento
│   │   ├── tracking/[id]/  # Rastreamento de pedido em tempo real
│   │   └── fidelidade/     # Programa de fidelização
│   ├── (admin)/            # Rotas do admin
│   │   ├── dashboard/      # Dashboard com métricas
│   │   ├── pedidos/        # Gerenciamento de pedidos
│   │   ├── estoque/        # Controle de estoque (FIFO)
│   │   ├── caixa/          # Caixa diário
│   │   ├── fiado/          # Gerenciamento de fiado
│   │   └── ocr/            # Scanner OCR para fiado/NF
│   ├── (motoboy)/          # Rotas do motoboy
│   │   └── corridas/       # Gerenciamento de corridas
│   └── api/                # API routes
│       ├── pix/            # Geração de QR Code PIX
│       ├── webhook/        # Webhook do Mercado Pago
│       ├── ocr/            # Processamento de imagens
│       └── notifications/  # Push notifications
├── components/
│   ├── ui/                 # Componentes reutilizáveis
│   ├── cliente/            # Componentes específicos do cliente
│   ├── admin/              # Componentes específicos do admin
│   └── shared/             # Componentes compartilhados
├── lib/
│   ├── supabase/           # Cliente e types do Supabase
│   ├── mercadopago/        # Integração Mercado Pago
│   ├── ocr/                # Integração Google Vision
│   └── push/               # Notificações push
└── supabase/
    └── migrations/         # Arquivos de migration SQL
```

## Configuração Inicial

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd bar-da-carmen
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
```

Preencha com seus valores:
- `NEXT_PUBLIC_SUPABASE_URL` - URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço do Supabase
- `MERCADOPAGO_ACCESS_TOKEN` - Token de acesso do Mercado Pago
- `GOOGLE_VISION_API_KEY` - Chave da API Google Vision
- `NEXT_PUBLIC_APP_URL` - URL da aplicação

### 4. Configurar Supabase

#### a) Criar projeto no Supabase
- Acesse [supabase.com](https://supabase.com)
- Crie um novo projeto
- Copie a URL e as chaves para `.env.local`

#### b) Executar migrations
```bash
# Via Supabase CLI
npx supabase link
npx supabase db push
```

Ou importar manualmente:
- Acesse SQL Editor no Supabase
- Execute os arquivos em `supabase/migrations/` em ordem

#### c) Configurar Autenticação
- Ative Email no Auth > Providers
- Configure OAuth (Google, GitHub, etc) se desejar

#### d) Configurar RLS (Row Level Security)
- Execute o arquivo `supabase/migrations/007_rls_policies.sql`

### 5. Integrar Mercado Pago

- Crie uma aplicação em [developer.mercadopago.com](https://developer.mercadopago.com)
- Copie o `ACCESS_TOKEN`
- Configure o webhook para: `https://seu-dominio.com/api/webhook/mercadopago`

### 6. Integrar Google Vision API

- Ative a API no Google Cloud Console
- Crie uma chave de serviço
- Copie a chave para `GOOGLE_VISION_API_KEY`

### 7. Deploy no Vercel

```bash
vercel
```

Configure as variáveis de ambiente no dashboard do Vercel.

## Funcionalidades Principais

### Cliente (PWA)
- ✅ Catálogo de produtos com busca e filtros
- ✅ Carrinho de compras com armazenamento local
- ✅ Checkout com múltiplas formas de pagamento
- ✅ Rastreamento de pedidos em tempo real
- ✅ Programa de fidelização com pontos
- ✅ Histórico de pedidos
- ✅ PWA para instalação na home screen

### Admin
- ✅ Dashboard com métricas em tempo real
- ✅ Gerenciamento de pedidos (status, itens, cliente)
- ✅ Controle de estoque com método FIFO
- ✅ Caixa diário com receitas e despesas
- ✅ Gerenciamento de fiado com alertas de vencimento
- ✅ Scanner OCR para caderninho de fiado
- ✅ Realtime updates dos dados

### Motoboy
- ✅ Lista de corridas disponíveis
- ✅ Aceitar/Recusar corridas
- ✅ Rastreamento GPS
- ✅ Contato direto com cliente
- ✅ Histórico de entregas

## Banco de Dados

### Tabelas Principais

**produtos**
- Catálogo de produtos com preços e estoque mínimo
- Suporta categorias: cerveja, drink, kit, combo, outro

**lotes**
- Controle de estoque por lote (FIFO)
- Data de validade
- Custo unitário

**pedidos & pedidos_itens**
- Registro de vendas
- Status: novo, pago, em_preparo, saiu, entregue
- Forma de pagamento: PIX, cartão, dinheiro, fiado

**clientes & enderecos**
- Dados de clientes
- Múltiplos endereços
- Pontos de fidelização

**fiados & fiados_lancamentos**
- Registro de crédito para clientes
- Histórico de compras e pagamentos

**lancamentos_caixa & fechamentos_caixa**
- Receitas e despesas diárias
- Fechamento do caixa por forma de pagamento

**motoboys & corridas**
- Registro de entregadores
- Gerenciamento de rotas e entregas

## API Routes

### POST `/api/pix`
Gera QR Code PIX para pagamento
```json
{
  "pedidoId": "uuid",
  "valor": 150.00,
  "email": "cliente@email.com"
}
```

### POST `/api/webhook/mercadopago`
Recebe confirmação de pagamento (webhook)

### POST `/api/ocr`
Processa imagem com OCR
```
FormData:
- imagem: File
- tipo: "fiado" | "estoque" | "caixa" | "nf"
```

### POST `/api/notifications/push`
Envia notificações push

## Desenvolvimento

### Rodar localmente
```bash
npm run dev
```

Acesse:
- Cliente: http://localhost:3000
- Admin: http://localhost:3000/dashboard

### Build
```bash
npm run build
npm run start
```

### Lint
```bash
npm run lint
```

## Temas de Cores

- **Brand (Azul Marinho)**: `#0D2240`
- **Brand Light**: `#1A3A6B`
- **Gold (Dourado)**: `#E6A817`
- **Gold Light**: `#F5C842`

## Próximas Melhorias

- [ ] Integração com WhatsApp Business API
- [ ] Mapa de rastreamento em tempo real
- [ ] Avaliações e comentários
- [ ] Cupons e promoções automáticas
- [ ] App nativa (React Native)
- [ ] Dashboard de relatórios avançados
- [ ] Integração com ERP

## Suporte

Para dúvidas, abra uma issue no repositório ou entre em contato.

---

Desenvolvido com ❤️ para Bar da Carmen
