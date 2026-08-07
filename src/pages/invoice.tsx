import { useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { BaseDirectory, readFile, writeFile } from "@tauri-apps/plugin-fs";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Download, FileText, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listProjects } from "@/features/project/project-repository";
import type { Project } from "@/features/project/project-repository";
import {
  generateInvoice,
  loadInvoiceSettings,
  recordInvoiceExport,
  saveInvoiceSettings,
  listProjectOrderItems,
} from "@/features/finance/finance-repository";
import type { InvoiceSettings } from "@/features/finance/finance-repository";

type InvoiceItem = {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
};

type ExportFormat = "png" | "jpg" | "pdf";

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const dateLabel = (value: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);

export default function InvoicePage() {
  const [settings, setSettings] = useState<InvoiceSettings>({
    agency_name: "",
    invoice_prefix: "INV",
    logo_path: "",
    agency_address: "",
    agency_phone: "",
    agency_email: "",
    payment_instructions: "",
    signatory_name: "",
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
const [documentType, setDocumentType] = useState<"invoice" | "nota">("invoice");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(
    (project) => String(project.id) === projectId,
  );
const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [items]);
  useEffect(() => {
    if (!settings.logo_path) { setLogoDataUrl(null); return; }
    readFile(settings.logo_path)
      .then((bytes) => setLogoDataUrl(`data:image/png;base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))}`))
      .catch(() => setLogoDataUrl(null));
  }, [settings.logo_path]);

  const logoSource = logoDataUrl || (settings.logo_path
    ? convertFileSrc(settings.logo_path)
    : null);

  useEffect(() => {
    loadInvoiceSettings().then(setSettings).catch(console.error);
    listProjects().then(setProjects).catch(console.error);
  }, []);

  useEffect(() => { setInvoiceNumber(""); setItems([]); }, [projectId]);

  useEffect(() => { if (!projectId) { setItems([]); return; } listProjectOrderItems(Number(projectId)).then(setItems).catch(console.error); }, [projectId]);

  const generate = async () => {
    if (!selectedProject) {
      setFeedback(
        projects.length
          ? "Pilih project terlebih dahulu."
          : "Belum ada project. Tambahkan project terlebih dahulu.",
      );
      return;
    }
    const number = await generateInvoice(
      selectedProject.id,
      null,
      documentType,
      settings.invoice_prefix,
      items,
    );
    setInvoiceNumber(number);
  };

  const createCanvas = async () => {
    if (!previewRef.current) return null;
    return html2canvas(previewRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      onclone: (document) => {
        for (const element of document.querySelectorAll("*")) {
          const htmlElement = element as HTMLElement;
          htmlElement.style.setProperty("color", "rgb(0, 0, 0)", "important");
          htmlElement.style.setProperty("background-color", "rgb(255, 255, 255)", "important");
          htmlElement.style.setProperty("border-color", "rgb(229, 231, 235)", "important");
          htmlElement.style.setProperty("box-shadow", "none", "important");
        }
      },
    });
  };

  const saveExport = async (format: ExportFormat, contents: Uint8Array) => {
    if (!invoiceNumber) return;
    const targetPath = await save({
      title: `Simpan ${documentType === "invoice" ? "Invoice" : "Nota"}`,
      defaultPath: `${documentType === "invoice" ? "invoice" : "nota"}-${invoiceNumber}.${format}`,
      filters: [{ name: format.toUpperCase(), extensions: [format] }],
    });
    if (!targetPath) {
      setFeedback("Penyimpanan dibatalkan.");
      return;
    }
    await writeFile(targetPath, contents);
    await recordInvoiceExport(invoiceNumber, format);
    setFeedback(`File ${format.toUpperCase()} disimpan di folder project.`);
  };

  const downloadImage = async (format: "png" | "jpg") => {
    const canvas = await createCanvas();
    if (!canvas || !invoiceNumber) return;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Preview invoice tidak dapat diekspor.")),
        format === "png" ? "image/png" : "image/jpeg",
        0.95,
      );
    });
    await saveExport(format, new Uint8Array(await blob.arrayBuffer()));
  };

  const downloadPdf = async () => {
    const canvas = await createCanvas();
    if (!canvas || !invoiceNumber) return;
    const documentPdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });
    const width = documentPdf.internal.pageSize.getWidth();
    const height = (canvas.height / canvas.width) * width;
    documentPdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      width,
      height,
    );
    await saveExport("pdf", new Uint8Array(documentPdf.output("arraybuffer")));
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{documentType === "invoice" ? "Invoice" : "Nota"}</h1>
          <p className="text-muted-foreground">
            {documentType === "invoice" ? "Buat tagihan formal dari data project." : "Buat bukti pembayaran yang sudah diterima."}
          </p>
        </div>
        <Button
          aria-label="Pengaturan invoice"
          size="icon"
          variant="outline"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings2 />
        </Button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Buat Invoice</CardTitle>
            <CardDescription>
              Pilih project, lalu buat satu invoice dari pemasukan yang tercatat.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Select value={documentType} onValueChange={(value) => setDocumentType(value as "invoice" | "nota")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="invoice">Invoice</SelectItem><SelectItem value="nota">Nota</SelectItem></SelectContent>
            </Select>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih project" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.code} - {project.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
<Button
              onClick={() =>
                generate()
                  .then(() => setFeedback("Invoice berhasil dibuat."))
                  .catch((error) =>
                    setFeedback(error instanceof Error ? error.message : "Invoice gagal dibuat."),
                  )
              }
            >
              <FileText data-icon="inline-start" />
              Generate {documentType === "invoice" ? "Invoice" : "Nota"}
            </Button>
            {selectedProject && (
              <p className="text-sm text-muted-foreground">
                {items.length} item pesanan · {rupiah(total)}
              </p>
            )}
            {feedback && (
              <p aria-live="polite" className="text-sm text-muted-foreground">{feedback}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview PDF</CardTitle>
              <CardDescription>
                {invoiceNumber
                  ? `Invoice ${invoiceNumber} siap diunduh.`
                  : `Pilih project lalu klik Generate ${documentType === "invoice" ? "Invoice" : "Nota"} untuk menampilkan dokumen.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoiceNumber && selectedProject ? (
                <div className="overflow-auto rounded-lg border bg-background p-4">
                  <div
                    ref={previewRef}
                    id="invoice-export-preview"
                    className="mx-auto flex min-w-[42rem] max-w-3xl flex-col gap-6 bg-background p-8 text-foreground"
                  >
                    <div className="flex items-start justify-between gap-8 border-b pb-6">
                      <div className="flex flex-col gap-1 text-sm">
                        {logoSource && (
                          <img
                            alt={`Logo ${settings.agency_name || "agency"}`}
                            className="mb-4 h-20 w-48 object-contain object-left"
                            src={logoSource}
                          />
                        )}
                        <p className="text-xl font-bold">
                          {settings.agency_name || "Nama Agency"}
                        </p>
                        {settings.agency_address && (
                          <p>{settings.agency_address}</p>
                        )}
                        {settings.agency_phone && (
                          <p>{settings.agency_phone}</p>
                        )}
                        {settings.agency_email && (
                          <p>{settings.agency_email}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{documentType === "invoice" ? "INVOICE" : "NOTA PEMBAYARAN"}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {invoiceNumber}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 text-sm sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold">{documentType === "invoice" ? "Tagihan untuk" : "Pembayaran dari"}</p>
                        <p>{selectedProject.client_name}</p>
                        <p className="text-muted-foreground">
                          {selectedProject.name}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 text-left sm:text-right">
                        <p>
                          <span className="text-muted-foreground">
                            Tanggal Invoice:{" "}
                          </span>
                          {dateLabel(new Date())}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Project:{" "}
                          </span>
                          {selectedProject.code}
                        </p>
                      </div>
                    </div>

                    <div className="border">
                      <div className="grid grid-cols-[auto_1fr_5rem_8rem_8rem] gap-4 border-b bg-muted px-4 py-3 text-sm font-semibold">
                        <span>No.</span>
                        <span>Deskripsi</span>
                        <span className="justify-self-center text-center">Qty</span>
                        <span className="text-right">Harga Satuan</span>
                        <span className="text-right">Nominal</span>
                      </div>
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[auto_1fr_5rem_8rem_8rem] gap-4 border-b px-4 py-3 text-sm last:border-b-0"
                        >
                          <span>{index + 1}</span>
                          <span>
                            {item.description}
                          </span>
                          <span className="justify-self-center text-center">{item.quantity}</span>
                          <span className="text-right">{rupiah(item.unit_price)}</span>
                          <span className="text-right">{rupiah(item.quantity * item.unit_price)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ml-auto flex w-full max-w-sm flex-col gap-2 border-t pt-4 text-sm">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>{documentType === "invoice" ? "Total Tagihan" : "Total Diterima"}</span>
                        <span>{rupiah(total)}</span>
                      </div>
                    </div>

                    <div className="grid gap-6 border-t pt-6 text-sm sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold">Instruksi Pembayaran</p>
                        <p className="text-muted-foreground">
                          {settings.payment_instructions || "Belum diatur."}
                        </p>
                      </div>
                      <div className="flex flex-col gap-6 text-left sm:text-right">
                        <p className="text-muted-foreground">{documentType === "invoice" ? "Hormat kami," : "Pembayaran telah diterima (LUNAS)."}</p>
                        <p className="font-semibold">
                          {settings.signatory_name ||
                            settings.agency_name ||
                            "Agency"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-96 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
                  <FileText className="text-muted-foreground" />
                  <p className="font-medium">
                    Preview invoice akan muncul di sini
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Data project dan pemasukan akan terisi otomatis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {invoiceNumber && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  downloadImage("png").catch((error) =>
                    setFeedback(error instanceof Error ? error.message : "Ekspor PNG gagal."),
                  )
                }
              >
                <Download data-icon="inline-start" />
                Download PNG
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  downloadImage("jpg").catch((error) =>
                    setFeedback(error instanceof Error ? error.message : "Ekspor JPG gagal."),
                  )
                }
              >
                <Download data-icon="inline-start" />
                Download JPG
              </Button>
              <Button
                onClick={() =>
                  downloadPdf().catch((error) =>
                    setFeedback(error instanceof Error ? error.message : "Ekspor PDF gagal."),
                  )
                }
              >
                <Download data-icon="inline-start" />
                Download PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pengaturan Invoice</DialogTitle>
            <DialogDescription>
              Atur identitas agency dan detail yang tampil di template invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Nama agency"
              value={settings.agency_name}
              onChange={(event) =>
                setSettings({ ...settings, agency_name: event.target.value })
              }
            />
            <Input
              placeholder="Prefix nomor invoice"
              value={settings.invoice_prefix}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  invoice_prefix: event.target.value.toUpperCase(),
                })
              }
            />
            <Input
              className="sm:col-span-2"
              placeholder="Alamat agency"
              value={settings.agency_address}
              onChange={(event) =>
                setSettings({ ...settings, agency_address: event.target.value })
              }
            />
            <Input
              placeholder="Nomor telepon"
              value={settings.agency_phone}
              onChange={(event) =>
                setSettings({ ...settings, agency_phone: event.target.value })
              }
            />
            <Input
              placeholder="Email agency"
              type="email"
              value={settings.agency_email}
              onChange={(event) =>
                setSettings({ ...settings, agency_email: event.target.value })
              }
            />
            <Input
              className="sm:col-span-2"
              placeholder="Instruksi pembayaran"
              value={settings.payment_instructions}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  payment_instructions: event.target.value,
                })
              }
            />
            <Input
              className="sm:col-span-2"
              placeholder="Nama penandatangan"
              value={settings.signatory_name}
              onChange={(event) =>
                setSettings({ ...settings, signatory_name: event.target.value })
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const selected = await open({
                  multiple: false,
                  filters: [
                    { name: "Logo", extensions: ["png", "jpg", "jpeg"] },
                  ],
                });
                if (typeof selected !== "string") return;
                const extension = selected.split(".").pop()?.toLowerCase() || "png";
                const localName = `invoice-logo.${extension}`;
                await writeFile(localName, await readFile(selected), {
                  baseDir: BaseDirectory.AppLocalData,
                });
                const localDirectory = await appLocalDataDir();
                const separator = localDirectory.endsWith("\\") ? "" : "\\";
                const localPath = `${localDirectory}${separator}${localName}`;
                setSettings({ ...settings, logo_path: localPath });
              }}
            >
              Pilih Logo
            </Button>
            <span className="text-sm text-muted-foreground">
              {settings.logo_path
                ? "Logo sudah dipilih."
                : "Logo belum dipilih."}
            </span>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
<Button
              onClick={() =>
                saveInvoiceSettings(settings)
                  .then(() => setSettingsOpen(false))
                  .catch(console.error)
              }
            >
              Simpan Pengaturan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
