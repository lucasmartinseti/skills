/**
 * mira-slide-to-video :: grava UM slide de um deck Mira como clipe .mp4.
 *
 * Captura em tempo real (Chrome headless + puppeteer-screen-recorder + ffmpeg).
 * Fidelidade ao slide:
 *  - a animacao NAO dispara sozinha: faz shim do IntersectionObserver do deck,
 *    posiciona o slide-alvo, comeca a gravar e SO ENTAO dispara -> t=0 limpo,
 *    sem vazar o slide anterior;
 *  - opcional: mede a caixa do conteudo e aplica um scale para preencher o frame.
 *
 * CommonJS (.cjs) de proposito: roda igual no repo-fonte (package type:module) e
 * instalado em .claude/skills, sem virar ESM.
 *
 * Caminhos por variavel de ambiente (com defaults):
 *  MIRA_CHROME  -> executavel do Chrome (senao tenta locais comuns)
 *  MIRA_FFMPEG  -> binario do ffmpeg   (senao usa "ffmpeg" do PATH)
 *
 * Uso CLI: node record-slide.cjs <input.html> <output.mp4> <slideIndex> <segundos> [fill] [W] [H]
 */
const path = require('path');
const fs = require('fs');

function findChrome() {
  if (process.env.MIRA_CHROME) return process.env.MIRA_CHROME;
  const la = process.env.LOCALAPPDATA || '';
  const cands = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    la ? la.replace(/\\/g, '/') + '/Google/Chrome/Application/chrome.exe' : null,
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const c of cands) { try { if (fs.existsSync(c)) return c; } catch (_) {} }
  return undefined; // deixa o puppeteer usar o Chromium proprio
}
const FFMPEG = process.env.MIRA_FFMPEG || 'ffmpeg';

/**
 * Grava um slide. Reusa um browser ja aberto (para lotes) OU abre um proprio.
 * @param {object} opts
 * @param {import('puppeteer').Browser} [opts.browser] browser ja aberto (opcional)
 * @param {string} opts.input   caminho do .html do deck
 * @param {string} opts.output  caminho do .mp4 do clipe
 * @param {number} opts.slideIndex  1-based
 * @param {number} opts.seconds  duracao da gravacao
 * @param {number} [opts.width=1920]
 * @param {number} [opts.height=1080]
 * @param {number} [opts.fill=0]  fracao da altura a preencher via scale; 0 desliga
 */
async function recordSlide(opts) {
  const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
  const input = path.resolve(opts.input);
  const output = path.resolve(opts.output);
  const slideIndex = parseInt(opts.slideIndex, 10) || 1;
  const seconds = parseFloat(opts.seconds) || 4;
  const W = parseInt(opts.width, 10) || 1920;
  const H = parseInt(opts.height, 10) || 1080;
  const fill = opts.fill == null ? 0 : parseFloat(opts.fill);

  if (!fs.existsSync(input)) throw new Error('HTML nao encontrado: ' + input);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const fileUrl = 'file:///' + input.replace(/\\/g, '/');

  let browser = opts.browser;
  let ownBrowser = false;
  if (!browser) {
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({
      headless: 'new', executablePath: findChrome(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars',
             '--force-device-scale-factor=1', `--window-size=${W},${H}`],
    });
    ownBrowser = true;
  }

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

    // shim do IntersectionObserver: a animacao do Mira nao dispara sozinha
    await page.evaluateOnNewDocument(() => {
      window.__miraObs = [];
      window.IntersectionObserver = function (cb) {
        const self = {
          _cb: cb, _t: [],
          observe(el) { this._t.push(el); },
          unobserve(el) { this._t = this._t.filter(x => x !== el); },
          disconnect() { this._t = []; },
          takeRecords() { return []; },
          root: null, rootMargin: '', thresholds: [],
        };
        window.__miraObs.push(self);
        return self;
      };
      window.__miraTrigger = function (section) {
        window.__miraObs.forEach(o => o._t.slice().forEach(el => {
          if (section === el || section.contains(el)) {
            o._cb([{ isIntersecting: true, intersectionRatio: 1, target: el,
                     boundingClientRect: el.getBoundingClientRect(), time: 0 }], o);
          }
        }));
      };
    });

    await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    const total = await page.evaluate(() => document.querySelectorAll('body > section').length);
    if (slideIndex < 1 || slideIndex > total) {
      throw new Error(`slideIndex ${slideIndex} fora do intervalo (1..${total})`);
    }

    // esconder UI de navegacao + rolagem instantanea
    await page.addStyleTag({ content:
      'html{scroll-behavior:auto !important;}#mira-progress,#mira-next{display:none !important;}' });

    // posicionar o slide-alvo pela posicao de layout (animacao ainda em espera)
    await page.evaluate((idx) => {
      const sec = document.querySelectorAll('body > section')[idx - 1];
      window.scrollTo(0, sec.offsetTop);
    }, slideIndex);

    // preencher o frame via scale (opcional)
    if (fill > 0) {
      await page.evaluate((idx, W, H, fill) => {
        const sec = document.querySelectorAll('body > section')[idx - 1];
        let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
        Array.from(sec.children).forEach(k => {
          const c = k.getBoundingClientRect();
          l = Math.min(l, c.left); t = Math.min(t, c.top);
          r = Math.max(r, c.right); b = Math.max(b, c.bottom);
        });
        const k = Math.min((fill * H) / (b - t), (0.96 * W) / (r - l), 2.2);
        sec.classList.add('mira-cap-target');
        const st = document.createElement('style');
        st.textContent = `.mira-cap-target{transform:scale(${k});transform-origin:center center;}`;
        document.head.appendChild(st);
      }, slideIndex, W, H, fill);
    }

    // deixar o AOS (fade-up do titulo) assentar
    await new Promise(r => setTimeout(r, 1000));

    const recorder = new PuppeteerScreenRecorder(page, {
      fps: 30, ffmpeg_Path: FFMPEG,
      videoFrame: { width: W, height: H }, aspectRatio: H > W ? '9:16' : '16:9',
    });
    await recorder.start(output);

    // dispara a animacao em sincronia com o inicio da gravacao
    await page.evaluate((idx) => {
      window.__miraTrigger(document.querySelectorAll('body > section')[idx - 1]);
    }, slideIndex);

    await new Promise(r => setTimeout(r, Math.round(seconds * 1000)));
    await recorder.stop();
    return output;
  } finally {
    await page.close();
    if (ownBrowser) await browser.close();
  }
}

module.exports = { recordSlide, findChrome, FFMPEG };

// ---- CLI ----
if (require.main === module) {
  const [input, output, slide, secs, fill, w, h] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Uso: node record-slide.cjs <input.html> <output.mp4> <slideIndex> <segundos> [fill] [W] [H]');
    process.exit(1);
  }
  recordSlide({ input, output, slideIndex: slide, seconds: secs, fill, width: w, height: h })
    .then(o => console.log('Clipe salvo:', o))
    .catch(err => { console.error('Erro:', err.message); process.exit(1); });
}
