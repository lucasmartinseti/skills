# Fase 1: backup verificado e diagnóstico de uso real

Objetivo: uma cópia integral da hospedagem fora do git, com integridade conferida, e um relatório que diga ao
usuário se alguém ainda usa o WordPress e o que depende de serviços externos.

## 1. Acesso à hospedagem (DreamHost e similares)

Credenciais vêm do usuário no chat. Nunca imprima a senha; grave-a num arquivo `chmod 600` no scratchpad e
apague ao final. Abra **um** master SSH com `expect` e reutilize por `ControlMaster`:

```bash
# templates/acesso/ssh-master.exp lê a senha de <dir>/pass e abre o master em <sock>
expect -f ssh-master.exp "$DIR" "$HOME/.ssh/cm-x"      # caminho do socket curto (< 100 chars)
ssh -o ControlPath="$HOME/.ssh/cm-x" user@host 'comando'  # sem senha a partir daqui
rsync -a -e "ssh -o ControlPath=$HOME/.ssh/cm-x" "${H}:/home/user/site/" destino/   # ${H} com chaves!
```

Opções do master: `-o PubkeyAuthentication=no -o PreferredAuthentications=password -o ServerAliveInterval=30
-o ControlPersist=4h -fN`. Se a sessão cair ("read from master failed"), reabra com o mesmo script.

Se o usuário for SFTP-only (sem shell), use `lftp`/`sftp` para os arquivos e phpMyAdmin/painel para o dump.

## 2. Reconhecimento (um comando só, leitura)

Levantar: `ls -la ~` (outras pastas/sites), `du -sh` por pasta, `wp-config.php` sem a senha
(`grep -E "DB_NAME|DB_USER|DB_HOST|table_prefix"`), versão do WP (`wp-includes/version.php`), `.htaccess`,
`crontab -l`, `php -v`, `which wp`, `wp-content/plugins`, `wp-content/themes`, pastas de uploads por ano,
backups de plugins (`ai1wm-backups`, `duplicator-backups`, `updraft`), logs (`~/logs/<dominio>/https/`),
arquivos modificados recentemente (`find -newermt`). Pastas extras no home costumam ser sites antigos: entram
no backup também.

## 3. Backup dos arquivos

```bash
B=../_backup-<host>-<dominio>-<AAAA-MM-DD>; mkdir -p $B/{files,home,db}
rsync -a -e "$E" "${H}:/home/user/<dominio>/" "$B/files/"      # site
rsync -a -e "$E" "${H}:/home/user/<outra-pasta>/" "$B/<outra-pasta>/"   # sites antigos
rsync -a -e "$E" --exclude='/<dominio>' --exclude='/logs' --exclude='/.cache' --exclude='/.gnupg' "${H}:./" "$B/home/"
```

Verificação (obrigatória): `md5sum` de tudo no servidor (`find . -type f -not -path "./wp-content/cache/*"
-print0 | xargs -0 md5sum`) versus `md5 -r` local; compare com `join`. Diferenças aceitáveis só em cache.
Atenção: o `ls` desta máquina é um alias com tamanhos em KiB ("3 KiB" parece "3 bytes" no `awk '{print $5}'`);
use `stat -f %z` para tamanho.

## 4. Dump do banco

Preferência: `wp db export - --add-drop-table` ou `mysqldump` **no shell do servidor**, comprimido e trazido pela
sessão SSH (`ssh host '... | gzip -c' > $B/db/<banco>-<data>.sql.gz`). Confira `gzip -t`, contagem de
`CREATE TABLE` e o rodapé `-- Dump completed`.

Se o host do banco (`mysql.<dominio>`) não resolver (registro DNS apagado), peça ao usuário o host real no painel
(DreamHost: `xxx.pdx1-mysql-xx-xx.dreamhost.com`) e use `mysqldump -h <host> -u <user>` com a senha em
`MYSQL_PWD` extraída por `sed` do wp-config (não por `php -r include`). Não edite o `wp-config.php` de
produção: isso é escrita no servidor e o classificador bloqueia; o usuário faz se quiser o site de volta.

O dump contém dados pessoais e segredos: fica fora do git, com o README do backup dizendo onde está.

## 5. Diagnóstico de uso real (consultas só de leitura)

Com o prefixo `P` (ex.: `prefixo_`), via `mysql -h <host>` no servidor ou no MySQL local depois de importar:

- Usuários e papéis: `P_users` + `P_usermeta.meta_key = 'P_capabilities'`.
- Último login por usuário: `P_usermeta.session_tokens` (serializado; pegue `login";i:<timestamp>` maior).
  Plugins de segurança (WP Cerber: tabela `cerber_log` **sem prefixo**, coluna `user_login`, `activity=5` =
  login ok) e logs de acesso (`wp-login.php` com 302) completam.
- Conteúdo: `P_posts` por `post_type/post_status` com `MAX(post_modified)`; últimos 15 modificados; posts por ano;
  uploads (`post_type='attachment'`) por ano e últimos.
- Formulários: CF7 (`post_type='wpcf7_contact_form'`), entradas CFDB7 (`P_db7_forms` por `form_post_id` e por
  mês; `SUM(form_value LIKE '%http%')` indica spam), Flamingo, Elementor (`P_e_submissions`). Onde cada
  formulário é usado: `post_content LIKE '%contact-form-7 id="N"%'` e `P_postmeta._elementor_data LIKE
  '%"form_id":"N"%'` ou `%contact-form-7 id=\"N\"%`.
- Tráfego: Koko Analytics (`P_koko_analytics_site_stats`), GA4/GTM ids em `googlesitekit_*`, logs.
- Integrações (só nomes de opções, sem valores): `rdsm_*` (RD Station), `mc4wp*`, `googlesitekit_*`,
  `facebook_*`, `dae_*` (Download After Email), `wp_mail_smtp`, `updraft_service`, `cron` (hooks agendados).
- Tabelas fora do prefixo: sites antigos (`wp_*`), plugins (`cerber_*`).

Relate ao usuário em tabela: usuário, e-mail, último login; último post/upload/edição; envios de formulário por
mês; o que existe além do WordPress na conta; e-mail hospedado onde (MX). É com isso que ele decide o escopo.

## 6. README do backup

Use `templates/backup-README.md` como modelo: tabela de pastas, como foi verificado, host real do MySQL,
prefixo e tabelas, aviso sobre dados pessoais, como restaurar.
