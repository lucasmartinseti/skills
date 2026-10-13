// Comportamentos do site estático.
(function () {
  // Botões "WhatsApp": se o widget do RD Station estiver na página, abre o widget (número e mensagem gerenciados no RD Station);
  // senão, segue o link wa.me do próprio botão.
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[data-rd-whatsapp]');
    if (!a) return;
    var rd = document.querySelector('.rdstation-popup-js-floating-button, button[aria-label="Abrir WhatsApp"]');
    if (rd) { ev.preventDefault(); rd.click(); }
  });
})();
