# Portal de Denúncias SOBEI

Bem-vindo ao repositório do **Portal de Denúncias da SOBEI** (Sociedade Beneficente Equilíbrio de Interlagos). 

Este portal é um ambiente oficial, seguro e sigiloso desenvolvido para receber relatos de condutas inadequadas, violações éticas ou irregularidades nas unidades da instituição. O objetivo do sistema é garantir a integridade, a segurança e a transparência, permitindo um fluxo de trabalho estruturado para a equipe de conformidade e auditoria.

## 🎯 Funcionalidades

O sistema é dividido em duas frentes principais:

### 1. Visão Pública (Para o Denunciante)
- **Registro Seguro:** Formulário com suporte para denúncias anônimas ou identificadas.
- **Coleta de Evidências:** Campos detalhados para descrição dos fatos, envolvidos, testemunhas e unidade de ocorrência.
- **Protocolo Único:** Geração de um código de protocolo único no formato `LLL-NNN-NNN` (ex: `DXH-957-437`) para garantia de anonimato.
- **Acompanhamento:** Ferramenta de busca na página inicial (com máscara de digitação) que permite acompanhar o status da apuração e ler esclarecimentos/medidas adotadas pela equipe administrativa sem necessidade de login.

### 2. Visão Administrativa (Para a Auditoria/Conformidade)
- **Dashboard Centralizado:** Painel de controle isolado (`/admin`) para gestão de todos os chamados.
- **Gestão de Filas:** Denúncias organizadas por status de vida (Na Fila, Em Andamento, Fechadas, Arquivadas).
- **Atualização de Status:** Permite que a equipe mude o status da denúncia e registre um relatório interno e medidas adotadas.
- **Comunicação Segura:** As "Medidas Adotadas" registradas pelo administrador no painel ficam visíveis para o denunciante quando ele consulta o protocolo.
- **Estatísticas:** Visão analítica para acompanhamento de métricas (chamados por unidade, volumetria, etc.).

## 🛠 Tecnologias e Stack

O projeto foi construído focando em performance, acessibilidade e design premium, utilizando as seguintes tecnologias:

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Biblioteca de UI:** [React 19](https://react.dev/)
- **Estilização:** CSS Vanilla com uso intenso de CSS Variables (Design Tokens) para facilitar manutenção e garantir um visual consistente e altamente customizado.
- **Gerenciamento de Estado de API:** [TanStack Query (React Query)](https://tanstack.com/query/latest) para cache, refetching e sincronização de dados.
- **Gerenciamento de Formulários:** [React Hook Form](https://react-hook-form.com/) para formulários performáticos.
- **Validação de Dados:** [Zod](https://zod.dev/) para validação robusta de esquemas de dados.


## 📄 Estrutura do Projeto

- `/src/app`: Rotas e páginas da aplicação (App Router do Next.js).
- `/src/components`: Componentes reutilizáveis de interface (Cards, Modais, Inputs).
- `/src/contexts`: Contextos do React (ex: Autenticação).
- `/src/hooks`: Custom hooks (ex: Integração com TanStack Query).
- `/src/lib`: Funções auxiliares, chamadas de API simuladas e Schemas de validação.
- `/src/styles`: Arquivos CSS modulares separados por contexto (landing, admin, modal, etc.) baseados em um arquivo de variáveis globais (`variables.css`).

## ☁️ Deploy

Este projeto está pré-configurado para ser publicado na plataforma **Vercel** sem necessidade de configurações adicionais complexas (Zero-config). Basta importar o repositório do GitHub pelo painel da Vercel.

---

*Projeto desenvolvido para a Sociedade Beneficente Equilíbrio de Interlagos (SOBEI).*
