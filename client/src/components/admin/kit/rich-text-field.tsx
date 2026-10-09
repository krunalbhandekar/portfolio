"use client";

import { useEffect, useId, useState } from "react";
import { useController } from "react-hook-form";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  Quote,
  Redo2,
  SquareCode,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { MediaItem } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { MediaPickerDialog } from "../media/media-picker-dialog";
import { FieldShell } from "./fields";

/** Keeps the Media Library id on inline images/files, so "Used in" tracking works. */
const mediaIdAttribute = {
  mediaId: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute("data-media-id"),
    renderHTML: (attrs: { mediaId?: string | null }) =>
      attrs.mediaId ? { "data-media-id": attrs.mediaId } : {},
  },
};

const InlineImage = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), ...mediaIdAttribute };
  },
}).configure({ inline: false, allowBase64: false });

const MediaLink = Link.extend({
  addAttributes() {
    return { ...this.parent?.(), ...mediaIdAttribute };
  },
}).configure({ openOnClick: false, autolink: true, defaultProtocol: "https" });

const fileName = (m: MediaItem) =>
  m.originalFilename
    ? `${m.originalFilename}${m.format ? `.${m.format}` : ""}`
    : (m.publicId.split("/").pop() ?? "file");

type Tool = {
  label: string;
  icon: LucideIcon;
  run: (e: Editor) => void;
  active?: (e: Editor) => boolean;
};

const tools: Tool[] = [
  {
    label: "Bold",
    icon: Bold,
    run: (e) => e.chain().focus().toggleBold().run(),
    active: (e) => e.isActive("bold"),
  },
  {
    label: "Italic",
    icon: Italic,
    run: (e) => e.chain().focus().toggleItalic().run(),
    active: (e) => e.isActive("italic"),
  },
  {
    label: "Inline code",
    icon: Code,
    run: (e) => e.chain().focus().toggleCode().run(),
    active: (e) => e.isActive("code"),
  },
  {
    label: "Heading 2",
    icon: Heading2,
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    active: (e) => e.isActive("heading", { level: 2 }),
  },
  {
    label: "Heading 3",
    icon: Heading3,
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    active: (e) => e.isActive("heading", { level: 3 }),
  },
  {
    label: "Bullet list",
    icon: List,
    run: (e) => e.chain().focus().toggleBulletList().run(),
    active: (e) => e.isActive("bulletList"),
  },
  {
    label: "Numbered list",
    icon: ListOrdered,
    run: (e) => e.chain().focus().toggleOrderedList().run(),
    active: (e) => e.isActive("orderedList"),
  },
  {
    label: "Quote",
    icon: Quote,
    run: (e) => e.chain().focus().toggleBlockquote().run(),
    active: (e) => e.isActive("blockquote"),
  },
  {
    label: "Code block",
    icon: SquareCode,
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
    active: (e) => e.isActive("codeBlock"),
  },
  {
    label: "Link",
    icon: Link2,
    active: (e) => e.isActive("link"),
    run: (e) => {
      const previous = e.getAttributes("link").href as string | undefined;
      const href = window.prompt("Link URL (leave empty to remove)", previous ?? "https://");
      if (href === null) return;
      if (href === "") e.chain().focus().extendMarkRange("link").unsetLink().run();
      else e.chain().focus().extendMarkRange("link").setLink({ href }).run();
    },
  },
  { label: "Undo", icon: Undo2, run: (e) => e.chain().focus().undo().run() },
  { label: "Redo", icon: Redo2, run: (e) => e.chain().focus().redo().run() },
];

