# IDEAS · Exportar Excel — Trello Power-Up

Power-Up estático (HTML + JS vanilla, sin build) que agrega un botón
**"Exportar Excel"** a la barra de un board de Trello. Al pulsarlo descarga un
`.xlsx` real con **una fila por tarjeta**, ordenadas por número de ticket:

| # Ticket | Título | Status | URL |
|----------|--------|--------|-----|
| `card.idShort` | `card.name` | nombre de la lista (`idList → name`) | `card.shortUrl` |

Pensado para el board **IDEAS Hub Issues** (`https://trello.com/b/jMcbVWnm/ideas-hub-issues`),
pero funciona en cualquier board donde se habilite el Power-Up: el botón exporta
**el board actual**.

Fila de prueba conocida (este mismo ticket):

```
115 | Crear plugin de exportar excel de la lista de ticket en trello. | To Do
```

---

## Archivos

```
index.html      Connector: carga power-up.min.js + config.js + client.js.
js/config.js    ÚNICO lugar a editar: la API key del Power-Up.
js/client.js    TrelloPowerUp.initialize + capability board-buttons.
export.html     Popup: botón "Generar Excel" + estado. Carga SheetJS.
js/export.js    Fetch cards+lists, arma filas, genera y descarga el .xlsx.
README.md       Este archivo.
```

- **Librería cliente:** `https://p.trello.com/power-up.min.js` (host obligatorio
  de Trello; solo funciona dentro del iframe de Trello).
- **Excel:** SheetJS `xlsx` 0.18.5 desde cdnjs (versión fija).

---

## Endpoints REST de Trello usados

Desde el iframe del Power-Up, con `key` (API key del Power-Up) + `token` (del usuario):

```
GET https://api.trello.com/1/boards/{boardId}/lists?fields=name&filter=open
GET https://api.trello.com/1/boards/{boardId}/cards?fields=name,idShort,idList,shortUrl,shortLink&filter=open&limit=1000
```

- `boardId` sale del contexto del Power-Up: `t.getContext().board`.
- El token sale de `t.getRestApi().getToken()`; si el usuario no autorizó aún,
  se dispara `authorize({ scope: 'read', expiration: 'never' })` y se reintenta.
- `filter=open` excluye tarjetas archivadas. Para incluir archivadas, cambiar a
  `filter=all` en `js/export.js`.

---

## Puesta en marcha (para un admin del workspace)

Necesitas: (1) hostear estos archivos en **HTTPS**, (2) crear el Power-Up + API
key, (3) apuntar el connector al `index.html` hosteado y habilitar el botón,
(4) activar el Power-Up en el board.

### Paso 1 — Hostear los archivos en HTTPS

El iframe de un Power-Up **exige HTTPS**. Dos caminos gratis:

**Opción 1a — Netlify Drop (lo más rápido, sin cuenta de Git):**

1. Entra a <https://app.netlify.com/drop>.
2. Arrastra la carpeta completa `ideas-trello-export-powerup/` a la zona de drop.
3. Netlify te da una URL tipo `https://random-name-123.netlify.app`.
4. Tu connector queda en `https://random-name-123.netlify.app/index.html`.

> Para re-publicar tras editar `config.js`, vuelve a arrastrar la carpeta
> (o conecta el sitio a un repo). Netlify Drop crea un sitio nuevo cada vez;
> si quieres URL estable, usa un sitio con deploy manual desde el dashboard.

**Opción 1b — GitHub Pages (URL estable):**

1. Crea un repo nuevo (p.ej. `ideas-trello-export-powerup`) y sube estos archivos
   a la raíz.
2. Repo → **Settings → Pages** → *Build and deployment* → *Source:* **Deploy from a branch**.
3. *Branch:* `main`, carpeta `/ (root)` → **Save**.
4. En ~1 min queda en `https://<usuario>.github.io/ideas-trello-export-powerup/`.
5. Tu connector: `https://<usuario>.github.io/ideas-trello-export-powerup/index.html`.

> Verifica abriendo esa URL del `index.html` en el navegador: debe cargar en
> blanco **sin errores 404** en la consola (index.html no tiene UI visible).

### Paso 2 — Crear el Power-Up y obtener la API key

1. Entra a <https://trello.com/power-ups/admin>.
2. **New** → completa:
   - **Power-Up name:** `IDEAS · Exportar Excel`
   - **Workspace:** el workspace del equipo (el que contiene *IDEAS Hub Issues*).
   - **Iframe connector URL:** la URL HTTPS del **`index.html`** del Paso 1.
     (p.ej. `https://<usuario>.github.io/ideas-trello-export-powerup/index.html`)
   - Email / autor de soporte: los del equipo.
3. Guarda. Entra al Power-Up recién creado → pestaña **API key** →
   **Generate a new API key**. Copia esa key.

### Paso 3 — Pegar la API key y re-publicar

1. Edita **`js/config.js`** y reemplaza el placeholder:
   ```js
   window.TRELLO_API_KEY = "LA_API_KEY_QUE_COPIASTE";
   ```
2. Vuelve a publicar el hosting (re-drag en Netlify, o `git push` en Pages).
   La API key de Trello **no es secreta** (es pública por diseño): lo que protege
   los datos es el token por usuario. Aun así, mantén el sitio para uso interno.

### Paso 4 — Habilitar la capability board-buttons

1. En el portal admin del Power-Up → sección **Capabilities**.
2. Marca **`board-buttons`** (el código ya la implementa en `client.js`).
3. Guarda.

### Paso 5 — Activar el Power-Up en el board y probar

1. Abre el board **IDEAS Hub Issues** en Trello.
2. Menú del board (**Power-Ups** / botón derecho arriba) → **Add Power-Ups** →
   pestaña **Custom** → encuentra *IDEAS · Exportar Excel* → **Add**.
3. En la barra del board aparece el botón **"Exportar Excel"**.
4. Púlsalo → se abre el popup. Pulsa **"Generar Excel"**.
   - La **primera vez** Trello pedirá **autorizar** acceso de solo lectura:
     acepta. Luego vuelve a pulsar "Generar Excel".
5. Se descarga `tickets-trello-AAAA-MM-DD.xlsx`. Ábrelo en Excel y verifica la
   fila conocida: **`115 | Crear plugin de exportar excel… | To Do`**.
6. Prueba extra: mueve una tarjeta de lista en Trello y re-exporta; la columna
   **Status** debe reflejar la lista nueva.

---

## Solución de problemas

| Síntoma | Causa / arreglo |
|---------|-----------------|
| El popup dice "Falta configurar la API key" | No pegaste la key en `js/config.js` (o no re-publicaste). |
| "Trello respondió 401" | Token inválido/revocado. Re-autoriza: borra el acceso del Power-Up en tu perfil de Trello y vuelve a "Generar Excel". |
| El botón no aparece en el board | Falta habilitar la capability `board-buttons` (Paso 4) o activar el Power-Up en el board (Paso 5). |
| 404 al abrir `index.html` | Rutas: `js/config.js`, `js/client.js`, `export.html`, `js/export.js` deben subirse con la misma estructura de carpetas. |
| No descarga el archivo | Algunos navegadores bloquean descargas desde iframes; permite descargas para `trello.com` o revisa la consola del popup. |

---

## Qué NO hace (alcance)

- No escribe en Trello (solo lectura).
- No pagina más allá de 1000 tarjetas (el board es chico). Si creciera, añadir
  paginación con el parámetro `before` en `js/export.js`.
- No es un Power-Up del Marketplace público: registro **privado en el workspace**
  es suficiente para uso interno.
