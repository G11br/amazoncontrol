# AmazonControl — site

Site institucional da AmazonControl (controle de pragas para empresas) com página de proposta em etapas que envia os leads para o WhatsApp e para o Google Planilhas.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` + `home.css` + `home.js` | Home B2B com animações (GSAP + Lenis) |
| `orcamento.html` + `orcamento.css` + `orcamento.js` | Formulário de proposta em etapas (estilo quiz) |
| `config.js` | Número de WhatsApp e URL da planilha |
| `google-apps-script.gs` | Script que recebe os leads no Google Planilhas |
| `index-v1.html` + `styles.css` + `script.js` | Primeira versão da home (`styles.css` também é usado pelo formulário) |

## Identidade visual

- Cores do manual da marca: azul do logo `#3A86DC`, marinho `#05172B` e `#12345A`, preto `#000000`, off-white `#F9F7F5` e branco.
- Fonte oficial: **Evermore** (títulos). Como não é uma fonte livre, o site usa **Comfortaa** como alternativa; se os arquivos da Evermore forem adicionados ao projeto (via `@font-face`), ela passa a ser usada automaticamente. Textos corridos usam **Urbanist**.
- Logo em `assets/` (`logo.svg`, `logo-white.svg`, `logo-mark.svg`), recriado em vetor a partir do manual por `tools/build_logo.py`. Ao receber o SVG oficial da agência, substitua esses arquivos e os símbolos `#ac-logo` / `#ac-mark` no fim de `index.html` e `orcamento.html`.

## Configuração

Edite `config.js`:

- `whatsappNumber`: DDI + DDD + número, só dígitos (ex.: `5511999999999`).
- `sheetsEndpoint`: URL `/exec` do App da Web do Apps Script (passo a passo no topo de `google-apps-script.gs`).

## Rodar localmente

```bash
python3 -m http.server 8765
```

Depois abra http://localhost:8765.

É um site estático: pode ser publicado no GitHub Pages, Netlify ou Vercel sem build.
