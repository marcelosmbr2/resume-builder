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

## Instalação

Baixe o instalador na página de [releases](https://github.com/marcelosmbr2/resume-builder/releases/latest):

- **Arquivo terminado em `_x64-setup.exe`:** o recomendado. Instala só para o usuário atual, sem pedir administrador.
- **Arquivo terminado em `_x64_pt-BR.msi`:** pacote MSI, para instalação gerenciada.

O app roda no Windows 10 e 11. Se o WebView2 Runtime não estiver instalado, o instalador baixa. Como o instalador não é assinado, o SmartScreen pode avisar na primeira execução: clique em **Mais informações** e depois em **Executar assim mesmo**.

## Desenvolvimento

Pré-requisitos: Rust (stable), Node.js (só para rodar a CLI do Tauri via `npx`) e o WebView2 Runtime.

```bash
npx @tauri-apps/cli@2 dev
```

```bash
npx @tauri-apps/cli@2 build
```

IDE recomendada: [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).

## Publicar uma versão

O workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) gera os instaladores no Windows e publica um release no GitHub sempre que uma tag `v*` é enviada.

1. Atualize `version` em `src-tauri/tauri.conf.json` (e em `src-tauri/Cargo.toml`) e faça o commit.
2. Crie a tag com a mesma versão e envie:

   ```bash
   git tag v0.1.0
   ```

   ```bash
   git push origin main v0.1.0
   ```

O workflow falha se a tag não bater com a versão do `tauri.conf.json`. Para gerar os instaladores localmente, rode `npx @tauri-apps/cli@2 build`; eles ficam em `src-tauri/target/release/bundle/`.
