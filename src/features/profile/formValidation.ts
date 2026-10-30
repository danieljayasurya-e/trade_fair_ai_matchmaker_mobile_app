import { guestInputSchema, type GuestInput } from '../../api/schemas';

export type FieldErrors = Partial<Record<keyof GuestInput, string>>;

export function validateGuestInput(
  input: GuestInput,
): { ok: true; data: GuestInput } | { ok: false; errors: FieldErrors } {
  const parsed = guestInputSchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof GuestInput | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
