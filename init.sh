#!/usr/bin/env bash
set -e

# ============================================================
# init.sh — Rakit
# Jalankan di awal tiap sesi kerja, sebelum nyentuh kode apa pun.
# Butuh Git Bash (atau shell bash lain) di Windows.
# ============================================================

# --- EDIT 3 VARIABEL INI SESUAI SETUP PROJECT ---
INSTALL_CMD="npm install"
VERIFY_CMD="npm run build"
START_CMD="npm run tauri dev"
# --------------------------------------------------

# Opsional: set RUN_START_COMMAND=1 sebelum jalanin script ini
# kalau mau langsung start dev server, bukan cuma diprint.
RUN_START_COMMAND="${RUN_START_COMMAND:-0}"

echo "============================================"
echo "Rakit — init.sh"
echo "============================================"

echo ""
echo "[1/4] Direktori kerja saat ini:"
pwd

echo ""
echo "[2/4] Install dependency..."
echo "> $INSTALL_CMD"
eval "$INSTALL_CMD"

echo ""
echo "[3/4] Jalankan verifikasi baseline..."
echo "> $VERIFY_CMD"
if eval "$VERIFY_CMD"; then
  echo ""
  echo "✅ Verifikasi baseline LOLOS."
else
  echo ""
  echo "❌ Verifikasi baseline GAGAL."
  echo "STOP — benerin ini dulu sebelum kerja fitur apa pun."
  exit 1
fi

echo ""
echo "[4/4] Command buat start dev server:"
echo "> $START_CMD"

if [ "$RUN_START_COMMAND" = "1" ]; then
  echo ""
  echo "RUN_START_COMMAND=1 terdeteksi, menjalankan dev server..."
  eval "$START_CMD"
else
  echo ""
  echo "(Gak dijalanin otomatis. Jalanin manual command di atas,"
  echo " atau set RUN_START_COMMAND=1 sebelum panggil init.sh.)"
fi
