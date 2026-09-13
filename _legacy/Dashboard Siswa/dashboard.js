(function () {
  const pages = [
    {
      key: "Dashboard",
      href: "/dashboard",
      aliases: ["dashboard", "dashboard.html"],
      icon: "dashboard"
    },
    {
      key: "Materi",
      href: "/materi",
      aliases: ["materi", "materi.html"],
      icon: "menu_book"
    },
    {
      key: "Budaya",
      href: "/budaya",
      aliases: ["budaya", "budaya.html"],
      icon: "museum"
    },
    {
      key: "Latihan",
      href: "/latihan",
      aliases: [
        "latihan",
        "latihan.html",
        "latihan-supabase",
        "latihan-supabase.html"
      ],
      icon: "fitness_center"
    },
    {
      key: "Laporan",
      href: "/laporan",
      aliases: ["laporan", "laporan.html"],
      icon: "analytics"
    },
    {
      key: "Pengaturan",
      href: "/pengaturan",
      aliases: ["pengaturan", "pengaturan.html"],
      icon: "settings"
    }
  ];

  /*
   * ============================================================
   * MENENTUKAN HALAMAN AKTIF
   * ============================================================
   */

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\\/g, "/")
      .split("/")
      .pop()
      .replace(/\.html$/i, "");
  }

  function getCurrentPage() {
    const pathname = decodeURIComponent(location.pathname || "");

    // Ambil nama terakhir dari URL.
    // Contoh:
    // /Dashboard%20Siswa/Latihan
    // menjadi:
    // Latihan
    const rawFile =
      pathname.split("/").filter(Boolean).pop() || "Dashboard";

    const currentName = normalize(rawFile);

    /*
     * Cocokkan halaman utama.
     */
    for (const page of pages) {
      const aliases = page.aliases.map(normalize);

      if (
        aliases.includes(currentName) ||
        normalize(page.href) === currentName
      ) {
        return page;
      }
    }

    /*
     * ========================================================
     * DETAIL PAGE → MODUL INDUK
     * ========================================================
     */

    if (
      currentName.startsWith("materi-detail") ||
      currentName.startsWith("materi_") ||
      currentName === "materidetail"
    ) {
      return pages.find((page) => page.key === "Materi");
    }

    if (
      currentName.startsWith("budaya-detail") ||
      currentName.startsWith("budaya_") ||
      currentName === "budayadetail"
    ) {
      return pages.find((page) => page.key === "Budaya");
    }

    if (
      currentName.startsWith("latihan-detail") ||
      currentName.startsWith("latihan_") ||
      currentName === "latihandetail" ||
      currentName === "latihan-supabase"
    ) {
      return pages.find((page) => page.key === "Latihan");
    }

    /*
     * ========================================================
     * JIKA MASIH TIDAK TERDETEKSI
     * ========================================================
     *
     * Jangan langsung menganggap Dashboard.
     * Coba cek path lengkap.
     */

    const fullPath = pathname.toLowerCase();

    if (fullPath.includes("/materi")) {
      return pages.find((page) => page.key === "Materi");
    }

    if (fullPath.includes("/budaya")) {
      return pages.find((page) => page.key === "Budaya");
    }

    if (fullPath.includes("/latihan")) {
      return pages.find((page) => page.key === "Latihan");
    }

    if (fullPath.includes("/laporan")) {
      return pages.find((page) => page.key === "Laporan");
    }

    if (fullPath.includes("/pengaturan")) {
      return pages.find((page) => page.key === "Pengaturan");
    }

    if (fullPath.includes("/dashboard")) {
      return pages.find((page) => page.key === "Dashboard");
    }

    /*
     * Fallback terakhir.
     */
    return pages.find((page) => page.key === "Dashboard");
  }

  const current = getCurrentPage();

  /*
   * ============================================================
   * AVATAR
   * ============================================================
   */

  const avatar =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA-fUR2eos4NrSCnw2CQ50t8iwgtcVRqdI8xp5oYKn6nTSfV2p2u8oOD75ElH4JRwKlW3Lmm0X52nFUzOvcIetq_vejV0umsoEpDD72Sl6H_hEiwvCF-VqWt1mQB9c7Cpt_lAZ2B4AwMjreUMhtWkjjXl_47QDl449znaYpskm98F5P7FZM-O_3U-TBOGVjROLyx2UsUREW387-dw5L7PWjtiL2ZNR1zA4iJcsZeRJ5kVuhejLvcBSz3Q0L-PtqYLnBavlcHLFXhWf_";

  /*
   * ============================================================
   * DATA USER
   * ============================================================
   */

  const storedName =
    localStorage.getItem("etno_user_name") || "Pengguna";

  const storedRole =
    localStorage.getItem("etno_user_class") || "";

  /*
   * ============================================================
   * URL NAVIGASI
   * ============================================================
   *
   * Aplikasi Anda menggunakan URL tanpa .html.
   *
   * Contoh:
   * /Dashboard Siswa/Latihan
   *
   * Karena itu href dibuat mengikuti pola tersebut.
   */

  function getPageHref(page) {
    return page.href;
  }

  /*
   * ============================================================
   * NAV LINK
   * ============================================================
   */

  function navLink(page, compact) {
    const active = page.key === current.key;
    const activeClass = active ? " is-active" : "";

    const href = getPageHref(page);

    if (compact) {
      return `
        <a
          class="app-bottom-link${activeClass}"
          href="${href}"
          aria-current="${active ? "page" : "false"}"
        >
          <span class="material-symbols-outlined">${page.icon}</span>
          <span>${page.key}</span>
        </a>
      `;
    }

    return `
      <a
        class="app-nav-link${activeClass}"
        href="${href}"
        aria-current="${active ? "page" : "false"}"
      >
        <span class="material-symbols-outlined">${page.icon}</span>
        <span>${page.key}</span>
      </a>
    `;
  }

  /*
   * ============================================================
   * BUILD SHELL
   * ============================================================
   */

  function buildShell() {
    document.body.classList.add("dashboard-app");

    /*
     * ========================================================
     * HAPUS NAVBAR / HEADER LAMA
     * ========================================================
     *
     * PENTING:
     *
     * Jangan hapus:
     * <aside class="quiz-side-panel">
     *
     * Karena elemen tersebut merupakan PANEL KIRI
     * halaman latihan siswa.
     *
     * Sebelumnya kode:
     *
     * querySelectorAll("aside, header, nav.fixed.bottom-0")
     *
     * menghapus SEMUA aside, termasuk quiz-side-panel.
     *
     * Sekarang:
     *
     * aside:not(.quiz-side-panel)
     *
     * sehingga quiz-side-panel tetap dipertahankan.
     */

    document
      .querySelectorAll(
        "aside:not(.quiz-side-panel), header, nav.fixed.bottom-0"
      )
      .forEach((node) => node.remove());

    /*
     * Main content.
     */
    const main = document.querySelector("main");

    if (main) {
      main.classList.add("app-page-main");
    }

    /*
     * ========================================================
     * SIDEBAR + TOPBAR
     * ========================================================
     */

    document.body.insertAdjacentHTML(
      "afterbegin",
      `
      <aside class="app-sidebar">
        <div class="app-sidebar-inner">

          <div class="app-brand">
            <span class="app-brand-title">KANUM</span>
            <p class="app-brand-subtitle">
              Kajang Numerasi
            </p>
          </div>

          <nav
            class="app-nav"
            aria-label="Navigasi dashboard"
          >
            ${pages.map((page) => navLink(page, false)).join("")}
          </nav>

          <button
            type="button"
            class="app-nav-link is-logout"
            onclick="handleLogout(event)"
          >
            <span class="material-symbols-outlined">
              logout
            </span>

            <span>Logout</span>
          </button>

        </div>
      </aside>

      <header class="app-topbar">

        <div class="app-topbar-inner">

          <!--
            JUDUL SEKARANG DINAMIS
            berdasarkan modul yang sedang aktif.
          -->
          <div class="app-page-title">
            ${current.key}
          </div>

          <div class="app-search">

            <span class="material-symbols-outlined">
              search
            </span>

            <input
              type="text"
              placeholder="Cari materi, budaya, atau latihan..."
              aria-label="Cari"
            />

          </div>

          <div class="app-actions">

            <button
              class="app-icon-button"
              type="button"
              aria-label="Notifikasi"
              onclick="window.location.href='Laporan'"
            >
              <span class="material-symbols-outlined">
                notifications
              </span>

              <span class="app-dot"></span>
            </button>

            <button
              class="app-icon-button"
              type="button"
              aria-label="Pengaturan"
              onclick="window.location.href='Pengaturan'"
            >
              <span class="material-symbols-outlined">
                settings
              </span>
            </button>

            <div class="app-profile">

              <div class="app-profile-text">

                <p class="app-profile-name">
                  ${storedName}
                </p>

                <p class="app-profile-role">
                  ${storedRole}
                </p>

              </div>

              <img
                class="app-avatar"
                alt="Profil ${storedName}"
                src="${avatar}"
              />

            </div>

          </div>

        </div>

      </header>

      <!-- MOBILE NAV -->

      <nav
        class="app-bottom-nav"
        aria-label="Navigasi dashboard mobile"
      >
        ${pages.map((page) => navLink(page, true)).join("")}
      </nav>
      `
    );
  }

  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  function handleLogout(event) {
    if (event) event.preventDefault();
    (async () => {
      try {
        if (window._sb && typeof window._sb.auth?.signOut === 'function') {
          await window._sb.auth.signOut();
        }
      } catch (err) {
        console.warn('KANUM logout error:', err);
      }
      window.location.href = '/login';
    })();
  }
  // Expose globally agar onclick="" bisa memanggil
  window.handleLogout = handleLogout;

  /*
   * ============================================================
   * INIT
   * ============================================================
   */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      buildShell
    );
  } else {
    buildShell();
  }
})();