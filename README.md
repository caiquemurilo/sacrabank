# SacraBank

Assistente financeiro com IA para consulta e análise de dados financeiros em linguagem natural.

🔗 **Aplicação:** https://sacrabank.lovable.app/  
💻 **Repositório:** https://github.com/caiquemurilo/sacrabank

## Sobre o projeto

O **SacraBank** é um MVP de uma aplicação financeira que combina um dashboard com um assistente de inteligência artificial chamado **Sacra AI**.

O objetivo é permitir que o usuário visualize seus dados financeiros e faça perguntas em linguagem natural, recebendo respostas baseadas nas informações disponíveis na aplicação.

O projeto foi criado como parte dos meus estudos e experimentações com desenvolvimento de software assistido por IA.

## MVP atual

A versão atual possui:

- cadastro e autenticação de usuários;
- dashboard financeiro;
- saldo consolidado;
- entradas e saídas do mês;
- visualização de contas e cartão;
- gastos organizados por categoria;
- dados financeiros de demonstração;
- assistente financeiro com IA;
- consultas de gastos em linguagem natural;
- aplicação publicada e acessível pela web.

Os dados utilizados nesta primeira versão são fictícios e gerados para demonstração.

## Sacra AI

O **Sacra AI** permite fazer perguntas sobre os dados financeiros disponíveis na aplicação.

Exemplo:

> Quanto gastei com Uber nos últimos 30 dias?

O assistente consulta os dados disponíveis antes de responder e retorna informações como valor total e quantidade de transações encontradas.

Nesta primeira versão, o assistente possui acesso apenas para consulta.

Ele não realiza:

- Pix;
- transferências;
- pagamentos;
- movimentações financeiras.

## Demonstração do fluxo

```text
Usuário
   ↓
SacraBank
   ↓
Dashboard financeiro
   ↓
Sacra AI
   ↓
Consulta aos dados
   ↓
Resposta em linguagem natural
```

## Tecnologias

Nesta primeira versão, o projeto utiliza:

- TypeScript
- Lovable
- Lovable Cloud
- Inteligência artificial generativa

A stack e a arquitetura serão documentadas com mais detalhes à medida que o projeto evoluir.

## Status

🟢 **MVP funcional e publicado**

O objetivo desta primeira versão foi validar rapidamente o fluxo principal da aplicação:

**dados financeiros → consulta com IA → resposta útil para o usuário.**

## Limitações atuais

Esta é uma primeira versão do produto.

No momento:

- os dados financeiros utilizados são de demonstração;
- ainda não há conexão com instituições financeiras reais;
- a integração com Open Finance ainda não está disponível;
- o Sacra AI possui somente acesso de leitura;
- operações financeiras não fazem parte do escopo do MVP.

## Próximos passos

As próximas evoluções planejadas incluem:

- integração com a Pluggy em ambiente sandbox;
- conexão simulada a instituições financeiras;
- integração com dados de Open Finance;
- sincronização de contas e transações;
- melhoria da experiência do Sacra AI dentro do dashboard;
- evolução das consultas e análises financeiras;
- categorização automática de transações;
- previsões e insights financeiros;
- metas financeiras;
- relatórios;
- melhorias de segurança e arquitetura para versões futuras.

## Desenvolvimento assistido por IA

O SacraBank também é um experimento prático sobre uma nova forma de desenvolver software utilizando IA como ferramenta durante diferentes etapas do processo.

O MVP inicial foi construído utilizando **Lovable** e continuará sendo evoluído com ferramentas de desenvolvimento assistido por IA.

## Objetivo do projeto

Além de resolver um problema financeiro, o SacraBank tem como objetivo explorar na prática conceitos como:

- construção de produtos com IA generativa;
- desenvolvimento assistido por IA;
- integração entre interfaces, dados e modelos de linguagem;
- uso de ferramentas por assistentes de IA;
- desenvolvimento incremental de um MVP até uma aplicação mais completa.

---

**SacraBank** — transformando dados financeiros em respostas simples através de IA.

Desenvolvido por **Caique Murilo Sacramento**.
