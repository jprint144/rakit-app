import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:rakit.db";

export type IncomeTransaction = {
  id: number;
  project_id: number;
  project_code: string;
  project_name: string;
installment_name: string | null;
  amount: number;
  transaction_date: string;
  notes: string | null;
};

export type IncomeInput = {
  project_id: string;
  order_id?: string;
  installment_name: string;
  amount: string;
  transaction_date: string;
  notes: string;
};

async function db() {
  return Database.load(DATABASE_URL);
}

export async function listIncomeTransactions() {
  return await (
    await db()
  ).select<IncomeTransaction[]>(
    `SELECT transactions.id, transactions.project_id, transactions.order_id, projects.code AS project_code, projects.name AS project_name, transactions.installment_name, transactions.amount, transactions.transaction_date, transactions.notes
     FROM transactions
     INNER JOIN projects ON projects.id = transactions.project_id
     WHERE transactions.type = 'income'
     ORDER BY transactions.transaction_date DESC, transactions.id DESC`,
  );
}

export async function saveIncomeTransaction(input: IncomeInput) {
  await (
    await db()
  ).execute(
    "INSERT INTO transactions (project_id, order_id, type, installment_name, amount, transaction_date, notes) VALUES ($1, $2, 'income', $3, $4, $5, $6)",
    [
      Number(input.project_id),
      input.order_id ? Number(input.order_id) : null,
      input.installment_name || null,
      Number(input.amount.replace(/\D/g, "")),
      input.transaction_date,
      input.notes || null,
    ],
  );
}

export async function deleteIncomeTransaction(id: number) {
  await (
    await db()
  ).execute("DELETE FROM transactions WHERE id = $1 AND type = 'income'", [id]);
}

export async function saveExpenseTransaction(
  input: Omit<IncomeInput, "installment_name">,
) {
  await (
    await db()
  ).execute(
    "INSERT INTO transactions (project_id, type, amount, transaction_date, notes) VALUES ($1, 'expense', $2, $3, $4)",
    [
      Number(input.project_id),
      Number(input.amount.replace(/\D/g, "")),
      input.transaction_date,
      input.notes || null,
    ],
  );
}

export async function listExpenseTransactions() {
  return await (
    await db()
  ).select<IncomeTransaction[]>(
    `SELECT transactions.id, transactions.project_id, transactions.order_id, projects.code AS project_code, projects.name AS project_name, transactions.installment_name, transactions.amount, transactions.transaction_date, transactions.notes
     FROM transactions INNER JOIN projects ON projects.id = transactions.project_id
     WHERE transactions.type = 'expense' ORDER BY transactions.transaction_date DESC, transactions.id DESC`,
  );
}

export async function deleteExpenseTransaction(id: number) {
  await (
    await db()
  ).execute("DELETE FROM transactions WHERE id = $1 AND type = 'expense'", [
    id,
  ]);
}

export type InvoiceSettings = {
  agency_name: string;
  invoice_prefix: string;
  logo_path: string;
  agency_address: string;
  agency_phone: string;
  agency_email: string;
  payment_instructions: string;
  signatory_name: string;
};
export async function loadInvoiceSettings(): Promise<InvoiceSettings> {
  const rows = await (
    await db()
  ).select<{ key: string; value: string }[]>(
    "SELECT key, value FROM settings WHERE key IN ('agency_name', 'invoice_prefix', 'logo_path', 'agency_address', 'agency_phone', 'agency_email', 'payment_instructions', 'signatory_name')",
  );
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    agency_name: values.agency_name ?? "",
    invoice_prefix: values.invoice_prefix ?? "INV",
    logo_path: values.logo_path ?? "",
    agency_address: values.agency_address ?? "",
    agency_phone: values.agency_phone ?? "",
    agency_email: values.agency_email ?? "",
    payment_instructions: values.payment_instructions ?? "",
    signatory_name: values.signatory_name ?? "",
  };
}
export async function saveInvoiceSettings(settings: InvoiceSettings) {
  const database = await db();
  const entries: [string, string][] = [
    ["agency_name", settings.agency_name],
    ["invoice_prefix", settings.invoice_prefix],
    ["logo_path", settings.logo_path],
    ["agency_address", settings.agency_address],
    ["agency_phone", settings.agency_phone],
    ["agency_email", settings.agency_email],
    ["payment_instructions", settings.payment_instructions],
    ["signatory_name", settings.signatory_name],
  ];

  for (const [key, value] of entries) {
    await database.execute(
      "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
      [key, value],
    );
  }
}
export async function listProjectTransactions(projectId: number) {
  return await (
    await db()
  ).select<
    {
      type: string;
      installment_name: string | null;
      amount: number;
      transaction_date: string;
      notes: string | null;
    }[]
  >(
    "SELECT type, installment_name, amount, transaction_date, notes FROM transactions WHERE project_id = $1 ORDER BY transaction_date ASC, id ASC",
    [projectId],
  );
}

export async function generateInvoice(
  projectId: number,
  orderId: number | null,
  documentType: "invoice" | "nota",
  prefix: string,
  items: unknown[],
) {
  const database = await db();
  const row = await database.select<{ next_number: number }[]>(
    "SELECT COUNT(*) + 1 AS next_number FROM invoices",
  );
  const number = `${prefix || "INV"}-${String(row[0]?.next_number ?? 1).padStart(3, "0")}`;
  await database.execute(
    "INSERT INTO invoices (project_id, order_id, document_type, number, issued_at, items_json) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)",
    [projectId, orderId, documentType, number, JSON.stringify(items)],
  );
  return number;
}

