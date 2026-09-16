"use client";

import { useState } from "react";
import { createClient, getSessionUser } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import type { Profile } from "@/lib/types";

/**
 * Nilai awal (nama, kelas, email) datang dari server lewat props: layout
 * siswa sudah membaca profil untuk request ini (getProfile di-cache per
 * request), jadi mengambilnya lagi dari browser hanya menambah satu request
 * Supabase dan sempat menampilkan form kosong. Perilaku simpan tidak berubah:
 * identitas tetap diambil dari sesi lokal (getSessionUser, tanpa roundtrip)
 * dan RLS tetap penjaga terakhir saat menulis.
 */
export function SettingsForm({ profile }: { profile: Profile | null }) {
  const { showToast } = useToast();
  const [name, setName] = useState(profile?.full_name || "");
  const [klass, setKlass] = useState(profile?.class_name || "");
  const [email] = useState(profile?.email || "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Nama tidak boleh kosong.", "error");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const user = await getSessionUser(supabase);
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
