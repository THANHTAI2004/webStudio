import {
  createExcerptFromHtml,
  sanitizeRichTextHtml,
} from '../../common/content/sanitize-rich-text';

export { createExcerptFromHtml };

export function sanitizePostContentHtml(contentHtml: string): string {
  return sanitizeRichTextHtml(contentHtml);
}
