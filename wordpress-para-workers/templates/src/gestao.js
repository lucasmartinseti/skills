// Área administrativa (/wp-admin/): telas de login, bloqueio e o painel (páginas, usuários, bloqueios de IP).
// Tudo em uma tela, sem dependências externas. Edições ficam no KV (CONTENT) e passam a valer na hora.

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `
*{box-sizing:border-box}body{margin:0;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#f3f5f7;color:#1f2933}
a{color:#077f36}header.topo{background:#122c47;color:#fff;padding:12px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
header.topo h1{font-size:17px;margin:0;font-weight:600}header.topo .esp{flex:1}header.topo form{margin:0}
.btn{display:inline-block;padding:8px 14px;border-radius:4px;border:1px solid #cfd6dd;background:#fff;color:#1f2933;cursor:pointer;font-size:14px;text-decoration:none;line-height:1.3}
.btn:hover{background:#f0f2f4}.btn-p{background:#077f36;border-color:#077f36;color:#fff}.btn-p:hover{background:#066a2d}
.btn-d{color:#b42318;border-color:#f3b2ab}.btn-d:hover{background:#fdf1ef}.btn[disabled]{opacity:.5;cursor:default}
nav.abas{display:flex;gap:6px;padding:12px 20px 0;max-width:1400px;margin:0 auto}nav.abas button{border:1px solid #cfd6dd;border-bottom:0;background:#e9edf1;padding:9px 16px;border-radius:6px 6px 0 0;cursor:pointer;font-size:14px}nav.abas button.ativo{background:#fff;font-weight:600}
main{padding:0 20px 20px;max-width:1400px;margin:0 auto}.caixa{background:#fff;border:1px solid #e3e8ee;border-radius:0 6px 6px 6px;padding:16px;margin-bottom:16px}
.login{max-width:400px;margin:60px auto;border-radius:6px}.login h2{margin:0 0 6px}.login p{margin:0 0 18px;color:#52606d}
label{display:block;font-weight:600;margin:12px 0 6px}input[type=text],input[type=password],input[type=search],input[type=email]{width:100%;padding:10px 12px;border:1px solid #cfd6dd;border-radius:4px;font-size:15px}
.erro{background:#fdf1ef;color:#b42318;border:1px solid #f3b2ab;padding:10px 12px;border-radius:4px;margin-bottom:12px}
.ok{background:#eefaf1;color:#077f36;border:1px solid #bfe6cb;padding:10px 12px;border-radius:4px;margin-bottom:12px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #eef1f4;vertical-align:middle}th{font-size:13px;color:#52606d;text-transform:uppercase;letter-spacing:.3px}
td .caminho{color:#52606d;font-size:13px}.tag{display:inline-block;background:#fff4e5;color:#9a5b00;border-radius:3px;padding:2px 7px;font-size:12px;font-weight:600}.tag.off{background:#f0f2f4;color:#52606d}
.barra{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.barra .esp{flex:1}
.modos{display:inline-flex;border:1px solid #cfd6dd;border-radius:4px;overflow:hidden}.modos button{border:0;background:#fff;padding:8px 14px;cursor:pointer;font-size:14px}.modos button.ativo{background:#122c47;color:#fff}
iframe.preview{width:100%;height:72vh;border:1px solid #cfd6dd;border-radius:4px;background:#fff}
textarea.codigo{width:100%;height:72vh;font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;border:1px solid #cfd6dd;border-radius:4px;padding:12px;white-space:pre;overflow:auto}
.dica{color:#52606d;font-size:13px;margin:8px 0 0}.oculto{display:none}
.form-linha{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end}.form-linha label{margin-top:0}
`;

const head = (titulo) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(titulo)} - Nome do Cliente</title><style>${CSS}</style></head>`;

export function gestaoLogin({ erro }) {
  return `${head('Entrar')}
