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

// Ícono del board-button. Trello exige una URL HTTPS a un SVG monocromo
// (NO acepta data-URI de forma fiable para board-buttons), por eso lo servimos
// como archivo desde GitHub Pages (icon.svg, blanco para el header oscuro).
var EXPORT_ICON =
  "https://611digital.github.io/ideas-trello-export-powerup/icon.svg";

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
