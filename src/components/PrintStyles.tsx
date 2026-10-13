// El pie va en las cajas de margen de @page (ver index.css). Acá solo se inyecta el folio, que
// cambia por documento. Se deja solo [A-Z0-9-] para que nada pueda cerrar la cadena CSS.
export function PrintStyles({ code }: { code: string }) {
  const safe = code.replace(/[^A-Za-z0-9-]/g, '')
  return <style>{`@page { @bottom-left { content: "ALTO TEST · ${safe}"; } }`}</style>
}
