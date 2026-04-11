const JOB_CODE_REGEX = /CODE\s*[:-]?\s*(\d{3,8})/i;

export function extractJobCode(description?: string | null): string | null {
  if (!description) return null;
  const match = description.match(JOB_CODE_REGEX);
  return match?.[1] ?? null;
}
