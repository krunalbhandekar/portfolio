import sanitizeHtml from "sanitize-html";

/**
 * Allow-list for Tiptap output (portfolio.md §12): basic formatting, headings, lists, links,
 * code, quotes. Everything else (scripts, styles, event handlers, iframes) is stripped.
 */
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "code",
    "pre",
    "blockquote",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "a",
    "hr",
  ],
  allowedAttributes: { a: ["href", "target", "rel"], code: ["class"], pre: ["class"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowedClasses: { code: [/^language-[\w-]+$/], pre: [/^language-[\w-]+$/] },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: "noopener noreferrer",
        ...(attribs.target ? { target: "_blank" } : {}),
      },
    }),
  },
};

export function sanitizeRichText(html: string) {
  const clean = sanitizeHtml(html, options).trim();
  // Tiptap's empty document is "<p></p>"; store it as empty.
  return clean === "<p></p>" ? "" : clean;
}
