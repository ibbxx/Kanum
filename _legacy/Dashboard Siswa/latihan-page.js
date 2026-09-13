/**
 * KANUM – Latihan Page Logic
 */
(function () {
  'use strict';

    let allPublishedExercises = [];
    let studentProgMap = {};
    let selectedCategory = '';

    (async () => {
      try {
        const session = await getSession();
        if (!session) {
          window.location.href = '/login';
          return;
        }

        // Fetch published exercises
        const { data: exercises, error: exErr } = await _sb
          .from('exercises')
          .select('id, title, description, category, difficulty, created_at, questions(id)')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (exErr) {
          showToast('Gagal memuat latihan: ' + exErr.message, 'error');
          document.getElementById('latihan-grid').innerHTML = `
        <div class="col-span-full text-center py-12 text-error">
          <span class="material-symbols-outlined text-4xl mb-2">error</span>
          <p class="font-bold">Gagal memuat data latihan</p>
        </div>`;
          return;
        }

        allPublishedExercises = (exercises || []).filter(ex => ex && ex.id);

        console.log('KANUM: latihan tersedia:', allPublishedExercises.length);

        // Fetch student progress
        const { data: progresses, error: progErr } = await _sb
          .from('student_progress')
          .select('exercise_id, best_score, attempts_count, is_completed')
          .eq('student_id', session.user.id);

        if (!progErr && progresses) {
          progresses.forEach(p => studentProgMap[p.exercise_id] = p);
        }

        buildCategoryFilters(allPublishedExercises);
        applyFiltersAndRender();

      } catch (e) {
        console.error('Error loading exercises:', e);
      }
    })();

    function buildCategoryFilters(exercises) {
      const bar = document.getElementById('category-filter-bar');
      if (!bar) return;

      // Ekstrak kategori unik dari latihan yang tersedia
      const categories = [...new Set(
        (exercises || [])
          .map(ex => ex.category)
          .filter(Boolean)
      )].sort();

      // Render tombol
      bar.innerHTML = [
        // Tombol "Semua" selalu pertama
        buildFilterButton('', 'Semua', selectedCategory === ''),
        ...categories.map(cat => buildFilterButton(cat, cat, selectedCategory === cat))
      ].join('');

      // Attach event listeners
      bar.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedCategory = btn.dataset.cat || '';
          buildCategoryFilters(allPublishedExercises);
          applyFiltersAndRender();
        });
      });
    }

    function buildFilterButton(value, label, isActive) {
      const activeClass = isActive
        ? 'bg-primary text-on-primary shadow-sm'
        : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-low';
      return `<button
    type="button"
    data-cat="${value}"
    class="cat-btn px-6 py-2 ${activeClass} rounded-full font-label-md text-label-md transition-all active:scale-95">
    ${label}
  </button>`;
    }

    function openExercise(encodedExerciseId) {
      try {
        console.log('KANUM openExercise dipanggil dengan:', encodedExerciseId);

        if (!encodedExerciseId) {
          console.error('KANUM: exercise ID kosong.');
          showToast('Latihan tidak valid.', 'error');
          return;
        }

        // ID pada data-exercise-id sudah di-encode saat kartu dibuat.
        let exerciseId = encodedExerciseId;
        try {
          exerciseId = decodeURIComponent(encodedExerciseId);
        } catch (_) {
          // Jika ternyata sudah berupa UUID biasa, gunakan apa adanya.
        }
        exerciseId = String(exerciseId || '').trim();

        if (!exerciseId) {
          showToast('ID latihan tidak valid.', 'error');
          return;
        }

        /*
         * PENTING:
         * Beberapa server lokal/SPA di localhost:3000 melakukan rewrite
         * URL dan membuang query string ?ex=... ketika berpindah halaman.
         *
         * Karena itu ID dikirim melalui 3 jalur sekaligus:
         * 1. query    : ?ex=UUID
         * 2. hash     : #ex=UUID  (tidak dikirim ke server sehingga tidak hilang)
         * 3. storage  : sessionStorage/localStorage sebagai fallback.
         */
        try {
          sessionStorage.setItem('kanum_active_exercise_id', exerciseId);
          localStorage.setItem('kanum_active_exercise_id', exerciseId);
        } catch (storageError) {
          console.warn('KANUM: storage tidak tersedia:', storageError);
        }

        const targetUrl = new URL('latihan-supabase.html', window.location.href);
        targetUrl.searchParams.set('ex', exerciseId);
        targetUrl.hash = 'ex=' + encodeURIComponent(exerciseId);

        console.log('KANUM: membuka latihan:', {
          exerciseId,
          target: targetUrl.href,
          queryId: targetUrl.searchParams.get('ex'),
          hashId: targetUrl.hash
        });

        // Navigasi normal agar browser mempertahankan hash jika server
        // melakukan rewrite pada URL.
        window.location.href = targetUrl.href;
      } catch (error) {
        console.error('KANUM: gagal membuka latihan:', error);
        showToast('Gagal membuka latihan. Silakan coba lagi.', 'error');
      }
    }

    function applyFiltersAndRender() {
      const grid = document.getElementById('latihan-grid');
      const sortVal = document.getElementById('sort-select')?.value || 'newest';

      let list = [...allPublishedExercises];

      if (selectedCategory) {
        list = list.filter(ex => (ex.category || '').toLowerCase() === selectedCategory.toLowerCase());
      }

      if (sortVal === 'difficulty') {
        const diffRank = { 'Mudah': 1, 'Sedang': 2, 'Sulit': 3 };
        list.sort((a, b) => (diffRank[a.difficulty] || 2) - (diffRank[b.difficulty] || 2));
      } else {
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      if (!list.length) {
        grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-on-surface-variant">
        <span class="material-symbols-outlined text-5xl mb-2 text-outline">edit_square</span>
        <h3 class="font-headline-sm text-lg text-primary font-bold">Belum Ada Latihan</h3>
        <p class="text-sm mt-1">Belum ada latihan yang dipublikasikan oleh guru pada kategori ini.</p>
      </div>`;
        return;
      }

      const diffMap = { 'Mudah': 'DASAR', 'Sedang': 'MENENGAH', 'Sulit': 'LANJUT' };
      const diffBg = {
        'Mudah': 'bg-primary-fixed text-primary',
        'Sedang': 'bg-secondary-container text-on-secondary-container',
        'Sulit': 'bg-error-container text-on-error-container'
      };

      grid.innerHTML = list.map(ex => {
        const prog = studentProgMap[ex.id];
        const qCount = ex.questions?.length || 0;
        const score = prog ? Math.round(prog.best_score) : null;
        const pct = score || 0;
        const done = prog?.is_completed;
        const label = done ? 'Ulangi' : (score !== null ? 'Lanjutkan' : 'Mulai');
        const icon = done ? 'refresh' : 'play_arrow';
        const btnCls = done
          ? 'border border-primary text-primary hover:bg-primary/5'
          : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm';
        const diff = ex.difficulty || 'Sedang';

        return `
    <article class="bg-white rounded-xl border border-slate-100 flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <div class="h-40 relative overflow-hidden group bg-primary/10 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary opacity-30" style="font-size:4rem">edit_square</span>
        <div class="absolute top-4 right-4 bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
          ${ex.category || 'Umum'}
        </div>
      </div>
      <div class="p-6 flex-1 flex flex-col">
        <h3 class="font-headline-sm text-headline-sm text-primary mb-2">${ex.title}</h3>
        <p class="text-body-sm text-on-surface-variant mb-4">${ex.description ? ex.description.substring(0, 100) + '...' : ''}</p>
        <div class="space-y-3 mb-6">
          <div class="flex justify-between items-center text-sm">
            <span class="text-outline font-label-md uppercase text-[10px]">Kesulitan</span>
            <span class="px-2 py-0.5 rounded font-bold text-[10px] ${diffBg[diff] || 'bg-slate-100'}">${diffMap[diff] || diff}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-outline font-label-md uppercase text-[10px]">Jumlah Soal</span>
            <span class="font-number-data text-on-surface">${qCount} Soal</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-outline font-label-md uppercase text-[10px]">Skor Terbaik</span>
            <span class="font-number-data text-secondary font-bold">${score !== null ? score + '/100' : '–'}</span>
          </div>
        </div>
        <div class="mt-auto">
          <div class="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
            <div class="bg-primary h-full rounded-full" style="width: ${pct}%"></div>
          </div>
          <button
            type="button"
            class="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${btnCls}"
            data-exercise-id="${encodeURIComponent(ex.id)}"
            onclick="openExercise(this.dataset.exerciseId)">
            <span class="material-symbols-outlined text-sm">${icon}</span> ${label}
          </button>
        </div>
      </div>
    </article>`;
      }).join('');
    }

})();
