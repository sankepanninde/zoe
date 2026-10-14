/* Pausa entre pasos de las historias, para ver cada acción en pantalla. */
export const pausa = (ms = 500) => new Promise<void>((r) => setTimeout(r, ms));
