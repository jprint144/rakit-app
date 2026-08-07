import { CalendarDays, CircleDollarSign, MessageCircle, TriangleAlert } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  isProjectOverdue,
  paymentStatusLabels,
  projectWhatsAppUrl,
} from "@/features/project/project-status";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@/features/project/project-repository";
import { cn } from "@/lib/utils";

const columns = [
  { id: "brief", label: "Brief" },
  { id: "concept", label: "Konsep" },
  { id: "revision", label: "Revisi" },
  { id: "finalization", label: "Finalisasi" },
  { id: "done", label: "Selesai" },
];

function ProjectCard({ project }: { project: Project }) {
  const whatsappUrl = projectWhatsAppUrl(project.client_whatsapp);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: project.id, data: { project } });

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "gap-3 transition-shadow hover:shadow-md",
        isDragging ? "cursor-grabbing opacity-50" : "cursor-grab",
      )}
      {...listeners}
      {...attributes}
    >
      <CardHeader className="gap-1">
        <CardTitle className="truncate text-sm">{project.name}</CardTitle>
        <CardDescription className="truncate">
          {project.client_name}
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">{project.code}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Badge variant="outline">
          <CircleDollarSign data-icon="inline-start" />
          {paymentStatusLabels[project.payment_status] ??
            project.payment_status}
        </Badge>
        {isProjectOverdue(project) && (
          <Badge variant="destructive">
            <TriangleAlert data-icon="inline-start" />
            Deadline lewat
          </Badge>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays data-icon="inline-start" />
          Mulai: {project.started_at?.slice(0, 10) || "-"}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant="outline"
          size="sm"
          disabled={!whatsappUrl}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() =>
            whatsappUrl && openUrl(whatsappUrl).catch(console.error)
          }
        >
          <MessageCircle data-icon="inline-start" />
          WhatsApp
        </Button>
      </CardFooter>
    </Card>
  );
}

function Column({
  id,
  label,
  projects,
}: {
  id: string;
  label: string;
  projects: Project[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-72 min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <h2 className="font-semibold">{label}</h2>
        <Badge variant="secondary">{projects.length}</Badge>
      </div>
      <div className="flex flex-col gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

export function ProjectKanban({
  projects,
  onStatusChange,
}: {
  projects: Project[];
  onStatusChange: (id: number, status: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const project = active.data.current?.project as Project | undefined;
    if (project && over && project.kanban_status !== over.id) {
      onStatusChange(project.id, String(over.id));
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {columns.map((column) => (
          <Column
            key={column.id}
            {...column}
            projects={projects.filter(
              (project) => project.kanban_status === column.id,
            )}
          />
        ))}
      </div>
    </DndContext>
  );
}