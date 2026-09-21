// ==========================================
// MESIN PEMINDAI GOOGLE SHEETS & AEGIS SANITIZER
// ==========================================

window.AegisEngine = {
    sanitizeText: function(text) {
        if (!text) return "";
        let clean = text.trim();
        // Sensor link ilegal, TAPI biarkan URL Cloudinary lolos
        clean = clean.replace(/(https?:\/\/(?!res\.cloudinary\.com)[^\s]+|www\.[^\s]+|\b\w+\.(com|id|me|net|org)\b)/gi, '[TAUTAN DIBLOKIR]');
        const badWords = ['anjing', 'bangsat', 'babi', 'kontol', 'memek', 'penipu', 'bajingan']; 
        const regexBad = new RegExp(`\\b(${badWords.join('|')})\\b`, 'gi');
        clean = clean.replace(regexBad, '***');
        return clean;
    },

    extractNumber: function(text) {
        if (!text) return 0;
        const numStr = text.replace(/[^0-9]/g, '');
        return numStr ? parseInt(numStr, 10) : 0;
    },

    validateWA: function(text) {
        if (!text) return null;
        let numStr = text.replace(/[^0-9]/g, '');
        if (numStr.startsWith('0')) {
            numStr = '62' + numStr.substring(1);
        }
        if (numStr.length < 10 || !numStr.startsWith('62')) return null;
        return numStr;
    },

    parseCsvRow: function(row) {
        let cols = [];
        let inQuotes = false;
        let col = '';
        for(let i = 0; i < row.length; i++) {
            let char = row[i];
            if(char === '"' && row[i+1] === '"') { col += '"'; i++; }
            else if(char === '"') { inQuotes = !inQuotes; }
            else if(char === ',' && !inQuotes) { cols.push(col); col = ''; }
            else { col += char; }
        }
        cols.push(col);
        return cols;
    },

    scanMitra: async function(targetService, routePrice) {
        try {
            const ts = new Date().getTime();
            const resJson = await fetch(`./data/drivers.json?t=${ts}`, { cache: 'no-store' });
            const data = await resJson.json();
            
            let availableDrivers = [];

            for (let url of data.driver_sheets) {
                try {
                    const resCsv = await fetch(`${url}&t=${ts}`, { cache: 'no-store' });
                    if (resCsv.ok) {
                        const csvText = await resCsv.text();
                        const lines = csvText.split('\n');
                        
                        // Eksekusi Baris ke-2 dst (Baris 1 diabaikan)
                        for (let i = 1; i < lines.length; i++) {
                            if (!lines[i].trim()) continue;
                            const cols = this.parseCsvRow(lines[i]);
                            
                            const status = this.sanitizeText(cols[0]).toUpperCase();
                            const layananList = this.sanitizeText(cols[1]).toUpperCase();
                            const nama = this.sanitizeText(cols[2]);
                            const wa = this.validateWA(cols[3]);
                            const plat = this.sanitizeText(cols[4]);
                            const info = this.sanitizeText(cols[5]);
                            const tarifMin = this.extractNumber(cols[6]);
                            
                            // Ekstraksi Kolom H (Index 7) - URL Foto Cloudinary
                            let fotoProfile = cols[7] ? cols[7].trim() : '';
                            // Jika kosong atau bukan link, fallback ke logo default
                            if (!fotoProfile.startsWith('http')) {
                                fotoProfile = './assets/icon-192.png';
                            }

                            if (status !== 'ON') continue;
                            if (!layananList.includes(targetService.toUpperCase())) continue;
                            if (!wa) continue;
                            if (routePrice > 0 && routePrice < tarifMin) continue;

                            availableDrivers.push({ nama, wa, plat, info, tarifMin, fotoProfile });
                        }
                    }
                } catch (errCsv) {
                    console.warn("Gagal terhubung ke satelit satu Mitra.");
                }
            }
            return availableDrivers;
        } catch (err) {
            console.error("Aegis Engine Error:", err);
            return [];
        }
    },

    renderMitraList: async function(targetService, routePrice) {
        const container = document.getElementById('driverListContainer');
        container.innerHTML = `
            <div class="text-center mt-4">
                <i class="fa-solid fa-satellite-dish fa-spin text-gold text-3xl mb-3" style="filter: drop-shadow(0 0 10px var(--neon-gold-glow));"></i>
                <div class="font-tech text-main text-sm font-bold" style="letter-spacing: 1px;">MEMINDAI RADAR...</div>
                <div class="text-muted text-xs mt-2">Mencari Mitra ${targetService} dengan batas tarif Rp ${routePrice.toLocaleString('id-ID')}</div>
            </div>
        `;

        const drivers = await this.scanMitra(targetService, routePrice);
        
        container.innerHTML = ''; 

        if (drivers.length === 0) {
            container.innerHTML = `
                <div class="glass-panel text-center text-muted" style="padding: 25px; border-radius: 16px;">
                    <i class="fa-solid fa-triangle-exclamation text-gold text-2xl mb-2"></i><br>
                    <b class="text-main">Radar Kosong.</b><br>Tidak ada Mitra ${targetService} yang tersedia di jangkauan tarif ini.
                </div>
            `;
            return;
        }

        // Render Kartu Mitra dengan Profil Gambar 3D Layout
        drivers.forEach(d => {
            const card = document.createElement('div');
            card.className = 'glass-panel';
            card.style.cssText = 'padding: 15px; border-radius: 16px; display: flex; flex-direction: column; gap: 10px; border-left: 3px solid var(--neon-gold);';
            
            let infoHtml = d.info ? `<div class="text-muted" style="font-size: 0.75rem; font-style: italic; border-left: 2px solid rgba(255,255,255,0.1); padding-left: 8px; margin-top: 5px;">"${d.info}"</div>` : '';
            
            card.innerHTML = `
                <div style="display: flex; gap: 15px; align-items: flex-start;">
                    <!-- Foto Profil Elite -->
                    <div style="flex-shrink: 0; width: 50px; height: 50px; border-radius: 50%; padding: 2px; background: linear-gradient(135deg, var(--neon-gold), #8a6327); box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                        <img src="${d.fotoProfile}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: var(--void-black);" onerror="this.src='./assets/icon-192.png'">
                    </div>
                    
                    <!-- Informasi Utama -->
                    <div style="flex-grow: 1;">
                        <div class="font-tech font-bold text-main" style="font-size: 0.95rem; line-height: 1.2;">${d.nama}</div>
                        <div class="text-neon" style="font-size: 0.7rem; font-weight: 600; letter-spacing: 0.5px; margin-top: 2px;">${d.plat}</div>
                    </div>
                    
                    <!-- Harga Minimum -->
                    <div class="text-right" style="flex-shrink: 0;">
                        <div class="text-muted" style="font-size: 0.55rem; letter-spacing: 0.5px;">MIN. TARIF</div>
                        <div class="text-gold font-tech font-bold" style="font-size: 0.85rem;">Rp ${d.tarifMin.toLocaleString('id-ID')}</div>
                    </div>
                </div>
                ${infoHtml}
                <button class="btn-primary mt-2 btn-pilih-driver" style="padding: 10px; font-size: 0.75rem;" data-nama="${d.nama}" data-wa="${d.wa}">
                    <i class="fa-solid fa-lock"></i> KUNCI MITRA INI
                </button>
            `;
            container.appendChild(card);
        });

        document.querySelectorAll('.btn-pilih-driver').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nama = e.currentTarget.getAttribute('data-nama');
                const wa = e.currentTarget.getAttribute('data-wa');
                
                window.BAGANTARA_DRIVER = { nama, wa };
                document.getElementById('client-form-overlay').classList.remove('hidden');
            });
        });
    }
};