<body><main><div class="caixa login"><h2>Área administrativa</h2><p>Nome do Cliente · use o mesmo usuário e senha do WordPress</p>${erro ? `<div class="erro">${esc(erro)}</div>` : ''}
<form method="post" action="/wp-admin/login"><label for="u">Usuário</label><input type="text" id="u" name="log" autocomplete="username" required autofocus>
<label for="s">Senha</label><input type="password" id="s" name="pwd" autocomplete="current-password" required>
<p style="margin-top:18px"><button class="btn btn-p" type="submit">Entrar</button></p></form>
<p class="dica">Após 3 erros de senha seguidos o seu endereço IP fica bloqueado por 24 horas. Outro administrador pode desbloquear antes.</p></div></main></body></html>`;
}

export function gestaoBloqueado({ ip }) {
  return `${head('Acesso bloqueado')}
<body><main><div class="caixa login"><h2>Acesso bloqueado</h2><p>O endereço IP <b>${esc(ip)}</b> foi bloqueado depois de 3 erros de senha seguidos.</p>
<p>O bloqueio dura 24 horas. Se for engano, peça a outro administrador para desbloquear em <i>Bloqueios de IP</i>, ou tente de outra conexão.</p></div></main></body></html>`;
}

export function gestaoApp({ user }) {
  return `${head('Administração')}
<body>
<header class="topo"><h1>Administração do site · Nome do Cliente</h1><span class="esp"></span><span>${esc(user)}</span><a class="btn" href="/" target="_blank" rel="noopener">Ver o site</a><a class="btn" href="/wp-admin/api/exportar">Exportar edições</a><form method="post" action="/wp-admin/logout"><button class="btn" type="submit">Sair</button></form></header>
<nav class="abas"><button data-aba="paginas" class="ativo">Páginas</button><button data-aba="usuarios">Usuários</button><button data-aba="bloqueios">Bloqueios de IP</button></nav>
<main>
<section id="aba-paginas">
<div id="lista" class="caixa">
  <div class="barra"><input type="search" id="filtro" placeholder="Filtrar por título ou endereço…" style="max-width:420px"><span class="esp"></span><span id="resumo" class="dica"></span></div>
  <table><thead><tr><th>Página</th><th style="width:120px">Situação</th><th style="width:260px"></th></tr></thead><tbody id="linhas"><tr><td colspan="3">Carregando…</td></tr></tbody></table>
</div>
<div id="editor" class="caixa oculto">
  <div class="barra">
    <button class="btn" id="voltar">← Páginas</button>
    <strong id="titulo"></strong><span id="caminho" class="caminho"></span>
    <span class="esp"></span>
    <div class="modos"><button data-modo="visual" class="ativo">Visual</button><button data-modo="html">HTML do conteúdo</button><button data-modo="doc">Documento completo</button></div>
    <a class="btn" id="abrir" target="_blank" rel="noopener">Abrir no site</a>
    <button class="btn" id="desfazer">Desfazer última gravação</button>
    <button class="btn btn-d" id="restaurar">Restaurar original</button>
    <button class="btn btn-p" id="salvar">Salvar e publicar</button>
  </div>
  <div id="aviso"></div>
  <iframe class="preview" id="preview" sandbox="allow-same-origin"></iframe>
  <textarea class="codigo oculto" id="codigo" spellcheck="false"></textarea>
  <p class="dica">No modo <b>Visual</b> clique no texto da página e edite diretamente (sem scripts: animações e carrosséis ficam parados aqui, mas funcionam no site). Para trocar imagens ou blocos inteiros use o <b>HTML do conteúdo</b>. O <b>Documento completo</b> permite mexer em cabeçalho e rodapé desta página.</p>
</div>
</section>
<section id="aba-usuarios" class="oculto">
<div class="caixa">
  <div id="aviso-usuarios"></div>
  <table><thead><tr><th>Usuário</th><th>E-mail</th><th>Senha</th><th>Último acesso</th><th style="width:300px"></th></tr></thead><tbody id="linhas-usuarios"><tr><td colspan="5">Carregando…</td></tr></tbody></table>
  <h3 style="margin:24px 0 8px">Novo usuário</h3>
  <div class="form-linha"><div><label>Login</label><input type="text" id="nu-login" autocomplete="off"></div><div><label>Nome</label><input type="text" id="nu-nome"></div><div><label>E-mail</label><input type="email" id="nu-email"></div><div><label>Senha (mín. 10)</label><input type="password" id="nu-senha" autocomplete="new-password"></div><div><button class="btn btn-p" id="nu-criar">Criar</button></div></div>
  <p class="dica">Todos os usuários têm os mesmos poderes (editar páginas, gerir usuários e bloqueios). Os usuários importados do WordPress entram com a mesma senha de lá.</p>
