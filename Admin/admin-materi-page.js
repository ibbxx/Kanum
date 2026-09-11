/**
 * KANUM – Admin Materi Page Logic
 */
(function () {
  'use strict';

    let allMateri = [];

    (async () => {
      const profile = await requireAdmin();
      if (!profile) return;
      document.getElementById('admin-avatar').textContent = (profile.full_name || 'A')[0].toUpperCase();
      document.getElementById('btn-logout').addEventListener('click', async (e) => {
        e.preventDefault();
        try { await _sb.auth.signOut(); } catch (err) { console.warn('KANUM logout:', err); }
        window.location.href = '/login';
      });
      await loadMateri();
    })();

    async function loadMateri() {
      const { data, error } = await _sb
        .from('materi')
        .select('id, title, chapter_number, level, description, duration_minutes, image_url, content_html, is_published, sort_order')
        .order('sort_order', { ascending: true });
      if (error) { showToast('Gagal memuat materi: ' + error.message, 'error'); return; }
      allMateri = data || [];
      renderMateriTable(allMateri);
    }

    function renderMateriTable(list) {
      const tbody = document.getElementById('materi-tbody');
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><span class="material-symbols-outlined">menu_book</span>Belum ada materi. Klik "Tambah Materi" untuk membuat.</div></td></tr>';
        return;
      }
      tbody.innerHTML = list.map(m => `
        <tr>
          <td style="font-weight:700;text-align:center">${m.chapter_number || '–'}</td>
          <td><strong style="color:var(--etno-text)">${m.title}</strong><br/><span style="font-size:.75rem;color:var(--etno-muted)">${m.description ? m.description.substring(0, 60) + '...' : '–'}</span></td>
          <td><span class="badge ${levelBadge(m.level)}">${m.level || '–'}</span></td>
          <td style="text-align:center">${m.duration_minutes || '–'} min</td>
          <td><span class="badge ${m.is_published ? 'badge-green' : 'badge-yellow'}">${m.is_published ? 'Dipublikasikan' : 'Draft'}</span></td>
          <td>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
              <button class="btn-secondary btn-sm" onclick="openMateriModal('${m.id}')"><span class="material-symbols-outlined" style="font-size:1rem">edit</span></button>
              <button class="btn-danger btn-sm" onclick="openDeleteMateriModal('${m.id}')"><span class="material-symbols-outlined" style="font-size:1rem">delete</span></button>
              <button class="btn-${m.is_published ? 'secondary' : 'primary'} btn-sm" onclick="togglePublishMateri('${m.id}', ${m.is_published})">
                <span class="material-symbols-outlined" style="font-size:1rem">${m.is_published ? 'unpublished' : 'publish'}</span>${m.is_published ? 'Nonaktif' : 'Publish'}
              </button>
            </div>
          </td>
        </tr>`).join('');
    }

    function levelBadge(l) {
      return l === 'dasar' ? 'badge-green' : l === 'lanjut' ? 'badge-red' : 'badge-yellow';
    }

    function filterMateri() {
      const q      = (document.getElementById('search-materi').value || '').toLowerCase();
      const level  = document.getElementById('filter-level').value;
      const status = document.getElementById('filter-status-materi').value;
      renderMateriTable(allMateri.filter(m => {
        const matchQ = !q || m.title.toLowerCase().includes(q);
        const matchL = !level  || m.level === level;
        const matchS = status === '' || String(m.is_published) === status;
        return matchQ && matchL && matchS;
      }));
    }

    function openMateriModal(id) {
      const m = id ? allMateri.find(x => x.id === id) : null;
      document.getElementById('modal-materi-title').textContent = m ? 'Edit Materi' : 'Tambah Materi';
      document.getElementById('materi-id').value           = m?.id || '';
      document.getElementById('materi-chapter').value      = m?.chapter_number ?? 1;
      document.getElementById('materi-level').value        = m?.level || 'dasar';
      document.getElementById('materi-title').value        = m?.title || '';
      document.getElementById('materi-desc').value         = m?.description || '';
      document.getElementById('materi-duration').value     = m?.duration_minutes ?? 30;
      document.getElementById('materi-sort').value         = m?.sort_order ?? 0;
      document.getElementById('materi-image').value        = m?.image_url || '';
      document.getElementById('materi-content').value      = m?.content_html || '';
      document.getElementById('materi-status').value       = m ? String(m.is_published) : 'false';
      document.getElementById('modal-materi').style.display = 'flex';
    }

    async function saveMateri() {
      const id    = document.getElementById('materi-id').value;
      const title = document.getElementById('materi-title').value.trim();
      if (!title) { showToast('Judul wajib diisi', 'error'); return; }

      const session = await getSession();
      const payload = {
        title,
        chapter_number:   parseInt(document.getElementById('materi-chapter').value) || 0,
        level:            document.getElementById('materi-level').value,
        description:      document.getElementById('materi-desc').value.trim(),
        duration_minutes: parseInt(document.getElementById('materi-duration').value) || 30,
        sort_order:       parseInt(document.getElementById('materi-sort').value) || 0,
        image_url:        document.getElementById('materi-image').value.trim() || null,
        content_html:     document.getElementById('materi-content').value.trim(),
        is_published:     document.getElementById('materi-status').value === 'true',
      };

      let error;
      if (id) {
        ({ error } = await _sb.from('materi').update(payload).eq('id', id));
      } else {
        payload.created_by = session?.user?.id || null;
        ({ error } = await _sb.from('materi').insert(payload));
      }

      if (error) { showToast('Gagal menyimpan: ' + error.message, 'error'); return; }
      showToast(id ? 'Materi berhasil diperbarui' : 'Materi berhasil ditambahkan');
      closeModal('modal-materi');
      await loadMateri();
    }

    function openDeleteMateriModal(id) {
      document.getElementById('delete-materi-id').value = id;
      document.getElementById('modal-delete-materi').style.display = 'flex';
    }

    async function confirmDeleteMateri() {
      const id = document.getElementById('delete-materi-id').value;
      const { error } = await _sb.from('materi').delete().eq('id', id);
      if (error) { showToast('Gagal menghapus: ' + error.message, 'error'); return; }
      showToast('Materi berhasil dihapus');
      closeModal('modal-delete-materi');
      await loadMateri();
    }

    async function togglePublishMateri(id, current) {
      const { error } = await _sb.from('materi').update({ is_published: !current }).eq('id', id);
      if (error) { showToast('Gagal memperbarui status: ' + error.message, 'error'); return; }
      showToast(!current ? 'Materi dipublikasikan' : 'Materi dinonaktifkan');
      await loadMateri();
    }

    function closeModal(id) {
      document.getElementById(id).style.display = 'none';
    }

    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
    });

})();
