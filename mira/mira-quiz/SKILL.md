---
name: mira-quiz
description: >-
  Cria um slide de QUIZ AO VIVO no Mira: a plateia escaneia um QR-code, responde
  uma pergunta de múltipla escolha num Google Forms, e o slide lê a planilha de
  respostas via Google Sheets gviz/JSONP. Diferente do mira-survey, o quiz tem
  resposta correta configurada, estado de revelação controlado pelo apresentador
  e porcentagens que só aparecem depois de revelar. Recebe link de votação,
  link da planilha, pergunta, alternativas e resposta correta. Use SEMPRE que o
  usuário disser /mira-quiz, quiz ao vivo, pergunta com resposta correta, revelar
  resposta, ranking do quiz, quiz com QR, quiz tipo Mentimeter, quiz tipo Slido,
  ou pedir um slide onde a plateia responde pelo celular e a resposta correta é
  revelada no palco. Para enquete sem resposta correta use /mira-survey; para QR
  simples use /mira-qrcode.
---

# Skill: Quiz ao vivo no slide

Cria um slide onde a plateia escaneia um QR-code, responde uma pergunta de múltipla escolha num Google Forms, e o resultado aparece no slide com uma revelação animada da resposta correta.

> **Fonte da verdade:** decisões congeladas em `BRAINSTORM_MIRA_QUIZ.md` (2026-06-30). O `/mira-quiz` reaproveita a arquitetura validada do `mira-survey`: Google Forms como interface, Google Sheets como fonte viva e leitura pelo endpoint `gviz` com JSONP para funcionar por `file://`.

## Modelo mental

O Mira não hospeda o jogo. Ele monta um slide que lê respostas já coletadas pelo Google Forms:

1. A plateia abre o **link de votação** pelo QR-code.
2. Cada envio cai na **planilha de respostas** vinculada ao Forms.
3. O slide lê a planilha a cada poucos segundos pelo `gviz`.
4. Antes da revelação, mostra pergunta, QR, alternativas e total de respostas.
5. Depois da revelação, marca a correta em verde e mostra contagem + percentual por alternativa.

## Dados obrigatórios

Antes de gerar qualquer slide, confirme que tem estes dados. Se faltar qualquer item, pergunte e pare.

| Dado | Exemplo | Uso |
|---|---|---|
| Link de votação | `forms.gle/...` ou `docs.google.com/forms/...` | vira QR-code inline |
| Link da planilha | `docs.google.com/spreadsheets/d/<ID>/...` | fonte viva de respostas |
| Pergunta | `Qual destes é um modelo multimodal?` | título do quiz |
| Alternativas | `GPT-4o`, `Excel`, `Photoshop`, `PowerPoint` | cards de resposta |
| Correta | `GPT-4o` | destaque na revelação |
| Campo de nome | primeira coluna textual depois do timestamp, ou índice informado | ranking básico |

Texto sugerido se faltar algo:

> Para montar o quiz ao vivo eu preciso do link de votação do Google Forms, do link da planilha de respostas, da pergunta, das alternativas e da resposta correta. A planilha precisa estar pública como "qualquer pessoa com o link -> Leitor". Pode colar esses dados aqui?

## Formulário esperado

O Google Forms deve ter, no mínimo:

- Um campo de identificação, como nome ou apelido.
- Uma pergunta de múltipla escolha com as mesmas alternativas do slide.

Na planilha, a skill assume:

- A última coluna é a resposta do quiz, salvo se o usuário indicar outro cabeçalho.
- A primeira coluna textual depois do timestamp é o nome/apelido, salvo se o usuário indicar outro cabeçalho.

Se a planilha tiver várias perguntas, avise que o slide usará a última coluna e peça confirmação se isso não estiver claro.

## Verificação da planilha

Extraia o `SHEET_ID` do link da planilha com `/spreadsheets/d/<ID>/` e teste o mesmo endpoint que o slide usará:

```bash
curl -sL "https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:json" | head -c 800
```

Se vier `google.visualization.Query.setResponse({...})` com `"status":"ok"`, a planilha está legível. Se vier HTML de login ou erro, peça para o usuário ajustar o compartilhamento para **qualquer pessoa com o link -> Leitor**.

