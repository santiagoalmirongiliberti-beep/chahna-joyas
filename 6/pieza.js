// Vista previa de cada pieza para WhatsApp, Instagram, etc.
// Lee la planilla en cada pedido, así que precio, stock y foto siempre están al día.

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzmbLqrGFRqhc1PgIxIHpBLxFPO67Ibl-R6X1JZuuQmUSiaaT1SCtEYWaxmbu35c1NcVw/exec";
const SITIO = "https://chahnajoyas.netlify.app";
const LOGO = `${SITIO}/preview-chahna.jpg?v=2`;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const precio = n => Number(n) > 0 ? "$ " + Number(n).toLocaleString("es-AR") : "";
const fotoHD = (url, w) => String(url).replace(/sz=w\d+/, "sz=w" + w);

exports.handler = async (event) => {
  const id = String((event.queryStringParameters && event.queryStringParameters.id) || "").trim();

  let p = null;
  try {
    const res = await fetch(SHEET_API_URL);
    const lista = await res.json();
    p = Array.isArray(lista) ? lista.find(x => String(x.id) === id) : null;
  } catch (e) {
    p = null;
  }

  // Si la pieza no existe, mandamos a la portada
  if (!p) {
    return { statusCode: 302, headers: { Location: `${SITIO}/` } };
  }

  const url = `${SITIO}/pieza/${encodeURIComponent(id)}`;
  const destino = `${SITIO}/#pieza=${encodeURIComponent(id)}`;
  const titulo = `${p.nombre} | Chahna Joyas`;
  const datos = [precio(p.precio), p.peso, p.tamano, p.especificaciones]
    .map(x => String(x ?? "").trim()).filter(Boolean).join(" · ");
  const descripcion = (datos || "Joya de plata de Chahna Joyas").slice(0, 300);
  const imagen = p.foto && String(p.foto).trim() ? fotoHD(String(p.foto).trim(), 1200) : LOGO;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Chahna Joyas">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(imagen)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(imagen)}">
<meta http-equiv="refresh" content="0; url=${esc(destino)}">
</head>
<body>
<a href="${esc(destino)}">Ver ${esc(p.nombre)}</a>
<script>location.replace(${JSON.stringify(destino)});</script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache"
    },
    body: html
  };
};
