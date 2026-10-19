export const NOME_ERROR = "Por favor, informe seu nome e sobrenome completos.";

/** Remove espaços do início/final e trata espaços repetidos como um único separador. */
export function normalizeName(v: string) {
  return v.replace(/\s+/g, " ").trim();
}

/** Exige pelo menos duas partes separadas por espaço (nome + sobrenome). */
export function validateNome(v: string): string | undefined {
  const nome = normalizeName(v);
  if (nome.split(" ").length < 2) return NOME_ERROR;
  return undefined;
}
