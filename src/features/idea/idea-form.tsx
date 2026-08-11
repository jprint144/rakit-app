import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listIdeaCategories, presetIdeaCategories } from "@/features/idea/idea-repository";
import type { Idea, IdeaInput } from "@/features/idea/idea-repository";
const initial = (idea?: Idea | null): IdeaInput =>
  idea
    ? {
        title: idea.title,
        category: idea.category,
        text_content: idea.text_content,
        document_path: idea.document_path,
        image_path: idea.image_path,
        link_url: idea.link_url,
      }
    : {
        title: "",
        category: presetIdeaCategories[0],
        text_content: "",
        document_path: "",
        image_path: "",
        link_url: "",
      };
export function IdeaForm({
  idea,
  onSubmit,
  onCancel,
}: {
  idea?: Idea | null;
  onSubmit: (input: IdeaInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<IdeaInput>(initial(idea));
  const [categories, setCategories] = useState<string[]>(presetIdeaCategories);
  const [error, setError] = useState("");
  useEffect(() => setForm(initial(idea)), [idea]);
  useEffect(() => { listIdeaCategories().then(setCategories).catch(console.error); }, []);
  const pick = async (field: "document_path" | "image_path") => {
    const path = await open({
      multiple: false,
      filters:
        field === "image_path"
          ? [
              {
                name: "Gambar",
                extensions: ["png", "jpg", "jpeg", "webp", "gif"],
              },
            ]
          : undefined,
    });
    if (typeof path === "string") setForm({ ...form, [field]: path });
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Object.fromEntries(
      Object.entries(form).map(([key, item]) => [key, item?.trim() || null]),
    ) as IdeaInput;
    if (!value.title) return setError("Judul Idea wajib diisi.");
    if (
      !value.text_content &&
      !value.document_path &&
      !value.image_path &&
      !value.link_url
    )
      return setError("Isi minimal satu bagian Idea.");
    if (value.link_url && !/^https?:\/\//i.test(value.link_url))
      return setError("Link harus diawali http:// atau https://.");
    setError("");
    await onSubmit(value);
  };
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <label>Judul</label>
        <Input
          value={form.title ?? ""}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Contoh: Ide kampanye Ramadan"
        />
      </div>
      <div className="grid gap-2">
        <label>Kategori</label>
        <Select
          value={form.category}
          onValueChange={(category) => setForm({ ...form, category })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <label>Teks</label>
        <Textarea
          value={form.text_content ?? ""}
          onChange={(event) =>
            setForm({ ...form, text_content: event.target.value })
          }
          placeholder="Opsional"
        />
      </div>
      {(
        [
          ["document_path", "Dokumen"],
          ["image_path", "Gambar"],
        ] as const
      ).map(([field, label]) => (
        <div key={field} className="grid gap-2">
          <label>{label}</label>
          <div className="flex gap-2">
            <Input value={form[field] ?? ""} readOnly placeholder="Opsional" />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                pick(field).catch((cause) => setError(String(cause)))
              }
            >
              {form[field] ? "Ganti" : "Pilih"}
            </Button>
            {form[field] && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForm({ ...form, [field]: "" })}
              >
                Hapus
              </Button>
            )}
          </div>
        </div>
      ))}
      <div className="grid gap-2">
        <label>Link</label>
        <Input
          type="url"
          value={form.link_url ?? ""}
          onChange={(event) =>
            setForm({ ...form, link_url: event.target.value })
          }
          placeholder="https://... (opsional)"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button>Simpan Idea</Button>
      </div>
    </form>
  );
}
