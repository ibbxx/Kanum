/**
 * KANUM – Budaya Page Logic
 */
(function () {
  'use strict';

        // ============================================================
        // FUNGSI LOGOUT
        // ============================================================
        function handleLogout(event) {
          if (event) event.preventDefault();
          (async () => {
            try { await _sb.auth.signOut(); } catch(e) { console.warn(e); }
            window.location.href = '/login';
          })();
        }

        // ============================================================
        // FUNGSI NAVIGASI KE BUDAYA-DETAIL DENGAN PARAMETER TOPIC
        // ============================================================
        function navigateToDetail(topic) {
            console.log('Navigasi ke:', topic);
            // Simpan topic ke localStorage sebagai fallback
            localStorage.setItem('budaya_topic', topic);
            // Arahkan ke halaman detail dengan parameter
            window.location.href = './budaya-detail.html?topic=' + topic;
        }

        // Micro-interactions and subtle parallax
        document.addEventListener('mousemove', (e) => {
            const masks = document.querySelectorAll('.cultural-mask');
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            masks.forEach(mask => {
                mask.style.backgroundPosition = `${x * 10}px ${y * 10}px`;
            });
        });

        // Entrance animations for cards
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.grid > div, section').forEach(el => {
            el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
            observer.observe(el);
        });

})();
