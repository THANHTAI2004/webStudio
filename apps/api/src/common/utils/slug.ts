const VIETNAMESE_D_PATTERN = /đ/g;
const VIETNAMESE_UPPER_D_PATTERN = /Đ/g;
const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g;
const NON_SLUG_CHARS_PATTERN = /[^a-z0-9]+/g;
const DUPLICATE_DASH_PATTERN = /-+/g;
const EDGE_DASH_PATTERN = /^-|-$/g;

export function createSlug(value: string): string {
  return value
    .trim()
    .replace(VIETNAMESE_UPPER_D_PATTERN, 'D')
    .replace(VIETNAMESE_D_PATTERN, 'd')
    .normalize('NFD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .toLowerCase()
    .replace(NON_SLUG_CHARS_PATTERN, '-')
    .replace(DUPLICATE_DASH_PATTERN, '-')
    .replace(EDGE_DASH_PATTERN, '');
}

export function resolveSlug(
  inputSlug: string | undefined,
  fallback: string,
): string {
  return createSlug(inputSlug?.trim() || fallback);
}
