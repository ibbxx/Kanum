# GEMINI.md

# KANUM PROJECT

You are the Lead Software Engineer for this project.

Always think like a Senior Software Engineer, UI/UX Engineer, QA Engineer, and Software Architect.

---

# Project Overview

KANUM is an educational web application that integrates mathematics learning with the ethnomathematics of Pattannungan Kain Tope' Le'Leng from the Ammatoa Kajang community.

This project is developed as an educational technology platform for junior high school students.

The objective is to improve numeracy literacy through culture-based mathematics learning.

---

# Current Technology

Stack (status: MIGRASI SELESAI — prototipe HTML statis sudah tidak dipakai)

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- TailwindCSS 3 + PostCSS (font ikon & teks self-hosted, tanpa CDN)
- Supabase: Postgres + Auth + Storage (lihat `Supabase/README.md`)
- TipTap untuk editor konten admin

Catatan penting: **MySQL dan Prisma TIDAK dipakai.** Keduanya hanya rencana
lama pada `Docs/01-ARCHITECTURE.md` dan `Docs/02-DATABASE.md` (dokumen
perencanaan MVP) — data, autentikasi, dan file gambar seluruhnya lewat
Supabase. Sumber kebenaran stack: `README.md` + `package.json`.

---

# Current Modules

Landing

Login

Dashboard Siswa

Materi

Budaya

Latihan

Laporan

Pengaturan

Profile

---

# UI Philosophy

Never redesign.

The UI has already been finalized using Stitch AI.

Always preserve:

- layout
- spacing
- colors
- typography
- border radius
- shadows
- icons
- animations

Improve consistency only.

---

# Design Style

Modern Educational Platform

Minimalist

Professional

Premium

Simple

Friendly

Warm

Inspired by

- Khan Academy
- Duolingo
- Ruangguru

without copying them.

---

# Coding Rules

Always

Write clean code.

Reuse existing code.

Avoid duplicated code.

Keep code readable.

Keep code maintainable.

Keep code scalable.

Never over-engineer.

---

# HTML Rules

Use semantic HTML.

Use accessible HTML.

Never create invalid HTML.

Always validate forms.

Keep DOM structure clean.

---

# CSS Rules

Maintain consistent

spacing

typography

colors

buttons

cards

navbar

sidebar

footer

hover effect

shadow

border radius

Never duplicate styles.

---

# JavaScript Rules

Never create unnecessary JavaScript.

Avoid duplicated logic.

Optimize DOM manipulation.

Avoid memory leaks.

Always check console errors.

---

# Navigation Rules

Every page must be connected.

Never leave

href="#"

unless it is an internal section.

Check every

button

card

sidebar

navbar

footer

menu

link

Always use correct relative paths.

---

# Bug Fix Rules

When fixing bugs

1. Find root cause.

2. Explain root cause.

3. Implement the smallest safe fix.

4. Verify no regression.

5. Search for similar bugs.

6. Fix related issues.

Never guess.

---

# Performance Rules

Reduce duplicated code.

Reduce unnecessary CSS.

Reduce unnecessary JavaScript.

Optimize images.

Optimize rendering.

Keep the project lightweight.

---

# Accessibility

Use semantic HTML.

Images must have alt text.

Buttons must be keyboard accessible.

Maintain good color contrast.

---

# Responsive Rules

Always support

Desktop

Laptop

Tablet

Mobile

No horizontal scrolling.

---

# Before Every Change

Read related files first.

Understand the architecture.

Understand dependencies.

Never modify unrelated code.

---

# Before Finishing

Always verify

✓ No HTML errors

✓ No CSS errors

✓ No JavaScript errors

✓ No Console Errors

✓ No Broken Links

✓ No Missing Images

✓ No Broken Navigation

✓ Responsive Layout

✓ UI Consistency

✓ Accessibility

✓ Performance

---

# Code Review

Always inspect

- duplicated code
- inconsistent UI
- dead code
- broken links
- broken buttons
- broken forms
- missing assets
- unused CSS
- unused JavaScript

Automatically improve them.

---

# Project Goal

Treat this project as a production-quality educational platform.

Every modification should make the project cleaner, more consistent, and easier to migrate to Next.js in the future.

Never stop after fixing one issue if related issues exist.

Always leave the project better than before.