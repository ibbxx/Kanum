/**
 * KANUM – Admin Dashboard Page Logic
 */
(function () {
  'use strict';

    (async () => {
      const profile = await requireAdmin();
      if (!profile) return;

      // Show admin name
      document.getElementById('admin-name').textContent = profile.full_name || 'Admin';
      document.getElementById('admin-avatar').textContent = (profile.full_name || 'A')[0].toUpperCase();
      const wrap = document.getElementById('admin-name-wrap');
      wrap.style.display = 'block';

      // Logout
      document.getElementById('btn-logout').addEventListener('click', async (e) => {
        e.preventDefault();
        await _sb.auth.signOut();
        window.location.href = '/login';
      });

      // Load stats
      const [exRes, pubRes, stuRes, attRes] = await Promise.all([
        _sb.from('exercises').select('id', { count: 'exact', head: true }),
        _sb.from('exercises').select('id', { count: 'exact', head: true }).eq('is_published', true),
        _sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        _sb.from('exercise_attempts').select('id', { count: 'exact', head: true }),
      ]);
      document.getElementById('stat-exercises').textContent = exRes.count ?? 0;
      document.getElementById('stat-published').textContent = pubRes.count ?? 0;
      document.getElementById('stat-students').textContent = stuRes.count ?? 0;
      document.getElementById('stat-attempts').textContent = attRes.count ?? 0;

      // Recent exercises
      const { data: exList } = await _sb.from('exercises')
        .select('id,title,category,is_published,created_at')
        .order('created_at', { ascending: false }).limit(5);
      const exEl = document.getElementById('recent-exercises');
      if (!exList || exList.length === 0) {
        exEl.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">edit_square</span>Belum ada latihan</div>';
      } else {
        exEl.innerHTML = exList.map(e => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 0;border-bottom:1px solid var(--etno-surface-high)">
        <div>
          <p style="font-weight:700;font-size:.875rem;color:var(--etno-text)">${e.title}</p>
          <p style="font-size:.75rem;color:var(--etno-muted)">${e.category}</p>
        </div>
        <span class="badge ${e.is_published ? 'badge-green' : 'badge-gray'}">${e.is_published ? 'Publik' : 'Draft'}</span>
      </div>`).join('');
      }

      // Top students
      const { data: progList } = await _sb
        .from('student_progress')
        .select('student_id, attempts_count, best_score, profiles(full_name, class_name)')
        .order('best_score', { ascending: false }).limit(5);
      const stuEl = document.getElementById('top-students');
      if (!progList || progList.length === 0) {
        stuEl.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">person</span>Belum ada aktivitas siswa</div>';
      } else {
        stuEl.innerHTML = progList.map((p, i) => `
      <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem 0;border-bottom:1px solid var(--etno-surface-high)">
        <div style="width:1.75rem;height:1.75rem;border-radius:50%;background:var(--etno-primary-container);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.75rem;font-weight:800;flex-shrink:0">${i + 1}</div>
        <div style="flex:1;min-width:0">
          <p style="font-weight:700;font-size:.875rem;color:var(--etno-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.profiles?.full_name || '–'}</p>
          <p style="font-size:.75rem;color:var(--etno-muted)">${p.profiles?.class_name || ''} · ${p.attempts_count} percobaan</p>
        </div>
        <span style="font-weight:800;font-size:.875rem;color:var(--etno-primary)">${Math.round(p.best_score)}</span>
      </div>`).join('');
      }
    })();

})();
