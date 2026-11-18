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
const norm = v => String(v ?? "").trim().toLowerCase();

// Saca el id de la pieza de cualquier lugar donde pueda venir
function idDesdeEvento(event) {
  const q = event.queryStringParameters || {};
  const candidatos = [q.id, event.path, event.rawUrl, event.rawPath];
  for (const c of candidatos) {
    const texto = String(c || "");
    const m = texto.match(/pieza\/([^\/?#&]+)/);
    if (m) {
      const valor = decodeURIComponent(m[1]).trim();
      if (valor && valor !== ":id") return valor;
    }
  }
  const directo = String(q.id || "").trim();
  return directo && directo !== ":id" ? directo : "";
}

async function leerProductos() {
  const res = await fetch(SHEET_API_URL);
  const texto = await res.text();
  let data;
  try {
    data = JSON.parse(texto);
  } catch (e) {
    throw new Error("La planilla no devolvió datos válidos: " + texto.slice(0, 100));
  }
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.productos)) return data.productos;
  throw new Error("Formato inesperado de la planilla");
}

function pagina({ titulo, descripcion, imagen, url, destino }) {
  return `<!DOCTYPE html>
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
<a href="${esc(destino)}">Ver ${esc(titulo)}</a>
<script>location.replace(${JSON.stringify(destino)});</script>
</body>
</html>`;
}

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const id = idDesdeEvento(event);
  const url = `${SITIO}/pieza/${encodeURIComponent(id)}`;

  let productos = [];
  let error = null;
  try {
    productos = await leerProductos();
  } catch (e) {
    error = e.message;
  }

  // Modo diagnóstico: /pieza/AAB0003?debug=1
  if (q.debug === "1") {
    const texto = [
      "id buscado: " + JSON.stringify(id),
      "path: " + JSON.stringify(event.path),
      "rawUrl: " + JSON.stringify(event.rawUrl),
      "queryStringParameters: " + JSON.stringify(q),
      "error: " + (error || "ninguno"),
      "cantidad de piezas leídas: " + productos.length
    ].join("\n");
    return { statusCode: 200, headers: { "Content-Type": "text/plain; charset=utf-8" }, body: texto };
  }

  const p = productos.find(x => norm(x.id) === norm(id));

  // Pieza encontrada: vista previa completa con su foto y datos
  if (p) {
    const destino = `${SITIO}/#pieza=${encodeURIComponent(id)}`;
    const titulo = `${p.nombre} | Chahna Joyas`;
    const datos = [precio(p.precio), p.peso, p.tamano, p.especificaciones]
      .map(x => String(x ?? "").trim()).filter(Boolean).join(" · ");
    const descripcion = (datos || "Joya de plata de Chahna Joyas").slice(0, 300);
    const imagen = p.foto && String(p.foto).trim() ? fotoHD(String(p.foto).trim(), 1200) : LOGO;
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=300" },
      body: pagina({ titulo, descripcion, imagen, url, destino })
    };
  }

  // Pieza no encontrada o planilla con error: vista previa de respaldo
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
    body: pagina({
      titulo: "Chahna Joyas | Joyas de plata, aros y más",
      descripcion: "Catálogo de joyas de plata de Chahna Joyas. Mirá la disponibilidad de cada pieza y hacé tu pedido por WhatsApp.",
      imagen: LOGO,
      url,
      destino: `${SITIO}/`
    })
  };
};