**Nunca use "Publicar na web -> CSV".** Esse endpoint pode ficar cacheado por minutos. O quiz ao vivo usa só `gviz` + JSONP.

## QR-code local

O QR do link de votação é gerado localmente e embutido como SVG inline, igual ao `/mira-qrcode` e ao `/mira-survey`. Não use `npx qrcode`, API externa nem CDN.

1. Instale o pacote uma vez numa pasta temp reaproveitável, se ainda não existir:

```bash
npm install qrcode --no-save --prefix "<pasta-temp>"
```

2. Gere o SVG:

```bash
node -e "require('qrcode').toString('LINK_VOTACAO',{type:'svg',errorCorrectionLevel:'M',margin:0,color:{dark:'#0a0a0a',light:'#ffffff'}},(e,s)=>{if(e)throw e;process.stdout.write(s)})"
```

3. Cole o `<svg>` inteiro dentro de `.qr-card`, com o comentário:

```html
<!-- QR gerado localmente (pacote npm qrcode, ECC M) para LINK_VOTACAO -->
```

O link de votação não aparece por extenso no slide.

## Estados

O slide tem três estados:

- `votando`: mostra pergunta, alternativas neutras, QR-code, total de respostas e status ao vivo. Não mostra percentuais.
- `revelando`: pausa curta, cards respiram e incorretas reduzem brilho.
- `revelado`: correta em verde `#35D07F`, contagens e percentuais visíveis, barras proporcionais preenchidas.

Comandos:

- Botão discreto "Revelar".
- Tecla `R` para revelar.
- Tecla `K` para alternar ranking depois da revelação.
- Tecla `V` para voltar ao estado de votação durante testes.

## Direção visual

Padrão da v1: cards de alternativas com barras internas. É o melhor formato para esconder porcentagens antes da revelação e destacar a correta depois.

- Fundo escuro Mira, laranja `#FF904D` como identidade.
- Correta em verde `#35D07F`, fundo translúcido e halo leve.
- Incorretas continuam legíveis, mas com menos destaque após revelar.
- Check discreto na correta.
- Barras aparecem só depois da revelação.
- Animação elegante, sem partículas e sem atrapalhar leitura em projeção.
- A Regra Zero do Mira continua valendo: existe loop interno contínuo no slide. Aqui, a bolinha "ao vivo", o brilho suave do QR e uma respiração leve dos cards mantêm o slide vivo.

## Template canônico

Gere o slide a partir deste HTML e preencha apenas:

- `SHEET_ID`
- `QUESTION`
- `OPTIONS`
- `CORRECT`
- `ANSWER_HEADER`, se necessário
- `NAME_HEADER`, se necessário
- SVG inline do QR dentro de `.qr-card`

