/**
 * KANUM – Admin Latihan Page Logic
 */
(function () {
  'use strict';

    let allExercises = [];

    (async () => {
      const profile = await requireAdmin();
      if (!profile) return;
      document.getElementById('admin-avatar').textContent = (profile.full_name || 'A')[0].toUpperCase();
      document.getElementById('btn-logout').addEventListener('click', async (e) => {
        e.preventDefault();
        try { await _sb.auth.signOut(); } catch (err) { console.warn('KANUM logout error:', err); }
        window.location.href = '/login';
      });
      await loadExercises();
    })();

    async function loadExercises() {
      const { data, error } = await _sb
        .from('exercises')
        .select(`id, title, category, difficulty, is_published, time_limit, passing_score, description,
             questions(id)`)
        .order('created_at', { ascending: false });
      if (error) { showToast('Gagal memuat latihan: ' + error.message, 'error'); return; }
      allExercises = data || [];
      renderTable(allExercises);
    }

    function renderTable(list) {
      console.log('KANUM admin: latihan tersedia:', list.map(e => ({ id: e.id, title: e.title })));
      const tbody = document.getElementById('exercise-tbody');
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><span class="material-symbols-outlined">edit_square</span>Belum ada latihan. Klik "Tambah Latihan" untuk membuat.</div></td></tr>';
        return;
      }
      tbody.innerHTML = list.map(e => `
    <tr>
      <td><strong style="color:var(--etno-text)">${e.title}</strong><br/><span style="font-size:.75rem;color:var(--etno-muted)">${e.description ? e.description.substring(0, 60) + '...' : '–'}</span></td>
      <td><span class="badge badge-gray">${e.category || '–'}</span></td>
      <td style="text-align:center;font-weight:700">${e.questions?.length ?? 0}</td>
      <td><span class="badge ${diffBadge(e.difficulty)}">${e.difficulty}</span></td>
      <td><span class="badge ${e.is_published ? 'badge-green' : 'badge-yellow'}">${e.is_published ? 'Dipublikasikan' : 'Draft'}</span></td>
      <td>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap">
          <a href="/admin/soal?ex=${e.id}" class="btn-secondary btn-sm">
            <span class="material-symbols-outlined" style="font-size:1rem">quiz</span>Soal
          </a>
          <button class="btn-secondary btn-sm" onclick="openExerciseModal('${e.id}')">
            <span class="material-symbols-outlined" style="font-size:1rem">edit</span>
          </button>
          <button class="btn-danger btn-sm" onclick="openDeleteModal('${e.id}')">
            <span class="material-symbols-outlined" style="font-size:1rem">delete</span>
          </button>
          <button class="btn-${e.is_published ? 'secondary' : 'primary'} btn-sm" onclick="togglePublish('${e.id}', ${e.is_published})">
            <span class="material-symbols-outlined" style="font-size:1rem">${e.is_published ? 'unpublished' : 'publish'}</span>${e.is_published ? 'Nonaktif' : 'Publish'}
          </button>
        </div>
      </td>
    </tr>`).join('');
    }

    function diffBadge(d) {
      return d === 'Mudah' ? 'badge-green' : d === 'Sulit' ? 'badge-red' : 'badge-yellow';
    }

    function filterExercises(q) {
      const query = (document.getElementById('search-ex').value || '').toLowerCase();
      const status = document.getElementById('filter-status').value;
      const filtered = allExercises.filter(e => {
        const matchQ = !query || e.title.toLowerCase().includes(query) || (e.category || '').toLowerCase().includes(query);
        const matchS = status === '' || String(e.is_published) === status;
        return matchQ && matchS;
      });
      renderTable(filtered);
    }

    function openExerciseModal(id) {
      const ex = id ? allExercises.find(e => e.id === id) : null;
      document.getElementById('modal-ex-title').textContent = ex ? 'Edit Latihan' : 'Tambah Latihan';
      document.getElementById('ex-id').value = ex?.id || '';
      document.getElementById('ex-title').value = ex?.title || '';
      document.getElementById('ex-desc').value = ex?.description || '';
      document.getElementById('ex-category').value = ex?.category || '';
      document.getElementById('ex-difficulty').value = ex?.difficulty || 'Sedang';
      document.getElementById('ex-time').value = ex?.time_limit ?? 30;
      document.getElementById('ex-pass').value = ex?.passing_score ?? 70;
      document.getElementById('ex-status').value = ex ? String(ex.is_published) : 'false';
      document.getElementById('modal-exercise').style.display = 'flex';
    }

    async function saveExercise() {
      const id = document.getElementById('ex-id').value;
      const title = document.getElementById('ex-title').value.trim();
      if (!title) { showToast('Judul wajib diisi', 'error'); return; }

      const payload = {
        title,
        description: document.getElementById('ex-desc').value.trim(),
        category: document.getElementById('ex-category').value.trim() || 'Umum',
        difficulty: document.getElementById('ex-difficulty').value,
        time_limit: parseInt(document.getElementById('ex-time').value) || 0,
        passing_score: parseInt(document.getElementById('ex-pass').value) || 70,
        is_published: document.getElementById('ex-status').value === 'true',
      };

      let error;
      if (id) {
        ({ error } = await _sb.from('exercises').update(payload).eq('id', id));
      } else {
        const session = await getSession();
        payload.created_by = session.user.id;
        ({ error } = await _sb.from('exercises').insert(payload));
      }
      if (error) { showToast('Gagal menyimpan: ' + error.message, 'error'); return; }
      showToast(id ? 'Latihan berhasil diperbarui' : 'Latihan berhasil ditambahkan');
      closeModal('modal-exercise');
      await loadExercises();
    }

    function openDeleteModal(id) {
      document.getElementById('delete-ex-id').value = id;
      document.getElementById('modal-delete').style.display = 'flex';
    }

    async function confirmDelete() {
      const id = document.getElementById('delete-ex-id').value;
      const { error } = await _sb.from('exercises').delete().eq('id', id);
      if (error) { showToast('Gagal menghapus: ' + error.message, 'error'); return; }
      showToast('Latihan berhasil dihapus');
      closeModal('modal-delete');
      await loadExercises();
    }

    async function togglePublish(id, current) {
      const { error } = await _sb.from('exercises').update({ is_published: !current }).eq('id', id);
      if (error) { showToast('Gagal memperbarui status: ' + error.message, 'error'); return; }
      showToast(!current ? 'Latihan dipublikasikan' : 'Latihan dinonaktifkan');
      await loadExercises();
    }

    function closeModal(id) {
      document.getElementById(id).style.display = 'none';
    }

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
    });

})();
