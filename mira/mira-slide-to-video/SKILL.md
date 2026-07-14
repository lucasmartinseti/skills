---
name: mira-slide-to-video
description: >-
  Gera um arquivo de video .mp4 a partir de um ou mais slides de um deck do Mira,
  gravando a animacao real do slide (Chrome headless + captura em tempo real,
  juncao com ffmpeg). O video expressa exatamente o slide: a animacao dispara do
  zero, sem vazar o slide anterior, enquadrada e preenchendo o frame. Recebe qual
  slide ou slides entram no video (um, varios ou todos) e a resolucao (16:9, 9:16,
  1:1), e monta um unico mp4; quando ha mais de um slide, encadeia com transicao,
  4 segundos por padrao, alteravel pelo usuario. Slides com animacao finita, como
  o chart-race, tocam por inteiro. Nunca toca no deck original. Use SEMPRE que o
  usuario disser /mira-slide-to-video, gerar video do slide, transformar slide em
  video, exportar slide como mp4, gravar a animacao do slide, video do deck, quero
  um mp4 do slide, renderizar o slide em video, ou fazer um Reels/Short a partir
  do slide.
---

# Skill: Slide (ou slides) do Mira em video .mp4

Grava a animacao real de um ou mais slides de um deck e entrega um unico `.mp4`. Casos tipicos: exportar um slide para Reels/Shorts, gerar um teaser do deck, mandar um trecho animado por WhatsApp.

## O que ela faz, em uma frase

Abre o deck no Chrome headless, grava cada slide pedido em tempo real (a animacao comeca do zero, sem vazar o slide anterior, preenchendo o frame), e junta os clipes num video, com uma transicao entre eles.

## Regra de Ouro: nunca toca no deck original

Grava a partir do `index.html` (ou de um `index-9x16.html` etc.) sem editar nada. A saida `.mp4` vai para a pasta do deck (ou o caminho que o usuario pedir).

## Modelo de tempo (o "4 segundos", leia)

O pedido "tempo de um slide para outro = 4s por padrao" e mapeado assim:

- **`--seconds N` (padrao 4):** quanto tempo CADA slide fica no video. Esse e o 4s padrao, alteravel.
- **`--durations 2:17,5:8`:** override por slide. **Slides com animacao finita (chart-race, que toca uma vez e para) devem receber aqui a duracao total da animacao**, senao o video corta no meio e nao "expressa exatamente o slide". Para chart-race, leia o `durationMs` (linhas) ou `stepMs x (nperiodos-1)` (barras) no JS do slide e use esse valor (some ~1s de folga para segurar o quadro final).
- **`--transition D` (padrao 0.6):** crossfade entre um slide e o proximo. Se o usuario quiser mesmo uma transicao longa de 4s, use `--transition 4`.

Regra pratica: slide de **loop continuo** = 4s (ou o valor pedido); slide de **animacao finita** = duracao total da animacao (via `--durations`).

## Dependencias (instalar sob demanda, padrao Mira)

Precisa de **ffmpeg** no PATH (ou em `MIRA_FFMPEG`) e dos pacotes **puppeteer** + **puppeteer-screen-recorder**. Não são dependencia do Mira: instale numa pasta temporaria reaproveitavel (como o `mira-qrcode` faz com o `qrcode`), e rode os scripts com `NODE_PATH` apontando para o `node_modules` dela.

1. **Conferir ffmpeg:** `ffmpeg -version`. Se nao houver, avise o usuario (Windows: baixar em gyan.dev e por no PATH, ou setar `MIRA_FFMPEG`). Sem ffmpeg a skill nao roda.
2. **Instalar os pacotes uma vez** (pule se `node_modules/puppeteer-screen-recorder` ja existir na pasta temp):
   ```
   npm install puppeteer puppeteer-screen-recorder --no-save --prefix "<pasta-temp>"
   ```
   (ex. de pasta-temp: `%TEMP%/mira-s2v` no Windows.) O `puppeteer` baixa um Chromium proprio; se preferir usar o Chrome ja instalado, sete `MIRA_CHROME` para o `chrome.exe` (o script ja tenta locais comuns no Windows sozinho).
3. **Rodar com NODE_PATH** para a pasta temp:
   ```
   NODE_PATH="<pasta-temp>/node_modules" node "<skill>/scripts/build-video.cjs" <deck.html> <saida.mp4> [flags]
   ```
   No Windows/PowerShell: `$env:NODE_PATH="<pasta-temp>\node_modules"; node ...`.

