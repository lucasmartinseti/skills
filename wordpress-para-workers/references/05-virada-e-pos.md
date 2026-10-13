# Fase 6 e 7: virada do domínio, domínios antigos, entrega e limpeza

## Virada do domínio (quando o usuário aprovar o preview)

1. Em `wrangler.jsonc`, ativar o bloco `routes` com `custom_domain: true` para apex e `www`.
2. O usuário apaga, na zona do Cloudflare, o registro A do apex e o CNAME/A de `www` que apontam para a
   hospedagem antiga. **Só esses.** MX/TXT ficam; e o registro `mysql.<dominio>` (DreamHost) também fica até
   a hospedagem ser cancelada, senão o WordPress de produção perde o banco antes da hora.
3. `npm run deploy`. A Cloudflare cria os registros e o certificado em segundos; o Worker já redireciona
   `http` e `www`.
4. Confirme com `dig @1.1.1.1`, `@8.8.8.8` e `curl --resolve <dominio>:443:<ip-cf>` (o resolvedor local pode ter
   NXDOMAIN em cache por alguns minutos). Em zsh, monte os `--resolve` num array (`"${RES[@]}"`), não numa string.
5. Se o usuário disser "feito" e o domínio não resolver, cheque imediatamente: pode ter apagado os registros
   sem ter feito o deploy das rotas. Nesse caso faça o deploy na hora, o site está fora do ar.

Erro `100117` ("already has externally managed DNS records") no deploy = os registros ainda existem.

## Domínios antigos (ex.: `dominio-antigo.com.br` -> `exemplo.com.br`)

Worker separado e minúsculo (`templates/redirects-worker.js` + `templates/redirects-wrangler.jsonc`): 301 para
a raiz do site final (caminho não preservado quando os sites antigos já estavam fora do ar), custom domains
para apex e `www` de cada zona. Mesmo procedimento de apagar A/CNAME antes. O e-mail (MX) dessas zonas não é
afetado.

## Pós-virada (listar para o usuário)

- Reenviar `/sitemap.xml` no Google Search Console; conferir Analytics/GTM no site novo.
- SSL/TLS > Edge Certificates: "Always Use HTTPS" (opcional; o Worker já redireciona).
- Primeiro login de cada usuário na área administrativa (migra o hash) e um ciclo editar/salvar/restaurar.
- Hospedagem antiga pode ser cancelada; backup completo está fora do git (dizer o caminho).
- Variável `CLOUDFLARE_API_TOKEN` no GitLab (Settings > CI/CD > Variables) para o deploy automático.

## Entrega (fase 7)

- README do projeto: estrutura, fluxo, o que o build faz com cada página, área administrativa (login, bloqueio,
  redefinir senha), estado do domínio, como o conteúdo foi capturado, o que ficou de fora de propósito, CI.
- Commits (sem segredos; `git check-ignore` nos `*.local.*`) e push para o remoto do cliente. Se o usuário
  pediu "guarde no repositório", commit e push fazem parte da entrega.
- Memória do projeto: host real do MySQL, decisões, pendências do usuário, armadilhas novas.
- Limpeza: encerrar `php -S` e `mysqld` locais, `ssh -O exit` no master, apagar o arquivo de senha do scratchpad
  e o `ControlPath`. Fechar abas do Chrome abertas pela sessão.
- Mensagem final curta: link, tabela do que foi verificado, comandos que faltam para o usuário, próximos passos.
