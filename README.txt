KINGS 9.2.2 — SISTEMA FINANCEIRO

Versão visual + funcional para substituição da versão anterior.

PRINCIPAIS CORREÇÕES
- Tela inicial refeita para seguir a referência visual enviada.
- Entradas, saídas, receitas, despesas, clientes e cortes continuam funcionais.
- Dashboard mostra Entradas, Saídas, A Receber, A Pagar, Saldo, Lucro e Resumo do mês.
- Corte recebido entra automaticamente no caixa; corte a receber entra em Receitas.
- Despesa paga entra automaticamente como saída de caixa.
- Deduplicação automática antes de cada gravação.
- Migração automática de dados das versões anteriores (kings92_data*, kings_cuts_v3, kings_expenses_v3 e kings_cfg_v3 quando encontrados).
- Datas calculadas no fuso local do aparelho para evitar diferença de dia no Brasil.
- Exclusão de uma movimentação vinculada mantém os registros relacionados coerentes.
- Service Worker atualizado para KINGS 9.2.2 e cache antigo é substituído.
- Logo e ícones incluídos no pacote.

SUBSTITUIÇÃO NO SITE
1. Extraia todos os arquivos deste ZIP.
2. Substitua os arquivos da versão anterior mantendo os nomes e a estrutura.
3. Publique index.html, app.js, styles.css, sw.js, manifest.webmanifest e os arquivos PNG.
4. No iPhone, abra o endereço do site novamente. O sw.js da 9.2.2 força a ativação da nova versão.
5. Se o navegador ainda mostrar a versão antiga, feche a aba do site completamente e abra novamente. Se estiver instalado na Tela de Início, remova o atalho antigo e adicione novamente após a atualização.

DADOS
Os dados são armazenados no localStorage do navegador/aparelho. A atualização não apaga os dados existentes quando as chaves antigas estão disponíveis.
