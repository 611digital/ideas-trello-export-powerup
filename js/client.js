/*
 * client.js — lógica del connector del Power-Up.
 *
 * Registra una sola capability: `board-buttons`, que agrega un botón
 * "Exportar Excel" a la barra del board. Al pulsarlo se abre export.html
 * como popup, donde el usuario genera y descarga el .xlsx.
 *
 * `t` es el objeto de Trello (TrelloPowerUp.iframe) que llega a cada
 * callback. No lo guardamos globalmente: Trello nos da una instancia
 * fresca en cada invocación.
 */

/* global TrelloPowerUp */

// Ícono del board-button. Trello exige un SVG monocromo servido por HTTPS
// (admite gris claro/oscuro). Usamos un data-URI para no depender de otro
// archivo ni de un host de imágenes.
var EXPORT_ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>'
  );

TrelloPowerUp.initialize({
  /*
   * Capability board-buttons: debe devolver un array de descriptores de
   * botón. Devolvemos uno solo.
   */
  "board-buttons": function (t /*, options */) {
    return [
      {
        icon: {
          // Trello usa `dark` sobre fondo claro y `light` en modo oscuro.
          dark: EXPORT_ICON,
          light: EXPORT_ICON,
        },
        text: "Exportar Excel",
        // callback: abre el popup. Devolver la promesa de t.popup deja que
        // Trello gestione el ciclo de vida del iframe.
        callback: function (t) {
          return t.popup({
            title: "Exportar tickets a Excel",
            url: "export.html",
            height: 180, // alto inicial; export.html puede pedir resize
          });
        },
      },
    ];
  },
});
