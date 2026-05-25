// Iris 4-color appointment palette (maps to therapist slots by index)
export const APT_COLORS = ['#5D4AA8', '#7A92D2', '#C97E68', '#8A6FBE'] as const;
export const APT_SOFT = ['#EDE5F4', '#E8EDF8', '#F7E5DD', '#EDE5F4'] as const;

export function colorByIndex(index: number): string {
  return APT_COLORS[index % APT_COLORS.length];
}

export function softByIndex(index: number): string {
  return APT_SOFT[index % APT_SOFT.length];
}

/** Hash a string (therapistId or name) to a consistent color. */
export function colorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % APT_COLORS.length;
  return APT_COLORS[h];
}

export function softForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % APT_SOFT.length;
  return APT_SOFT[h];
}

/** Find therapist color by position in a list. */
export function colorForTherapist(therapistId: string, therapists: { id: string }[]): string {
  const idx = therapists.findIndex((t) => t.id === therapistId);
  return APT_COLORS[idx >= 0 ? idx % APT_COLORS.length : 0];
}
