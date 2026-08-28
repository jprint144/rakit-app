import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    RakitAuth?: { open: (url: string) => void };
  }
}

function GoogleIcon() {
  return <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.15c1.84-1.69 2.9-4.18 2.9-7.29Z"/><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.23L15.3 17a5.81 5.81 0 0 1-8.65-3.05H3.4v2.6A9.75 9.75 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M6.65 13.95a5.9 5.9 0 0 1 0-3.9v-2.6H3.4a9.75 9.75 0 0 0 0 9.1l3.25-2.6Z"/><path fill="#EA4335" d="M12 6.25c1.53 0 2.9.53 3.98 1.56l2.99-2.99C16.83 2.82 14.62 2.25 12 2.25a9.75 9.75 0 0 0-8.6 5.2l3.25 2.6A5.81 5.81 0 0 1 12 6.25Z"/></svg>;
}

export function LoginForm() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [signUp, setSignUp] = useState(false); const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    const { error } = signUp ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: "rakit://auth/callback" } }) : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false); if (error) toast.error(error.message); else if (signUp) toast.success("Akun dibuat. Periksa email untuk konfirmasi jika diminta.");
  };
  const google = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "rakit://auth/callback", queryParams: { prompt: "select_account" }, skipBrowserRedirect: true } });
    if (error) { toast.error(error.message); return; }
    if (!data.url) { toast.error("Alamat masuk Google tidak tersedia."); return; }
    if (window.RakitAuth) window.RakitAuth.open(data.url);
    else await openUrl(data.url);
  };
  return <form className="flex flex-col gap-6" onSubmit={submit}><FieldGroup><div className="flex flex-col items-center gap-1 text-center"><h1 className="text-2xl font-bold">{signUp ? "Buat akun Rakit" : "Masuk ke Rakit"}</h1><p className="text-sm text-muted-foreground">Gunakan akun yang sama di laptop dan Android.</p></div><Field><FieldLabel htmlFor="email">Email</FieldLabel><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field><Field><FieldLabel htmlFor="password">Password</FieldLabel><Input id="password" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></Field><Field><Button disabled={loading} type="submit">{loading ? "Memuat…" : signUp ? "Buat akun" : "Masuk"}</Button></Field><FieldSeparator>atau</FieldSeparator><Field><Button variant="outline" type="button" onClick={() => void google()}><GoogleIcon />Masuk dengan Google</Button><FieldDescription className="text-center"><button className="underline underline-offset-4" type="button" onClick={() => setSignUp((value) => !value)}>{signUp ? "Sudah punya akun? Masuk" : "Belum punya akun? Buat akun"}</button></FieldDescription></Field></FieldGroup></form>;
}
