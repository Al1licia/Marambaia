# No Ponto

**A tecnologia que ajuda a preservar o conhecimento por trás do sabor.**

Acesse o site: https://al1licia.github.io/Marambaia/

Protótipo funcional para hackathon. Conecta três dimensões: **Conhecimento** (como o prato é feito e quais decisões o definem), **Pessoas** (formar a equipe e reconhecer o mestre) e **Consistência** (acompanhar se o prato continua no padrão).

Todos os dados são fictícios.
O Bar do Seu Arlindo é um estabelecimento inventado para a demonstração.

## Como executar

**Online:** o GitHub Pages publica a raiz da branch `main` (Settings > Pages > Deploy from a branch > `main` / `root`).

**Sem instalar nada:** abra o `index.html` da raiz com dois cliques. Funciona sem internet, desde que as pastas `css/`, `js/` e `fonts/` fiquem ao lado dele.

**Para desenvolver** (requer Node.js 20 ou mais recente):

```bash
npm install
```

```bash
npm run dev
```

Abra o endereço mostrado no terminal, normalmente `http://localhost:5173`.

```bash
npm run build
```

Atualiza `css/`, `js/` e `fonts/` na raiz. **Rode antes de cada push que mude o código**, senão o site publicado continua com a versão anterior. O `index.html` é um só: no `npm run dev` o Vite troca sozinho as linhas do build pelo código-fonte. Para mudar o visual, edite `src/index.css` e `tailwind.config.js`, e não `css/style.css`, que é recriado a cada build.

## Acessos demonstrativos

Na tela de login, clique em um perfil. E-mail e senha são preenchidos sozinhos.

| Perfil | E-mail | Pode fazer |
|---|---|---|
| Administrador | gestora@pontozero.demo | Tudo, inclusive feedback dos clientes |
| Cozinheiro Mestre | mestre@pontozero.demo | Vídeos, fichas, validação, comparação e avaliações |
| Aprendiz | aprendiz@pontozero.demo | Conteúdo aprovado e o próprio progresso |

Senha dos três: `pontozero`. Não há autenticação real.

## Roteiro da demonstração (cerca de 5 minutos)

Antes de começar: menu > **Restaurar dados demonstrativos**. Se tiver um vídeo real, carregue-o em Feijoada > Gravação 1 e use **Ajustar marcações a este vídeo**.

1. **Login** como Administrador. Mostre os três cartões da tela inicial: Conhecimento, Pessoas e Consistência.
2. Em **Feijoada da casa**, clique em **Aprender preparo**.
3. Selecione **Ponto do caldo**: as orientações do mestre mudam com a etapa.
4. Aba **Comparar Preparos**: na etapa **Entrada do refogado**, a Gravação 2 (casa cheia) difere das demais. Destaque que o sistema não elege a receita verdadeira.
5. Aba **Validação**: aprove a etapa **Entrada do refogado**. Agora ela aparece para os aprendizes.
6. **Ficha técnica**: mostre a instrução escrita ao lado do complemento prático e clique em **Ver este momento**.
7. Menu > **Progresso e Avaliação Interna** > aba **Avaliação Interna**. Caio Mendes já vem selecionado em Carne de panela, com 3 de 5 etapas.
8. Preencha o lote, dê notas 4, escolha **Aprovado para esta etapa** e marque **Cozimento lento**.
9. Antes de salvar, clique em **Habilitado para o preparo completo** para mostrar que a habilitação fica bloqueada: uma nota isolada não basta. Volte para Aprovado e registre.
10. A barra sobe de 60% para 80%. Clique em **Ver progresso da equipe**.
11. Menu > **Feedback dos Clientes**: Carne de panela lidera as observações. Feche ligando consistência, cozinha e equipe.

## Arquitetura

```
src/
  types.ts              Modelo de dados
  data/seed.ts          Dados demonstrativos
  store/AppContext.tsx  Estado global, perfis e persistência em localStorage
  lib/metrics.ts        Regras: progresso, habilitação e indicadores
  lib/videoStore.ts     Vídeos locais em IndexedDB
  components/           Interface base, layout, player, comparação e validação
  pages/                Uma tela por arquivo
```

Decisões principais:

- **Indicadores são calculados** a partir dos registros, nunca digitados. O progresso de um funcionário é derivado das avaliações, por isso a Avaliação atualiza o Progresso sem sincronização.
- **Vídeo assistido não conta** para o progresso. Só contam etapas aprovadas em avaliação prática.
- **Etapa sem orientação aprovada** não pode ser validada em avaliação.
- **HashRouter e script comum** (formato IIFE, sem `type="module"`) permitem abrir o protótipo sem servidor.
- **Recharts não foi usado.** As comparações são barras simples, e evitar a biblioteca mantém o arquivo leve.

## O que é simulado e o que exigiria integração real

| Hoje, no protótipo | Para produção |
|---|---|
| Login demonstrativo, sem segurança | Autenticação real e autorização no servidor |
| Dados em `localStorage`, por navegador | Banco de dados compartilhado e auditoria |
| Vídeos em IndexedDB, apenas neste navegador | Armazenamento e streaming, com original preservado e controle de acesso |
| Etapas e tempos cadastrados à mão | Apoio de IA para sugerir cortes, sempre validados pelo mestre |
| Marcações ajustadas de forma proporcional | Edição precisa de trechos |
| Formulário do cliente dentro da gestão | QR Code na mesa ou link público, em conformidade com a LGPD |
| Consentimento por caixa de seleção | Termo formal registrado, com possibilidade de revogação |
| Regras de habilitação fixas em `lib/metrics.ts` | Regras configuráveis por estabelecimento |
| Um estabelecimento | Várias unidades e contas |

Não há vídeo de exemplo: sem arquivo carregado, o player informa isso claramente. Pratos, ilustrações, quantidades, nomes e feedbacks são demonstrativos e não representam validação de campo.

## Identidade visual

A paleta e o símbolo seguem a logo enviada. O símbolo foi redesenhado em vetor (`src/components/Logo.tsx`) para ficar nítido em qualquer tamanho; o arquivo original está em `marca/logo-original.png`. O projeto do Stitch inspirou o tom acolhedor e a preocupação mobile. A paleta terrosa dele foi substituída pela paleta obrigatória do briefing.
