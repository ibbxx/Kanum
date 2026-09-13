import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GuruDashboardPage() {
  const supabase = await createClient();

  const [kelasRes, latihanRes, siswaRes] = await Promise.all([
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("exercises").select("id", { count: "exact", head: true }),
    supabase.from("class_members").select("student_id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Kelas", value: kelasRes.count ?? 0, icon: "groups" },
    { label: "Latihan dibuat", value: latihanRes.count ?? 0, icon: "edit_square" },
    { label: "Siswa di kelas", value: siswaRes.count ?? 0, icon: "person" },
  ];

  return (
    <div>
      <p className="text-on-surface-variant mb-6">
        Ringkasan pengelolaan kelas &amp; konten Anda. Angka di bawah otomatis
        dibatasi pada data milik/kelas Anda.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-outline-variant rounded-2xl p-6 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className="material-symbols-outlined text-2xl">{s.icon}</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
