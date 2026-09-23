export function truncateDialogLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…`;
}

export interface BuildDeleteConfirmCopyInput {
  /** Nome da entidade no singular (ex.: fonte, notícia, assunto). */
  entity: string;
  name: string;
  consequence?: string;
  maxNameLength?: number;
  confirmLabel?: string;
}

export interface DeleteConfirmCopy {
  title: string;
  description: string;
  confirmLabel: string;
}

export function buildDeleteConfirmCopy(
  input: BuildDeleteConfirmCopyInput
): DeleteConfirmCopy {
  const label = truncateDialogLabel(input.name, input.maxNameLength ?? 50);
  const consequence = input.consequence?.trim();
  const description = consequence
    ? `Tem certeza que deseja excluir "${label}"? ${consequence}`
    : `Tem certeza que deseja excluir "${label}"? Esta ação não pode ser desfeita.`;

  return {
    title: `Excluir ${input.entity}?`,
    description,
    confirmLabel: input.confirmLabel ?? "Excluir",
  };
}
