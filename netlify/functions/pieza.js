// Vista previa general para cualquier pieza.
// No lee la planilla, así que responde al instante y WhatsApp siempre muestra la vista previa.
// Al tocar el link, la persona llega directo al recuadro grande de la pieza.

const SITIO = "https://chahnajoyas.netlify.app";
const LOGO = `${SITIO}/preview-chahna.jpg?v=2`;
const TITULO = "Chahna Joyas | Joyas de plata, aros y más";
const DESCRIPCION = "Catálogo de joyas de plata de Chahna Joyas. Mirá la disponibilidad de cada pieza y hacé tu pedido por WhatsApp.";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

// Saca el id de la pieza de la dirección (por ejemplo /pieza/DIN0005)
function idDesdeEvento(event) {
  const q = event.queryStringParameters || {};
  const candidatos = [q.id, event.path, event.rawUrl, event.rawPath];
  for (const c of candidatos) {
    const m = String(c || "").match(/pieza\/([^\/?#&]+)/);
    if (m) {
      const valor = decodeURIComponent(m[1]).trim();
      if (valor && valor !== ":id") return valor;
    }
  }
  const directo = String(q.id || "").trim();
  return directo && directo !== ":id" ? directo : "";
}

exports.handler = async (event) => {
  const id = idDesdeEvento(event);
  const url = id ? `${SITIO}/pieza/${encodeURIComponent(id)}` : `${SITIO}/`;
  const destino = id ? `${SITIO}/#pieza=${encodeURIComponent(id)}` : `${SITIO}/`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esc(TITULO)}</title>
<meta name="description" content="${esc(DESCRIPCION)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Chahna Joyas">
<meta property="og:title" content="${esc(TITULO)}">
<meta property="og:description" content="${esc(DESCRIPCION)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(LOGO)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(LOGO)}">
<meta http-equiv="refresh" content="0; url=${esc(destino)}">
</head>
<body>
<a href="${esc(destino)}">Ver la pieza en Chahna Joyas</a>
<script>location.replace(${JSON.stringify(destino)});</script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600"
    },
    body: html
  };
};
