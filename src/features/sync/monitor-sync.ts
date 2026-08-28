import Database from "@tauri-apps/plugin-sql";
import { supabase } from "@/lib/supabase";

const DATABASE_URL = "sqlite:rakit.db";
const MONITOR_DOMAIN = "monitor_snapshot";
const MONITOR_RECORD_ID = "desktop";

type MonitorSnapshot = {
  projects: Record<string, unknown>[];
  customer_orders: Record<string, unknown>[];
  order_items: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
};

const isAndroid = () => /Android/i.test(navigator.userAgent);
const database = () => Database.load(DATABASE_URL);

async function readSnapshot(): Promise<MonitorSnapshot> {
  const db = await database();
  const [projects, customerOrders, orderItems, transactions, invoices] = await Promise.all([
    db.select<Record<string, unknown>[]>("SELECT * FROM projects"),
    db.select<Record<string, unknown>[]>("SELECT * FROM customer_orders"),
    db.select<Record<string, unknown>[]>("SELECT * FROM order_items"),
    db.select<Record<string, unknown>[]>("SELECT * FROM transactions"),
    db.select<Record<string, unknown>[]>("SELECT * FROM invoices"),
  ]);
  return { projects, customer_orders: customerOrders, order_items: orderItems, transactions, invoices };
}

function asSnapshot(value: unknown): MonitorSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const snapshot = value as Partial<MonitorSnapshot>;
  if (![snapshot.projects, snapshot.customer_orders, snapshot.order_items, snapshot.transactions, snapshot.invoices].every(Array.isArray)) return null;
  return snapshot as MonitorSnapshot;
}

async function applySnapshot(snapshot: MonitorSnapshot) {
  const db = await database();
  await db.execute("DELETE FROM invoices");
  await db.execute("DELETE FROM transactions");
  await db.execute("DELETE FROM order_items");
  await db.execute("DELETE FROM customer_orders");
  await db.execute("DELETE FROM projects");

  for (const project of snapshot.projects) {
    await db.execute(
      "INSERT INTO projects (id, code, name, client_name, client_whatsapp, brief, kanban_status, payment_status, deadline, started_at, folder_path, archived, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
      [project.id, project.code, project.name, project.client_name, project.client_whatsapp, project.brief, project.kanban_status, project.payment_status, project.deadline, project.started_at, null, project.archived, project.created_at, project.updated_at],
    );
  }
  for (const order of snapshot.customer_orders) await db.execute("INSERT INTO customer_orders (id, project_id, customer_name, customer_whatsapp, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", [order.id, order.project_id, order.customer_name, order.customer_whatsapp, order.status, order.created_at, order.updated_at]);
  for (const item of snapshot.order_items) await db.execute("INSERT INTO order_items (id, order_id, description, quantity, unit_price, created_at) VALUES ($1,$2,$3,$4,$5,$6)", [item.id, item.order_id, item.description, item.quantity, item.unit_price, item.created_at]);
  for (const transaction of snapshot.transactions) await db.execute("INSERT INTO transactions (id, project_id, type, installment_name, amount, transaction_date, notes, created_at, order_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [transaction.id, transaction.project_id, transaction.type, transaction.installment_name, transaction.amount, transaction.transaction_date, transaction.notes, transaction.created_at, transaction.order_id]);
  for (const invoice of snapshot.invoices) await db.execute("INSERT INTO invoices (id, project_id, number, issued_at, items_json, last_export_format, created_at, order_id, document_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [invoice.id, invoice.project_id, invoice.number, invoice.issued_at, invoice.items_json, invoice.last_export_format, invoice.created_at, invoice.order_id, invoice.document_type]);
}

export async function syncMonitorSnapshot(ownerId: string) {
  if (isAndroid()) {
    const { data, error } = await supabase.from("rakit_records").select("payload").eq("domain", MONITOR_DOMAIN).eq("record_id", MONITOR_RECORD_ID).maybeSingle();
    if (error) throw error;
    const snapshot = asSnapshot(data?.payload);
    if (!snapshot) return false;
    await applySnapshot(snapshot);
    return true;
  }

  const snapshot = await readSnapshot();
  const { error } = await supabase.from("rakit_records").upsert({ owner_id: ownerId, domain: MONITOR_DOMAIN, record_id: MONITOR_RECORD_ID, payload: snapshot, updated_at: new Date().toISOString(), deleted_at: null }, { onConflict: "owner_id,domain,record_id" });
  if (error) throw error;
  return true;
}