export async function recordInvoiceExport(
  invoiceNumber: string,
  format: "png" | "jpg" | "pdf",
) {
  await (
    await db()
  ).execute(
    "UPDATE invoices SET last_export_format = $1 WHERE number = $2",
    [format, invoiceNumber],
  );
}

export type CustomerOrder = {
  id: number;
  project_id: number;
  customer_name: string;
  customer_whatsapp: string | null;
  status: string;
  total_amount: number;
  primary_item_id: number | null;
  primary_quantity: number;
};

export type OrderItem = {
  id: number;
  order_id: number;
  description: string;
  quantity: number;
  unit_price: number;
};

export async function listCustomerOrders(projectId: number) {
  return await (await db()).select<CustomerOrder[]>(
    "SELECT customer_orders.id, customer_orders.project_id, customer_orders.customer_name, customer_orders.customer_whatsapp, customer_orders.status, COALESCE(SUM(order_items.quantity * order_items.unit_price), 0) AS total_amount, MIN(order_items.id) AS primary_item_id, COALESCE(MIN(order_items.quantity), 1) AS primary_quantity FROM customer_orders LEFT JOIN order_items ON order_items.order_id = customer_orders.id WHERE customer_orders.project_id = $1 GROUP BY customer_orders.id ORDER BY customer_orders.id DESC",
    [projectId],
  );
}


export async function listProjectOrderItems(projectId: number) {
  return await (await db()).select<OrderItem[]>(
    "SELECT order_items.id, order_items.order_id, order_items.description AS description, order_items.quantity, order_items.unit_price FROM order_items INNER JOIN customer_orders ON customer_orders.id = order_items.order_id WHERE customer_orders.project_id = $1 ORDER BY customer_orders.id ASC, order_items.id ASC",
    [projectId],
  );
}
export async function listOrderItems(orderId: number) {
  return await (await db()).select<OrderItem[]>(
    "SELECT id, order_id, description, quantity, unit_price FROM order_items WHERE order_id = $1 ORDER BY id ASC",
    [orderId],
  );
}

export async function saveCustomerOrder(projectId: number, customerName: string, customerWhatsapp: string) {
  const result = await (await db()).execute(
    "INSERT INTO customer_orders (project_id, customer_name, customer_whatsapp) VALUES ($1, $2, $3)",
    [projectId, customerName, customerWhatsapp || null],
  );
  return result.lastInsertId;
}

export async function saveOrderItem(orderId: number, description: string, quantity: number, unitPrice: number) {
  await (await db()).execute(
    "INSERT INTO order_items (order_id, description, quantity, unit_price) VALUES ($1, $2, $3, $4)",
    [orderId, description, quantity, unitPrice],
  );
}

export async function syncOrderIncome(
  projectId: number,
  orderId: number,
  orderName: string,
  amount: number,
) {
  const database = await db();
  const result = await database.execute(
    "UPDATE transactions SET installment_name = $1, amount = $2, notes = $3 WHERE order_id = $4 AND type = 'income'",
    ["Pesanan", amount, `Pesanan: ${orderName}`, orderId],
  );

  if (result.rowsAffected > 0) return;

  await database.execute(
    "INSERT INTO transactions (project_id, order_id, type, installment_name, amount, transaction_date, notes) VALUES ($1, $2, 'income', $3, $4, date('now'), $5)",
    [projectId, orderId, "Pesanan", amount, `Pesanan: ${orderName}`],
  );
}
export async function syncExistingOrderIncomes() {
  const rows = await (await db()).select<
    { project_id: number; order_id: number; order_name: string; amount: number }[]
  >(
    "SELECT customer_orders.project_id, customer_orders.id AS order_id, customer_orders.customer_name AS order_name, COALESCE(SUM(order_items.quantity * order_items.unit_price), 0) AS amount FROM customer_orders LEFT JOIN order_items ON order_items.order_id = customer_orders.id GROUP BY customer_orders.id",
  );

  await Promise.all(
    rows.map((order) =>
      syncOrderIncome(order.project_id, order.order_id, order.order_name, order.amount),
    ),
  );
}
export async function updateCustomerOrder(
  orderId: number,
  itemId: number | null,
  name: string,
  amount: number,
  quantity: number,
) {
  const database = await db();
  await database.execute(
    "UPDATE customer_orders SET customer_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [name, orderId],
  );
  if (itemId) {
    await database.execute(
      "UPDATE order_items SET description = $1, quantity = $2, unit_price = $3 WHERE id = $4",
      [name, quantity, amount, itemId],
    );
  } else {
    await saveOrderItem(orderId, name, quantity, amount);
  }
  const items = await listOrderItems(orderId);
  const order = await database.select<{ project_id: number }[]>(
    "SELECT project_id FROM customer_orders WHERE id = $1",
    [orderId],
  );
  await syncOrderIncome(
    order[0].project_id,
    orderId,
    name,
    items.reduce((total, item) => total + item.quantity * item.unit_price, 0),
  );
}

export async function deleteCustomerOrder(id: number) {
  const database = await db();
  await database.execute("DELETE FROM transactions WHERE order_id = $1 AND type = 'income'", [id]);
  await database.execute("DELETE FROM order_items WHERE order_id = $1", [id]);
  await database.execute("DELETE FROM customer_orders WHERE id = $1", [id]);
}

export async function deleteOrderItem(id: number) {
  await (await db()).execute("DELETE FROM order_items WHERE id = $1", [id]);
}