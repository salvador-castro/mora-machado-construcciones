import sanitizeHtml from "sanitize-html";

/**
 * Allowlist for rich text produced by the admin editor (Tiptap, F7).
 * Applied on save (F7) and again on render — defense in depth.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "h2",
    "h3",
    "h4",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "hr",
    "figure",
    "figcaption",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: [] },
  // Images only from our own media library.
  exclusiveFilter: (frame) =>
    frame.tag === "img" && !String(frame.attribs.src ?? "").startsWith("/uploads/"),
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "#";
      const external = /^https?:\/\//.test(href);
      const out: sanitizeHtml.Attributes = { href };
      if (external) Object.assign(out, { target: "_blank", rel: "noopener noreferrer" });
      return { tagName, attribs: out };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: "lazy", decoding: "async" },
    }),
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
