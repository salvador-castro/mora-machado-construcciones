"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
  Unlink,
} from "lucide-react";
import { MediaPickerDialog } from "@/components/admin/media/media-picker";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin/ui/popover";
import { cn } from "@/lib/cn";

/**
 * Tiptap editor producing HTML. Allowed output matches src/lib/sanitize.ts
 * (headings h2/h3, lists, quotes, links, images from the media library).
 */
export function RichTextEditor({
  id,
  value,
  onChange,
  invalid,
  minHeight = 220,
}: {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
  minHeight?: number;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, protocols: ["mailto", "tel"] },
      }),
      Image.configure({ inline: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id: id ?? "",
        class: "rich-text max-w-none px-4 py-3 focus:outline-none",
        style: `min-height:${minHeight}px`,
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-card focus-within:ring-2 focus-within:ring-ring",
        invalid && "border-destructive",
      )}
    >
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const btn = (
    label: string,
    Icon: typeof Bold,
    onClick: () => void,
    active = false,
    disabled = false,
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-8", active && "bg-muted")}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={label}
    >
      <Icon />
    </Button>
  );

  const chain = () => editor.chain().focus();

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1"
      role="toolbar"
      aria-label="Formato"
    >
      {btn("Título", Heading2, () => chain().toggleHeading({ level: 2 }).run(), state.h2)}
      {btn("Subtítulo", Heading3, () => chain().toggleHeading({ level: 3 }).run(), state.h3)}
      {btn("Negrita", Bold, () => chain().toggleBold().run(), state.bold)}
      {btn("Cursiva", Italic, () => chain().toggleItalic().run(), state.italic)}
      {btn("Lista", List, () => chain().toggleBulletList().run(), state.bullet)}
      {btn("Lista numerada", ListOrdered, () => chain().toggleOrderedList().run(), state.ordered)}
      {btn("Cita", Quote, () => chain().toggleBlockquote().run(), state.quote)}
      {btn("Separador", Minus, () => chain().setHorizontalRule().run())}
      <LinkButton editor={editor} active={state.link} />
      {state.link && btn("Quitar enlace", Unlink, () => chain().unsetLink().run())}
      {btn("Insertar imagen", ImagePlus, () => setPickerOpen(true))}
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      {btn("Deshacer", Undo2, () => chain().undo().run(), false, !state.canUndo)}
      {btn("Rehacer", Redo2, () => chain().redo().run(), false, !state.canRedo)}
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={([item]) => {
          if (item) chain().setImage({ src: item.largeUrl, alt: item.alt }).run();
        }}
      />
    </div>
  );
}

function LinkButton({ editor, active }: { editor: Editor; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");

  function apply() {
    const url = href.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else if (/^(https?:\/\/|mailto:|tel:|\/|#)/.test(url)) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: `https://${url}` })
        .run();
    }
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setHref(editor.getAttributes("link").href ?? "");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-8", active && "bg-muted")}
          aria-label="Enlace"
          title="Enlace"
        >
          <Link2 />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2">
        <Input
          autoFocus
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://… o /servicios"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          aria-label="URL del enlace"
        />
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={apply}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
