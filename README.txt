KINGS 9.2.1 — PACOTE CORRETO

Esta versão é baseada no KINGS 9 definitivo completo (não na versão simplificada anterior).

Correções 9.2.1:
- Mantém o layout completo, logo e funcionalidades do KINGS 9 definitivo.
- Cache/service worker atualizado para kings-v9.2.1-20260814.
- Limpa automaticamente caches antigos do KINGS.
- Desregistra versões antigas ao detectar mudança de build.
- Força atualização do index/app/estilos com query string 9.2.1.
- Mantém deduplicação automática de cortes, clientes, receitas e despesas.

SUBSTITUIÇÃO:
1. Extraia TODOS os arquivos deste ZIP diretamente na raiz do site.
2. Confirme que index.html, app.js, estilo.css, sw.js e service-worker.js estão na mesma pasta.
3. Publique/substitua os arquivos no GitHub Pages.
4. No iPhone, abra o endereço do site novamente. A própria aplicação remove o cache kings-* antigo e registra o novo service worker.

IMPORTANTE: este ZIP substitui o pacote 9.2.1 simplificado anterior. O pacote correto tem logo.png, estilo.css, service-worker.js, sw.js, app.js e os demais arquivos do KINGS definitivo.
