/**
 * KANUM – Materi Page Logic
 */
(function () {
  'use strict';

  // ── Filter & Search ──────────────────────────────────────────────────────
  function filterBab(level) {
    document.querySelectorAll('.filter-btn').forEach(function (b) {
      b.classList.remove('bg-primary', 'text-on-primary');
      b.classList.add('bg-surface-container', 'border', 'border-outline-variant', 'text-on-surface-variant');
    });
    var active = document.getElementById('filter-' + level);
    if (active) {
      active.classList.add('bg-primary', 'text-on-primary');
      active.classList.remove('bg-surface-container', 'border', 'border-outline-variant', 'text-on-surface-variant');
    }
    document.querySelectorAll('#babGrid article').forEach(function (card) {
      card.style.display = (level === 'semua' || card.dataset.level === level) ? '' : 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = searchInput.value.toLowerCase();
        document.querySelectorAll('#babGrid article').forEach(function (card) {
          card.style.display = (card.dataset.title || '').toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }

    // Lazy-load materi dari Supabase; fallback ke konten hardcoded jika tabel kosong
    loadMateriFromSupabase();
  });

  async function loadMateriFromSupabase() {
    var session = await window.getSession();
    if (!session) return;

    var result = await window._sb
      .from('materi')
      .select('id, title, chapter_number, level, description, duration_minutes, image_url, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (result.error || !result.data || result.data.length === 0) {
      console.info('KANUM: menggunakan konten materi hardcoded (tabel kosong atau error)');
      return;
    }

    var babGrid = document.getElementById('babGrid');
    if (!babGrid) return;

    var levelBadge = {
      'dasar':    'bg-primary-fixed text-primary',
      'menengah': 'bg-secondary-container text-on-secondary-container',
      'lanjut':   'bg-tertiary-container text-on-tertiary-container'
    };
    var levelLabel = { 'dasar': 'DASAR', 'menengah': 'MENENGAH', 'lanjut': 'LANJUT' };

    babGrid.innerHTML = result.data.map(function (m) {
      var imgSrc     = m.image_url || '../Asset/Images/gambarmateri.png';
      var badge      = levelBadge[m.level] || levelBadge['dasar'];
      var label      = levelLabel[m.level]  || (m.level || '').toUpperCase() || 'DASAR';
      var dur        = m.duration_minutes ? m.duration_minutes + ' menit' : '–';
      var chapLabel  = m.chapter_number > 0 ? 'Bab ' + m.chapter_number : 'Materi';
      var titleSafe  = (m.title || '').replace(/"/g, '&quot;');

      return '<article' +
        ' class="bab-card group bg-surface rounded-2xl overflow-hidden border border-outline-variant hover:shadow-xl flex flex-col justify-between"' +
        ' data-level="' + (m.level || 'dasar') + '"' +
        ' data-title="' + titleSafe + '">' +
        '<div>' +
          '<div class="h-44 relative overflow-hidden bg-primary-container">' +
            '<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"' +
              ' src="' + imgSrc + '" alt="' + titleSafe + '" loading="lazy"' +
              ' onerror="this.src=\'../Asset/Images/gambarmateri.png\'"/>' +
            '<div class="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent"></div>' +
            '<div class="absolute top-3 left-3"><span class="bg-surface/90 text-primary text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">' + chapLabel + '</span></div>' +
            '<div class="absolute top-3 right-3"><span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ' + badge + '">' + label + '</span></div>' +
          '</div>' +
          '<div class="p-5">' +
            '<h3 class="font-display font-bold text-primary text-base mb-1.5">' + (m.title || '–') + '</h3>' +
            '<p class="text-xs text-on-surface-variant leading-relaxed">' + (m.description || '') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="p-5 pt-0">' +
          '<div class="pt-3 border-t border-outline-variant/40 flex items-center justify-between">' +
            '<div class="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">' +
              '<span class="material-symbols-outlined text-sm text-primary">schedule</span><span>' + dur + '</span>' +
            '</div>' +
            '<a href="/materi/' + m.id + '" class="inline-flex items-center gap-1.5 bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary-container active:scale-95 transition-all shadow-sm">' +
              'Mulai Belajar<span class="material-symbols-outlined text-sm">arrow_forward</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
        '</article>';
    }).join('');

    window._materiData = result.data;
  }

  window.filterBab = filterBab;
})();
