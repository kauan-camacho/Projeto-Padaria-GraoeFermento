# Grão & Fermento — Site da Padaria

Site institucional e cardápio online para uma padaria artesanal fictícia.
HTML, CSS e JavaScript puros — **sem build, sem dependências, sem framework**.

Basta abrir `index.html` no navegador, ou servir a pasta por HTTP (veja abaixo).

---

## ⚠️ Antes de publicar — dados fictícios

**Todo o conteúdo abaixo é de mentira e precisa ser trocado:**

| O que | Valor atual (fictício) | Onde trocar |
| --- | --- | --- |
| Nome da marca | Grão & Fermento | `assets/js/main.js` → constante `BRAND`; e `<title>`/`<h1>`/meta das 4 páginas |
| WhatsApp | `(11) 98765-4321` / `5511987654321` | `assets/js/main.js` → constante `WHATSAPP`; e os `wa.me/…` no rodapé/contato |
| Mensagem de abertura do WhatsApp | 4 `data-wa-msg` diferentes | `data-wa-msg` do botão flutuante em cada uma das 4 páginas |
| Telefone | `(11) 98765-4321` | `contato.html`, `sobre.html`, rodapés |
| E-mail | `oi@graofermento.com.br` | `contato.html`, rodapés |
| Endereço | Rua das Flores, 245 — Vila Madalena, SP | `contato.html` (+ iframe do mapa), `index.html`, rodapés |
| Horários | seg–sex 7h–19h / sáb 7h–18h / dom 8h–14h | `contato.html` (tabela) e `assets/js/main.js` (módulo de status aberto/fechado) |
| Preços | R$ 8 – R$ 64 | `cardapio.html` (`data-price`) e `index.html` (destaques) |
| Anos / números | "27 anos", "1.240 avaliações", "+50.000 pães" | `index.html`, `sobre.html` |
| Equipe | 4 pessoas com nome e foto | `sobre.html` |
| Depoimentos | 4 textos fictícios | `index.html` |
| Instagram / Facebook | links `#` | rodapés (4 arquivos) |
| Mapa | iframe do Google Maps apontando para um lugar genérico | `contato.html` |

