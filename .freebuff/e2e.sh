#!/bin/bash
# E2E KANUM — server, guard, UI marker, RPC security
cd /Users/ibnufajar/Documents/project/KANUM
# Muat hanya var yang dibutuhkan — jangan source seluruh .env
# (baris non VAR=value akan dieksekusi bash dan error).
export NEXT_PUBLIC_SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env | cut -d= -f2-)
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env | cut -d= -f2-)
REF="vantlmdcqziaccglfayb"
LOG=".freebuff/preview-b882493d-ffe0-449d-b6a9-6c51e1e1df51.log"

# 0. Server
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null; sleep 1
{ nohup env PATH=/usr/local/bin:/usr/bin:/bin node node_modules/next/dist/bin/next dev -p 3000 > "$LOG" 2>&1 < /dev/null & disown; }
CODE=000
for i in $(seq 1 20); do CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null); [ "$CODE" = "200" ] && break; sleep 2; done
echo "SERVER_READY:$CODE"

echo ""
echo "=== A. ROUTE GUARD — ANONIM ==="
for p in / /login /daftar /verifikasi /dashboard /admin /guru; do
  curl -s -o /dev/null -w "anon $p -> %{http_code} %{redirect_url}\n" "http://localhost:3000$p"
done

echo ""
echo "=== B. LOGIN ADMIN ==="
RESP=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"adminkanum01@gmail.com","password":"adminkanum1234"}')
COOKIE_VAL=$(printf '%s' "$RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const s={access_token:j.access_token,refresh_token:j.refresh_token,token_type:j.token_type,expires_in:j.expires_in,expires_at:j.expires_at,user:j.user};process.stdout.write(encodeURIComponent(JSON.stringify(s)))}catch(e){process.stdout.write('')}})")
[ -n "$COOKIE_VAL" ] && echo "ADMIN_SESSION_OK" || echo "ADMIN_LOGIN_GAGAL"
CB="sb-$REF-auth-token=$COOKIE_VAL"
TOKEN=$(printf '%s' "$RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{process.stdout.write(JSON.parse(d).access_token)}catch(e){}})")
AH1="apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
AHA="Authorization: Bearer $TOKEN"

echo ""
echo "=== C. ROUTE GUARD — ADMIN ==="
for p in /admin /admin/verifikasi /admin/akun /dashboard /guru /login; do
  curl -s -o /dev/null -w "admin $p -> %{http_code} %{redirect_url}\n" -b "$CB" "http://localhost:3000$p"
done

echo ""
echo "=== D. UI MARKERS (SSR) ==="
echo -n "admin/verifikasi memuat sidebar Verifikasi Akun: "
curl -s -b "$CB" http://localhost:3000/admin/verifikasi | grep -c "Verifikasi Akun" | head -1
echo -n "daftar memuat tombol Google: "
curl -s http://localhost:3000/daftar | grep -c "Daftar dengan Google"
echo -n "daftar memuat form email + Kata Sandi (harus >=1): "
curl -s http://localhost:3000/daftar | grep -c "Kata Sandi"
echo -n "login?error=not_registered memuat pesan banner (harus 1): "
curl -s "http://localhost:3000/login?error=not_registered" | grep -c "Akun belum terdaftar"
echo -n "daftar?error=already_registered memuat pesan banner (harus 1): "
curl -s "http://localhost:3000/daftar?error=already_registered" | grep -c "Email ini sudah terdaftar"
echo -n "login TANPA link Lupa kata sandi (harus 0): "
curl -s http://localhost:3000/login | grep -c "Lupa kata sandi"
echo -n "lupa-password (harus 404): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/lupa-password
echo -n "reset-password (harus 404): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/reset-password
echo -n "auth/reset (harus 404): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/auth/reset
echo -n "verifikasi(anon) redirect ke login: "
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/verifikasi

