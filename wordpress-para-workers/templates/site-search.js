// Busca do site feita no navegador: lê /search-index.json e mostra os resultados em /busca/.
(function () {
  var params = new URLSearchParams(location.search);
  var q = (params.get('s') || '').trim();
  var title = document.getElementById('search-title');
  var box = document.getElementById('search-results');
  if (!box) return;
  var form = document.createElement('form');
  form.className = 'wpw-busca-form'; form.method = 'get'; form.action = '/busca/';
  form.innerHTML = '<input type="search" name="s" placeholder="O que você procura?" value="' + q.replace(/"/g, '&quot;') + '"><button type="submit">Buscar</button>';
  box.parentNode.insertBefore(form, box);
  var norm = function (s) { return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tipos = { produto: 'Produto', post: 'Blog', pagina: 'Página' };
  if (!q) { title.textContent = 'Busca'; box.innerHTML = '<p>Digite o que procura: nome do produto, serviço, assunto…</p>'; return; }
  title.textContent = 'Buscando por "' + q + '"…';
  fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (items) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    var scored = items.map(function (it) {
      var t = norm(it.title), x = norm(it.excerpt), b = norm(it.text), u = norm(it.url);
      var score = 0;
      terms.forEach(function (w) {
        if (t.indexOf(w) >= 0) score += 10;
        if (u.indexOf(w) >= 0) score += 6;
        if (x.indexOf(w) >= 0) score += 3;
        if (b.indexOf(w) >= 0) score += 1;
      });
      if (terms.length > 1 && t.indexOf(norm(q)) >= 0) score += 10;
      return { it: it, score: score };
    }).filter(function (r) { return r.score > 0; }).sort(function (a, b) { return b.score - a.score; });
    title.textContent = scored.length ? scored.length + ' resultado' + (scored.length > 1 ? 's' : '') + ' para "' + q + '"' : 'Nada encontrado para "' + q + '"';
    box.innerHTML = scored.length ? scored.map(function (r) {
      var it = r.it;
      var i = norm(it.text).indexOf(terms[0]); var snippet = it.excerpt || (i >= 0 ? '…' + it.text.slice(Math.max(0, i - 80), i + 160) + '…' : it.text.slice(0, 200));
      return '<article class="wpw-resultado">' + (it.image ? '<a href="' + esc(it.url) + '"><img src="' + esc(it.image) + '" alt="" loading="lazy"></a>' : '') +
        '<div><span class="wpw-tipo">' + (tipos[it.type] || '') + '</span><h2><a href="' + esc(it.url) + '">' + esc(it.title) + '</a></h2><p>' + esc(snippet) + '</p></div></article>';
    }).join('') : '<p>Tente outro termo, como o nome de um produto ou serviço.</p>';
  }).catch(function () { title.textContent = 'A busca não está disponível no momento.'; });
})();
