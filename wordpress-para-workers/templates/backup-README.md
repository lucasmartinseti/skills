# Backup DreamHost — conta `<usuario>` (exemplo.com.br) — 2026-10-12

Cópia integral da conta de hospedagem compartilhada da DreamHost (servidor `<servidor>.dreamhost.com`,
usuário `<usuario>`), feita antes da migração do site para Cloudflare Workers. Fica FORA do repositório git.

| Pasta | Conteúdo | Verificação |
|---|---|---|
| `files/` | `~/exemplo.com.br`: WordPress 7.1.3 completo (núcleo, `wp-content` com tema OceanWP, plugins, uploads, cache, backups antigos do All-in-One/Duplicator/UpdraftPlus, pastas `v1/`, `bkps/`, `homologacao/`, `.well-known/`, `.htaccess`, `wp-config.php`). 3,2 GB, 29 mil arquivos. | MD5 de todos os arquivos (exceto `wp-content/cache`) conferido com o servidor: 28.872 iguais, 0 diferentes |
| `dominio-antigo.com.br/` | `~/dominio-antigo.com.br`: WordPress antigo (2018), 111 MB | contagem de arquivos igual ao servidor |
| `bkp-site-antigo/` | `~/bkp-site-antigo`: site CodeIgniter de 2016, 92 MB | contagem de arquivos igual ao servidor |
| `home/` | dotfiles da conta (`.php/` com phprc por versão, `.bash_profile`, `.alias`, etc.) | |
| `db/nome_do_banco-2026-10-12.sql.gz` | dump completo do banco `nome_do_banco` (MySQL 8.0.41), 89 tabelas, `mysqldump --single-transaction --add-drop-table --routines --triggers`, charset utf8mb4. Rodapé "Dump completed" conferido. | `gzip -t` OK |

## Banco de dados

- Host configurado no `wp-config.php`: `mysql.dominio-antigo.com.br` (registro DNS da zona dominio-antigo.com.br, que deixou de existir em 2026-10-12).
  Host real do servidor MySQL: `<host-mysql>.dreamhost.com`. Usuário `<usuario>`, banco `nome_do_banco`, senha no `wp-config.php`.
- Prefixo do site atual: `prefixo_`. Tabelas `wp_*` são o site antigo de 2022 (`https://exemplo.com.br/v1`, tema Divi), `cerber_*` são do plugin WP Cerber, `prefixo_db7_forms` guarda os envios dos formulários (Contact Form 7 + CFDB7), `prefixo_dae_*` os downloads mediante e-mail.
- O dump contém dados pessoais (envios de formulários, currículos referenciados em `uploads/cfdb7_uploads`, assinantes) e segredos (hash de senhas, tokens do RD Station, SMTP). Não commitar.

## Como restaurar (resumo)

1. Criar um banco MySQL/MariaDB e importar: `gunzip -c db/nome_do_banco-2026-10-12.sql.gz | mysql -u USUARIO -p NOVO_BANCO`
2. Copiar `files/` para a raiz do vhost e ajustar `DB_*` no `wp-config.php` (PHP 8.2 na origem).
3. Se o domínio mudar: `wp search-replace 'https://exemplo.com.br' 'https://novo-dominio' --all-tables`

## Como foi feito

- Arquivos: `rsync -a` por SSH (openrsync do macOS), depois comparação de MD5 com o servidor.
- Banco: `mysqldump` executado no shell da DreamHost contra o host direto do MySQL, comprimido com gzip e transportado pela sessão SSH.
