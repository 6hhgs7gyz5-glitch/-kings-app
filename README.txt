KINGS 9.2.9

Atualizações desta versão:
- Logo do cabeçalho sem moldura/borda e com mais espaço vertical para não ficar colada à área superior do iPhone.
- Cabeçalho com área segura (safe-area) para reduzir sobreposição visual com horário e indicadores do sistema.
- Ícones visuais adicionados às categorias de despesas, incluindo Aluguel, Mercadorias, Contas Fixas, Internet, Cartão, Materiais, Folha de Pagamento, Água, Energia, Transporte, Marketing, Impostos, Manutenção, Limpeza e Outros.
- Os mesmos símbolos aparecem nas listas de despesas, relatórios e despesas por categoria.
- Correção crítica da deduplicação: duas ou mais entradas/saídas/cortes/receitas/despesas com o mesmo valor no mesmo dia agora são preservadas como lançamentos independentes.
- Deduplicação segura passa a usar a identidade do registro (ID), evitando apagar operações legítimas só porque possuem os mesmos dados.
- Service worker/cache atualizado para 9.2.9 e registro versionado para forçar a atualização dos arquivos após substituição no site.
- Dados continuam sem registros financeiros de demonstração; a deduplicação automática permanece ativa.

Substituição: envie todo o conteúdo deste ZIP para o diretório público do site, substituindo os arquivos antigos.
