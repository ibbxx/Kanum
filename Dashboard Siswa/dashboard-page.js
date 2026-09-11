/**
 * KANUM – Dashboard Siswa Page Logic
 */
(function () {
  'use strict';

  // Micro-interactions
  document.querySelectorAll('a, button').forEach(function (el) {
    el.addEventListener('mousedown', function () { el.classList.add('scale-95'); });
    el.addEventListener('mouseup',   function () { el.classList.remove('scale-95'); });
    el.addEventListener('mouseleave',function () { el.classList.remove('scale-95'); });
  });

  // Hide Scrollbar utility
  var style = document.createElement('style');
  style.textContent =
    '.hide-scrollbar::-webkit-scrollbar{display:none}' +
    '.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}';
  document.head.append(style);

  document.addEventListener('DOMContentLoaded', async function () {
    var greetingH1  = document.querySelector('h1.font-headline-md');
    var storedName  = localStorage.getItem('etno_user_name') || 'Pengguna';
    if (greetingH1) greetingH1.textContent = 'Halo, ' + storedName + '! 👋';

    var session = await window.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }

    var result = await window._sb
      .from('profiles')
      .select('full_name, class_name')
      .eq('id', session.user.id)
      .single();

    var profile = result.data;
    if (profile) {
      localStorage.setItem('etno_user_name', profile.full_name || '');
      localStorage.setItem('etno_user_class', profile.class_name || '');
      var displayName = profile.full_name || 'Pengguna';
      if (greetingH1) greetingH1.textContent = 'Halo, ' + displayName + '! 👋';
    }

    var progResult = await window._sb
      .from('student_progress')
      .select('is_completed, best_score, attempts_count')
      .eq('student_id', session.user.id);

    if (progResult.error) {
      window.showToast('Gagal memuat statistik: ' + progResult.error.message, 'error');
      renderDashboardStats(null);
      return;
    }

    renderDashboardStats(progResult.data || []);
  });

  function renderDashboardStats(progresses) {
    var statCards = document.querySelectorAll('.bg-white.p-6.rounded-3xl.border');

    if (!progresses) {
      statCards.forEach(function (card) {
        var h3 = card.querySelector('h3');
        if (h3) h3.textContent = '–';
      });
      return;
    }

    var completed = progresses.filter(function (p) { return p.is_completed; }).length;
    var attempted = progresses.length;
    var avgScore  = attempted > 0
      ? Math.round(progresses.reduce(function (s, p) { return s + Number(p.best_score); }, 0) / attempted)
      : 0;

    if (statCards.length >= 3) {
      var pct  = attempted > 0 ? Math.min(Math.round((completed / Math.max(attempted, 1)) * 100), 100) : 0;
      var h3_0 = statCards[0].querySelector('h3');
      if (h3_0) h3_0.textContent = pct + '% Selesai';
      var bar0 = statCards[0].querySelector('.bg-primary.h-full');
      if (bar0) bar0.style.width = pct + '%';

      var h3_1 = statCards[1].querySelector('h3');
      if (h3_1) h3_1.textContent = attempted + ' Latihan';
      var sub1 = statCards[1].querySelectorAll('p');
      var lastSub1 = sub1[sub1.length - 1];
      if (lastSub1) {
        lastSub1.textContent = completed > 0
          ? completed + ' latihan selesai'
          : 'Belum ada latihan selesai';
      }

      var h3_2 = statCards[2].querySelector('h3');
      if (h3_2) h3_2.textContent = attempted > 0 ? avgScore + '/100' : '–';
      var sub2 = statCards[2].querySelectorAll('p');
      var lastSub2 = sub2[sub2.length - 1];
      if (lastSub2) {
        lastSub2.textContent = attempted > 0
          ? attempted + ' percobaan total'
          : 'Belum ada percobaan';
      }
    }
  }
})();
