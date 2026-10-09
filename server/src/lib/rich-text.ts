import sanitizeHtml from "sanitize-html";
import { cloudinaryConfig } from "../config/cloudinary.js";

/** Inline images may only come from this site's own Cloudinary account (Media Library). */
const OWN_MEDIA = new RegExp(
  `^https://res\\.cloudinary\\.com/${cloudinaryConfig.cloudName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`,
);

/**
 * Allow-list for Tiptap output (portfolio.md §12): basic formatting, headings, lists, links,
 * code, quotes and images from the Media Library. Everything else (scripts, styles, event
 * handlers, iframes, external images) is stripped.
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
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "data-media-id"],
    code: ["class"],
    pre: ["class"],
    // `data-media-id` keeps the Media Library's "Used in" tracking working for inline files.
    img: ["src", "alt", "width", "height", "data-media-id"],
  },
  allowedSchemesByTag: { img: ["https"] },
  // Drop images that don't point at our own Cloudinary account.
  exclusiveFilter: (frame) => frame.tag === "img" && !OWN_MEDIA.test(frame.attribs.src ?? ""),
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
