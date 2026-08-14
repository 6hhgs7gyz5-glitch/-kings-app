KINGS 9.2.1 — versão funcional

Esta versão mantém o visual KINGS 9.2.1 e corrige o fluxo de dados:
- Entrada e saída rápidas salvam no localStorage.
- Receitas e despesas podem ser criadas, recebidas/pagas e excluídas.
- Clientes podem ser cadastrados e usados para registrar cortes.
- Cortes podem ser registrados como recebidos ou a receber.
- Valores do painel, caixa, relatórios e calendário são recalculados automaticamente.
- Deduplicação automática antes de salvar.
- Backup JSON para exportação e restauração.
- Migração automática do armazenamento kings92_data_v1 para kings92_data_v2.
- Service worker com cache versionado para evitar carregar a versão antiga.

SUBSTITUIÇÃO NO SITE
1. Extraia o ZIP.
2. Substitua os arquivos do site pelos arquivos deste pacote.
3. Mantenha index.html na raiz.
4. No iPhone, recarregue o site após a publicação. Se a versão antiga persistir, feche a aba e abra novamente; o service worker desta versão remove caches antigos na ativação.