/** Code-block languages offered in the toolbar (the site highlights them with Shiki). */
const CODE_LANGUAGES = [
  ["", "Plain text"],
  ["typescript", "TypeScript"],
  ["javascript", "JavaScript"],
  ["tsx", "TSX / JSX"],
  ["json", "JSON"],
  ["bash", "Shell"],
  ["python", "Python"],
  ["go", "Go"],
  ["java", "Java"],
  ["sql", "SQL"],
  ["yaml", "YAML"],
  ["dockerfile", "Dockerfile"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["graphql", "GraphQL"],
  ["diff", "Diff"],
] as const;

/** Tiptap editor storing HTML. The server sanitises it against an allow-list on save. */
export function RichTextField({
  name,
  label,
  description,
  required,
  mediaFolder = "portfolio/general",
}: {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  /** Upload folder for images/files inserted into the text. */
  mediaFolder?: string;
}) {
  const [picker, setPicker] = useState<"image" | "pdf" | null>(null);
  const id = useId();
  const { field, fieldState } = useController({ name });
  const value = (field.value as string) ?? "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
      MediaLink,
      InlineImage,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        class:
          "prose-admin min-h-36 px-3 py-2.5 text-sm outline-none [&_a]:text-brand-text [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_img]:my-3 [&_img]:max-h-80 [&_img]:rounded-lg [&_img]:border [&_img.ProseMirror-selectednode]:ring-2 [&_img.ProseMirror-selectednode]:ring-ring [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
    onUpdate: ({ editor }) => field.onChange(editor.isEmpty ? "" : editor.getHTML()),
    onBlur: () => field.onBlur(),
  });

  // Keep the editor in sync when the form is reset (load / save).
  useEffect(() => {
    if (
      editor &&
      !editor.isFocused &&
      value !== editor.getHTML() &&
      !(value === "" && editor.isEmpty)
    ) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const activeStates = useEditorState({
    editor,
    selector: ({ editor }) => (editor ? tools.map((tool) => tool.active?.(editor) ?? false) : []),
  });
  // Language of the code block under the cursor (null when not in one).
  const codeLanguage = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor?.isActive("codeBlock")
        ? String((editor.getAttributes("codeBlock").language as string | null) ?? "")
        : null,
  });

  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={fieldState.error?.message}
      required={required}
      wide
    >
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          fieldState.error && "border-destructive",
        )}
      >
        <div
          role="toolbar"
          aria-label={`${label} formatting`}
          className="flex flex-wrap gap-0.5 border-b bg-surface p-1"
        >
          {tools.map((tool, index) => (
            <button
              key={tool.label}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={tool.active ? Boolean(activeStates?.[index]) : undefined}
              disabled={!editor}
              onClick={() => editor && tool.run(editor)}
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50",
                activeStates?.[index] && "bg-accent text-foreground",
              )}
            >
              <tool.icon className="size-3.5" aria-hidden="true" />
            </button>
          ))}
          <span className="mx-1 w-px self-stretch bg-border" aria-hidden="true" />
          <button
            type="button"
            title="Insert image"
            aria-label="Insert image"
            disabled={!editor}
            onClick={() => setPicker("image")}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <ImagePlus className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Attach file (PDF)"
            aria-label="Attach file"
            disabled={!editor}
            onClick={() => setPicker("pdf")}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <Paperclip className="size-3.5" aria-hidden="true" />
          </button>
          {codeLanguage !== null && editor ? (
            <label className="ml-auto flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
              Language
              <select
                value={codeLanguage}
                onChange={(e) =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("codeBlock", { language: e.target.value || null })
                    .run()
                }
                className="h-7 rounded-md border border-input bg-background px-1.5 text-xs text-foreground"
              >
                {CODE_LANGUAGES.map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
                {codeLanguage && !CODE_LANGUAGES.some(([value]) => value === codeLanguage) ? (
                  <option value={codeLanguage}>{codeLanguage}</option>
                ) : null}
              </select>
            </label>
          ) : null}
        </div>
        <EditorContent editor={editor} />
        {picker ? (
          <MediaPickerDialog
            open
            onOpenChange={(open) => !open && setPicker(null)}
            folder={mediaFolder}
            accept={picker}
            onSelect={(media) => {
              if (!editor) return;
              if (picker === "image") {
                editor
                  .chain()
                  .focus()
                  .setImage({
                    src: media.url,
                    alt: media.alt,
                    ...(media.width ? { width: media.width } : {}),
                    ...(media.height ? { height: media.height } : {}),
                    mediaId: media._id,
                  } as Parameters<typeof editor.commands.setImage>[0])
                  .run();
              } else {
                const text = fileName(media);
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "text",
                    text,
                    marks: [
                      {
                        type: "link",
                        attrs: { href: media.url, target: "_blank", mediaId: media._id },
                      },
                    ],
                  })
                  .insertContent(" ")
                  .run();
              }
            }}
          />
        ) : null}
      </div>
    </FieldShell>
  );
}
