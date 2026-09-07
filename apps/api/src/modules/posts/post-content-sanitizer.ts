import sanitizeHtml, { type IOptions } from 'sanitize-html';

const SAFE_LINK_PROTOCOLS = ['http', 'https', 'mailto', 'tel'];
const EMPTY_HTML_PATTERN = /<[^>]*>/g;
const WHITESPACE_PATTERN = /\s+/g;

const sanitizerOptions: IOptions = {
  allowedTags: [
    'p',
    'br',
    'h2',
    'h3',
    'h4',
    'strong',
    'em',
    's',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'code',
    'pre',
    'hr',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
  },
  allowedSchemes: SAFE_LINK_PROTOCOLS,
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
  transformTags: {
    a: (_tagName, attribs) => {
      const target = attribs.target === '_blank' ? '_blank' : undefined;
      const safeAttribs = { ...attribs };

      delete safeAttribs.rel;
      delete safeAttribs.target;

      return {
        tagName: 'a',
        attribs: target
          ? { ...safeAttribs, target, rel: 'noopener noreferrer' }
          : safeAttribs,
      };
    },
  },
};

export function sanitizePostContentHtml(contentHtml: string): string {
  return sanitizeHtml(contentHtml, sanitizerOptions).trim();
}

export function createExcerptFromHtml(
  contentHtml: string,
  maxLength = 240,
): string {
  const plainText = sanitizeHtml(contentHtml, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(EMPTY_HTML_PATTERN, ' ')
    .replace(WHITESPACE_PATTERN, ' ')
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trimEnd()}...`;
}
