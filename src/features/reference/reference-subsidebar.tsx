import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listReferences,
  reorderReferences,
} from "@/features/reference/reference-repository";
import type { ReferenceItem } from "@/features/reference/reference-repository";
import { cn } from "@/lib/utils";

function SortableWebsite({
  compact,
  item,
  onOpen,
}: {
  compact: boolean;
  item: ReferenceItem;
  onOpen: (url: string) => void;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return <Button ref={setNodeRef} {...attributes} {...listeners} size={compact ? "icon" : "default"} style={style} variant="ghost" className={cn("shrink-0 touch-none", compact ? "justify-center" : "justify-start", isDragging && "opacity-50")} title={`${item.title} — tarik untuk mengubah urutan`} onClick={() => onOpen(item.url)}><img className="size-5 shrink-0 aspect-square rounded-sm object-contain" src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.url)}&sz=32`} alt="" />{!compact && <span className="truncate">{item.title}</span>}</Button>;
}

export function ReferenceSubsidebar() {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [compact, setCompact] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    const load = () => listReferences().then(setItems).catch(console.error);
    load();
    window.addEventListener("reference:updated", load);
    return () => window.removeEventListener("reference:updated", load);
  }, []);

  useEffect(() => {
    const updateHeaderState = (event: Event) => setHeaderHidden((event as CustomEvent<boolean>).detail);
    window.addEventListener("reference:header-hidden", updateHeaderState);
    return () => window.removeEventListener("reference:header-hidden", updateHeaderState);
  }, []);

  const open = (url: string) => window.dispatchEvent(new CustomEvent("reference:navigate", { detail: url }));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const fromIndex = items.findIndex((item) => item.id === active.id);
    const toIndex = items.findIndex((item) => item.id === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = arrayMove(items, fromIndex, toIndex);
    setItems(next);
    void reorderReferences(next.map((item) => item.id)).catch(console.error);
  };

  const toggleFocusMode = () => setFocusMode((value) => {
    const next = !value;
    window.dispatchEvent(new CustomEvent("reference:focus-mode", { detail: next }));
    return next;
  });

  return <aside className={cn("flex shrink-0 flex-col border-r bg-card text-card-foreground py-3 transition-[width]", compact ? "w-14" : "w-52")}><div className={cn("flex px-2", compact ? "flex-col items-center gap-1" : "items-center justify-between")}>{!compact && <p className="text-sm font-semibold">Website</p>}<div className={cn("flex", compact ? "flex-col gap-1" : "items-center")}>{headerHidden && <Button size="icon" variant="ghost" title="Tampilkan bar atas" onClick={() => window.dispatchEvent(new Event("reference:show-header"))}><ChevronDown /></Button>}<Button size="icon" variant="ghost" title={focusMode ? "Keluar mode fokus" : "Mode fokus"} onClick={toggleFocusMode}>{focusMode ? <Minimize2 /> : <Maximize2 />}</Button><Button size="icon" variant="ghost" onClick={() => setCompact(!compact)}>{compact ? <PanelLeftOpen /> : <PanelLeftClose />}</Button></div></div><DndContext sensors={sensors} onDragEnd={onDragEnd}><div className="mt-2 grid gap-1 px-2"><SortableContext items={itemIds} strategy={verticalListSortingStrategy}>{items.map((item, index) => <div key={item.id} className="grid gap-1">{!compact && (index === 0 || items[index - 1].category !== item.category) && <p className="px-2 pt-2 text-xs font-medium text-muted-foreground">{item.category}</p>}<SortableWebsite compact={compact} item={item} onOpen={open} /></div>)}</SortableContext></div></DndContext></aside>;
}
