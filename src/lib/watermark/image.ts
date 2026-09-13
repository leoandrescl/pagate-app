// Cloudflare Workers (edge) no puede cargar módulos nativos (sharp/canvas),
// por lo que el marcado raster de imágenes queda pendiente. Para no romper el
// flujo de descarga, se devuelve el original sin modificar.
export async function watermarkImage(source: Uint8Array): Promise<Uint8Array> {
  return source;
}