/*
 * config.js — ÚNICO lugar que el admin debe editar.
 *
 * Pega aquí la API key de tu Power-Up (la de
 * https://trello.com/power-ups/admin → tu Power-Up → "API key").
 *
 * La API key de Trello NO es secreta (es pública por diseño): lo que protege
 * los datos del usuario es su token, que se solicita con authorize() la
 * primera vez. Aun así, este archivo solo debe exponerse al workspace interno.
 *
 * Lo cargan tanto index.html (connector) como export.html (popup), así que
 * basta cambiarlo UNA vez.
 */
window.TRELLO_API_KEY = "REEMPLAZAR_CON_TU_API_KEY";

// Nombre que verá el usuario en la pantalla de autorización de Trello.
window.TRELLO_APP_NAME = "IDEAS · Exportar Excel";
