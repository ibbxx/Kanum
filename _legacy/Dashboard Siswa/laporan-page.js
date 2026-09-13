/**
 * KANUM – Laporan Page Logic
 */
(function () {
  'use strict';

  (async function () {
    var session = await window.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }

    // Ambil ringkasan progress
    var progResult = await window._sb
      .from('student_progress')
      .select('exercise_id, best_score, is_completed, attempts_count, exercises(title)')
      .eq('student_id', session.user.id);

    if (progResult.error) {
      window.showToast('Gagal memuat data: ' + progResult.error.message, 'error');
      ['stat-progress', 'stat-avg-score', 'stat-completed'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.textContent = '–';
      });
    } else {
      var list      = progResult.data || [];
      var completed = list.filter(function (p) { return p.is_completed; }).length;
      var avgScore  = list.length > 0
        ? Math.round(list.reduce(function (s, p) { return s + Number(p.best_score); }, 0) / list.length)
        : 0;

      var elProgress  = document.getElementById('stat-progress');
      var elAvg       = document.getElementById('stat-avg-score');
      var elCompleted = document.getElementById('stat-completed');

      if (elProgress)  elProgress.textContent  = list.length + ' latihan';
      if (elAvg)       elAvg.textContent        = list.length > 0 ? String(avgScore) : '0';
      if (elCompleted) elCompleted.textContent  = completed + '/' + list.length;
    }

    // Ambil riwayat attempt terbaru
    var attResult = await window._sb
      .from('exercise_attempts')
      .select('id, score, correct_count, wrong_count, started_at, finished_at, exercises(title)')
      .eq('student_id', session.user.id)
      .order('started_at', { ascending: false })
      .limit(20);

    var activityEl = document.getElementById('activity-list');
    if (!activityEl) return;

    if (attResult.error) {
      activityEl.innerHTML = '<p class="text-sm text-error">Gagal memuat riwayat aktivitas.</p>';
      return;
    }

    var attempts = attResult.data || [];
    if (attempts.length === 0) {
      activityEl.innerHTML =
        '<p class="text-sm italic text-center py-6 text-on-surface-variant">' +
        'Belum ada aktivitas latihan. Silakan kunjungi menu Latihan!' +
        '</p>';
      return;
    }

    activityEl.innerHTML = attempts.map(function (a) {
      var date  = a.finished_at
        ? new Date(a.finished_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Belum selesai';
      var score       = a.score !== null ? Math.round(a.score) : '–';
      var title       = (a.exercises && a.exercises.title) ? a.exercises.title : 'Latihan';
      var status      = a.score !== null ? (a.score >= 70 ? 'Lulus' : 'Belum lulus') : 'In Progress';
      var statusColor = a.score !== null ? (a.score >= 70 ? 'text-green-600' : 'text-red-600') : 'text-on-surface-variant';
      var correct     = a.correct_count || 0;
      var wrong       = a.wrong_count   || 0;

      return '<div class="flex items-center justify-between gap-3 py-3 border-b border-outline-variant last:border-0">' +
        '<div class="min-w-0 flex-1">' +
          '<p class="font-semibold text-sm text-on-surface truncate">' + title + '</p>' +
          '<p class="text-xs text-on-surface-variant mt-0.5">' + date + ' · ' + correct + ' benar, ' + wrong + ' salah</p>' +
        '</div>' +
        '<div class="text-right flex-shrink-0">' +
          '<p class="font-bold text-lg text-primary">' + score + '</p>' +
          '<p class="text-xs ' + statusColor + ' font-medium">' + status + '</p>' +
        '</div>' +
        '</div>';
    }).join('');
  })();
})();
