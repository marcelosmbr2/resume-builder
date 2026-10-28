# Currículos

Aplicativo desktop para criar e exportar currículos em PDF, feito com Tauri 2 e Preact. A interface segue o mockup em `mockup/mockup.html`.

## Funcionalidades

- **Biblioteca:** currículos organizados em pastas. Dá para arrastar um currículo até uma pasta, além de duplicar, renomear e excluir.
- **Editor com pré-visualização A4 ao vivo:**
  - cabeçalho com contatos reordenáveis;
  - seções e entradas com texto rico, cada uma com a opção de mostrar ou ocultar no currículo;
  - zoom e marcação das quebras de página.
- **Exportação de PDF vetorial em A4,** com links clicáveis (somente no Windows, pelo WebView2).
- **Tema claro e escuro.**
- **Armazenamento local:** os currículos ficam no arquivo `curriculos.json`, dentro da pasta escolhida em Configurações.

## Desenvolvimento

Pré-requisitos: Rust (stable), Node.js (só para rodar a CLI do Tauri via `npx`) e o WebView2 Runtime.

```bash
npx @tauri-apps/cli@2 dev
```

```bash
npx @tauri-apps/cli@2 build
```

IDE recomendada: [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).
