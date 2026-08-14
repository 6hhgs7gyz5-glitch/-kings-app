KINGS 9 v9.1 — pacote definitivo

Compatível com a estrutura atual do repositório:
index.html, app.js, estilo.css, logo.png, manifest.json, manifest.webmanifest, sw.js, service-worker.js e ícones.

Atualização de cache:
- versão de build renovada;
- service worker antigo é desregistrado na primeira abertura após a atualização;
- caches antigos com prefixo kings- são removidos;
- novo SW usa updateViaCache=none e navegação sem cache;
- ambos sw.js e service-worker.js são atualizados para evitar conflito com versões anteriores.

Publicação:
1. Substitua os arquivos da raiz do GitHub pelos arquivos deste pacote.
2. Faça commit.
3. Aguarde o GitHub Pages publicar.
4. Abra o site uma vez; ele fará a limpeza de cache e recarregará a KINGS 9.

Não renomeie os arquivos da raiz.
