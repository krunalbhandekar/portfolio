"use client";

import { useEffect, useId } from "react";
import { useController } from "react-hook-form";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  SquareCode,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldShell } from "./fields";

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

/** Tiptap editor storing HTML. The server sanitises it against an allow-list on save. */
export function RichTextField({
  name,
  label,
  description,
  required,
}: {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
}) {
  const id = useId();
  const { field, fieldState } = useController({ name });
  const value = (field.value as string) ?? "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
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
          "prose-admin min-h-36 px-3 py-2.5 text-sm outline-none [&_a]:text-brand-text [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5",
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
        </div>
        <EditorContent editor={editor} />
      </div>
    </FieldShell>
  );
}
