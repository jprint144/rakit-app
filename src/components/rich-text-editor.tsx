import { useEffect, useRef } from "react";
import {
  Bold,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
} from "lucide-react";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps, useEditor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function ResizableImageView({ node, selected, updateAttributes }: NodeViewProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  const resize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const image = imageRef.current;
    if (!image) return;

    const startX = event.clientX;
    const startWidth = image.getBoundingClientRect().width;
    const maxWidth = image.parentElement?.parentElement?.getBoundingClientRect().width ?? startWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const width = Math.min(Math.max(120, startWidth + moveEvent.clientX - startX), maxWidth);
      updateAttributes({ width: Math.round(width) });
    };
    const stopResize = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize, { once: true });
  };

  return (
    <NodeViewWrapper className={cn("relative my-4 w-fit max-w-full", selected && "rounded-md ring-2 ring-ring ring-offset-2")}>
      <img ref={imageRef} src={node.attrs.src} alt={node.attrs.alt ?? ""} title={node.attrs.title ?? ""} width={node.attrs.width ?? undefined} className="h-auto max-w-full rounded-md" draggable={false} />
      {selected && <button type="button" contentEditable={false} className="absolute right-0 bottom-0 size-4 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-sm border bg-background" aria-label="Tarik untuk mengubah ukuran gambar" onPointerDown={resize} />}
    </NodeViewWrapper>
  );
}

const BriefImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("width") || element.getAttribute("data-width");
          if (!value || value.endsWith("%")) return null;
          const width = Number.parseInt(value, 10);
          return Number.isFinite(width) ? width : null;
        },
        renderHTML: (attributes) => attributes.width ? { width: attributes.width } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onError?: (message: string) => void;
};

export function RichTextEditor({ value, onChange, onError }: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      BriefImage.configure({ allowBase64: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-80 px-4 py-3 text-sm leading-6 outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value);
  }, [editor, value]);

  if (!editor) return null;

  const toggleLink = () => {
    const currentUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Masukkan tautan", currentUrl ?? "");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const insertImage = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onError?.("Ukuran gambar maksimal 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") editor.chain().focus().setImage({ src: reader.result }).run();
    };
    reader.onerror = () => onError?.("Gambar tidak dapat dibaca.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-lg border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <Button type="button" size="icon" variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="Heading utama" title="Heading utama"><Heading1 data-icon="inline-start" /></Button>
        <Button type="button" size="icon" variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading kedua" title="Heading kedua"><Heading2 data-icon="inline-start" /></Button>
        <Button type="button" size="icon" variant={editor.isActive("bold") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Tebal" title="Tebal"><Bold data-icon="inline-start" /></Button>
        <Button type="button" size="icon" variant={editor.isActive("italic") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Miring" title="Miring"><Italic data-icon="inline-start" /></Button>
        <Button type="button" size="icon" variant={editor.isActive("bulletList") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Daftar bullet" title="Daftar bullet"><List data-icon="inline-start" /></Button>
        <Button type="button" size="icon" variant={editor.isActive("orderedList") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Daftar bernomor" title="Daftar bernomor"><ListOrdered data-icon="inline-start" /></Button>
        <Button type="button" size="icon" variant={editor.isActive("taskList") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleTaskList().run()} aria-label="Checklist" title="Checklist"><ListChecks data-icon="inline-start" /></Button>
        <Button type="button" size="icon" variant={editor.isActive("link") ? "secondary" : "ghost"} onClick={toggleLink} aria-label="Tambah atau ubah tautan" title="Tambah atau ubah tautan"><Link data-icon="inline-start" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => imageInputRef.current?.click()} aria-label="Tambah gambar" title="Tambah gambar"><ImagePlus data-icon="inline-start" /></Button>
        <Input ref={imageInputRef} className="hidden" type="file" accept="image/*" aria-label="Pilih gambar" onChange={(event) => {
          insertImage(event.target.files?.[0]);
          event.target.value = "";
        }} />
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          "text-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0",
        )}
      />
    </div>
  );
}
