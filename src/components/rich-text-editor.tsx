import { useEffect } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = { value: string; onChange: (value: string) => void };

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({ extensions: [StarterKit], content: value, editorProps: { attributes: { class: "min-h-32 px-3 py-2 text-sm outline-none" } }, onUpdate: ({ editor: instance }) => onChange(instance.getHTML()) });
  useEffect(() => { if (editor && value !== editor.getHTML()) editor.commands.setContent(value); }, [editor, value]);
  if (!editor) return null;
  return <div className="rounded-md border border-input">
    <div className="flex items-center justify-between border-b px-3 py-2">
      <span className="text-sm font-medium">Brief Project</span>
      <div className="flex gap-1">
        <Button type="button" size="icon" variant={editor.isActive("bold") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold"><Bold /></Button>
        <Button type="button" size="icon" variant={editor.isActive("italic") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic"><Italic /></Button>
        <Button type="button" size="icon" variant={editor.isActive("bulletList") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list"><List /></Button>
        <Button type="button" size="icon" variant={editor.isActive("orderedList") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list"><ListOrdered /></Button>
      </div>
    </div>
    <EditorContent editor={editor} className={cn("text-foreground", "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6")} />
  </div>;
}