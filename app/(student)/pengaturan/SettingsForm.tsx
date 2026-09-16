"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export function SettingsForm() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [klass, setKlass] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, class_name, email")
        .eq("id", user.id)
        .single();
      if (data) {
        setName(data.full_name || "");
        setKlass(data.class_name || "");
        setEmail(data.email || "");
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Nama tidak boleh kosong.", "error");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      showToast("Sesi tidak ditemukan. Silakan login ulang.", "error");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), class_name: klass.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) showToast("Gagal menyimpan: " + error.message, "error");
    else showToast("Profil berhasil disimpan!");
  }

  return (
    <form onSubmit={save} className="max-w-lg space-y-4 bg-white border border-outline-variant rounded-2xl p-6">
      <div>
        <label className="text-xs font-bold uppercase text-on-surface-variant">Nama</label>
        <input
          className="mt-1 w-full px-4 py-3 rounded-xl bg-surface-container-low"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-on-surface-variant">Kelas</label>
        <input
          className="mt-1 w-full px-4 py-3 rounded-xl bg-surface-container-low"
          value={klass}
          onChange={(e) => setKlass(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-on-surface-variant">Email</label>
        <input
          className="mt-1 w-full px-4 py-3 rounded-xl bg-surface-container-low"
          value={email}
          disabled
        />
      </div>
      <button type="submit" disabled={saving} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold">
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
