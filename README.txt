KINGS 9.2.1
============

Esta pasta é uma PWA substituta da versão anterior, com visual inspirado diretamente na imagem de referência enviada.

Arquivos principais:
- index.html
- styles.css
- app.js
- manifest.webmanifest
- sw.js

Recursos:
- Dashboard, Caixa, Receitas, Despesas, Clientes, Calendário, Relatórios, Categorias e Mais.
- Cadastro de entradas, saídas, receitas, despesas e clientes.
- Dados persistidos no localStorage.
- Deduplicação automática para cortes, clientes, receitas, despesas e movimentações.
- Botão para executar a limpeza de duplicados manualmente.
- Backup JSON.
- Service worker com cache versionado para reduzir o problema de carregar a versão antiga.

PUBLICAÇÃO:
1. Extraia todos os arquivos para a mesma pasta do site.
2. Substitua os arquivos antigos.
3. Publique o conteúdo.
4. Abra o site no iPhone e recarregue.
5. Se uma instalação PWA antiga continuar aparecendo, remova a instalação antiga da Tela de Início e abra o endereço novamente no Safari para instalar a nova versão.

IMPORTANTE:
A deduplicação considera:
- Clientes: nome + telefone
- Receitas: cliente + descrição + valor + data
- Despesas: descrição + valor + categoria + data
- Movimentações: tipo + descrição + valor + data
- Cortes: cliente + valor + data + serviço
