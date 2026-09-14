# Migrasi Database Supabase — KANUM

Jalankan berurutan di **Supabase → SQL Editor**. Semua file idempotent
(aman dijalankan ulang, tidak menduplikasi data/policy).

| Urutan | File | Isi |
|--------|------|-----|
| 1 | [`000_rebuild.sql`](./000_rebuild.sql) | Schema dasar: tabel (profiles, exercises, questions, attempts, materi, budaya), trigger profil otomatis, RLS, RPC quiz |
| 2 | [`001_multi_role.sql`](./001_multi_role.sql) | Sistem tiga peran (siswa/guru/admin): role `teacher`, tabel kelas & anggota, RLS per pemilik |
| 3 | [`002_verification_flow.sql`](./002_verification_flow.sql) | Verifikasi akun: status `pending/approved/rejected`, akun baru pending, verifikasi siswa oleh guru & guru oleh admin (RPC berotoritas), anti-eskalasi via column privilege |
| 4 | [`003_performance_indexes.sql`](./003_performance_indexes.sql) | Index performa: profil by email & (role,status), kelas/anggota, attempt/progres, konten published |

Cara menjalankan:
1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) → project KANUM.
2. Sidebar kiri → **SQL Editor** → **New query**.
3. Salin **seluruh isi** file nomor 1 → **Run** → pastikan sukses.
4. Ulangi untuk file nomor 2.

Setelah migrasi, lanjutkan setup aplikasi mengikuti **satu-satunya** panduan:
[`docs/TUTORIAL.md`](./docs/TUTORIAL.md) — mencakup URL Configuration, template
email, SMTP Resend, Google OAuth, pengujian end-to-end, dan troubleshooting.
