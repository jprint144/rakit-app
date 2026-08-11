import { useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { BaseDirectory, readFile, writeFile } from "@tauri-apps/plugin-fs";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Download, FileText, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import signatureUrl from "@/assets/januarianto-signature-transparent.png";
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  getInvoiceNumberRecap,
  loadInvoiceSettings,
  recordInvoiceExport,
  saveInvoiceSettings,
  listProjectOrderItems,
} from "@/features/finance/finance-repository";
import type { InvoiceNumberRecap, InvoiceSettings, PaymentAccount } from "@/features/finance/finance-repository";

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
    payment_accounts: [],
    signature_path: "",
    signatory_name: "",
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
const [documentType, setDocumentType] = useState<"invoice" | "nota">("invoice");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [numberRecap, setNumberRecap] = useState<InvoiceNumberRecap[]>([]);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(
    (project) => String(project.id) === projectId,
  );
const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [items]);
  const paymentAccounts = settings.payment_accounts.filter(
    (account) => account.bank_name || account.account_number || account.account_holder,
  );

  const updatePaymentAccount = (
    id: string,
    field: keyof Omit<PaymentAccount, "id">,
    value: string,
  ) => {
    setSettings({
      ...settings,
      payment_accounts: settings.payment_accounts.map((account) =>
        account.id === id ? { ...account, [field]: value } : account,
      ),
    });
  };
  useEffect(() => {
    if (!settings.logo_path) { setLogoDataUrl(null); return; }
    const extension = settings.logo_path.split(".").pop()?.toLowerCase();
    const mimeType = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : "image/png";
    readFile(settings.logo_path)
      .then((bytes) => setLogoDataUrl(`data:${mimeType};base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))}`))
      .catch(() => setLogoDataUrl(null));
  }, [settings.logo_path]);

  useEffect(() => {
    if (!settings.signature_path) { setSignatureDataUrl(null); return; }
    const extension = settings.signature_path.split(".").pop()?.toLowerCase();
    const mimeType = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : "image/png";
    readFile(settings.signature_path)
      .then((bytes) => setSignatureDataUrl(`data:${mimeType};base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))}`))
      .catch(() => setSignatureDataUrl(null));
  }, [settings.signature_path]);

  const logoSource = logoDataUrl || (settings.logo_path
    ? convertFileSrc(settings.logo_path)
    : null);
  const signatureSource = signatureDataUrl || (settings.signature_path
    ? convertFileSrc(settings.signature_path)
    : signatureUrl);

  useEffect(() => {
    loadInvoiceSettings().then(setSettings).catch(console.error);
    listProjects().then(setProjects).catch(console.error);
    getInvoiceNumberRecap().then(setNumberRecap).catch(console.error);
  }, []);

  useEffect(() => {
    setInvoiceNumber("");
    setItems([]);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setItems([]);
      return;
    }
    listProjectOrderItems(Number(projectId)).then(setItems).catch(console.error);
  }, [projectId]);

  const generate = async () => {
    if (!selectedProject) {
      toast.error(
        projects.length
          ? "Pilih project terlebih dahulu."
          : "Belum ada project. Tambahkan project terlebih dahulu.",
      );
      return false;
    }
    if (!items.length) {
      toast.error("Project ini belum memiliki pesanan.");
      return false;
    }
    if (documentType === "nota" && selectedProject.payment_status !== "paid") {
      toast.error("Nota hanya dapat dibuat setelah status pembayaran project menjadi Lunas.");
      return false;
    }
    const number = await generateInvoice(
      selectedProject.id,
      null,
      documentType,
      documentType === "invoice" ? settings.invoice_prefix : "NOTA",
      items,
    );
    setInvoiceNumber(number);
    getInvoiceNumberRecap().then(setNumberRecap).catch(console.error);
    return true;
  };

  const createCanvas = async () => {
    if (!previewRef.current) return null;
    await document.fonts.ready;
    return html2canvas(previewRef.current, {
      backgroundColor: "rgb(255, 255, 255)",
      scale: 2,
      onclone: (document) => {
        const exportTokens: Record<string, string> = {
          "--background": "rgb(255, 255, 255)",
          "--foreground": "rgb(24, 24, 27)",
          "--card": "rgb(255, 255, 255)",
          "--card-foreground": "rgb(24, 24, 27)",
          "--popover": "rgb(255, 255, 255)",
          "--popover-foreground": "rgb(24, 24, 27)",
          "--primary": "rgb(24, 24, 27)",
          "--primary-foreground": "rgb(255, 255, 255)",
          "--secondary": "rgb(244, 244, 245)",
          "--secondary-foreground": "rgb(24, 24, 27)",
          "--muted": "rgb(244, 244, 245)",
          "--muted-foreground": "rgb(113, 113, 122)",
          "--accent": "rgb(244, 244, 245)",
          "--accent-foreground": "rgb(24, 24, 27)",
          "--border": "rgb(228, 228, 231)",
          "--input": "rgb(228, 228, 231)",
          "--ring": "rgb(113, 113, 122)",
          "--invoice-accent": "rgb(190, 224, 246)",
          "--invoice-accent-strong": "rgb(69, 58, 184)",
          "--invoice-ink": "rgb(16, 21, 65)",
          "--invoice-canvas": "rgb(255, 255, 255)",
        };
        for (const [token, value] of Object.entries(exportTokens)) {
          document.documentElement.style.setProperty(token, value, "important");
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
      toast.info("Penyimpanan dibatalkan.");
      return;
    }
    await writeFile(targetPath, contents);
    await recordInvoiceExport(invoiceNumber, format);
    toast.success(`File ${format.toUpperCase()} berhasil disimpan di lokasi pilihan.`);
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
        <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Buat {documentType === "invoice" ? "Invoice" : "Nota"}</CardTitle>
            <CardDescription className="mt-2">
              Pilih project. Semua pesanan project akan masuk ke dokumen.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid w-full grid-cols-2 gap-3">
              <Select
                value={documentType}
                onValueChange={(value) => {
                  setDocumentType(value as "invoice" | "nota");
                  setInvoiceNumber("");
                }}
              >
                <SelectTrigger className="relative w-full justify-center [&>svg]:absolute [&>svg]:right-3">
                  <SelectValue className="w-full justify-center text-center" />
                </SelectTrigger>
                <SelectContent><SelectItem value="invoice">Invoice</SelectItem><SelectItem value="nota">Nota</SelectItem></SelectContent>
              </Select>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="relative w-full justify-center [&>svg]:absolute [&>svg]:right-3">
                  <SelectValue className="w-full justify-center text-center" placeholder="Pilih project" />
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
            </div>
            <Button
              onClick={() =>
                generate()
                  .then((generated) => {
                    if (generated) {
                      toast.success(`${documentType === "invoice" ? "Invoice" : "Nota"} berhasil dibuat.`);
                    }
                  })
                  .catch((error) =>
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : typeof error === "string"
                          ? error
                          : "Invoice gagal dibuat.",
                    ),
                  )
              }
            >
              <FileText data-icon="inline-start" />
              Generate {documentType === "invoice" ? "Invoice" : "Nota"}
            </Button>
            {selectedProject && (
              <p className="text-sm text-muted-foreground">
                {items.length} item pesanan Â· {rupiah(total)}
              </p>
            )}
            {invoiceNumber && (
              <div className="grid gap-2 border-t pt-4 sm:grid-cols-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadImage("png").catch((error) =>
                      toast.error(error instanceof Error ? error.message : "Ekspor PNG gagal."),
                    )
                  }
                >
                  <Download data-icon="inline-start" /> PNG
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadImage("jpg").catch((error) =>
                      toast.error(error instanceof Error ? error.message : "Ekspor JPG gagal."),
                    )
                  }
                >
                  <Download data-icon="inline-start" /> JPG
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    downloadPdf().catch((error) =>
                      toast.error(error instanceof Error ? error.message : "Ekspor PDF gagal."),
                    )
                  }
                >
                  <Download data-icon="inline-start" /> PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full gap-2 py-4">
          <CardHeader className="px-5">
            <CardTitle className="text-base">Rekap Penomoran Global</CardTitle>
          </CardHeader>
          {invoiceNumber ? (
            <p className="px-5 text-xs text-muted-foreground">
              Dokumen project ini: <span className="font-medium text-foreground">{invoiceNumber}</span>
            </p>
          ) : null}
          <CardContent className="grid grid-cols-2 gap-2 px-5">
            {(["invoice", "nota"] as const).map((type) => {
              const recap = numberRecap.find((item) => item.document_type === type);
              return (
                <div key={type} className="rounded-md border px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    {type === "invoice" ? "Invoice terakhir" : "Nota terakhir"}
                  </p>
                  <p className="text-sm font-semibold">{recap?.latest_number || "Belum ada"}</p>
                  <p className="text-xs text-muted-foreground">
                    {recap?.total ?? 0} dokumen lintas project
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview PDF</CardTitle>
              <CardDescription>
                {invoiceNumber
                  ? `${documentType === "invoice" ? "Invoice" : "Nota"} ${invoiceNumber} siap diunduh.`
                  : `Pilih project lalu klik Generate ${documentType === "invoice" ? "Invoice" : "Nota"} untuk menampilkan dokumen.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoiceNumber && selectedProject ? (
                <div className="overflow-auto rounded-lg border bg-background p-4">
                  <div
                    ref={previewRef}
                    id="invoice-export-preview"
                    className="invoice-document font-invoice mx-auto flex min-w-[42rem] max-w-3xl flex-col overflow-hidden rounded-xl border bg-invoice-canvas text-invoice-ink shadow-sm"
                  >
                    <div data-invoice-header className="bg-background px-16 pt-10 text-invoice-ink">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                        {logoSource && (
                          <img
                            alt={`Logo ${settings.agency_name || "agency"}`}
                            className="mt-2 -ml-4 block h-28 w-auto max-w-72 object-contain object-left"
                            src={logoSource}
                          />
                        )}
                        {!logoSource && <p className="text-2xl font-bold tracking-[0.12em]">{settings.agency_name || "Nama Agency"}</p>}
                        <div className="shrink-0 text-right">
                          <p className="text-5xl leading-none font-bold tracking-tight text-invoice-accent-strong">{documentType === "invoice" ? "INVOICE" : "NOTA"}</p>
                          {documentType === "nota" && <p className="mt-3 text-xs font-semibold tracking-[0.16em] text-invoice-ink">BUKTI PELUNASAN</p>}
                          <p className="mt-2 text-sm font-semibold tracking-[0.12em] text-invoice-ink">NO. {invoiceNumber}</p>
                        </div>
                      </div>
                      <div className="-mt-3 grid gap-3 pb-2 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xl font-bold tracking-[0.08em]">{settings.agency_name || "Nama Agency"}</p>
                          <p className="mt-1 max-w-md leading-5 text-muted-foreground">{settings.agency_address || "Alamat agency belum diatur."}</p>
                        </div>
                        <div className="pt-8 text-left leading-5 sm:text-right">
                          <p>{settings.agency_phone || "Nomor telepon belum diatur."}</p>
                          <p>{settings.agency_email || "Email belum diatur."}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 px-16 pt-3 pb-12">
                      <div className="grid gap-4 border-y pt-2 pb-4 text-sm sm:grid-cols-2">
                        <div className="flex flex-col">
                          <p className="text-xs font-semibold tracking-wide text-muted-foreground">{documentType === "invoice" ? "INVOICE TO" : "PEMBAYARAN DARI"}</p>
                          <p className="-mt-2 text-2xl font-bold tracking-[0.1em]">{selectedProject.client_name}</p>
                          <p className="text-muted-foreground">{selectedProject.name}</p>
                        </div>
                        <div className="-mt-1 flex flex-col gap-1 text-left sm:text-right">
                          <p><span className="text-muted-foreground">{documentType === "invoice" ? "Tanggal terbit: " : "Tanggal pelunasan: "}</span>{dateLabel(new Date())}</p>
                          <p><span className="text-muted-foreground">Kode project: </span>{selectedProject.code}</p>
                          {documentType === "nota" && <p className="font-semibold text-invoice-ink">STATUS: LUNAS</p>}
                        </div>
                      </div>

                    <div className="overflow-hidden rounded-lg">
                      <div data-invoice-table-head className="grid grid-cols-[2rem_minmax(0,1fr)_7rem_3rem_7rem] gap-2 bg-invoice-accent px-4 py-3 text-sm font-semibold text-invoice-ink">
                        <span className="text-center">No.</span>
                        <span>Deskripsi</span>
                        <span className="text-center">Harga Satuan</span>
                        <span className="justify-self-center text-center">Qty</span>
                        <span className="text-center">Nominal</span>
                      </div>
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[2rem_minmax(0,1fr)_7rem_3rem_7rem] gap-2 border-b px-4 py-3 text-sm last:border-b-0"
                        >
                          <span className="justify-self-center">{index + 1}</span>
                          <span>
                            {item.description}
                          </span>
                          <span className="text-center">{rupiah(item.unit_price)}</span>
                          <span className="justify-self-center text-center">{item.quantity}</span>
                          <span className="text-center">{rupiah(item.quantity * item.unit_price)}</span>
                        </div>
                      ))}
                    </div>

                    <div data-invoice-total className="mr-6 ml-auto w-fit border-y px-5 py-3 text-right text-invoice-ink">
                      <p className="whitespace-nowrap text-xl font-bold">
                        {documentType === "invoice" ? "Total Tagihan:" : "Total Diterima:"} {rupiah(total)}
                      </p>
                    </div>

                    <div data-invoice-footer className="grid gap-6 border-t py-4 text-sm sm:grid-cols-2">
                      <div className="flex flex-col gap-3">
                        <p className="text-xs font-semibold tracking-wide text-invoice-ink">{documentType === "invoice" ? "PEMBAYARAN KE" : "STATUS PEMBAYARAN"}</p>
                        {documentType === "nota" ? (
                          <>
                            <p className="text-lg font-bold text-invoice-ink">LUNAS</p>
                            <p className="text-muted-foreground">Pembayaran penuh telah diterima pada {dateLabel(new Date())}.</p>
                          </>
                        ) : paymentAccounts.length > 0 ? (
                          <div className="grid gap-3">
                            {paymentAccounts.map((account) => (
                              <div key={account.id} className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Nama Bank</p>
                                  <p className="mt-1 font-medium">{account.bank_name || "-"}</p>
                                  {account.account_holder && <p className="text-xs text-muted-foreground">a.n. {account.account_holder}</p>}
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">No. Rekening</p>
                                  <p className="mt-1 font-medium">{account.account_number || "-"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-muted-foreground">Belum ada rekening pembayaran.</p>}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-muted-foreground">{documentType === "invoice" ? "Hormat kami," : "Penerima pembayaran,"}</p>
                        <div className="relative mt-1 h-28">
                          <img className="absolute -right-6 top-0 block h-auto w-32 object-contain object-right mix-blend-multiply" src={signatureSource} alt="Tanda tangan penandatangan" />
                          <p className="absolute right-0 bottom-0 font-semibold">{settings.signatory_name || "Januarianto"}</p>
                        </div>
                      </div>
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
                    Data project dan item pesanan akan terisi otomatis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto px-6 py-6 sm:max-w-md">
          <SheetHeader className="px-0 pt-0">
            <SheetTitle>Pengaturan Invoice</SheetTitle>
            <SheetDescription>
              Atur identitas agency dan detail yang tampil di template invoice.
            </SheetDescription>
          </SheetHeader>
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
            <div className="flex flex-col gap-3 sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Rekening Pembayaran</p>
                  <p className="text-xs text-muted-foreground">Tambahkan satu atau beberapa rekening yang tampil pada invoice.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      payment_accounts: [
                        ...settings.payment_accounts,
                        {
                          id: crypto.randomUUID(),
                          bank_name: "",
                          account_number: "",
                          account_holder: "",
                        },
                      ],
                    })
                  }
                >
                  <Plus /> Tambah Rekening
                </Button>
              </div>
              {settings.payment_accounts.map((account, index) => (
                <div key={account.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <Input
                    placeholder="Nama bank"
                    value={account.bank_name}
                    onChange={(event) => updatePaymentAccount(account.id, "bank_name", event.target.value)}
                  />
                  <Input
                    placeholder="Nomor rekening"
                    value={account.account_number}
                    onChange={(event) => updatePaymentAccount(account.id, "account_number", event.target.value)}
                  />
                  <Input
                    placeholder="Atas nama"
                    value={account.account_holder}
                    onChange={(event) => updatePaymentAccount(account.id, "account_holder", event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus rekening ${index + 1}`}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        payment_accounts: settings.payment_accounts.filter((item) => item.id !== account.id),
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
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
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const selected = await open({
                  multiple: false,
                  filters: [
                    { name: "Tanda tangan", extensions: ["png", "jpg", "jpeg"] },
                  ],
                });
                if (typeof selected !== "string") return;
                const extension = selected.split(".").pop()?.toLowerCase() || "png";
                const localName = `invoice-signature.${extension}`;
                await writeFile(localName, await readFile(selected), {
                  baseDir: BaseDirectory.AppLocalData,
                });
                const localDirectory = await appLocalDataDir();
                const separator = localDirectory.endsWith("\\") ? "" : "\\";
                const localPath = `${localDirectory}${separator}${localName}`;
                setSettings({ ...settings, signature_path: localPath });
              }}
            >
              Upload Tanda Tangan
            </Button>
            <span className="text-sm text-muted-foreground">
              {settings.signature_path
                ? "Tanda tangan sudah dipilih."
                : "Menggunakan tanda tangan bawaan."}
            </span>
          </div>
          <SheetFooter className="px-0 pb-0">
            <SheetClose asChild>
              <Button variant="outline">Batal</Button>
            </SheetClose>
            <Button
              onClick={() =>
                saveInvoiceSettings(settings)
                  .then(() => setSettingsOpen(false))
                  .catch(console.error)
              }
            >
              Simpan Pengaturan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
