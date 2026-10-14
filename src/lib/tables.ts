// Un informe guardado con una versión anterior de la tabla puede traer filas con otra cantidad de
// celdas: se ajustan a las columnas actuales (lo que falte queda vacío y se valida como vacío).
export const padRow = (row: string[], columns: number): string[] => Array.from({ length: columns }, (_, c) => row[c] ?? '')
