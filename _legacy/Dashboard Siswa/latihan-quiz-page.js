/**
 * KANUM – Latihan Quiz Page Logic
 */
(function () {
  'use strict';

    'use strict';

    /*
     * KANUM STUDENT QUIZ
     *
     * Sumber data:
     * exercises
     *   └── questions
     *         └── question_options
     *
     * Semua konten yang dibuat melalui Admin/soal.html dibaca langsung
     * dari Supabase, termasuk:
     * - question
     * - image_url
     * - explanation
     * - points
     * - sort_order
     * - question_options
     * - option_text
     * - is_correct
     */

    /*
     * Ambil ID latihan dari beberapa sumber.
     *
     * Prioritas:
     * 1. Query string       ?ex=UUID
     * 2. URL hash           #ex=UUID
     * 3. sessionStorage
     * 4. localStorage
     *
     * Hash sengaja digunakan sebagai jalur kedua karena hash tidak pernah
     * dikirim ke server. Jadi walaupun localhost:3000 me-rewrite URL dan
     * membuang query string, ID latihan tetap sampai ke halaman ini.
     */
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      String(window.location.hash || '').replace(/^#/, '')
    );

    const queryExerciseId = (params.get('ex') || '').trim();
    const hashExerciseId = (hashParams.get('ex') || '').trim();

    let storedExerciseId = '';
    try {
      storedExerciseId = (
        sessionStorage.getItem('kanum_active_exercise_id') ||
        localStorage.getItem('kanum_active_exercise_id') ||
        ''
      ).trim();
    } catch (storageError) {
      console.warn('KANUM: storage tidak tersedia:', storageError);
    }

    let exerciseId = queryExerciseId || hashExerciseId || storedExerciseId;
    exerciseId = String(exerciseId || '').trim();

    console.log('KANUM: sumber ID latihan:', {
      queryExerciseId,
      hashExerciseId,
      storedExerciseId,
      exerciseId,
      href: window.location.href
    });

    /*
     * Jika ID berhasil dipulihkan dari hash/storage tetapi query string
     * hilang karena rewrite server, tuliskan kembali keduanya ke address bar.
     * replaceState tidak melakukan reload.
     */
    if (exerciseId) {
      try {
        const restoredUrl = new URL(window.location.href);
        restoredUrl.searchParams.set('ex', exerciseId);
        restoredUrl.hash = 'ex=' + encodeURIComponent(exerciseId);
        window.history.replaceState({}, '', restoredUrl.href);

        sessionStorage.setItem('kanum_active_exercise_id', exerciseId);
        localStorage.setItem('kanum_active_exercise_id', exerciseId);
      } catch (restoreError) {
        console.warn('KANUM: gagal memulihkan URL/storage:', restoreError);
      }
    }

    let questions = [];
    let answers = {};
    let currentQ = 0;
    let attemptId = null;
    let session = null;
    let passingScore = 70;
    let exerciseData = null;
    let loading = false;

    /* ---------------------------------------------------------------
       NAVIGATION
    ---------------------------------------------------------------- */

    function backToExerciseList() {
      window.location.assign(new URL('Latihan.html', window.location.href).href);
    }

    function retryLoading() {
      if (!exerciseId) {
        showError('ID latihan tidak ditemukan pada URL.');
        return;
      }

      document.getElementById('error-state').style.display = 'none';
      document.getElementById('result-section').style.display = 'none';
      document.getElementById('quiz-section').style.display = 'none';
      document.getElementById('loading-state').style.display = 'block';

      loadExercise();
    }

    /* ---------------------------------------------------------------
       INITIALIZATION
    ---------------------------------------------------------------- */

    document.addEventListener('DOMContentLoaded', initQuiz);

    async function initQuiz() {
      if (!exerciseId) {
        showError(
          'ID latihan tidak ditemukan. Pastikan tombol "Mulai" membuka ' +
          'latihan-supabase.html?ex=ID_LATIHAN.'
        );
        return;
      }

      try {
        if (typeof _sb === 'undefined' || !_sb) {
          throw new Error('Koneksi Supabase tidak tersedia.');
        }

        session = await getSession();

        if (!session) {
          window.location.assign(
            new URL('/login', window.location.href).href
          );
          return;
        }

        await loadExercise();

      } catch (error) {
        console.error('KANUM initQuiz:', error);
        showError(
          'Gagal memulai latihan: ' +
          (error?.message || String(error))
        );
      }
    }

    /* ---------------------------------------------------------------
       LOAD EXERCISE
    ---------------------------------------------------------------- */

    async function loadExercise() {
      if (loading) return;
      loading = true;
      setLoadingText('Memuat data latihan...');

      try {
        if (!exerciseId) {
          throw new Error('ID latihan kosong.');
        }

        /*
         * SECURITY:
         * Semua data quiz siswa diambil melalui RPC.
         * RPC TIDAK mengembalikan question_options.is_correct.
         *
         * RPC juga membuat exercise_attempts dan mengembalikan attempt_id.
         */
        const { data, error } = await _sb.rpc('get_student_quiz', {
          p_exercise_id: exerciseId
        });

        if (error) {
          throw new Error('Gagal memuat latihan: ' + error.message);
        }

        if (!data) {
          throw new Error('Data latihan tidak diterima dari server.');
        }

        exerciseData = data.exercise || {};
        attemptId = data.attempt_id || null;

        if (!attemptId) {
          throw new Error(
            'Latihan berhasil ditemukan, tetapi ID percobaan tidak diterima. ' +
            'Pastikan SQL RPC get_student_quiz sudah dijalankan.'
          );
        }

        passingScore =
          Number(exerciseData.passing_score) || 70;

        document.getElementById('chapter-label').textContent =
          exerciseData.category || '';

        document.getElementById('quiz-title').textContent =
          exerciseData.title || 'Latihan';

        questions = Array.isArray(data.questions)
          ? data.questions
            .map(q => ({
              ...q,
              question_options:
                Array.isArray(q.options)
                  ? q.options
                    .slice()
                    .sort(
                      (a, b) =>
                        Number(a.sort_order ?? 0) -
                        Number(b.sort_order ?? 0)
                    )
                  : []
            }))
            .sort(
              (a, b) =>
                Number(a.sort_order ?? 0) -
                Number(b.sort_order ?? 0)
            )
          : [];

        if (!questions.length) {
          throw new Error(
            'Latihan ini belum memiliki soal. Tambahkan soal melalui Admin → Soal.'
          );
        }

        const invalidQuestion =
          questions.findIndex(q =>
            !Array.isArray(q.question_options) ||
            q.question_options.length < 2
          );

        if (invalidQuestion !== -1) {
          throw new Error(
            `Soal nomor ${invalidQuestion + 1} belum memiliki minimal 2 pilihan jawaban.`
          );
        }

        try {
          sessionStorage.setItem(
            'kanum_active_exercise_id',
            exerciseId
          );

          localStorage.setItem(
            'kanum_active_exercise_id',
            exerciseId
          );
        } catch (_) { }

        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'none';
        document.getElementById('result-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'grid';

        currentQ = 0;

        /*
         * Jangan menghapus draft jawaban jika reload terjadi.
         * Draft dipulihkan berdasarkan exerciseId.
         */
        restoreDraftAnswers();

        renderQuestion();

      } catch (error) {
        console.error('KANUM loadExercise:', error);

        showError(
          error?.message ||
          'Gagal memuat latihan.'
        );
      } finally {
        loading = false;
      }
    }

    /* ---------------------------------------------------------------
       RENDER QUESTION
    ---------------------------------------------------------------- */

    function renderQuestion() {
      const q = questions[currentQ];

      if (!q) {
        showError('Soal tidak ditemukan.');
        return;
      }

      const total = questions.length;
      const pct = total
        ? Math.round((currentQ / total) * 100)
        : 0;

      const questionCounter = document.getElementById('question-counter');
      const progressLabel = document.getElementById('progress-label');
      const progressBar = document.getElementById('progress-bar');

      if (questionCounter) {
        questionCounter.textContent = `Soal ${currentQ + 1}/${total}`;
      }

      if (progressLabel) {
        progressLabel.textContent = `${pct}%`;
      }

      if (progressBar) {
        progressBar.style.width = `${pct}%`;
      }

      const sideTitle = document.getElementById('side-quiz-title');
      if (sideTitle) {
        sideTitle.textContent =
          exerciseData?.title || document.getElementById('quiz-title')?.textContent || 'Latihan';
      }

      const answeredTotal = questions.filter(item => answers[item.id]?.optionId).length;
      const answeredCount = document.getElementById('answered-count');
      if (answeredCount) answeredCount.textContent = `${answeredTotal}/${total}`;

      const navigation = document.getElementById('question-navigation');
      if (navigation) {
        navigation.innerHTML = questions.map((item, index) => {
          const isCurrent = index === currentQ;
          const isAnswered = Boolean(answers[item.id]?.optionId);
          return `
            <button
              type="button"
              class="quiz-number-button ${isAnswered ? 'is-answered' : ''} ${isCurrent ? 'is-current' : ''}"
              aria-label="Buka soal ${index + 1}"
              aria-current="${isCurrent ? 'step' : 'false'}"
              onclick="goToQuestion(${index})">
              ${index + 1}
            </button>
          `;
        }).join('');
      }

      const explanationEl = document.getElementById('explanation');
      if (explanationEl) {
        explanationEl.style.display = 'none';
      }

      const questionImage = q.image_url
        ? `
      <div class="question-media-wrap">
        <img
          src="${escAttr(q.image_url)}"
          alt="Gambar untuk soal"
          class="question-image"
          loading="eager"
          onerror="this.closest('.question-media-wrap').style.display='none'"/>
      </div>
    `
        : '';

      const optionsHtml =
        (q.question_options || [])
          .map((option, index) => {
            const selected = answers[q.id]?.optionId === option.id;
            return `
              <button
                type="button"
                class="quiz-answer-option answer-opt ${selected ? 'answer-selected' : ''}"
                data-option-id="${escAttr(option.id)}"
                onclick="selectAnswer('${escAttr(q.id)}', '${escAttr(option.id)}')">
                <span class="quiz-answer-letter">
                  ${String.fromCharCode(65 + index)}
                </span>
                <span class="quiz-answer-text math-content">${renderStudentMath(option.option_text)}</span>
              </button>`;
          })
          .join('');

      document.getElementById('question-card').innerHTML = `
    <div class="flex items-start gap-3">
      <span class="question-number-badge">
        ${currentQ + 1}
      </span>

      <div class="min-w-0 flex-1">
        <p class="question-prompt">
          ${renderStudentMath(q.question)}
        </p>
      </div>
    </div>

    ${questionImage}

    <div class="quiz-answer-list">
      ${optionsHtml}
    </div>
  `;

      renderMath(document.getElementById('question-card'));

      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
      const submitBtn = document.getElementById('submit-btn');

      if (prevBtn) {
        prevBtn.style.display = currentQ === 0 ? 'none' : 'inline-flex';
      }

      if (nextBtn) {
        nextBtn.style.display = currentQ === total - 1 ? 'none' : 'inline-flex';
      }

      if (submitBtn) {
        submitBtn.style.display = currentQ === total - 1 ? 'inline-flex' : 'none';
      }
    }

    function goToQuestion(index) {
      const target = Number(index);
      if (!Number.isInteger(target) || target < 0 || target >= questions.length) return;

      currentQ = target;
      renderQuestion();
    }

    /* ---------------------------------------------------------------
       ANSWER
    ---------------------------------------------------------------- */

    function selectAnswer(questionId, optionId) {
      if (!questionId || !optionId) return;
      const q = questions.find(item => item.id === questionId);
      if (!q) return;
      const option = (q.question_options || []).find(item => item.id === optionId);
      if (!option) return;
      answers[questionId] = { optionId: optionId };
      persistDraftAnswers();
      renderQuestion();
    }

    /* ---------------------------------------------------------------
       NAVIGATION QUESTIONS
    ---------------------------------------------------------------- */

    document.getElementById('prev-btn').addEventListener('click', () => {
      if (currentQ > 0) {
        currentQ--;
        renderQuestion();
      }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      const q = questions[currentQ];

      if (!answers[q.id]) {
        showToast(
          'Pilih jawaban terlebih dahulu',
          'error'
        );
        return;
      }

      if (currentQ < questions.length - 1) {
        currentQ++;
        renderQuestion();
      }
    });

    document.getElementById('submit-btn').addEventListener(
      'click',
      submitQuiz
    );

    /* ---------------------------------------------------------------
       SUBMIT
    ---------------------------------------------------------------- */

    async function submitQuiz() {
      if (!attemptId) {
        showToast(
          'Percobaan belum tersedia. Silakan ulangi latihan.',
          'error'
        );
        return;
      }

      const unanswered =
        questions.findIndex(
          q => !answers[q.id]?.optionId
        );

      if (unanswered !== -1) {
        showToast(
          `Soal nomor ${unanswered + 1} belum dijawab.`,
          'error'
        );

        currentQ = unanswered;
        renderQuestion();
        return;
      }

      const submitButton =
        document.getElementById('submit-btn');

      submitButton.disabled = true;
      submitButton.textContent = 'Menyimpan...';

      try {
        /*
         * SECURITY:
         * Browser hanya mengirim:
         * question_id + option_id.
         *
         * Tidak ada:
         * - is_correct
         * - points_earned
         * - score
         *
         * Scoring dilakukan oleh PostgreSQL.
         */
        const answerPayload =
          questions.map(q => ({
            question_id: q.id,
            option_id: answers[q.id].optionId
          }));

        const { data, error } =
          await _sb.rpc(
            'submit_student_quiz',
            {
              p_attempt_id: attemptId,
              p_answers: answerPayload
            }
          );

        if (error) {
          throw new Error(
            'Gagal menyimpan hasil: ' +
            error.message
          );
        }

        const result = data || {};

        /*
         * Setelah Submit berhasil, barulah review yang berisi
         * jawaban benar dikirim oleh backend.
         */
        clearDraftAnswers();

        showQuizResult(result);

      } catch (error) {
        console.error(
          'KANUM submitQuiz:',
          error
        );

        showToast(
          error?.message ||
          'Gagal menyimpan hasil latihan.',
          'error'
        );

      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
      }
    }

    function showQuizResult(result) {
      document.getElementById('quiz-section').style.display = 'none';
      document.getElementById('result-section').style.display = 'block';

      document.getElementById('result-score').textContent = Number(result.score || 0).toFixed(1);
      document.getElementById('result-correct').textContent = result.correct_count || 0;
      document.getElementById('result-wrong').textContent = result.wrong_count || 0;

      const passed = Number(result.score || 0) >= passingScore;
      const passEl = document.getElementById('result-pass');
      passEl.textContent = passed
        ? '🎉 Selamat! Kamu lulus latihan ini.'
        : `Nilai minimum lulus: ${passingScore}. Coba lagi ya!`;
      passEl.className = 'font-bold text-lg mb-6 ' + (passed ? 'text-green-600' : 'text-red-600');

      let review = document.getElementById('result-review');
      if (!review) {
        review = document.createElement('div');
        review.id = 'result-review';
        review.style.cssText = 'margin-top:1.5rem;text-align:left;display:grid;gap:.75rem';
        document.querySelector('#result-section > div').appendChild(review);
      }

      review.innerHTML = (result.review || []).map((item, index) => {
        const correct = Boolean(item.is_correct);
        return `
          <div style="border:1px solid var(--outline-variant, #bfc9c3);border-radius:.9rem;padding:1rem;background:#fff">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.75rem">
              <strong>Soal ${index + 1}</strong>
              <span style="font-weight:700;color:${correct ? '#16a34a' : '#dc2626'}">${correct ? 'Benar' : 'Salah'}</span>
            </div>
            <div class="math-content" style="line-height:1.8">${renderStudentMath(item.question)}</div>
            <div style="margin-top:.75rem;padding:.75rem;background:#eef4ff;border-radius:.6rem">
              <strong>Jawaban Siswa:</strong>
              <div class="math-content">${renderStudentMath(item.your_answer)}</div>
            </div>
            <div style="margin-top:.5rem;padding:.75rem;background:#f0fdf4;border-radius:.6rem">
              <strong>Jawaban Benar:</strong>
              <div class="math-content">${renderStudentMath(item.correct_answer)}</div>
            </div>
            ${item.explanation ? `
              <div style="margin-top:.5rem;padding:.75rem;border-left:3px solid #003527">
                <strong>Pembahasan:</strong>
                <div class="math-content">${renderStudentMath(item.explanation)}</div>
              </div>` : ''}
          </div>`;
      }).join('');

      renderMath(review);
    }

    /* ---------------------------------------------------------------
       RESTART
    ---------------------------------------------------------------- */

    async function restartQuiz() {
      answers = {};
      currentQ = 0;
      attemptId = null;

      document.getElementById('result-section').style.display =
        'none';

      document.getElementById('error-state').style.display =
        'none';

      document.getElementById('quiz-section').style.display =
        'none';

      document.getElementById('loading-state').style.display =
        'block';

      await loadExercise();
    }

    /* ---------------------------------------------------------------
       DRAFT ANSWERS
    ---------------------------------------------------------------- */

    function answerStorageKey() {
      return `kanum_quiz_answers_${exerciseId || 'unknown'}`;
    }

    function persistDraftAnswers() {
      try {
        sessionStorage.setItem(
          answerStorageKey(),
          JSON.stringify(answers)
        );
      } catch (_) { }
    }

    function restoreDraftAnswers() {
      try {
        const raw =
          sessionStorage.getItem(
            answerStorageKey()
          );

        if (!raw) return;

        const saved =
          JSON.parse(raw);

        if (
          saved &&
          typeof saved === 'object'
        ) {
          answers = saved;
        }
      } catch (_) {
        answers = {};
      }
    }

    function clearDraftAnswers() {
      try {
        sessionStorage.removeItem(
          answerStorageKey()
        );
      } catch (_) { }
    }

    /* ---------------------------------------------------------------
       SAFE TOAST FALLBACK
       Jika dashboard.js sudah menyediakan showToast(), fungsi ini tidak
       menimpa fungsi tersebut.
    ---------------------------------------------------------------- */

    if (typeof window.showToast !== 'function') {
      window.showToast = function (message, type = 'info') {
        const old = document.getElementById('kanum-toast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.id = 'kanum-toast';
        toast.textContent = message;

        toast.style.cssText = `
          position:fixed;
          left:50%;
          bottom:24px;
          transform:translateX(-50%);
          z-index:99999;
          max-width:min(90vw,520px);
          padding:.75rem 1rem;
          border-radius:.75rem;
          background:${type === 'error' ? '#ba1a1a' : '#003527'};
          color:#fff;
          font-weight:600;
          box-shadow:0 10px 30px rgba(0,0,0,.15);
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
          toast.remove();
        }, 2800);
      };
    }

    /* ---------------------------------------------------------------
       UI HELPERS
    ---------------------------------------------------------------- */

    /*
     * Render teks matematika secara konsisten.
     *
     * MathJax hanya merender ekspresi yang memiliki delimiter seperti
     * $...$, \( ... \), $$...$$, atau \[ ... \].
     *
     * Admin sebelumnya dapat menyimpan source seperti:
     *   1/2 x^{2}
     *   x^{2} + 2x + 1 = 0
     *   \frac{1}{2}x^{2}
     *
     * Source tanpa delimiter menyebabkan browser menampilkan raw LaTeX,
     * seperti pada screenshot. Fungsi ini menambahkan delimiter hanya
     * pada ekspresi yang memang terdeteksi sebagai matematika.
     */
    function renderStudentMath(value) {
      if (value === null || value === undefined) return '';

      let text = String(value);

      // Escape HTML terlebih dahulu. Source LaTeX tetap utuh.
      text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');

      text = text.replace(/\r?\n/g, '<br>');

      // Jika sudah menggunakan delimiter MathJax, jangan ubah lagi.
      if (
        text.includes('$$') ||
        text.includes('\\[') ||
        text.includes('\\]') ||
        text.includes('\\(') ||
        text.includes('\\)') ||
        /(^|[^$])\$[^$]+\$/.test(text)
      ) {
        return text;
      }

      // Pulihkan ekspresi matematika sederhana yang tersimpan tanpa delimiter.
      // Contoh: x^{2} -> \(x^{2}\)
      //         a_1 -> \(a_1\)
      //         \frac{1}{2} -> \(\frac{1}{2}\)
      const mathSignal =
        /\\(?:frac|sqrt|sum|prod|int|lim|sin|cos|tan|log|ln|alpha|beta|gamma|theta|pi|pm|times|cdot|leq|geq|neq|begin)\b|\^\{|_\{|\^\d|_\d/;

      if (mathSignal.test(text)) {
        const plain = text.replace(/<br>/g, ' ').trim();

        // Bila seluruh isi terlihat seperti ekspresi matematika,
        // perlakukan sebagai satu ekspresi display/inline.
        const pureMath = /^[0-9A-Za-z+\-*/=().,\s^_{}\\]+$/.test(plain) &&
          (/[\^_]/.test(plain) || /\\(?:frac|sqrt|sum|int|lim|sin|cos|tan|log|ln|alpha|beta|gamma|theta|pi|pm|times|cdot|leq|geq|neq|begin)/.test(plain));

        if (pureMath) {
          let expr = plain;

          // 1/2 x^{2} -> \frac{1}{2}x^{2}
          expr = expr.replace(/(^|[\s(])([0-9]+)\s*\/\s*([0-9]+)(?=\s*[A-Za-z(])/g, '$1\\frac{$2}{$3}');

          return '<span class=\"kanum-math-expression\">\\(' + expr + '\\)</span>';
        }

        // Untuk kalimat yang mengandung satu fragmen matematika,
        // bungkus fragmen sederhana tanpa mengubah teks lainnya.
        text = text.replace(
          /(^|[\s(:=])((?:[A-Za-z]\w*)?(?:\^\{[^{}]+\}|_\{[^{}]+\})+(?:\s*[+\-*/=]\s*(?:[A-Za-z0-9]|\\[A-Za-z]+|\{[^{}]+\}))*)(?=$|[\s,.;:)])/g,
          '$1\\($2\\)'
        );

        return text;
      }

      return text;
    }

    async function renderMath(element) {
      if (!element) return;

      // MathJax dapat selesai loading setelah renderQuestion().
      if (!window.MathJax || typeof MathJax.typesetPromise !== 'function') {
        setTimeout(() => renderMath(element), 120);
        return;
      }
      try {
        if (typeof MathJax.typesetClear === 'function') MathJax.typesetClear([element]);
        await MathJax.typesetPromise([element]);
      } catch (error) {
        console.warn('KANUM MathJax:', error);
      }
    }

    function setLoadingText(text) {
      const el =
        document.getElementById('loading-text');

      if (el) el.textContent = text;
    }

    function showError(message) {
      console.error(
        'KANUM quiz error:',
        message
      );

      document.getElementById('loading-state').style.display =
        'none';

      document.getElementById('quiz-section').style.display =
        'none';

      document.getElementById('result-section').style.display =
        'none';

      document.getElementById('error-state').style.display =
        'block';

      document.getElementById('error-msg').textContent =
        message;
    }

    function escHtml(value) {
      if (value === null || value === undefined) {
        return '';
      }

      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function escAttr(value) {
      return escHtml(value);
    }

})();
