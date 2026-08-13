# KINGS • Gestão da Barbearia

PWA offline para gestão de barbearia, pronta para GitHub Pages.

## Incluído

- Logo KINGS aplicada no app e nos ícones do iPhone
- Tela inicial renovada
- Configurações funcionando
- Cadastro/edição de cortes
- Edição e exclusão de clientes
- Relatórios diário, semanal e mensal
- Gráfico de faturamento por dia
- Distribuição das formas de pagamento
- Meta diária e mensal com progresso
- Pix, dinheiro, cartão e fiado
- Data e horário do corte
- Nome do barbeiro
- Backup e restauração em JSON
- Service Worker para uso offline
- Manifest PWA para instalação na tela inicial

## Publicar no GitHub Pages

1. Crie um repositório, por exemplo `kings-barbearia`.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. No GitHub, abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch principal e a pasta `/ (root)`.
6. Aguarde a publicação e abra a URL do GitHub Pages no iPhone.

## Atualizar o app já instalado no iPhone

O aplicativo usa o mesmo `localStorage` no navegador/origem do GitHub Pages. Ao publicar uma nova versão mantendo a mesma URL, os registros locais continuam no aparelho.

Depois da publicação:

1. Feche o KINGS.
2. Abra a URL do KINGS no Safari uma vez.
3. Aguarde o carregamento da nova versão.
4. Abra novamente pelo ícone da tela inicial.

Antes de uma atualização importante, use **Configurações → Exportar backup**.

## Importante sobre os dados

Os cortes e configurações ficam armazenados localmente no aparelho. Eles não são sincronizados automaticamente entre iPhones ou navegadores.

Não apague os dados do Safari nem troque o domínio sem fazer backup.
