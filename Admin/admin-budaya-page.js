/**
 * KANUM – Admin Budaya Page Logic
 */
(function () {
  'use strict';

    let allBudaya = [];

    (async () => {
      const profile = await requireAdmin();
      if (!profile) return;
      document.getElementById('admin-avatar').textContent = (profile.full_name || 'A')[0].toUpperCase();
      document.getElementById('btn-logout').addEventListener('click', async (e) => {
        e.preventDefault();
        try { await _sb.auth.signOut(); } catch (err) { console.warn('KANUM logout:', err); }
        window.location.href = '/login';
      });
      await loadBudaya();
    })();

    async function loadBudaya() {
      const { data, error } = await _sb
        .from('budaya')
        .select('id, title, topic_key, category, description, image_url, content_html, is_published, sort_order')
        .order('sort_order', { ascending: true });
      if (error) { showToast('Gagal memuat budaya: ' + error.message, 'error'); return; }
      allBudaya = data || [];
      renderBudayaTable(allBudaya);
    }

    function renderBudayaTable(list) {
      const tbody = document.getElementById('budaya-tbody');
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><span class="material-symbols-outlined">museum</span>Belum ada konten budaya. Klik "Tambah Budaya" untuk membuat.</div></td></tr>';
        return;
      }
      tbody.innerHTML = list.map(b => `
        <tr>
          <td><strong style="color:var(--etno-text)">${b.title}</strong><br/><span style="font-size:.75rem;color:var(--etno-muted)">${b.description ? b.description.substring(0, 60) + '...' : '–'}</span></td>
          <td><code style="font-size:.75rem;background:var(--etno-surface-high);padding:.2rem .4rem;border-radius:.3rem">${b.topic_key}</code></td>
          <td><span class="badge badge-gray">${b.category || '–'}</span></td>
          <td><span class="badge ${b.is_published ? 'badge-green' : 'badge-yellow'}">${b.is_published ? 'Dipublikasikan' : 'Draft'}</span></td>
          <td>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
              <button class="btn-secondary btn-sm" onclick="openBudayaModal('${b.id}')"><span class="material-symbols-outlined" style="font-size:1rem">edit</span></button>
              <button class="btn-danger btn-sm" onclick="openDeleteBudayaModal('${b.id}')"><span class="material-symbols-outlined" style="font-size:1rem">delete</span></button>
              <button class="btn-${b.is_published ? 'secondary' : 'primary'} btn-sm" onclick="togglePublishBudaya('${b.id}', ${b.is_published})">
                <span class="material-symbols-outlined" style="font-size:1rem">${b.is_published ? 'unpublished' : 'publish'}</span>${b.is_published ? 'Nonaktif' : 'Publish'}
              </button>
            </div>
          </td>
        </tr>`).join('');
    }

    function filterBudaya() {
      const q      = (document.getElementById('search-budaya').value || '').toLowerCase();
      const status = document.getElementById('filter-status-budaya').value;
      renderBudayaTable(allBudaya.filter(b => {
        const matchQ = !q || b.title.toLowerCase().includes(q) || (b.topic_key || '').toLowerCase().includes(q);
        const matchS = status === '' || String(b.is_published) === status;
        return matchQ && matchS;
      }));
    }

    function openBudayaModal(id) {
      const b = id ? allBudaya.find(x => x.id === id) : null;
      document.getElementById('modal-budaya-title').textContent  = b ? 'Edit Konten Budaya' : 'Tambah Konten Budaya';
      document.getElementById('budaya-id').value                 = b?.id || '';
      document.getElementById('budaya-title').value              = b?.title || '';
      document.getElementById('budaya-topic-key').value          = b?.topic_key || '';
      document.getElementById('budaya-category').value           = b?.category || '';
      document.getElementById('budaya-desc').value               = b?.description || '';
      document.getElementById('budaya-image').value              = b?.image_url || '';
      document.getElementById('budaya-sort').value               = b?.sort_order ?? 0;
      document.getElementById('budaya-content').value            = b?.content_html || '';
      document.getElementById('budaya-status').value             = b ? String(b.is_published) : 'false';
      document.getElementById('modal-budaya').style.display      = 'flex';
    }

    async function saveBudaya() {
      const id        = document.getElementById('budaya-id').value;
      const title     = document.getElementById('budaya-title').value.trim();
      const topic_key = document.getElementById('budaya-topic-key').value.trim().toLowerCase().replace(/\s+/g, '-');
      if (!title)     { showToast('Judul wajib diisi', 'error'); return; }
      if (!topic_key) { showToast('Topic Key wajib diisi', 'error'); return; }

      const session = await getSession();
      const payload = {
        title,
        topic_key,
        category:     document.getElementById('budaya-category').value.trim() || 'Umum',
        description:  document.getElementById('budaya-desc').value.trim(),
        image_url:    document.getElementById('budaya-image').value.trim() || null,
        sort_order:   parseInt(document.getElementById('budaya-sort').value) || 0,
        content_html: document.getElementById('budaya-content').value.trim(),
        is_published: document.getElementById('budaya-status').value === 'true',
      };

      let error;
      if (id) {
        ({ error } = await _sb.from('budaya').update(payload).eq('id', id));
      } else {
        payload.created_by = session?.user?.id || null;
        ({ error } = await _sb.from('budaya').insert(payload));
      }

      if (error) { showToast('Gagal menyimpan: ' + error.message, 'error'); return; }
      showToast(id ? 'Konten berhasil diperbarui' : 'Konten berhasil ditambahkan');
      closeModal('modal-budaya');
      await loadBudaya();
    }

    function openDeleteBudayaModal(id) {
      document.getElementById('delete-budaya-id').value = id;
      document.getElementById('modal-delete-budaya').style.display = 'flex';
    }

    async function confirmDeleteBudaya() {
      const id = document.getElementById('delete-budaya-id').value;
      const { error } = await _sb.from('budaya').delete().eq('id', id);
      if (error) { showToast('Gagal menghapus: ' + error.message, 'error'); return; }
      showToast('Konten budaya berhasil dihapus');
      closeModal('modal-delete-budaya');
      await loadBudaya();
    }

    async function togglePublishBudaya(id, current) {
      const { error } = await _sb.from('budaya').update({ is_published: !current }).eq('id', id);
      if (error) { showToast('Gagal memperbarui status: ' + error.message, 'error'); return; }
      showToast(!current ? 'Konten dipublikasikan' : 'Konten dinonaktifkan');
      await loadBudaya();
    }

    function closeModal(id) {
      document.getElementById(id).style.display = 'none';
    }

    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
    });

})();