Salve em `decks/<nome-do-quiz>/index.html`.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mira - Quiz ao vivo</title>
<style>
  :root{
    --bg:#15151a; --panel:#1d1d24; --panel2:#24242d; --ink:#f4f4f6;
    --muted:#9a9aa6; --line:#30303a; --orange:#FF904D; --green:#35D07F;
    --green-soft:rgba(53,208,127,.16); --green-line:rgba(53,208,127,.68);
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  html,body{height:100%;}
  body{background:radial-gradient(circle at 18% 12%, rgba(255,144,77,.12), transparent 32%), var(--bg); color:var(--ink); font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; overflow:hidden;}
  .stage{height:100vh; display:grid; grid-template-columns:1fr 450px; gap:42px; padding:46px 56px; align-items:stretch;}
  .main{min-width:0; display:flex; flex-direction:column; gap:26px;}
  .top{display:flex; align-items:flex-start; justify-content:space-between; gap:28px;}
  .eyebrow{color:var(--orange); font-size:18px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; margin-bottom:12px;}
  .question{font-size:43px; line-height:1.12; font-weight:800; max-width:980px;}
  .status{display:flex; align-items:center; justify-content:flex-end; gap:10px; color:var(--muted); font-size:18px; white-space:nowrap; padding-top:10px;}
  .dot{width:11px; height:11px; border-radius:50%; background:#39d353; box-shadow:0 0 0 0 rgba(57,211,83,.6); animation:pulse 1.6s infinite;}
  .dot.off{background:#888; animation:none; box-shadow:none;}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(57,211,83,.55)}70%{box-shadow:0 0 0 12px rgba(57,211,83,0)}100%{box-shadow:0 0 0 0 rgba(57,211,83,0)}}
  .options{flex:1; display:grid; grid-template-columns:1fr 1fr; gap:18px; align-content:center;}
  .option{position:relative; min-height:142px; overflow:hidden; border:1px solid var(--line); border-radius:22px; background:rgba(29,29,36,.88); padding:24px; display:flex; flex-direction:column; justify-content:space-between; transition:transform .45s ease, opacity .45s ease, border-color .45s ease, background .45s ease, box-shadow .45s ease; animation:card-breathe 5s ease-in-out infinite;}
  .option:nth-child(2){animation-delay:.35s}.option:nth-child(3){animation-delay:.7s}.option:nth-child(4){animation-delay:1.05s}
  @keyframes card-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  .state-revealing .option{animation:suspense .42s ease-in-out 2;}
  @keyframes suspense{0%,100%{transform:translateX(0) scale(1)}25%{transform:translateX(-4px) scale(1.01)}75%{transform:translateX(4px) scale(1.01)}}
  .state-revealed .option{animation:none;}
  .state-revealed .option.wrong{opacity:.52; transform:scale(.985);}
  .state-revealed .option.correct{background:linear-gradient(135deg, var(--green-soft), rgba(29,29,36,.92)); border-color:var(--green-line); box-shadow:0 0 0 1px rgba(53,208,127,.25), 0 18px 70px rgba(53,208,127,.16); transform:scale(1.025);}
  .fill{position:absolute; inset:auto 0 0 0; height:0; background:linear-gradient(90deg, rgba(53,208,127,.36), rgba(53,208,127,.10)); transition:height 900ms cubic-bezier(.2,.8,.2,1); pointer-events:none;}
  .wrong .fill{background:linear-gradient(90deg, rgba(255,255,255,.13), rgba(255,255,255,.04));}
  .state-revealed .fill{height:var(--pct);}
  .option-main{position:relative; z-index:1; display:flex; align-items:flex-start; gap:16px;}
  .letter{width:38px; height:38px; border-radius:12px; display:grid; place-items:center; background:rgba(255,144,77,.15); color:var(--orange); font-weight:800; flex:0 0 auto;}
  .text{font-size:31px; line-height:1.14; font-weight:750;}
  .check{margin-left:auto; width:34px; height:34px; border-radius:50%; display:grid; place-items:center; color:#08150d; background:var(--green); opacity:0; transform:scale(.65); transition:opacity .3s ease, transform .45s cubic-bezier(.2,1.3,.4,1);}
  .state-revealed .correct .check{opacity:1; transform:scale(1);}
  .meta{position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; color:var(--muted); font-size:22px; font-variant-numeric:tabular-nums; opacity:0; transform:translateY(8px); transition:opacity .35s ease, transform .35s ease;}
  .state-revealed .meta{opacity:1; transform:translateY(0);}
  .meta b{color:var(--ink);}
  .side{background:rgba(29,29,36,.92); border:1px solid var(--line); border-radius:28px; padding:34px 30px; display:flex; flex-direction:column; align-items:center; justify-content:space-between; min-width:0;}
  .qr-block{text-align:center; display:flex; flex-direction:column; align-items:center; gap:18px; padding-top:18px;}
  .qr-block h2{font-size:35px; line-height:1.05;}
  .accent{color:var(--orange);}
  .qr-block p{color:var(--muted); font-size:20px; line-height:1.35;}
  .qr-card{background:#fff; padding:17px; border-radius:20px; line-height:0; box-shadow:0 0 34px rgba(255,144,77,.16); animation:qr-glow 3.2s ease-in-out infinite;}
  .qr-card svg{width:338px; height:338px; display:block;}
  @keyframes qr-glow{0%,100%{box-shadow:0 0 26px rgba(255,144,77,.18)}50%{box-shadow:0 0 52px rgba(255,144,77,.34)}}
  .controls{width:100%; display:flex; flex-direction:column; gap:14px;}
  .total{display:flex; justify-content:space-between; align-items:baseline; padding:17px 18px; background:rgba(255,255,255,.04); border:1px solid var(--line); border-radius:18px;}
  .total span{color:var(--muted); font-size:17px;}
  .total b{font-size:42px; line-height:1;}
  .actions{display:flex; gap:10px;}
  button{appearance:none; border:1px solid var(--line); border-radius:14px; background:var(--panel2); color:var(--ink); padding:13px 14px; font-size:16px; font-weight:800; cursor:pointer; flex:1;}
  button.primary{background:var(--orange); color:#23140d; border-color:transparent;}
  button:focus-visible{outline:3px solid rgba(255,144,77,.4); outline-offset:2px;}
  .hint{color:var(--muted); text-align:center; font-size:14px;}
  .ranking{position:absolute; inset:46px 56px; display:none; grid-template-columns:1fr 450px; gap:42px; background:rgba(21,21,26,.96);}
  .ranking.show{display:grid; animation:rank-in .45s ease both;}
  @keyframes rank-in{from{opacity:0; transform:translateY(18px)}to{opacity:1; transform:translateY(0)}}
  .rank-panel{grid-column:1 / 2; align-self:center;}
  .rank-title{font-size:50px; font-weight:850; margin-bottom:24px;}
  .rank-list{display:flex; flex-direction:column; gap:14px; max-width:860px;}
  .rank-item{display:grid; grid-template-columns:72px 1fr auto; gap:18px; align-items:center; background:rgba(29,29,36,.92); border:1px solid var(--line); border-radius:18px; padding:18px 22px; animation:rank-card .5s ease both;}
  .rank-item:nth-child(2){animation-delay:.06s}.rank-item:nth-child(3){animation-delay:.12s}.rank-item:nth-child(4){animation-delay:.18s}.rank-item:nth-child(5){animation-delay:.24s}
  @keyframes rank-card{from{opacity:0; transform:translateY(20px)}to{opacity:1; transform:translateY(0)}}
  .rank-pos{font-size:28px; color:var(--orange); font-weight:850;}
  .rank-name{font-size:30px; font-weight:750;}
  .rank-score{font-size:19px; color:var(--muted);}
  .rank-empty{color:var(--muted); font-size:28px;}
  .rank-side{grid-column:2 / 3; align-self:stretch; display:flex; align-items:center; justify-content:center; color:var(--muted); text-align:center; font-size:22px; line-height:1.4;}
</style>
</head>
<body class="state-voting">
  <main class="stage">
    <section class="main">
      <div class="top">
        <div>
          <div class="eyebrow">Quiz ao vivo</div>
          <h1 class="question" id="question">Qual destes é um modelo multimodal?</h1>
        </div>
        <div class="status"><span class="dot" id="dot"></span><span id="status">conectando...</span></div>
      </div>
      <div class="options" id="options"></div>
    </section>
    <aside class="side">
      <div class="qr-block">
        <h2>Responda <span class="accent">agora</span></h2>
        <p>Aponte a câmera do celular<br>para o QR-code</p>
        <div class="qr-card">
          <!-- QR gerado localmente (pacote npm qrcode, ECC M) para LINK_VOTACAO -->
          <!-- COLE AQUI o <svg> do QR gerado localmente -->
        </div>
      </div>
      <div class="controls">
        <div class="total"><span>respostas recebidas</span><b id="total">0</b></div>
        <div class="actions">
          <button class="primary" id="revealBtn">Revelar</button>
          <button id="rankBtn">Ranking</button>
        </div>
        <div class="hint">R revela · K ranking · V votar</div>
      </div>
    </aside>
  </main>
  <section class="ranking" id="ranking">
    <div class="rank-panel">
      <div class="eyebrow">Participantes que acertaram</div>
      <h2 class="rank-title">Ranking</h2>
      <div class="rank-list" id="rankList"></div>
    </div>
    <div class="rank-side">Pressione K para voltar ao resultado.</div>
  </section>

<script>
  // ===== CONFIG =====
  var SHEET_ID = "COLE_O_SHEET_ID_AQUI";
  var QUESTION = "Qual destes é um modelo multimodal?";
  var OPTIONS = ["GPT-4o", "Excel", "Photoshop", "PowerPoint"];
  var CORRECT = "GPT-4o";
  var ANSWER_HEADER = ""; // deixe vazio para usar a última coluna
  var NAME_HEADER = "";   // deixe vazio para detectar a primeira coluna textual
  var INTERVALO = 3000;

  var counts = {}, displayed = {}, total = 0, rowsCache = [], revealed = false, rankingOpen = false;
  OPTIONS.forEach(function(o){ counts[o]=0; displayed[o]=0; });
  document.getElementById("question").textContent = QUESTION;

  function poll(){
    var s = document.createElement("script");
    s.src = "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
            "/gviz/tq?tqx=out:json;responseHandler:miraQuizPoll&headers=1&_=" + Date.now();
    s.onerror = function(){ setStatus(false); s.remove(); };
    s.onload = function(){ s.remove(); };
    document.body.appendChild(s);
  }

  window.miraQuizPoll = function(resp){
    if(!resp || !resp.table){ setStatus(false); return; }
    var table = resp.table, cols = table.cols || [], rows = table.rows || [];
    var answerIdx = findColumn(cols, ANSWER_HEADER);
    if(answerIdx < 0) answerIdx = cols.length - 1;
    var nameIdx = findColumn(cols, NAME_HEADER);
    if(nameIdx < 0) nameIdx = detectNameColumn(cols, answerIdx);
    var next = {};
    OPTIONS.forEach(function(o){ next[o]=0; });
    rowsCache = [];
    rows.forEach(function(row){
      var answer = cellValue(row, answerIdx);
      var name = cellValue(row, nameIdx);
      if(answer !== ""){
        if(!(answer in next)) next[answer] = 0;
        next[answer] += 1;
        rowsCache.push({name:name || "Participante", answer:answer});
      }
    });
    counts = next;
    total = Object.keys(counts).reduce(function(sum,o){ return sum + counts[o]; }, 0);
    Object.keys(counts).forEach(function(o){ if(!(o in displayed)) displayed[o]=0; });
    setStatus(true);
    renderRanking();
  };

  function findColumn(cols, header){
    if(!header) return -1;
    var wanted = normalize(header);
    for(var i=0;i<cols.length;i++){
      if(normalize(cols[i].label || "") === wanted) return i;
    }
    return -1;
  }

  function detectNameColumn(cols, answerIdx){
    for(var i=1;i<cols.length;i++){
      if(i !== answerIdx) return i;
    }
    return 1;
  }

  function cellValue(row, idx){
    if(idx < 0 || !row || !row.c || !row.c[idx]) return "";
    var v = row.c[idx].v;
    return v === null || v === undefined ? "" : String(v).trim();
  }

  function setStatus(ok){
    var dot = document.getElementById("dot"), st = document.getElementById("status");
    if(ok){ dot.className = "dot"; st.textContent = "ao vivo"; }
    else{ dot.className = "dot off"; st.textContent = "sem conexão com a planilha"; }
  }

  function tick(){
    Object.keys(counts).forEach(function(o){
      var t = counts[o] || 0, d = displayed[o] || 0;
      d = d + (t-d)*0.14;
      if(Math.abs(t-d) < 0.01) d = t;
      displayed[o] = d;
    });
    drawOptions();
    requestAnimationFrame(tick);
  }

  function drawOptions(){
    document.getElementById("total").textContent = total;
    var realTotal = total || 1;
    var html = "";
    OPTIONS.forEach(function(opt, idx){
      var n = counts[opt] || 0;
      var pct = Math.round(100 * n / realTotal);
      var classes = "option";
      if(revealed) classes += opt === CORRECT ? " correct" : " wrong";
      html += '<article class="'+classes+'" style="--pct:'+pct+'%">'+
        '<div class="fill"></div>'+
        '<div class="option-main">'+
          '<div class="letter">'+String.fromCharCode(65+idx)+'</div>'+
          '<div class="text">'+escapeHtml(opt)+'</div>'+
          '<div class="check">✓</div>'+
        '</div>'+
        '<div class="meta"><span><b>'+n+'</b> votos</span><span>'+pct+'%</span></div>'+
      '</article>';
    });
    document.getElementById("options").innerHTML = html;
  }

  function reveal(){
    if(revealed) return;
    document.body.className = "state-revealing";
    setTimeout(function(){
      revealed = true;
      document.body.className = "state-revealed";
      renderRanking();
    }, 900);
  }

  function voteMode(){
    revealed = false;
    rankingOpen = false;
    document.body.className = "state-voting";
    document.getElementById("ranking").className = "ranking";
  }

  function toggleRanking(){
    if(!revealed) reveal();
    rankingOpen = !rankingOpen;
    document.getElementById("ranking").className = rankingOpen ? "ranking show" : "ranking";
    renderRanking();
  }

  function renderRanking(){
    var hits = rowsCache.filter(function(r){ return normalize(r.answer) === normalize(CORRECT); });
    var seen = {}, unique = [];
    hits.forEach(function(r){
      var key = normalize(r.name);
      if(!seen[key]){ seen[key]=1; unique.push(r); }
    });
    var list = document.getElementById("rankList");
    if(!unique.length){ list.innerHTML = '<div class="rank-empty">Aguardando acertos...</div>'; return; }
    list.innerHTML = unique.slice(0,5).map(function(r,i){
      return '<div class="rank-item"><div class="rank-pos">#'+(i+1)+'</div>'+
        '<div class="rank-name">'+escapeHtml(r.name)+'</div>'+
        '<div class="rank-score">acertou</div></div>';
    }).join("");
  }

  function normalize(s){
    return String(s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; });
  }

  document.getElementById("revealBtn").addEventListener("click", reveal);
  document.getElementById("rankBtn").addEventListener("click", toggleRanking);
  window.addEventListener("keydown", function(ev){
    if(ev.key === "r" || ev.key === "R") reveal();
    if(ev.key === "k" || ev.key === "K") toggleRanking();
    if(ev.key === "v" || ev.key === "V") voteMode();
  });

  drawOptions();
  poll();
  setInterval(poll, INTERVALO);
  requestAnimationFrame(tick);
</script>
</body>
</html>
```

## Passos

1. **Confirmar dados obrigatórios.** Link de votação, link da planilha, pergunta, alternativas e resposta correta. Se faltar algo, peça e pare.
2. **Validar a correta.** A resposta correta precisa ser exatamente uma das alternativas, ignorando só caixa e acentos para conferência. No HTML, grave o texto canônico da alternativa.
3. **Extrair `SHEET_ID`** do link da planilha e verificar o `gviz`. Se a planilha não estiver pública, peça ajuste.
4. **Gerar QR localmente** com `qrcode` e embutir SVG inline. Nunca mostre o link por extenso no slide.
5. **Montar o slide** com o template canônico. Preencha `QUESTION`, `OPTIONS`, `CORRECT`, `SHEET_ID` e, se necessário, `ANSWER_HEADER` e `NAME_HEADER`.
6. **Salvar em `decks/<nome-do-quiz>/index.html`.**
7. **Reportar** o caminho do arquivo, os atalhos (`R`, `K`, `V`) e lembrar que o slide precisa de internet para ler a planilha, mas abre por duplo clique via `file://`.

## Checklist

- [ ] Usa QR code gerado localmente como SVG inline.
- [ ] Usa Google Forms como interface de resposta.
- [ ] Usa Google Sheets como fonte viva de dados.
- [ ] Lê a planilha via `gviz` + JSONP.
- [ ] Pergunta é de múltipla escolha.
- [ ] Resposta correta configurada explicitamente.
- [ ] Correta existe entre as alternativas.
- [ ] Porcentagens só aparecem depois da revelação.
- [ ] Revelação acionada por botão ou tecla `R`.
- [ ] Correta marcada em verde suave `#35D07F`, flat e legível.
- [ ] Animação de revelação tem suspense, destaque e barras animadas.
- [ ] Ranking básico por nome/apelido disponível por tecla `K`.
- [ ] Preserva a Regra Zero do Mira com loop interno contínuo.
- [ ] Link de votação não aparece por extenso no slide.
- [ ] Nenhum "Publicar na web -> CSV".
- [ ] Texto revisado, acentuação correta e sem travessão.