</div>
</section>
<section id="aba-bloqueios" class="oculto">
<div class="caixa">
  <div id="aviso-bloqueios"></div>
  <table><thead><tr><th>IP</th><th>Bloqueado em</th><th>Último login tentado</th><th style="width:160px"></th></tr></thead><tbody id="linhas-bloqueios"><tr><td colspan="4">Carregando…</td></tr></tbody></table>
  <p class="dica">Um IP entra aqui após 3 erros de senha seguidos e sai sozinho depois de 24 horas. Seu IP atual: <span id="meu-ip"></span>.</p>
</div>
</section>
</main>
<script>
(function(){
  var api = function(url, opts){ return fetch(url, Object.assign({ credentials: 'same-origin' }, opts || {})).then(function(r){ return r.json().then(function(j){ if(!r.ok||!j.ok){ throw new Error(j.erro||('Erro '+r.status)); } return j; }); }); };
  var post = function(url, body){ return api(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); };
  var $ = function(id){ return document.getElementById(id); };
  var escapar = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var data = function(iso){ return iso ? new Date(iso).toLocaleString('pt-BR') : '—'; };
  var estado = { paginas: [], editadas: [], atual: null, modo: 'visual', doc: '' };

  // ---- abas ----
  document.querySelectorAll('nav.abas button').forEach(function(b){ b.addEventListener('click', function(){
    document.querySelectorAll('nav.abas button').forEach(function(x){ x.classList.toggle('ativo', x===b); });
    ['paginas','usuarios','bloqueios'].forEach(function(a){ $('aba-'+a).classList.toggle('oculto', a!==b.getAttribute('data-aba')); });
    if (b.getAttribute('data-aba')==='usuarios') carregarUsuarios(); if (b.getAttribute('data-aba')==='bloqueios') carregarBloqueios();
  }); });

  // ---- páginas ----
  function carregarLista(){
    api('/wp-admin/api/paginas').then(function(j){ estado.paginas = j.paginas; estado.editadas = j.editadas; renderLista(); }).catch(function(e){ $('linhas').innerHTML = '<tr><td colspan="3" class="erro">'+escapar(e.message)+'</td></tr>'; });
  }
  function renderLista(){
    var f = ($('filtro').value||'').toLowerCase();
    var itens = estado.paginas.filter(function(p){ return !f || (p.title||'').toLowerCase().indexOf(f)>=0 || p.path.toLowerCase().indexOf(f)>=0; });
    $('resumo').textContent = itens.length+' página(s) · '+estado.editadas.length+' editada(s)';
    $('linhas').innerHTML = itens.map(function(p){
      var ed = estado.editadas.indexOf(p.path)>=0;
      return '<tr><td><div>'+escapar(p.title||p.path)+'</div><div class="caminho">'+escapar(p.path)+'</div></td><td>'+(ed?'<span class="tag">editada</span>':'<span class="caminho">original</span>')+'</td><td><button class="btn btn-p" data-editar="'+escapar(p.path)+'">Editar</button> <a class="btn" href="'+escapar(p.path)+'" target="_blank" rel="noopener">Ver</a></td></tr>';
    }).join('') || '<tr><td colspan="3">Nenhuma página encontrada.</td></tr>';
  }
  $('filtro').addEventListener('input', renderLista);
  $('linhas').addEventListener('click', function(ev){ var b = ev.target.closest('[data-editar]'); if (b) abrir(b.getAttribute('data-editar')); });

  function abrir(path){
    api('/wp-admin/api/pagina?p='+encodeURIComponent(path)).then(function(j){
      estado.atual = j; estado.doc = j.html;
      var p = estado.paginas.filter(function(x){ return x.path===j.path; })[0];
      $('titulo').textContent = (p && p.title) || j.path; $('caminho').textContent = ' '+j.path; $('abrir').href = j.path;
      $('desfazer').disabled = !j.temAnterior; $('restaurar').disabled = !j.editada;
      $('aviso').innerHTML = j.editada ? '<div class="ok">Esta página tem uma versão editada publicada (diferente do arquivo original).</div>' : '';
      $('lista').classList.add('oculto'); $('editor').classList.remove('oculto');
      setModo('visual');
    }).catch(function(e){ alert(e.message); });
  }
  $('voltar').addEventListener('click', function(){ if (!confirmarSaida()) return; $('editor').classList.add('oculto'); $('lista').classList.remove('oculto'); estado.atual = null; carregarLista(); });
  document.querySelectorAll('.modos button').forEach(function(b){ b.addEventListener('click', function(){ sincronizar(); setModo(b.getAttribute('data-modo')); }); });

  function partes(doc){ var m = doc.match(/<main\\b[^>]*>/i); if (!m) return null; var ini = m.index + m[0].length; var fim = doc.lastIndexOf('</main>'); if (fim < ini) return null; return { antes: doc.slice(0, ini), conteudo: doc.slice(ini, fim), depois: doc.slice(fim) }; }

  function setModo(modo){
    estado.modo = modo;
    document.querySelectorAll('.modos button').forEach(function(b){ b.classList.toggle('ativo', b.getAttribute('data-modo')===modo); });
    var pv = $('preview'), cd = $('codigo');
    if (modo === 'visual') {
      pv.classList.remove('oculto'); cd.classList.add('oculto');
      var extra = '<style>.elementor-invisible{visibility:visible!important}html{scroll-behavior:auto}</style><base href="'+location.origin+'/">';
      pv.srcdoc = estado.doc.replace(/<head([^>]*)>/i, '<head$1>'+extra);
      pv.onload = function(){ try { pv.contentDocument.designMode = 'on'; pv.contentDocument.addEventListener('click', function(e){ var a = e.target.closest('a'); if (a) e.preventDefault(); }, true); } catch(e){} };
    } else {
      pv.classList.add('oculto'); cd.classList.remove('oculto');
      if (modo === 'html') { var p = partes(estado.doc); cd.value = p ? p.conteudo : estado.doc; } else { cd.value = estado.doc; }
    }
  }
  function sincronizar(){
    if (estado.modo === 'visual') {
      try { var d = $('preview').contentDocument; if (!d) return; var main = d.querySelector('main'); var p = partes(estado.doc); if (main && p) estado.doc = p.antes + main.innerHTML + p.depois; } catch(e){}
    } else if (estado.modo === 'html') { var q = partes(estado.doc); if (q) estado.doc = q.antes + $('codigo').value + q.depois; }
    else { estado.doc = $('codigo').value; }
  }
  function confirmarSaida(){ if (!estado.atual) return true; sincronizar(); return estado.doc === estado.atual.html || confirm('Há alterações não salvas. Sair mesmo assim?'); }

  $('salvar').addEventListener('click', function(){
    sincronizar();
    post('/wp-admin/api/pagina', { path: estado.atual.path, html: estado.doc })
      .then(function(){ estado.atual.html = estado.doc; estado.atual.editada = true; estado.atual.temAnterior = true; $('restaurar').disabled = false; $('desfazer').disabled = false; $('aviso').innerHTML = '<div class="ok">Publicado. A página já está no ar com a nova versão (pode levar até 1 minuto para atualizar em quem já a tinha aberta).</div>'; })
      .catch(function(e){ $('aviso').innerHTML = '<div class="erro">'+escapar(e.message)+'</div>'; });
  });
  $('restaurar').addEventListener('click', function(){ if (!confirm('Descartar a versão editada e voltar ao arquivo original publicado?')) return; post('/wp-admin/api/restaurar', { path: estado.atual.path }).then(function(){ abrir(estado.atual.path); }).catch(function(e){ alert(e.message); }); });
  $('desfazer').addEventListener('click', function(){ if (!confirm('Voltar para a versão gravada anteriormente?')) return; post('/wp-admin/api/desfazer', { path: estado.atual.path }).then(function(){ abrir(estado.atual.path); }).catch(function(e){ alert(e.message); }); });
  window.addEventListener('beforeunload', function(e){ if (estado.atual && !$('editor').classList.contains('oculto')) { sincronizar(); if (estado.doc !== estado.atual.html) { e.preventDefault(); e.returnValue = ''; } } });

  // ---- usuários ----
  function carregarUsuarios(){
    api('/wp-admin/api/usuarios').then(function(j){
      $('linhas-usuarios').innerHTML = j.usuarios.map(function(u){
        var eu = u.login === j.eu;
        return '<tr><td><div><b>'+escapar(u.login)+'</b>'+(eu?' <span class="tag off">você</span>':'')+(u.ativo?'':' <span class="tag">desativado</span>')+'</div><div class="caminho">'+escapar(u.nome||'')+(u.origem==='wordpress'?' · importado do WordPress':'')+'</div></td><td>'+escapar(u.email||'')+'</td><td class="caminho">'+escapar(u.senha)+'</td><td class="caminho">'+data(u.ultimoLogin)+'</td><td>'+
          '<button class="btn" data-acao="senha" data-login="'+escapar(u.login)+'">Trocar senha</button> '+(eu?'':'<button class="btn" data-acao="ativo" data-ativo="'+(u.ativo?'0':'1')+'" data-login="'+escapar(u.login)+'">'+(u.ativo?'Desativar':'Ativar')+'</button> <button class="btn btn-d" data-acao="remover" data-login="'+escapar(u.login)+'">Remover</button>')+'</td></tr>';
      }).join('');
    }).catch(function(e){ $('aviso-usuarios').innerHTML = '<div class="erro">'+escapar(e.message)+'</div>'; });
  }
  $('linhas-usuarios').addEventListener('click', function(ev){
    var b = ev.target.closest('[data-acao]'); if (!b) return;
    var login = b.getAttribute('data-login'), acao = b.getAttribute('data-acao'), p;
    if (acao === 'senha') { var s = prompt('Nova senha para '+login+' (mínimo 10 caracteres):'); if (!s) return; p = post('/wp-admin/api/usuarios', { acao: 'senha', login: login, senha: s }); }
    else if (acao === 'ativo') { p = post('/wp-admin/api/usuarios', { acao: 'ativo', login: login, ativo: b.getAttribute('data-ativo')==='1' }); }
    else if (acao === 'remover') { if (!confirm('Remover o usuário '+login+'?')) return; p = post('/wp-admin/api/usuarios', { acao: 'remover', login: login }); }
    p.then(function(){ $('aviso-usuarios').innerHTML = '<div class="ok">Feito.</div>'; carregarUsuarios(); }).catch(function(e){ $('aviso-usuarios').innerHTML = '<div class="erro">'+escapar(e.message)+'</div>'; });
  });
  $('nu-criar').addEventListener('click', function(){
    post('/wp-admin/api/usuarios', { acao: 'novo', login: $('nu-login').value, nome: $('nu-nome').value, email: $('nu-email').value, senha: $('nu-senha').value })
      .then(function(){ ['nu-login','nu-nome','nu-email','nu-senha'].forEach(function(i){ $(i).value=''; }); $('aviso-usuarios').innerHTML = '<div class="ok">Usuário criado.</div>'; carregarUsuarios(); })
      .catch(function(e){ $('aviso-usuarios').innerHTML = '<div class="erro">'+escapar(e.message)+'</div>'; });
  });

  // ---- bloqueios ----
  function carregarBloqueios(){
    api('/wp-admin/api/bloqueios').then(function(j){
      $('meu-ip').textContent = j.meuIp;
      $('linhas-bloqueios').innerHTML = j.bloqueios.length ? j.bloqueios.map(function(b){ return '<tr><td><b>'+escapar(b.ip)+'</b></td><td>'+data(b.quando)+'</td><td>'+escapar(b.ultimoLogin||'')+'</td><td><button class="btn" data-ip="'+escapar(b.ip)+'">Desbloquear</button></td></tr>'; }).join('') : '<tr><td colspan="4">Nenhum IP bloqueado no momento.</td></tr>';
    }).catch(function(e){ $('aviso-bloqueios').innerHTML = '<div class="erro">'+escapar(e.message)+'</div>'; });
  }
  $('linhas-bloqueios').addEventListener('click', function(ev){ var b = ev.target.closest('[data-ip]'); if (!b) return; post('/wp-admin/api/bloqueios', { acao: 'desbloquear', ip: b.getAttribute('data-ip') }).then(carregarBloqueios).catch(function(e){ alert(e.message); }); });

  carregarLista();
})();
</script>
</body></html>`;
}
