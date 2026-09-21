// ==========================================
// MESIN UTAMA: NAVIGASI SPA & AUTO THEME
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. MESIN AUTO-THEME (Berbasis Waktu Hardware Klien)
    function updateTimeTheme() {
        const hour = new Date().getHours();
        // Siang (Terang): 06:00 - 17:59 | Malam (Gelap): 18:00 - 05:59
        if (hour >= 6 && hour < 18) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }
    
    // Eksekusi mutlak saat aplikasi dibuka
    updateTimeTheme();
    
    // Eksekusi ulang jika klien meminimalkan aplikasi lalu membukanya lagi beberapa jam kemudian
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateTimeTheme();
    });

    // 2. SISTEM NAVIGASI SPA (Pindah Layar Instan)
    window.spaNavigateTo = function(viewId) {
        const views = document.querySelectorAll('.spa-view');
        views.forEach(view => {
            if (view.id === viewId) {
                view.classList.remove('hidden-view');
                view.classList.add('active-view');
            } else {
                view.classList.remove('active-view');
                view.classList.add('hidden-view');
            }
        });
    };

    // 3. LOGIKA BOTTOM NAVIGATION (Beranda, Aktivitas, Bantuan)
    const navHome = document.getElementById('navHome');
    const navActivity = document.getElementById('navActivity');
    const navHelp = document.getElementById('navHelp');
    
    const helpOverlay = document.getElementById('help-overlay');
    const btnCloseHelp = document.getElementById('btnCloseHelp');

    function resetNavs() {
        navHome.classList.remove('active');
        navActivity.classList.remove('active');
        navHelp.classList.remove('active');
    }

    // Navigasi Beranda (Kembali ke Pilih Layanan & Reset Wizard)
    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        resetNavs();
        navHome.classList.add('active');
        window.spaNavigateTo('view-dashboard');
        if (window.resetWizard) window.resetWizard(); 
    });

    // Navigasi Aktivitas (Riwayat)
    navActivity.addEventListener('click', (e) => {
        e.preventDefault();
        resetNavs();
        navActivity.classList.add('active');
        alert("Modul Riwayat Aktivitas akan aktif setelah misi pertama Anda selesai.");
    });

    // Navigasi Bantuan (Deklarasi Transparansi)
    navHelp.addEventListener('click', (e) => {
        e.preventDefault();
        resetNavs();
        navHelp.classList.add('active');
        helpOverlay.classList.remove('hidden');
    });

    btnCloseHelp.addEventListener('click', () => {
        helpOverlay.classList.add('hidden');
        resetNavs();
        navHome.classList.add('active');
    });

    // 4. MITIGASI FULLSCREEN
    const btnFs = document.getElementById('btnFullscreen');
    const iconFs = btnFs.querySelector('i');
    const textFs = btnFs.querySelector('span');

    btnFs.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.warn("Fullscreen diblokir browser"));
            iconFs.classList.replace('fa-expand', 'fa-compress');
            textFs.innerText = "MIN";
        } else {
            document.exitFullscreen().catch(err => console.warn(err));
            iconFs.classList.replace('fa-compress', 'fa-expand');
            textFs.innerText = "MAX";
        }
    });
});
  
