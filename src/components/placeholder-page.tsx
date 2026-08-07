interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="bg-muted/50 flex flex-1 items-center justify-center rounded-xl border border-dashed">
        <p className="text-muted-foreground text-sm">
          Halaman {title} — coming soon
        </p>
      </div>
    </div>
  );
}