## Enquadramento e preenchimento

- **16:9 (padrao):** `--width 1920 --height 1080`. O script mede a caixa do conteudo do slide e da um `scale` (`--fill`, padrao 0.92) para o slide preencher o frame sem distorcer. Sobra faixa lateral quando o conteudo e mais estreito que 16:9 (inerente, mantem a proporcao).
- **9:16 / 1:1:** para um vertical/quadrado que preenche de verdade, grave a partir do **deck ja adaptado ao formato** (`index-9x16.html` do `mira-vertical`, `index-1x1.html` do `mira-squared`) com `--width 1080 --height 1920` (ou `1080 1080`) e `--fill 0` (o deck ja preenche). Gravar o 16:9 direto num quadro 9:16 deixa o conteudo como uma faixa fina no meio.

## Passos

1. **Descobrir o alvo.** Qual deck (ache o `index.html` em `decks/<deck>/`; se houver varios e o usuario nao disser, pergunte) e quais slides (um, lista `2,3`, ou todos). Qual formato (16:9 padrao, 9:16, 1:1). Se pedir 9:16/1:1, confirme se existe o deck adaptado do formato; se nao, ofereca rodar antes o `mira-vertical`/`mira-squared`.
2. **Definir as duracoes.** Para cada slide alvo: loop continuo usa `--seconds` (4 padrao); animacao finita (chart-race) recebe a duracao total via `--durations` (leia `durationMs`/`stepMs` no JS do slide). Confirme a transicao (`--transition`, 0.6 padrao; ou o que o usuario pedir).
3. **Garantir dependencias** (secao acima): ffmpeg + instalar puppeteer/recorder na pasta temp.
4. **Rodar o `build-video.cjs`** com as flags. Ele grava cada slide (animacao do zero, sem vazamento) e junta com crossfade.
5. **Conferir o resultado.** Extraia 2-3 frames com ffmpeg (inicio, meio, fim) e verifique: (a) o t=0 e o slide certo, sem vazar o anterior; (b) a animacao roda inteira; (c) o enquadramento preenche o frame; (d) as transicoes entre slides estao suaves.
6. **Reportar.** Caminho do `.mp4`, resolucao/duracao, quais slides e com que duracao cada um, e que o deck original ficou intacto.

## Exemplos

```
# um slide, 16:9, animacao finita de ~16s (chart-race no slide 2):
node build-video.cjs decks/meu/index.html decks/meu/slide-2.mp4 --slides 2 --durations 2:17

# tres slides de loop, 4s cada, transicao de 0.6s:
node build-video.cjs decks/meu/index.html decks/meu/teaser.mp4 --slides 1,3,4

# vertical (deck ja reflowado pelo mira-vertical):
node build-video.cjs decks/meu/index-9x16.html decks/meu/reels.mp4 --slides 2 --durations 2:17 --width 1080 --height 1920 --fill 0
```

## Edge cases

- **Sem ffmpeg:** aborte com mensagem clara (é obrigatorio). Nao tente gerar so frames.
- **Slide finito cortado:** se o video termina antes da animacao acabar, a duracao daquele slide ficou curta; aumente via `--durations`.
- **9:16 com faixa fina no meio:** foi gravado o 16:9 direto; grave o `index-9x16.html` com `--fill 0`.
- **Transicao maior que o clipe:** o script reduz o crossfade automaticamente e avisa.
- **Chart-race que ainda nao entrou na viewport:** o script ja resolve, faz shim do IntersectionObserver e dispara a animacao no inicio da gravacao.

## Checklist

- [ ] Deck original intacto (a skill so le o HTML, nunca edita).
- [ ] `.mp4` gerado na pasta do deck (ou caminho pedido), na resolucao certa.
- [ ] Cada slide expressa exatamente o slide: t=0 correto (sem vazar o anterior), animacao inteira, enquadramento preenchendo o frame.
- [ ] Slides de animacao finita (chart-race) com duracao total via `--durations` (nao cortados).
- [ ] Transicao entre slides aplicada (padrao 4s de tempo por slide; crossfade `--transition`).
- [ ] ffmpeg presente; puppeteer + puppeteer-screen-recorder instalados na pasta temp; rodou com `NODE_PATH`.
- [ ] Nenhum travessao (—); acentuacao correta (segue `agents/_shared/idioma.md`).
```
