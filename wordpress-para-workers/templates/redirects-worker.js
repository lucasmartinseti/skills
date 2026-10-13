// Redireciona os domínios antigos (dominio-antigo.com.br, dominio-antigo-2.com.br e seus www)
// para a raiz do site oficial. Caminho e query não são preservados: os sites antigos
// estavam fora do ar ("Site not found"), então não há URLs antigas a manter.
const TARGET = 'https://exemplo.com.br/';

export default {
  async fetch() {
    return new Response(null, {
      status: 301,
      headers: {
        Location: TARGET,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  },
};
