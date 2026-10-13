<?php
// Ajustes na cópia LOCAL do banco: desativa plugins sem efeito no HTML público e extrai dados para o build.
$db = new mysqli('127.0.0.1', 'root', '', 'nome_do_banco', 3307);
$db->set_charset('utf8mb4');
$off = ['wp-cerber/','wp-fastest-cache/','updraftplus/','duplicator/','all-in-one-wp-migration/','official-facebook-pixel/','akismet/','image-optimization/','elementor-beta/','koko-analytics/','wp-mail-smtp/','duplicate-page/','classic-editor/','classic-widgets/'];
$row = $db->query("SELECT option_value FROM prefixo_options WHERE option_name='active_plugins'")->fetch_row();
$active = unserialize($row[0]);
$keep = array_values(array_filter($active, fn($p) => !array_filter($off, fn($o) => str_starts_with($p, $o))));
$db->query("UPDATE prefixo_options SET option_value='" . $db->real_escape_string(serialize($keep)) . "' WHERE option_name='active_plugins'");
echo "plugins ativos na cópia local:\n  " . implode("\n  ", $keep) . "\n";
// Pixel do Facebook (só o ID)
$fb = $db->query("SELECT option_value FROM prefixo_options WHERE option_name='facebook_config'")->fetch_row();
$cfg = @unserialize($fb[0]);
$pixelId = is_array($cfg) ? ($cfg['pixel_id'] ?? ($cfg['pixel']['pixel_id'] ?? '')) : '';
if (!$pixelId && preg_match('/pixel_id";s:\d+:"(\d+)"/', $fb[0], $m)) $pixelId = $m[1];
echo "facebook pixel id: " . ($pixelId ?: '(não encontrado)') . "\n";
file_put_contents(__DIR__ . '/facebook-pixel-id.txt', $pixelId);
// Mapa Download After Email: id do download -> arquivo
$map = [];
$res = $db->query("SELECT p.ID, p.post_title, m.meta_value FROM prefixo_posts p JOIN prefixo_postmeta m ON m.post_id=p.ID AND m.meta_key='dae_settings' WHERE p.post_type='dae_download'");
while ($r = $res->fetch_assoc()) {
  $s = @unserialize($r['meta_value']);
  $fid = is_array($s) ? (int)($s['file_id'] ?? 0) : 0;
  $file = '';
  if ($fid) { $a = $db->query("SELECT meta_value FROM prefixo_postmeta WHERE post_id=$fid AND meta_key='_wp_attached_file'")->fetch_row(); $file = $a ? $a[0] : ''; }
  $map[$r['ID']] = ['title' => $r['post_title'], 'file_id' => $fid, 'file' => $file ? '/wp-content/uploads/' . $file : '', 'url' => is_array($s) ? ($s['file_url'] ?? '') : ''];
}
file_put_contents(__DIR__ . '/dae-map.json', json_encode($map, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
$semArquivo = array_filter($map, fn($d) => !$d['file']);
echo "downloads DAE: " . count($map) . " (sem arquivo mapeado: " . count($semArquivo) . ")\n";
foreach (array_slice($map, 0, 3, true) as $id => $d) echo "  $id {$d['title']} -> {$d['file']}\n";
// Usuários (só para referência) — nada a alterar
echo "ok\n";
