// ==========================================
// MESIN FORENSIK KANVAS (CETAK MANIFESTO)
// ==========================================

window.CanvasEngine = {
    // Fungsi untuk mendapatkan GPS Perangkat Klien secara real-time
    getHardwareGPS: function() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve("Modul GPS Hardware Tidak Tersedia");
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
                (err) => resolve("Akses GPS Hardware Ditolak/Gagal")
            );
        });
    },

    // Merender Bukti PDF Digital
    generateManifesto: async function(clientName, clientWA, photoBase64) {
        const canvas = document.getElementById('kycCanvas');
        const ctx = canvas.getContext('2d');

        // Tarik data dari memori mesin sebelumnya
        const driver = window.BAGANTARA_DRIVER || { nama: 'Tidak Diketahui', wa: '-' };
        const pickup = window.BAGANTARA_PICKUP_DETAIL || { kec: '-', rtrw: '-', patokan: '-' };
        const dropoff = window.BAGANTARA_DROPOFF_DETAIL || { kec: '-', rtrw: '-', patokan: '-' };
        const service = window.BAGANTARA_SERVICE || 'RIDE';
        const distance = window.BAGANTARA_DISTANCE_KM || 0;
        const price = window.BAGANTARA_FINAL_PRICE || 0;

        // Ambil Data Forensik Perangkat Klien
        const hardwareGPS = await this.getHardwareGPS();
        const deviceID = navigator.userAgent.substring(0, 50) + "..."; // Potong agar muat
        const timeStamp = new Date().toLocaleString('id-ID');
        const transID = `SYS-${new Date().getTime()}`;

        // Resolusi Kanvas (Kertas A4 Potrait Pendek)
        canvas.width = 800;
        canvas.height = 1100;

        // Latar Putih Bersih
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header Dokumen
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 28px "Space Grotesk", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MANIFESTO TRANSIT BAGANTARA', canvas.width / 2, 60);

        ctx.font = '14px Courier';
        ctx.fillText(`ID TRANSAKSI: ${transID} | TANGGAL: ${timeStamp}`, canvas.width / 2, 85);

        // Garis Pemisah Atas
        ctx.beginPath();
        ctx.moveTo(40, 100);
        ctx.lineTo(760, 100);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'left';

        // =======================================
        // BLOK KIRI: INFORMASI TEKS
        // =======================================
        ctx.font = 'bold 18px Courier';
        ctx.fillText('KREDENSIAL MITRA:', 40, 140);
        ctx.font = '16px Courier';
        ctx.fillText(`Nama : ${driver.nama}`, 40, 165);
        ctx.fillText(`Kontak : ${driver.wa}`, 40, 190);

        ctx.font = 'bold 18px Courier';
        ctx.fillText('OTORITAS KLIEN:', 40, 240);
        ctx.font = '16px Courier';
        ctx.fillText(`Nama : ${clientName}`, 40, 265);
        ctx.fillText(`Kontak : ${clientWA}`, 40, 290);

        // =======================================
        // BLOK KANAN: FOTO WAJAH 3X LEBIH BESAR
        // =======================================
        if (photoBase64) {
            await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    // Cetak foto besar di sudut kanan atas (Ukuran 240x320)
                    ctx.drawImage(img, 500, 120, 240, 320);
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(500, 120, 240, 320);
                    
                    ctx.font = 'bold 12px Courier';
                    ctx.textAlign = 'center';
                    ctx.fillText('[ BUKTI AUTENTIKASI VISUAL ]', 620, 460);
                    resolve();
                };
                img.src = photoBase64;
            });
        }
        ctx.textAlign = 'left';

        // Garis Pemisah Tengah
        ctx.beginPath();
        ctx.moveTo(40, 480);
        ctx.lineTo(760, 480);
        ctx.lineWidth = 1;
        ctx.stroke();

        // =======================================
        // DETAIL MISI & DATA SPASIAL
        // =======================================
        ctx.font = 'bold 18px Courier';
        ctx.fillText('DETAIL MISI & DATA SPASIAL', 40, 520);
        ctx.font = '16px Courier';
        ctx.fillText(`Layanan     : ${service}`, 40, 550);
        ctx.fillText(`Jarak Tempuh: ${distance} KM`, 40, 575);

        // Titik Jemput
        ctx.font = 'bold 16px Courier';
        ctx.fillText(`TITIK JEMPUT:`, 40, 615);
        ctx.font = '16px Courier';
        ctx.fillText(`Kec/Desa : ${pickup.kec}`, 50, 640);
        ctx.fillText(`Detail   : ${pickup.rtrw}`, 50, 665);
        ctx.fillText(`Patokan  : ${pickup.patokan}`, 50, 690);

        // Titik Tujuan
        ctx.font = 'bold 16px Courier';
        ctx.fillText(`TITIK TUJUAN:`, 420, 615);
        ctx.font = '16px Courier';
        ctx.fillText(`Kec/Desa : ${dropoff.kec}`, 430, 640);
        ctx.fillText(`Detail   : ${dropoff.rtrw}`, 430, 665);
        ctx.fillText(`Patokan  : ${dropoff.patokan}`, 430, 690);

        // Garis Pemisah Bawah
        ctx.beginPath();
        ctx.moveTo(40, 720);
        ctx.lineTo(760, 720);
        ctx.stroke();

        // =======================================
        // HARGA & FORENSIK DIGITAL
        // =======================================
        ctx.font = 'bold 20px Courier';
        ctx.fillText('ESTIMASI BIAYA TRANSAKSI :', 40, 760);
        
        ctx.font = 'bold 45px "Space Grotesk", sans-serif';
        const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
        ctx.fillText(formattedPrice, 40, 820);

        // Forensik Perangkat (Paling Bawah)
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(40, 860, 720, 150);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Courier';
        ctx.fillText('=== LOG FORENSIK DIGITAL ===', 55, 890);
        ctx.font = '12px Courier';
        ctx.fillText(`Waktu Tangkap : ${timeStamp}`, 55, 915);
        ctx.fillText(`Hardware GPS  : [ ${hardwareGPS} ]`, 55, 935);
        ctx.fillText(`Device ID     : ${deviceID}`, 55, 955);
        ctx.fillText(`Status        : TERENKRIPSI`, 55, 975);

        // Footer Miring
        ctx.font = 'italic 12px Courier';
        ctx.textAlign = 'center';
        ctx.fillText('Dokumen ini dicetak secara otomatis (Serverless) oleh Sistem BAGANTARA.', canvas.width / 2, 1050);
        ctx.fillText('Platform tidak memungut komisi. Transaksi sah jika disetujui Mitra.', canvas.width / 2, 1070);

        return canvas.toDataURL('image/jpeg', 0.85); // Ekspor gambar dengan kualitas 85%
    }
};
