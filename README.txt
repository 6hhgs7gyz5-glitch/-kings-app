KINGS 9.2.1
=========
Versão responsiva inspirada no layout enviado: Início, Caixa, Despesas, Clientes, Receitas, Calendário, Relatórios e Configurações.

Destaques:
- Layout mobile-first com navegação inferior.
- Cadastro de cortes, receitas, despesas e clientes.
- Controle de fiado, contas pendentes e despesas pagas.
- Calendário financeiro.
- Relatórios de entradas x saídas.
- Persistência em localStorage.
- Rotina automática de deduplicação de cortes, clientes, receitas e despesas ao abrir e após novos cadastros.

Substituição:
1. Extraia o ZIP.
2. Substitua os arquivos do site pelos arquivos desta pasta.
3. Mantenha o manifest.json e sw.js na raiz.
4. O service worker foi atualizado para 9.2.1, usa cache versionado, limpa caches antigos, assume o controle imediatamente e força a atualização do index.
5. Se o iPhone ainda mostrar a versão anterior, abra o site uma vez, feche a aba e abra novamente. Em último caso, remova os dados do site em Ajustes > Safari > Avançado > Dados dos Sites e abra o site de novo.