echo ""
echo "=== E. RPC — QUEUE + SECURITY ==="
echo "-- Antrean (admin):"
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/list_verification_queue" -H "$AH1" -H "$AHA" -H "Content-Type: application/json" -d '{}' | head -c 400
echo ""
MYID=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?email=eq.adminkanum01@gmail.com&select=id" -H "$AH1" -H "$AHA" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{process.stdout.write(JSON.parse(d)[0].id)}catch(e){}})")
echo "-- Approve diri sendiri (harus 42501):"
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/set_verification_status" -H "$AH1" -H "$AHA" -H "Content-Type: application/json" -d "{\"p_user_id\":\"$MYID\",\"p_status\":\"approved\"}" -w " [%{http_code}]"
echo ""
echo "-- PATCH status langsung (harus 403):"
curl -s -X PATCH "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?id=eq.$MYID" -H "$AH1" -H "$AHA" -H "Content-Type: application/json" -d '{"status":"pending"}' -o /dev/null -w "[%{http_code}]"
echo ""
echo "-- admin_set_role invalid (harus 22023):"
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/admin_set_role" -H "$AH1" -H "$AHA" -H "Content-Type: application/json" -d "{\"p_user_id\":\"$MYID\",\"p_role\":\"superadmin\"}" -w " [%{http_code}]"
echo ""
echo "-- claim_signup_role dgn akun existing/admin (harus 'existing', bukan re-claim):"
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/claim_signup_role" -H "$AH1" -H "$AHA" -H "Content-Type: application/json" -d '{"p_role":"teacher"}'
echo ""
echo "-- claim_signup_role role invalid (harus 22023):"
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/claim_signup_role" -H "$AH1" -H "$AHA" -H "Content-Type: application/json" -d '{"p_role":"admin"}' -w " [%{http_code}]"
echo ""
echo "-- Status semua akun (sanity):"
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=email,role,status&order=created_at.desc&limit=8" -H "$AH1" -H "$AHA"
echo ""

# ============================================================
# F. SEED — PENGAJUAN SISWA E2E: buat akun via signup API →
#    cek masuk antrean verifikasi → hapus bersih (admin RPC).
#    Akun dibuang: email timestamped, tidak menyisakan data.
# ============================================================
echo ""
echo "=== F. SEED — PENGAJUAN SISWA (buat → antrean → hapus) ==="
SEED_EMAIL="e2e-seed-$(date +%s)@example.com"
SEED_PASS="e2e-seed-Passw0rd"
SEED_PAYLOAD=$(printf '{"email":"%s","password":"%s","data":{"full_name":"E2E Seed Siswa","role":"student","class_name":"E2E-X"}}' "$SEED_EMAIL" "$SEED_PASS")
SEED_RESP=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/signup" \
  -H "$AH1" -H "Content-Type: application/json" -d "$SEED_PAYLOAD")
SEED_ID=$(printf '%s' "$SEED_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);process.stdout.write(j.id||'')}catch(e){}})")
if [ -n "$SEED_ID" ]; then
  echo "SEED_CREATED:$SEED_ID ($SEED_EMAIL)"
else
  echo "SEED_SIGNUP_GAGAL:"
  printf '%s' "$SEED_RESP" | head -c 300; echo ""
  case "$SEED_RESP" in
    *"Error sending confirmation email"*)
      echo "SEED_DIAGNOSIS: SMTP gagal kirim email konfirmasi (Resend tidak terpakai lagi?)."
      echo "  Perbaiki salah satu di Supabase Dashboard:"
      echo "  1) Authentication -> Sign In/Providers -> matikan 'Confirm email', ATAU"
      echo "  2) Authentication -> SMTP -> pasang SMTP yang berfungsi."
      echo "  Sampai diperbaiki, pendaftaran email+sandi di /daftar GAGAL untuk user baru."
      ;;
  esac
fi

if [ -n "$SEED_ID" ]; then
  echo "-- Profil seed (harus pending / student / kelas E2E-X):"
  curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?id=eq.$SEED_ID&select=email,role,status,class_name" -H "$AH1" -H "$AHA"
  echo ""
  echo "-- Antrean verifikasi memuat seed (QUEUE_HIT harus 1):"
  QUEUE_HIT=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/list_verification_queue" \
    -H "$AH1" -H "$AHA" -H "Content-Type: application/json" -d '{}' | grep -c "$SEED_ID")
  echo "QUEUE_HIT:$QUEUE_HIT"
fi

echo "-- Cleanup hapus akun seed (admin_delete_account):"
if [ -n "$SEED_ID" ]; then
  curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/admin_delete_account" \
    -H "$AH1" -H "$AHA" -H "Content-Type: application/json" \
    -d "{\"p_user_id\":\"$SEED_ID\"}" -w " [%{http_code}]"
  echo ""
  echo "-- Sisa profil seed (harus []):"
  curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?id=eq.$SEED_ID&select=id" -H "$AH1" -H "$AHA"
  echo ""
else
  echo "SKIP (tidak ada akun seed yang dibuat)"
fi
echo ""
echo "E2E_DONE"
