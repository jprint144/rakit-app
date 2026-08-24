import { getCurrentWindow } from "@tauri-apps/api/window";

type Theme = "light" | "dark";

export async function syncWindowIcon(theme: Theme) {
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

  context.filter = theme === "dark" ? "brightness(0) invert(1)" : "brightness(0)";
  context.drawImage(logo, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => next ? resolve(next) : reject(new Error("Ikon Rakit tidak dapat dibuat.")), "image/png");
  });
  await getCurrentWindow().setIcon(new Uint8Array(await blob.arrayBuffer()));
}