As imagens vêm do [Unsplash](https://unsplash.com) por CDN (43 URLs). Para usar
fotos próprias, troque os `src` e mantenha os `alt` descritivos.

---

## Como rodar

### Opção 1 — abrir direto
Dê duplo clique em `index.html`. Funciona, mas em alguns navegadores o
`localStorage` do carrinho pode ficar restrito ao protocolo `file://`.

### Opção 2 — servidor local (recomendado)

Com Python:
```bash
python -m http.server 8000
```

Com Node:
```bash
npx serve .
```

Com PowerShell (sem instalar nada):
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

Depois acesse `http://localhost:8000`.

### Publicar
Site estático: qualquer hospedagem serve. Suba a pasta inteira, com
`index.html` na raiz. Defina `index.html` como documento padrão.

---

## Estrutura

```
.
├── index.html          Home: hero, categorias, destaques, sobre, faixa
│                       editorial, valores, "do grão ao pão", depoimentos,
│                       CTA, FAQ
├── cardapio.html       26 produtos com filtros + busca, faixa editorial,
│                       planos de assinatura e newsletter
├── sobre.html          História, linha do tempo, faixa editorial, valores,
│                       processo com figuras, equipe
├── contato.html        Formulário, canais, faixa editorial, horários, mapa,
│                       figuras, FAQ
├── assets/
│   ├── css/style.css   Design system completo (~67 KB)
│   └── js/main.js      14 módulos de interação (~32 KB)
└── serve.ps1           Servidor estático opcional para PowerShell
```

### Navegação

O menu principal tem **três itens, em todas as páginas** — Início, Cardápio e
Contato — tanto na barra do topo quanto no drawer móvel:

```html
<nav class="nav" aria-label="Navegação principal">
  <a class="nav__link is-active" href="index.html" aria-current="page">Início</a>
  <a class="nav__link" href="cardapio.html">Cardápio</a>
  <a class="nav__link" href="contato.html">Contato</a>
</nav>
```

`sobre.html` foi tirado do menu para manter esse limite, mas continua
acessível pelo rodapé e por links no corpo das outras páginas. Ao trocar de
página, lembre-se de mover `is-active` e `aria-current="page"` — nos dois menus.

---

## Stack e decisões técnicas

**HTML semântico.** Um único `<h1>` por página, hierarquia de títulos em ordem,
`<header>`/`<nav>`/`<main>`/`<section>`/`<footer>` com `aria-label` nos
landmarks. Todo conteúdo está no HTML — nada é renderizado por JavaScript, então
o site funciona e é indexável sem JS.

**CSS com custom properties.** Tokens em `:root` (cores, espaçamento, raios,
sombras, curvas de transição). Tipografia fluida com `clamp()`, então não há
media query só para ajustar `font-size`. Grid/Flexbox para layout.

**JavaScript vanilla, sem dependências.** Um IIFE por módulo, cada um
auto-inicializando e retorna cedo se não encontrar seus elementos no DOM — ou
seja, o mesmo arquivo roda nas 4 páginas sem configuração e nada quebra.

**Estado do carrinho em `localStorage`** (`gf_cart_v1`). O checkout não tem
backend: monta um link de WhatsApp com o pedido formatado.

**Acessibilidade.** Auditoria axe-core (0 violações) e Lighthouse
100/100/100 em todas as páginas, sem nenhuma falha: landmarks nomeados,
`skip link`, foco visível, foco preso dentro dos drawers (com `Esc` para
fechar), `aria-live` para o carrinho e os toasts, `prefers-reduced-motion`
respeitado, alvos de toque ≥ 44 px em ponteiro grosso, contraste ≥ 4.5:1.

O axe não resolve fundo em gradiente nem em imagem, então os casos de véu e
foto foram conferidos **na mão**, pelo pior ponto e não pela média. Vale para
texto (4,5:1) e para gráfico (3,1:1) — foi o que reprovou o verde antigo do
botão de WhatsApp, que só dava 1,98:1 sob o glifo.

**SEO.** `lang="pt-BR"`, `title` e `meta description` únicos por página, Open
Graph, canonical, `sitemap`-ready, hierarquia de headings limpa.

---

## Sistema de cor

A paleta não é uma lista de cores escolhidas no olho: ela sai de uma rampa
monocromática de matiz única em torno de **30°** (ocre quente), com dois
acentos colocados a cerca de 120° dela.

**1. Rampa base — matiz 30°, do papel à tinta**

| Token | Hex | Uso |
| --- | --- | --- |
| `--paper` | `#f9f7f5` | fundo da página |
| `--sand` | `#f3f0ec` | faixa alternada |
| `--clay` | `#e3dbd3` | **só** hairlines |
| `--taupe` | `#a59483` | decorativo — nunca texto |
| `--mute` | `#655749` | texto terciário |
| `--soft` | `#4b3d30` | texto secundário |
| `--ink` | `#1f1a14` | texto principal |

**2. Acentos — complementar (~150°) e split-complementar (~20°)**

| Token | Hex | Uso |
| --- | --- | --- |
| `--amber` | `#b14a16` | ação principal |
| `--amber-ink` | `#8e3a10` | hover/pressionado, texto de destaque |
| `--amber-soft` | `#fbe9e0` | superfície tingida |
| `--amber-on-dark` | `#f0a275` | acento **sobre** `--ink` |
| `--sage` | `#2d5340` | "aberto agora", sucesso |
| `--sage-soft` | `#e1efe8` | fundo de sucesso |

**3. Acento C — WhatsApp, matiz 173° (análogo ao sage)**

| Token | Hex | Uso |
| --- | --- | --- |
| `--wa` | `#128c7e` | botão flutuante de contato |
| `--wa-deep` | `#0a5f55` | hover / pressionado |

Não é o verde de marketing do WhatsApp (`#25d366`): branco sobre ele dá
**1,98:1**, e o glifo é a única coisa que diz ao visitante vidente o que o botão
faz, então precisa passar dos 3:1 que qualquer gráfico significativo exige.
`#128c7e` é o próprio teal de interface do WhatsApp — igualmente reconhecível,
4,14:1 com branco — e na matiz 173° ele fica ao lado do sage (150°) em vez de
brigar com a rampa de 30° como o esmeralda fazia.

Os semânticos (`--success`, `--danger`, `--info` e seus `-bg`) são apelidos
desses tokens, então mexer na rampa reposiciona tudo de uma vez.

**Todos os pares texto/fundo foram conferidos numericamente** (WCAG 2.1):
`ink/paper` 16,2:1 · `soft/paper` 9,8:1 · `mute/paper` 6,5:1 · `mute/clay`
5,1:1 · `amber/white` 5,4:1 · `white/amber-ink` 7,6:1 · `sage/paper` 8,1:1 ·
`amber-on-dark/ink` 8,3:1 · `taupe/ink` 5,9:1.

Duas regras que vieram da conferência e valem para não quebrar o padrão:

- **Nunca use `--amber` como texto sobre `--clay`** (dá 3,97:1). Sobre
  `--amber` o texto tem que ser branco; para texto âmbar use `--amber-ink`.
- **`--amber-on-dark` só funciona sobre superfície sólida escura.** Ele não
  atinge 4,5:1 sobre véu claro: se precisar de acento sobre foto, use
  `#fbe9e0` (6,5:1 no pior ponto da faixa).

Os véus sobre imagem (`#1f1a14` com alfa) foram dimensionados pelo pior caso
— foto branca pura — e não pela média:

| Véu | Sobre branco | Branco no véu |
| --- | --- | --- |
| `0.62` | `#74716d` | 4,85:1 |
| `0.66` | `#6b6864` | 5,6:1 |
| `0.86` | `#3e3a35` | 11,3:1 |

---

## Componentes de imagem

Duas peças resolvem "mais imagens" sem poluir a leitura:

**`.band` — faixa editorial de largura total.** Foto sangrando, com véu
escuro e o texto num container normal por cima (nunca sobre a imagem):

```html
<section class="band" id="band-craft">
  <img class="band__img" src="…" alt="Mãos do padeiro modelando a massa">
  <div class="container band__body">
    <span class="band__eyebrow">Do grão ao pão</span>
    <h2 class="band__title">Nenhuma fornada é apressada.</h2>
    <p class="band__text">…</p>
  </div>
</section>
```

O véu é um `::after` a 100° (`0.86 → 0.76 → 0.66`), o que dá 5,6:1 no pior
ponto. Cada página tem uma faixa: `band-craft` (home), `band-fornada`
(cardápio), `band-fermento` (sobre) e `band-balcão` (contato).

**`.figures` / `.figure` — grade de legendas.** Tríade de fotos com
legenda embaixo, sem texto sobre a foto — é o contraponto editorial da faixa:

```html
<div class="figures figures--3">
  <figure class="figure">
    <img src="…" alt="Close da farofa na forma">
    <figcaption class="figure__cap">Triticale</figcaption>
  </figure>
  …
</div>
```

`figures--3` vira uma coluna em telas estreitas; `figure--wide` ocupa a linha
inteira. Onde aparecem: home ("Do grão ao pão"), sobre (processo) e contato
("A vitrine", "O balcão", "Nos horários de pico").

**Contagem atual:** 61 `<img>` no total — home 20, cardápio 27, sobre 10,
contato 4 — com 43 IDs distintos do Unsplash, todos com `alt` descritivo,
`width`/`height` e `loading="lazy"` (fora da dobra).

---

## Módulos do `main.js`

| Módulo | O que faz |
| --- | --- |
| `imageFallback` | Troca por um placeholder quando a imagem falha |
| `stickyHeader` | Sombra ao rolar + estado compacto |
| `drawers` | Menu e carrinho móveis, foco preso, `Esc`, trava o scroll do body |
| `cart` | Adicionar/remover/alterar quantidade, total, persistência, badge |
| `toasts` | Avisos temporários com `aria-live="polite"` |
| `menuFilter` | Filtro por categoria + busca sem acento (deep link `?cat=`) |
| `slider` | Carrossel de depoimentos com autoplay, dots e swipe |
| `accordion` | FAQ em accordion acessível |
| `forms` | Validação no blur/input, mensagens inline, foco no primeiro erro, honeypot |
| `reveal` | Animação de entrada via `IntersectionObserver` |
| `backToTop` | Botão que aparece ao rolar |
| `whatsappCta` | Pré-preenche a conversa de todo link `wa.me` e deriva o nome acessível do botão de `BRAND` |
| `fabStackGuard` | Esconde os atalhos flutuantes quando um botão ficaria embaixo deles |
| `openStatus` | "Aberto agora / Fechado agora" a partir dos horários |
| `footerYear` | Ano corrente no rodapé |

O objeto `window.GF` expõe os módulos para depuração no console.

São 14 colchas de inicialização (as que o `boot()` chama); `toast` é um auxiliar
compartilhado pelo carrinho e pelos formulários, sem passo próprio no `boot()`.

### Atalhos flutuantes × conteúdo

Os dois botões flutuantes (WhatsApp e voltar ao topo) ficam fixos no canto
inferior direito, então em telas estreitas passavam por cima do formulário de
contato, da busca do cardápio, dos filtros e de todo "adicionar ao carrinho" —
engolindo toques. O módulo `fabStackGuard` testa a interseção entre a pilha e
todos os controles interativos e aplica `.is-tucked` (some e vira
`pointer-events: none`) sempre que algo ficaria embaixo.

Ele dispara em `scroll` (com *throttle* de 90 ms), `resize`, `click`,
`focusin` e `visibilitychange`. **Não** usa `requestAnimationFrame` de
propósito: rAF é suspenso em aba oculta, e isso aqui é checagem de correção,
não truque de pintura.

Se você remover a `.fab-stack`, o módulo sai sozinho (retorna cedo).

### Botão do WhatsApp

Quatro decisões, todas com motivo — mexa em qualquer uma sabendo o porquê:

**A cor não é a do WhatsApp.** `--wa` é o teal de interface deles
(`#128c7e`), não o verde de marketing (`#25d366`). Branco sobre o verde de
marketing dá 1,98:1, e o glifo é a única pista visual do que o botão faz —
precisa dos 3:1 de um gráfico. O teal passa em 4,14:1, é tão reconhecível
quanto, e fica na família do sage em vez de brigar com a rampa de 30°.

**O anel de atenção é `.fab__pulse::before`, e o `.fab` precisa de
`position: relative`.** O pseudo-elemento é `position: absolute; inset: 0`, e
sem o `position` no botão o anel ancorava na `.fab-stack` (que é `fixed`):
virava uma elipse 54×111 envolvendo os *dois* atalhos, não um halo no
WhatsApp.
O anel usa `z-index: 0` (não `-1`) e o `svg` fica em `z-index: 1` — pintar o
anel atrás do fundo do botão só funcionava por acaso e quebrava assim que o
fundo deixasse de ser opaco.

**O pulso roda três vezes, não em loop.** Um `infinite` nunca desliga: é
distração permanente e queima quadros muito depois de o ponto ter sido feito.
Depois das três voltas o anel fica em `opacity: 0` e some. Passar o mouse ou o
foco troca o pulso por um halo estático (`scale(1.18)`) — o scale importa, senão
o anel fica exatamente atrás do botão, na mesma cor, e não apareceria.

**A conversa já vem preenchida.** O módulo `whatsappCta` dá `?text=` a todo
link `wa.me` que ainda não tem, e o `aria-label` do botão flutuante é derivado
de `BRAND` em vez de repetir o nome da padaria em quatro arquivos HTML. Cada
página declara sua intenção no próprio markup:

```html
<a class="fab fab--wa fab__pulse"
   data-wa-msg="Olá! Vim pelo cardápio da Grão &amp; Fermento e gostaria de fazer um pedido."
   href="https://wa.me/5511987654321" …>
```

Links que já trazem `?text=` (o resumo do carrinho, os três planos) nunca são
tocados. O HTML guarda `href` e `aria-label` estáticos utilizáveis, então sem
JavaScript os links continuam abrindo um chat de verdade — o módulo só refina.

Duas armadilhas que já custaram bug aqui:

- **Não pré-encodar `%0A` dentro da mensagem.** O `Cart.message()` fazia isso e
  o `encodeURIComponent` do link codificava de novo, chegando ao WhatsApp como
  `%0A` literal e o pedido inteiro em uma linha só. A mensagem usa `\n` de
  verdade e deixa a codificação para o link.
- **Nada de rótulo que expanda no hover.** O botão ficaria cobrindo mais
  conteúdo — exatamente o problema que o `fabStackGuard` existe para resolver.
  A personalização vem da mensagem, do nome e do verde, não de pixels a mais.

O alvo é 54 px no desktop e **56 px** no mobile (`:-599px`): o atalho de
contato *cresce* no toque, porque é o caminho principal de quem chega pelo
celular e é onde o polegar é menos preciso. Continua acima dos 44 px do WCAG.

---

## Formulários

Os formulários **não enviam nada** — não há backend. Ao enviar com sucesso, a
página mostra uma confirmação e, no caso da newsletter/encomendas, sugere o
WhatsApp. Para mandar e-mail de verdade, troque o `preventDefault` em
`forms` (em `assets/js/main.js`) por um `fetch()` para o seu endpoint (Formspree,
Netlify Forms, etc.).

Cada formulário tem um campo *honeypot* invisível: robôs que preenchem tudo são
descartados silenciosamente.

---

## Ajustes rápidos

**Trocar a cor da marca** — edite os tokens no bloco `:root` do
`assets/css/style.css` (linhas 42–75). A rampa inteira sai dali:

```css
--ink:  #1f1a14;   /* texto principal        */
--amber: #b14a16;  /* ação principal         */
--sage:  #2d5340;  /* status / "aberto"      */
--wa:    #128c7e;  /* botão de contato       */
```

Se você mudar o matiz de base, revalide os pares de contraste: as razões da
seção [Sistema de cor](#sistema-de-cor) valem **para os tons atuais**, não para
tons novos. Um `--amber` mais claro, por exemplo, reprova como texto sobre
branco. O mesmo vale para `--wa`: ele não está na rampa, e o glyph branco
precisa continuar acima de 3:1.

**Trocar as fontes** — os `<link>` do Google Fonts ficam no `<head>` das 4 páginas,
com as variáveis `--font-display` / `--font-body` / `--font-script` no CSS.
Já há fallback de sistema, então o site continua legível offline.

**Trocar o número do WhatsApp** — em `assets/js/main.js`:
```js
const WHATSAPP = "5511987654321";  // só dígitos, com DDI
```

**Mudar os horários de funcionamento** — em `contato.html` (tabela) e no módulo
`openStatus` do `main.js`.
