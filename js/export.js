/*
 * export.js — lógica del popup de exportación.
 *
 * Flujo al pulsar "Generar Excel":
 *   1. Leer el board actual desde el contexto del Power-Up (t.getContext()).
 *   2. Conseguir el token del usuario (autorizar la primera vez).
 *   3. GET /1/boards/{id}/lists  -> mapa idList -> nombre (Status).
 *      GET /1/boards/{id}/cards  -> tarjetas (name, idShort, idList, URL).
 *   4. Construir filas ordenadas por # de ticket ascendente.
 *   5. Generar un .xlsx real con SheetJS y descargarlo por blob.
 *
 * Solo pedimos scope 'read'. La API key es pública; el token es por usuario.
 */

/* global TrelloPowerUp, XLSX */

var API_KEY = window.TRELLO_API_KEY;
var APP_NAME = window.TRELLO_APP_NAME || "IDEAS · Exportar Excel";

// Instancia del iframe de Trello. appKey es necesario para getRestApi().
var t = TrelloPowerUp.iframe({
  appKey: API_KEY,
  appName: APP_NAME,
});

var btn = document.getElementById("generate");
var statusEl = document.getElementById("status");

/** Muestra un mensaje de estado. `isError` lo pinta en rojo. */
function setStatus(msg, isError) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "muted";
}

/**
 * Llama a la REST API de Trello y devuelve el JSON.
 * `path` es relativo (p.ej. "/boards/ABC/cards"). Agrega key+token.
 */
function trelloFetch(path, token, params) {
  var url = new URL("https://api.trello.com/1" + path);
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("token", token);
  if (params) {
    Object.keys(params).forEach(function (k) {
      url.searchParams.set(k, params[k]);
    });
  }
  return fetch(url.toString(), {
    headers: { Accept: "application/json" },
  }).then(function (res) {
    if (!res.ok) {
      return res.text().then(function (body) {
        throw new Error(
          "Trello respondió " + res.status + " en " + path + ": " + body
        );
      });
    }
    return res.json();
  });
}

/**
 * Obtiene el token del usuario. Si aún no autorizó, lanza el flujo de
 * autorización (popup de Trello) y reintenta. Devuelve una promesa<string>.
 */
function getToken() {
  var restApi = t.getRestApi();
  return restApi.getToken().then(function (token) {
    if (token) return token;
    // No autorizado todavía: pedir permiso de solo lectura, sin expiración.
    setStatus("Autoriza el acceso de solo lectura a tu Trello…");
    return restApi
      .authorize({ scope: "read", expiration: "never" })
      .then(function () {
        return restApi.getToken();
      });
  });
}

/**
 * Descarga un libro de SheetJS como .xlsx usando un blob + <a download>.
 * (XLSX.writeFile no siempre funciona dentro del iframe sandbox de Trello,
 * por eso generamos el blob a mano.)
 */
function downloadWorkbook(wb, filename) {
  var wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  var blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Liberar el object URL un instante después de iniciar la descarga.
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1500);
}

/** Construye un nombre de archivo con fecha: tickets-trello-YYYY-MM-DD.xlsx */
function buildFilename() {
  var d = new Date();
  var pad = function (n) {
    return String(n).padStart(2, "0");
  };
  var stamp =
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  return "tickets-trello-" + stamp + ".xlsx";
}

/** Orquesta todo el proceso de exportación. */
function runExport() {
  if (!API_KEY || API_KEY.indexOf("REEMPLAZAR") === 0) {
    setStatus(
      "Falta configurar la API key en js/config.js. Pide al admin que la pegue.",
      true
    );
    return;
  }

  btn.disabled = true;
  setStatus("Obteniendo el board…");

  // t.getContext() es SÍNCRONO en el cliente de Trello (devuelve el contexto
  // directo, no una promesa): el id interno (24 hex) del board donde está el botón.
  var boardId = t.getContext().board;

  getToken()
    .then(function (token) {
      setStatus("Descargando listas y tarjetas…");
      // Pedimos listas y tarjetas en paralelo.
      return Promise.all([
        trelloFetch("/boards/" + boardId + "/lists", token, {
          fields: "name",
          filter: "open",
        }),
        trelloFetch("/boards/" + boardId + "/cards", token, {
          // filter=open excluye tarjetas archivadas.
          fields: "name,idShort,idList,shortUrl,shortLink",
          filter: "open",
          // El board es chico; 1000 cubre de sobra. Si creciera, habría que
          // paginar con el parámetro `before`.
          limit: "1000",
        }),
      ]);
    })
    .then(function (results) {
      var lists = results[0];
      var cards = results[1];

      // Mapa idList -> nombre de la lista (= Status).
      var listNameById = {};
      lists.forEach(function (l) {
        listNameById[l.id] = l.name;
      });

      // Filas, ordenadas por # de ticket ascendente.
      var rows = cards
        .map(function (c) {
          return {
            "# Ticket": c.idShort,
            "Título": c.name,
            Status: listNameById[c.idList] || "(sin lista)",
            URL:
              c.shortUrl ||
              (c.shortLink ? "https://trello.com/c/" + c.shortLink : ""),
          };
        })
        .sort(function (a, b) {
          return a["# Ticket"] - b["# Ticket"];
        });

      if (rows.length === 0) {
        setStatus("El board no tiene tarjetas abiertas para exportar.", true);
        btn.disabled = false;
        return;
      }

      // Hoja "Tickets" con header en la fila 1 (orden de columnas explícito).
      var ws = XLSX.utils.json_to_sheet(rows, {
        header: ["# Ticket", "Título", "Status", "URL"],
      });
      // Anchos de columna cómodos.
      ws["!cols"] = [{ wch: 10 }, { wch: 60 }, { wch: 18 }, { wch: 34 }];

      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tickets");

      downloadWorkbook(wb, buildFilename());

      setStatus("Listo: " + rows.length + " tickets exportados.");
      btn.disabled = false;
    })
    .catch(function (err) {
      // Mensaje legible; el detalle técnico va a la consola.
      console.error(err);
      setStatus(
        "No se pudo exportar: " + (err && err.message ? err.message : err),
        true
      );
      btn.disabled = false;
    });
}

btn.addEventListener("click", runExport);
