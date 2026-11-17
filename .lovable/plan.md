# SacraBank — MVP

## O que será construído
- **Página inicial** (`/`): apresentação do SacraBank com botões "Criar conta" e "Entrar".
- **Cadastro e login por e-mail** (`/auth`), com entrada imediata após o cadastro (sem confirmação por e-mail, para simplificar o teste).
- **Dashboard** (`/dashboard`, protegido):
  - saldo consolidado;
  - entradas e saídas do mês;
  - lista de contas/cartões;
  - transações recentes;
  - gráfico de gastos por categoria;
  - botão "Conectar banco" (visual, mostra aviso "em breve").
- **Sacra AI** (`/assistente`, protegido): chat em uma única conversa, sem histórico salvo. Responde só com base nos dados do usuário, apenas leitura, e recusa Pix/pagamentos/transferências.

## Dados demo
Ao criar a conta, o sistema gera automaticamente 3 contas (ex.: conta corrente, poupança, cartão de crédito) e ~40 transações realistas dos últimos 2 meses (iFood, Uber, mercado, salário, aluguel, Netflix etc.).

## Visual
Verde-petróleo escuro, detalhes dourados discretos, tipografia profissional, responsivo, tudo em português do Brasil.

## Detalhes técnicos
- Ativar Lovable Cloud; e-mail/senha com auto-confirmação.
- Tabelas: `accounts` (user_id, nome, tipo, instituição, saldo) e `transactions` (user_id, account_id, data, descrição, estabelecimento, categoria, valor com sinal). GRANTs + RLS por `auth.uid()`, somente SELECT para o usuário.
- Gatilho em `auth.users` que insere os dados demo para cada novo usuário.
- Dashboard: leitura via cliente autenticado + TanStack Query; gráfico com Recharts.
- Sacra AI: server route de streaming com AI SDK pelo Lovable AI Gateway (modelo padrão), autenticado pelo token do usuário; 3 ferramentas somente leitura: `consultar_saldo`, `resumir_transacoes(periodo)`, `buscar_gastos(estabelecimento|categoria, periodo)`. Totais calculados no servidor; prompt exige usar só valores das ferramentas.
- UI do chat com componentes AI Elements e respostas em markdown.
