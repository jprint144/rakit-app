import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Project } from "@/features/project/project-repository";
import {
  deleteCustomerOrder,
  listCustomerOrders,
  saveCustomerOrder,
  saveOrderItem,
  syncOrderIncome,
} from "@/features/finance/finance-repository";
import type { CustomerOrder } from "@/features/finance/finance-repository";

const formatNumberInput = (value: string) =>
  value ? new Intl.NumberFormat("id-ID").format(Number(value)) : "";

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export function OrderSheet({
  open,
  onOpenChange,
  projects,
  initialProjectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  initialProjectId?: number;
}) {
  const [projectId, setProjectId] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!open) return;
    setProjectId(String(initialProjectId ?? projects[0]?.id ?? ""));
    setName("");
    setQuantity("1");
    setPrice("");
  }, [open, initialProjectId, projects]);

  useEffect(() => {
    if (!projectId) {
      setOrders([]);
      return;
    }
    listCustomerOrders(Number(projectId)).then(setOrders).catch(console.error);
  }, [projectId]);

  const save = async () => {
    if (!projectId || !name.trim() || !price) return;
    const orderId = await saveCustomerOrder(Number(projectId), name.trim(), "");
    await saveOrderItem(
      Number(orderId),
      name.trim(),
      Number(quantity),
      Number(price),
    );
    await syncOrderIncome(
      Number(projectId),
      Number(orderId),
      name.trim(),
      Number(quantity) * Number(price),
    );
    setName("");
    setQuantity("1");
    setPrice("");
    setOrders(await listCustomerOrders(Number(projectId)));
    toast.success("Pesanan tersimpan.");
  };

  const removeOrder = async (order: CustomerOrder) => {
    await deleteCustomerOrder(order.id);
    setOrders(await listCustomerOrders(Number(projectId)));
    toast.success(`Pesanan ${order.customer_name} dihapus.`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="px-5 py-5 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tambah Pesanan</SheetTitle>
        </SheetHeader>
        <div className="mt-3 flex flex-col gap-3">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.code} - {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Nama pesanan"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <Input
            inputMode="numeric"
            placeholder="Harga satuan"
            value={formatNumberInput(price)}
            onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))}
          />
          <Button
            onClick={() =>
              save().catch((error: unknown) => {
                console.error(error);
                toast.error("Pesanan gagal disimpan. Coba lagi.");
              })
            }
            disabled={!projectId || !name.trim() || !price}
          >
            <Plus data-icon="inline-start" />
            Simpan Pesanan
          </Button>
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-md border p-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-muted-foreground">
                    {rupiah(order.total_amount)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus pesanan ${order.customer_name}`}
                  onClick={() =>
                    removeOrder(order).catch((error: unknown) => {
                      console.error(error);
                      toast.error("Pesanan gagal dihapus. Coba lagi.");
                    })
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
