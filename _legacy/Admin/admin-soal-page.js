/**
 * KANUM – Admin Soal Page Logic
 */
(function () {
  'use strict';

    const params = new URLSearchParams(location.search);
    let exerciseId = params.get('ex') || '';
    let allExercises = [];
    let allQuestions = [];
    let optionCount = 0;
    let removeImageFlag = false;

    (async () => {
      const profile = await requireAdmin();
      if (!profile) return;

      document.getElementById('admin-avatar').textContent =
        (profile.full_name || 'A')[0].toUpperCase();

      document.getElementById('btn-logout').addEventListener('click', async (e) => {
        e.preventDefault();
        try { await _sb.auth.signOut(); } catch (err) { console.warn('KANUM logout error:', err); }
        window.location.href = '/login';
      });

      await loadExercises();

      if (exerciseId) {
        document.getElementById('exercise-selector').value = exerciseId;

        const exists = allExercises.some(e => e.id === exerciseId);
        if (!exists) {
          showToast('Latihan yang dipilih tidak ditemukan.', 'error');
          exerciseId = '';
          history.replaceState({}, '', '/admin/soal');
        }
      }

      updateExerciseUI();

      if (exerciseId) {
        await loadExerciseInfo();
        await loadQuestions();
      }
    })();

    async function loadExercises() {
      const selector = document.getElementById('exercise-selector');

      const { data, error } = await _sb
        .from('exercises')
        .select('id, title, is_published, category, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        selector.innerHTML = '<option value="">Gagal memuat latihan</option>';
        document.getElementById('exercise-empty-hint').style.display = 'none';
        showToast('Gagal memuat latihan: ' + error.message, 'error');
        return;
      }

      allExercises = data || [];

      if (!allExercises.length) {
        selector.innerHTML = '<option value="">Belum ada latihan</option>';
        document.getElementById('exercise-empty-hint').style.display = 'block';
        return;
      }

      document.getElementById('exercise-empty-hint').style.display = 'none';

      selector.innerHTML = '<option value="">Pilih latihan...</option>' +
        allExercises.map(e => {
          const status = e.is_published ? 'Dipublikasikan' : 'Draft';
          return `<option value="${escHtml(e.id)}">${escHtml(e.title)} — ${status}</option>`;
        }).join('');

      if (exerciseId && allExercises.some(e => e.id === exerciseId)) {
        selector.value = exerciseId;
      }
    }

    async function handleExerciseChange(selectedId) {
      exerciseId = (selectedId || '').trim();
      console.log('KANUM: exercise dipilih:', exerciseId);

      allQuestions = [];
      document.getElementById('questions-container').innerHTML =
        '<div class="empty-state"><span class="kanum-spinner"></span></div>';

      if (!exerciseId) {
        history.replaceState({}, '', '/admin/soal');
        document.getElementById('ex-status-badge').textContent = '–';
        document.getElementById('ex-status-badge').className = 'badge badge-gray';
        document.getElementById('page-title').textContent = 'Manajemen Soal';
        document.getElementById('btn-add-question').disabled = true;
        document.getElementById('questions-container').innerHTML =
          '<div class="empty-state"><span class="material-symbols-outlined">quiz</span>Pilih latihan untuk melihat dan mengelola soal.</div>';
        return;
      }

      history.replaceState({}, '', `/admin/soal?ex=${encodeURIComponent(exerciseId)}`);

      document.getElementById('btn-add-question').disabled = false;
      await loadExerciseInfo();
      await loadQuestions();
    }

    function updateExerciseUI() {
      const hasExercise = Boolean(exerciseId);
      document.getElementById('btn-add-question').disabled = !hasExercise;

      if (!hasExercise) {
        document.getElementById('page-title').textContent = 'Manajemen Soal';
        document.getElementById('ex-status-badge').textContent = '–';
        document.getElementById('ex-status-badge').className = 'badge badge-gray';
        document.getElementById('questions-container').innerHTML =
          '<div class="empty-state"><span class="material-symbols-outlined">quiz</span>Pilih latihan untuk melihat dan mengelola soal.</div>';
      }
    }

    async function loadExerciseInfo() {
      if (!exerciseId) return;

      const { data, error } = await _sb.from('exercises').select('title, is_published, category').eq('id', exerciseId).single();
      if (error) { showToast('Gagal memuat info latihan: ' + error.message, 'error'); return; }
      if (data) {
        document.getElementById('page-title').textContent = `Soal – ${data.title}`;
        const badge = document.getElementById('ex-status-badge');
        badge.textContent = data.is_published ? 'Dipublikasikan' : 'Draft';
        badge.className = 'badge ' + (data.is_published ? 'badge-green' : 'badge-yellow');
      }
    }

    async function loadQuestions() {
      if (!exerciseId) {
        renderQuestions();
        return;
      }

      const { data, error } = await _sb
        .from('questions')
        .select('*, question_options(*)')
        .eq('exercise_id', exerciseId)
        .order('sort_order', { ascending: true });
      if (error) { showToast('Gagal memuat soal: ' + error.message, 'error'); return; }
      allQuestions = data || [];
      renderQuestions();
    }

    function renderQuestions() {
      const container = document.getElementById('questions-container');
      if (!allQuestions.length) {
        container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">quiz</span>Belum ada soal. Klik "Tambah Soal" untuk mulai.</div>';
        return;
      }
      container.innerHTML = allQuestions.map((q, idx) => {
        const opts = (q.question_options || []).sort((a, b) => a.sort_order - b.sort_order);
        return `
    <div class="admin-card" style="padding:1.5rem;margin-bottom:1rem">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
            <span style="width:2rem;height:2rem;border-radius:50%;background:var(--etno-primary-container);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.875rem;font-weight:800;flex-shrink:0">${idx + 1}</span>
            <p style="font-weight:700;font-size:.9375rem;color:var(--etno-text)">${escMathContent(q.question)}</p>
          </div>
          ${q.image_url ? `
          <div style="margin-left:2.75rem;margin-bottom:.75rem">
            <img src="${escHtml(q.image_url)}" alt="Gambar soal" style="max-height:140px;max-width:300px;border-radius:.5rem;object-fit:contain;border:1px solid var(--etno-border)"/>
          </div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-left:2.75rem">
            ${opts.map(o => `
              <div style="display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;border-radius:.5rem;border:1.5px solid ${o.is_correct ? 'var(--etno-primary)' : 'var(--etno-border)'};background:${o.is_correct ? 'rgba(0,53,39,.06)' : '#fff'}">
                <span class="material-symbols-outlined" style="font-size:1rem;color:${o.is_correct ? 'var(--etno-primary)' : 'var(--etno-muted)'}">${o.is_correct ? 'check_circle' : 'radio_button_unchecked'}</span>
                <span style="font-size:.8rem;color:var(--etno-text)">${escMathContent(o.option_text)}</span>
              </div>`).join('')}
          </div>
          ${q.explanation ? `<p style="font-size:.8rem;color:var(--etno-muted);margin-top:.75rem;margin-left:2.75rem;padding:.5rem .75rem;border-left:3px solid var(--etno-primary-soft);background:var(--etno-surface-low);border-radius:0 .5rem .5rem 0"><strong>Penjelasan:</strong> ${escMathContent(q.explanation)}</p>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:.4rem;flex-shrink:0">
          <span class="badge badge-gray" style="white-space:nowrap">${q.points} poin</span>
          <button class="btn-secondary btn-sm" onclick="openQuestionModal('${q.id}')">
            <span class="material-symbols-outlined" style="font-size:1rem">edit</span>
          </button>
          <button class="btn-danger btn-sm" onclick="openDeleteQuestion('${q.id}')">
            <span class="material-symbols-outlined" style="font-size:1rem">delete</span>
          </button>
          ${idx > 0 ? `<button class="btn-secondary btn-sm btn-icon" title="Naikan urutan" onclick="moveQuestion('${q.id}', 'up')"><span class="material-symbols-outlined" style="font-size:1rem">arrow_upward</span></button>` : ''}
          ${idx < allQuestions.length - 1 ? `<button class="btn-secondary btn-sm btn-icon" title="Turunkan urutan" onclick="moveQuestion('${q.id}', 'down')"><span class="material-symbols-outlined" style="font-size:1rem">arrow_downward</span></button>` : ''}
        </div>
      </div>
    </div>`;
      }).join('');
      renderMath(container);
    }

    function escHtml(s) {
      if (!s) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /*
     * KANUM Math renderer
     *
     * Admin boleh menyimpan:
     *   1) teks biasa
     *   2) inline LaTeX: $x^2$
     *   3) display LaTeX: $$\frac{1}{2}x^2$$
     *   4) raw LaTeX dari toolbar: \frac{1}{2}x^{2}
     *
     * Untuk raw LaTeX dari toolbar, kita bungkus otomatis dengan
     * inline math delimiter agar MathJax dapat merendernya.
     * Jika admin sudah menggunakan $...$, $$...$$, \(...\), atau \[...\],
     * delimiter tersebut dipertahankan.
     */
    function escapeMathHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function hasMathDelimiter(value) {
      return /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/.test(value);
    }

    function looksLikeRawLatex(value) {
      const v = String(value).trim();

      if (!v) return false;

      // LaTeX command / superscript / subscript / matrix.
      return /\\(?:frac|dfrac|tfrac|sqrt|sum|prod|int|oint|lim|sin|cos|tan|cot|log|ln|alpha|beta|gamma|delta|theta|pi|pm|times|cdot|leq|geq|neq|infty|begin|end)\b/.test(v)
        || /(?:\^[{]|_[{]|\^\w|_\w)/.test(v);
    }

    function normalizeMathMarkup(value) {
      if (value === null || value === undefined) return '';

      const raw = String(value);

      if (!raw.trim()) return '';

      /*
       * Jika sudah menggunakan delimiter MathJax, jangan bungkus lagi.
       */
      if (hasMathDelimiter(raw)) {
        return escapeMathHtml(raw).replace(/\r?\n/g, '<br>');
      }

      /*
       * Input dari toolbar berupa raw LaTeX.
       * Contoh:
       *   \frac{1}{2}x^{2}
       *   \sum_{i=1}^{n} i
       *
       * Dibungkus menjadi \( ... \) agar langsung dirender.
       */
      if (looksLikeRawLatex(raw)) {
        return '\\(' +
          escapeMathHtml(raw).replace(/\r?\n/g, ' ') +
          '\\)';
      }

      /*
       * Teks biasa tetap menjadi teks biasa.
       */
      return escapeMathHtml(raw).replace(/\r?\n/g, '<br>');
    }

    function escMathContent(value) {
      return normalizeMathMarkup(value);
    }

    async function renderMath(element) {
      if (!element) return;

      /*
       * MathJax dimuat async. Jika belum siap, jadwalkan ulang
       * setelah library selesai dimuat.
       */
      if (!window.MathJax || typeof MathJax.typesetPromise !== 'function') {
        return;
      }

      try {
        if (typeof MathJax.typesetClear === 'function') {
          MathJax.typesetClear([element]);
        }

        await MathJax.typesetPromise([element]);
      } catch (error) {
        console.warn('KANUM MathJax:', error);
      }
    }

    function insertLatex(latex) {
      const textarea = document.getElementById('q-text');
      if (!textarea) return;
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      textarea.value = textarea.value.slice(0, start) + latex + textarea.value.slice(end);
      textarea.focus();
      const pos = start + latex.length;
      textarea.setSelectionRange(pos, pos);
      updateMathPreview();
    }

    function updateMathPreview() {
      const textarea = document.getElementById('q-text');
      const preview = document.getElementById('q-math-preview');
      if (!textarea || !preview) return;
      const value = textarea.value.trim();
      preview.innerHTML = value ? escMathContent(value) : 'Preview akan muncul di sini.';
      renderMath(preview);
    }

    /*
     * MathJax dimuat async. Saat library selesai dimuat, render ulang
     * preview/list yang mungkin sudah terisi sebelum MathJax siap.
     */
    window.addEventListener('load', () => {
      updateMathPreview();

      const questionsContainer =
        document.getElementById('questions-container');

      if (questionsContainer) {
        renderMath(questionsContainer);
      }

      const optionsContainer =
        document.getElementById('options-container');

      if (optionsContainer) {
        renderMath(optionsContainer);
      }
    });

    function updateOptionMathPreview(idx) {
      const input = document.getElementById(`opt-text-${idx}`);
      const preview = document.getElementById(`opt-preview-${idx}`);
      if (!input || !preview) return;
      const value = input.value.trim();
      if (!value) {
        preview.style.display = 'none';
        preview.innerHTML = '';
        return;
      }
      preview.style.display = 'block';
      preview.innerHTML = escMathContent(value);
      renderMath(preview);
    }

    function openQuestionModal(id) {
      const q = id ? allQuestions.find(x => x.id === id) : null;
      document.getElementById('modal-q-title').textContent = q ? 'Edit Soal' : 'Tambah Soal';
      document.getElementById('q-id').value = q?.id || '';
      document.getElementById('q-text').value = q?.question || '';
      document.getElementById('q-explanation').value = q?.explanation || '';
      document.getElementById('q-points').value = q?.points ?? 10;
      document.getElementById('q-image-file').value = '';

      // Reset image state
      removeImageFlag = false;
      const existingImg = q?.image_url || '';
      document.getElementById('q-existing-image').value = existingImg;

      const previewWrap = document.getElementById('image-preview-wrap');
      const previewEl = document.getElementById('image-preview');
      const filenameEl = document.getElementById('image-filename');
      const btnRemove = document.getElementById('btn-remove-image');

      if (existingImg) {
        previewEl.src = existingImg;
        filenameEl.textContent = 'Gambar saat ini';
        previewWrap.style.display = 'flex';
        btnRemove.style.display = '';
      } else {
        previewEl.src = '';
        filenameEl.textContent = '';
        previewWrap.style.display = 'none';
        btnRemove.style.display = 'none';
      }

      const optCon = document.getElementById('options-container');
      optCon.innerHTML = '';
      optionCount = 0;

      const opts = (q?.question_options || []).sort((a, b) => a.sort_order - b.sort_order);
      if (opts.length) {
        opts.forEach(o => addOptionField(o.option_text, o.is_correct, o.id));
      } else {
        for (let i = 0; i < 4; i++) addOptionField();
      }

      document.getElementById('modal-question').style.display = 'flex';
      updateMathPreview();
    }

    function handleImageChange(input) {
      const file = input.files[0];
      if (!file) return;
      const previewWrap = document.getElementById('image-preview-wrap');
      const previewEl = document.getElementById('image-preview');
      const filenameEl = document.getElementById('image-filename');
      const btnRemove = document.getElementById('btn-remove-image');

      const reader = new FileReader();
      reader.onload = e => {
        previewEl.src = e.target.result;
        filenameEl.textContent = file.name;
        previewWrap.style.display = 'flex';
        btnRemove.style.display = '';
        removeImageFlag = false; // user pilih gambar baru, bukan hapus
      };
      reader.readAsDataURL(file);
    }

    function removeImage() {
      removeImageFlag = true;
      document.getElementById('q-image-file').value = '';
      document.getElementById('image-preview').src = '';
      document.getElementById('image-filename').textContent = '';
      document.getElementById('image-preview-wrap').style.display = 'none';
      document.getElementById('btn-remove-image').style.display = 'none';
    }

    function addOptionField(text = '', isCorrect = false, optId = '') {
      const idx = optionCount++;
      const div = document.createElement('div');
      div.id = `opt-row-${idx}`;
      div.style.cssText = 'display:grid;grid-template-columns:auto 1fr auto;gap:.5rem;align-items:start';
      div.innerHTML = `
        <input type="radio" name="correct-answer" value="${idx}" ${isCorrect ? 'checked' : ''}
          style="accent-color:var(--etno-primary);width:1.1rem;height:1.1rem;margin-top:.75rem"/>
        <div>
          <input class="admin-input" data-opt-id="${escHtml(optId)}" id="opt-text-${idx}" type="text"
            placeholder="Pilihan jawaban ${idx + 1}" value="${escHtml(text)}" style="width:100%"
            oninput="updateOptionMathPreview(${idx})"/>
          <div id="opt-preview-${idx}" style="display:none;margin-top:.4rem;padding:.5rem .75rem;border:1px solid var(--etno-border);border-radius:.5rem;background:var(--etno-surface-low);overflow-x:auto"></div>
        </div>
        <button type="button" onclick="removeOption(${idx})" class="btn-danger btn-sm btn-icon" title="Hapus pilihan">
          <span class="material-symbols-outlined" style="font-size:1rem">close</span>
        </button>`;
      document.getElementById('options-container').appendChild(div);
      updateOptionMathPreview(idx);
    }

    function removeOption(idx) {
      const row = document.getElementById(`opt-row-${idx}`);
      if (row) row.remove();
    }

    async function saveQuestion() {
      // Re-read exerciseId from selector to always be in sync
      exerciseId = document.getElementById('exercise-selector').value || '';

      if (!exerciseId) {
        showToast('Pilih latihan terlebih dahulu', 'error');
        return;
      }

      const id = document.getElementById('q-id').value;
      const questionText = document.getElementById('q-text').value.trim();
      if (!questionText) { showToast('Pertanyaan wajib diisi', 'error'); return; }

      console.log('KANUM saveQuestion: exercise_id =', exerciseId, '| question_id =', id || '(baru)');

      const points = parseInt(document.getElementById('q-points').value);
      if (isNaN(points) || points <= 0) { showToast('Poin harus lebih dari 0', 'error'); return; }

      const optRows = document.querySelectorAll('#options-container > div[id^="opt-row-"]');
      const options = [];
      let correctCount = 0;

      optRows.forEach((row, si) => {
        const radio = row.querySelector('input[type="radio"]');
        const input = row.querySelector('input[type="text"]');
        if (!input || !input.value.trim()) return;
        const correct = Boolean(radio && radio.checked);
        if (correct) correctCount++;
        options.push({
          id: input.dataset.optId || '',
          text: input.value.trim(),
          is_correct: correct,
          sort_order: si
        });
      });

      if (options.length < 2) { showToast('Minimal 2 pilihan jawaban', 'error'); return; }
      if (correctCount !== 1) { showToast('Pilih tepat 1 jawaban yang benar', 'error'); return; }

      // Disable button during save
      const btnSave = document.getElementById('btn-save-q');
      btnSave.disabled = true;
      btnSave.textContent = 'Menyimpan...';

      try {
        const session = await getSession();
        if (!session) { showToast('Sesi habis, silakan login ulang', 'error'); return; }

        const qId = id || crypto.randomUUID();

        // Handle image
        let imageUrl = document.getElementById('q-existing-image').value || null;
        const fileInput = document.getElementById('q-image-file');
        const newFile = fileInput.files[0];

        if (removeImageFlag) {
          if (imageUrl) {
            await deleteImageFromStorage(imageUrl, session.user.id);
          }
          imageUrl = null;
        } else if (newFile) {
          if (imageUrl) {
            await deleteImageFromStorage(imageUrl, session.user.id);
          }
          const uploaded = await uploadImage(newFile, session.user.id, qId);
          if (uploaded === false) { return; }
          imageUrl = uploaded;
        }

        const qPayload = {
          id: qId,
          exercise_id: exerciseId,
          question: questionText,
          explanation: document.getElementById('q-explanation').value.trim(),
          points: points,
          sort_order: id ? (allQuestions.find(q => q.id === id)?.sort_order ?? allQuestions.length) : allQuestions.length,
          image_url: imageUrl,
        };

        if (id) {
          const { error } = await _sb.from('questions').update({
            question: qPayload.question,
            explanation: qPayload.explanation,
            points: qPayload.points,
            image_url: qPayload.image_url,
          }).eq('id', id);
          if (error) { showToast('Gagal menyimpan soal: ' + error.message, 'error'); return; }
        } else {
          const { error } = await _sb.from('questions').insert(qPayload);
          if (error) { showToast('Gagal menyimpan soal: ' + error.message, 'error'); return; }
        }

        // Smart Option Sync (preserve existing option IDs to prevent setting past student answers to NULL)
        const { data: dbOptions, error: dbOptErr } = await _sb.from('question_options').select('id').eq('question_id', qId);
        if (dbOptErr) { showToast('Gagal memuat pilihan lama: ' + dbOptErr.message, 'error'); return; }

        const dbOptIds = new Set((dbOptions || []).map(o => o.id));
        const keepOptIds = new Set();

        for (let i = 0; i < options.length; i++) {
          const o = options[i];
          if (o.id && dbOptIds.has(o.id)) {
            keepOptIds.add(o.id);
            const { error: uErr } = await _sb.from('question_options').update({
              option_text: o.text,
              is_correct: o.is_correct,
              sort_order: i
            }).eq('id', o.id);
            if (uErr) { showToast('Gagal memperbarui pilihan: ' + uErr.message, 'error'); return; }
          } else {
            const { data: newOpt, error: iErr } = await _sb.from('question_options').insert({
              question_id: qId,
              option_text: o.text,
              is_correct: o.is_correct,
              sort_order: i
            }).select('id').single();
            if (iErr) { showToast('Gagal menambah pilihan: ' + iErr.message, 'error'); return; }
            if (newOpt) keepOptIds.add(newOpt.id);
          }
        }

        const toDelete = Array.from(dbOptIds).filter(optId => !keepOptIds.has(optId));
        if (toDelete.length > 0) {
          const { error: delErr } = await _sb.from('question_options').delete().in('id', toDelete);
          if (delErr) { showToast('Gagal menghapus pilihan lama: ' + delErr.message, 'error'); return; }
        }

        showToast(id ? 'Soal berhasil diperbarui' : 'Soal berhasil ditambahkan');
        closeModal('modal-question');
        await loadQuestions();
      } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = '<span class="material-symbols-outlined">save</span>Simpan Soal';
      }
    }

    async function uploadImage(file, userId, questionId) {
      const ext = file.name.split('.').pop().toLowerCase();
      const allowed = ['jpg', 'jpeg', 'png', 'webp'];
      if (!allowed.includes(ext)) {
        showToast('Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.', 'error');
        return false;
      }
      const filename = `${userId}/${questionId}-${Date.now()}.${ext}`;
      const { data, error } = await _sb.storage
        .from('question-images')
        .upload(filename, file, { upsert: true, contentType: file.type });
      if (error) {
        showToast('Gagal upload gambar: ' + error.message, 'error');
        return false;
      }
      const { data: urlData } = _sb.storage.from('question-images').getPublicUrl(filename);
      return urlData.publicUrl || null;
    }

    async function deleteImageFromStorage(imageUrl, userId) {
      try {
        const url = new URL(imageUrl);
        const parts = url.pathname.split('/question-images/');
        if (parts.length < 2) return;
        const path = parts[1];
        await _sb.storage.from('question-images').remove([path]);
      } catch (e) {
        console.warn('Gagal hapus gambar lama dari storage:', e);
      }
    }

    function openDeleteQuestion(id) {
      document.getElementById('delete-q-id').value = id;
      document.getElementById('modal-delete-q').style.display = 'flex';
    }

    async function confirmDeleteQuestion() {
      const id = document.getElementById('delete-q-id').value;
      const q = allQuestions.find(x => x.id === id);
      if (q?.image_url) {
        const session = await getSession();
        if (session) await deleteImageFromStorage(q.image_url, session.user.id);
      }
      const { error } = await _sb.from('questions').delete().eq('id', id);
      if (error) { showToast('Gagal menghapus soal: ' + error.message, 'error'); return; }
      showToast('Soal berhasil dihapus');
      closeModal('modal-delete-q');
      await loadQuestions();
    }

    async function moveQuestion(id, dir) {
      const idx = allQuestions.findIndex(q => q.id === id);
      if (dir === 'up' && idx <= 0) return;
      if (dir === 'down' && (idx < 0 || idx >= allQuestions.length - 1)) return;
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;

      const qCurrent = allQuestions[idx];
      const qTarget = allQuestions[swapIdx];

      const [r1, r2] = await Promise.all([
        _sb.from('questions').update({ sort_order: swapIdx }).eq('id', qCurrent.id),
        _sb.from('questions').update({ sort_order: idx }).eq('id', qTarget.id),
      ]);
      if (r1.error) { showToast('Gagal urutkan: ' + r1.error.message, 'error'); return; }
      if (r2.error) { showToast('Gagal urutkan: ' + r2.error.message, 'error'); return; }
      await loadQuestions();
    }

    function closeModal(id) {
      document.getElementById(id).style.display = 'none';
    }
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
    });

})();
