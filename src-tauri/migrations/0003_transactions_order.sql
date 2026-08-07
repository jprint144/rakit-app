ALTER TABLE transactions ADD COLUMN order_id INTEGER REFERENCES customer_orders(id);
