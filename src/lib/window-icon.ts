import { getCurrentWindow } from "@tauri-apps/api/window";

type Theme = "light" | "dark";

export async function syncWindowIcon(_theme: Theme) {
  const logo = new Image();
  logo.src = "/branding/rakit-logo.png";

  await new Promise<void>((resolve, reject) => {
    logo.onload = () => resolve();
    logo.onerror = () => reject(new Error("Logo Rakit tidak dapat dimuat."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia.");

  context.drawImage(logo, 0, 0, canvas.width, canvas.height);

  // WebView2 tidak selalu menerapkan CanvasRenderingContext2D.filter pada gambar
  // yang akan dijadikan ikon native. Ubah pixel secara langsung supaya logo
  // desktop tetap putih pada title bar/taskbar Windows.
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const color = 255;
  for (let index = 0; index < pixels.data.length; index += 4) {
    pixels.data[index] = color;
    pixels.data[index + 1] = color;
    pixels.data[index + 2] = color;
  }
  context.putImageData(pixels, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => next ? resolve(next) : reject(new Error("Ikon Rakit tidak dapat dibuat.")), "image/png");
  });
  await getCurrentWindow().setIcon(new Uint8Array(await blob.arrayBuffer()));
}
