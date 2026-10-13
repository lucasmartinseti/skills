<?php
// Router para o servidor embutido do PHP: serve arquivos estáticos existentes, senão entrega ao WordPress (equivale ao .htaccess padrão).
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . '/html' . $uri;
if ($uri !== '/' && is_file($file)) return false;
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/html/index.php';
$_SERVER['PHP_SELF'] = '/index.php';
chdir(__DIR__ . '/html');
require __DIR__ . '/html/index.php';
