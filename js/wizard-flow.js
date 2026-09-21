// ==========================================
// MESIN WIZARD FLOW (PEMANDU LANGKAH ELITE)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    const serviceCards = document.querySelectorAll('.service-card');
    const btnWizardNext = document.getElementById('btnWizardNext');
    const wizardInstruction = document.getElementById('wizardInstruction');
    const priceArea = document.getElementById('priceArea');
    
    const addressFormOverlay = document.getElementById('address-form-overlay');
    const formAddressTitle = document.getElementById('formAddressTitle');
    const inputKecamatan = document.getElementById('inputKecamatan');
    const inputRtRw = document.getElementById('inputRtRw');
    const inputPatokanDetail = document.getElementById('inputPatokanDetail');
    const btnSaveAddress = document.getElementById('btnSaveAddress');
    const btnCancelAddress = document.getElementById('btnCancelAddress');
    
    let currentState = 'START'; 

    // Kontrol Tombol Pembatalan di Layar Daftar Mitra
    const btnBackToMap = document.getElementById('btnBackToMap');
    if (btnBackToMap) {
        btnBackToMap.addEventListener('click', () => {
            window.spaNavigateTo('view-map');
        });
    }

    // 1. Memicu Wizard dari Dashboard
    serviceCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const service = e.currentTarget.getAttribute('data-service');
            window.BAGANTARA_SERVICE = service;
            document.getElementById('labelLayananPeta').innerText = service;
            
            window.spaNavigateTo('view-map');
            setWizardState('DROPOFF_PIN');
            
            setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 300);
        });
    });

    // 2. Kontrol Tombol Utama (Integrasi Aegis Engine)
    btnWizardNext.addEventListener('click', () => {
        if (currentState === 'DROPOFF_PIN') {
            setWizardState('DROPOFF_FORM');
        } else if (currentState === 'PICKUP_PIN') {
            setWizardState('PICKUP_FORM');
        } else if (currentState === 'FINAL') {
            // Lempar klien ke Layar Daftar Driver
            window.spaNavigateTo('view-drivers');
            
            // Eksekusi Mesin Deep-Scan Google Sheets
            if (window.AegisEngine) {
                window.AegisEngine.renderMitraList(window.BAGANTARA_SERVICE, window.BAGANTARA_FINAL_PRICE);
            }
        }
    });

    // 3. Simpan Detail Alamat dari Form
    btnSaveAddress.addEventListener('click', () => {
        const kec = inputKecamatan.value.trim();
        const rtrw = inputRtRw.value.trim();
        const patokan = inputPatokanDetail.value.trim();

        if (kec.length < 3 || rtrw.length < 2 || patokan.length < 3) {
            alert("Harap lengkapi semua kolom (Kecamatan, RT/RW, dan Patokan) agar Mitra tidak tersasar.");
            return;
        }

        if (currentState === 'DROPOFF_FORM') {
            window.BAGANTARA_DROPOFF_DETAIL = { kec, rtrw, patokan };
            setWizardState('PICKUP_PIN');
        } else if (currentState === 'PICKUP_FORM') {
            window.BAGANTARA_PICKUP_DETAIL = { kec, rtrw, patokan };
            setWizardState('FINAL');
        }
    });

    btnCancelAddress.addEventListener('click', () => {
        if (currentState === 'DROPOFF_FORM') setWizardState('DROPOFF_PIN');
        else if (currentState === 'PICKUP_FORM') setWizardState('PICKUP_PIN');
    });

    // Menangkap Jarak & Mengambil Tarif Dinamis dari tariffs.json
    window.addEventListener('priceCalculated', async (e) => {
        const distance = e.detail.distance;
        let price = 0;
        window.BAGANTARA_DISTANCE_KM = distance; // Simpan untuk PDF Canvas di Tahap 7
        
        try {
            const ts = new Date().getTime();
            const res = await fetch(`./data/tariffs.json?t=${ts}`, { cache: 'no-store' });
            const tariffData = await res.json();
            
            const service = window.BAGANTARA_SERVICE || 'RIDE';
            const rules = tariffData.layanan[service];
            const minDist = tariffData.jarak_minimum_km;
            
            if (distance <= minDist) {
                price = rules.tarif_dasar;
            } else {
                const excess = distance - minDist;
                price = rules.tarif_dasar + (excess * rules.tarif_per_km);
            }
        } catch (err) {
            console.warn("Gagal terhubung ke tariffs.json, menggunakan kalkulator darurat.");
            const basePrice = 8000; 
            if(distance <= 2) price = basePrice;
            else price = basePrice + ((distance - 2) * 2500); 
        }
        
        window.BAGANTARA_FINAL_PRICE = Math.ceil(price / 100) * 100; 
        
        document.getElementById('priceValue').innerText = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(window.BAGANTARA_FINAL_PRICE);
    });

    function setWizardState(newState) {
        currentState = newState;
        
        if (newState !== 'DROPOFF_FORM' && newState !== 'PICKUP_FORM') {
            addressFormOverlay.classList.add('hidden');
        }

        switch (newState) {
            case 'DROPOFF_PIN':
                wizardInstruction.innerText = '1. GESER PETA KE LOKASI TUJUAN';
                btnWizardNext.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> KUNCI TITIK TUJUAN';
                btnWizardNext.className = 'btn-primary w-full pulse-attention';
                priceArea.classList.add('hidden');
                
                window.dispatchEvent(new CustomEvent('wizardState', { detail: 'DROPOFF' }));
                break;
                
            case 'DROPOFF_FORM':
                formAddressTitle.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> DETAIL ALAMAT TUJUAN';
                inputKecamatan.value = window.TEMPORARY_GEOCODE || ''; 
                inputRtRw.value = '';
                inputPatokanDetail.value = '';
                addressFormOverlay.classList.remove('hidden');
                break;

            case 'PICKUP_PIN':
                wizardInstruction.innerText = '2. GESER PETA KE LOKASI JEMPUT';
                btnWizardNext.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> KUNCI LOKASI JEMPUT';
                btnWizardNext.className = 'btn-primary w-full pulse-attention';
                
                window.dispatchEvent(new CustomEvent('wizardState', { detail: 'PICKUP' }));
                break;
                
            case 'PICKUP_FORM':
                formAddressTitle.innerHTML = '<i class="fa-solid fa-map-pin"></i> DETAIL ALAMAT JEMPUT';
                inputKecamatan.value = window.TEMPORARY_GEOCODE || '';
                inputRtRw.value = '';
                inputPatokanDetail.value = '';
                addressFormOverlay.classList.remove('hidden');
                break;

            case 'FINAL':
                wizardInstruction.innerText = '3. KONFIRMASI & CARI MITRA';
                btnWizardNext.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> CARI MITRA SEKARANG';
                btnWizardNext.className = 'btn-primary w-full';
                btnWizardNext.style.background = 'linear-gradient(135deg, #fceabb 0%, var(--neon-gold) 50%, var(--neon-gold-dark) 100%)';
                btnWizardNext.style.color = '#02040a';
                priceArea.classList.remove('hidden');
                
                if (window.AddressVault) window.AddressVault.showSaveButton();
                window.dispatchEvent(new CustomEvent('wizardState', { detail: 'CALCULATE' }));
                break;
        }
    }
    
    window.resetWizard = function() {
        setWizardState('START');
        priceArea.classList.add('hidden');
        btnWizardNext.style.background = '';
        btnWizardNext.style.color = '';
        const btnSaveVault = document.getElementById('btnSaveVaultFinal');
        if (btnSaveVault) btnSaveVault.classList.add('hidden');
    }

    window.applyVaultData = function(data) {
        window.BAGANTARA_SERVICE = data.service || 'RIDE';
        document.getElementById('labelLayananPeta').innerText = window.BAGANTARA_SERVICE;
        window.BAGANTARA_DROPOFF_DETAIL = data.dropoff;
        window.BAGANTARA_PICKUP_DETAIL = data.pickup;

        window.spaNavigateTo('view-map');
        
        window.dispatchEvent(new CustomEvent('wizardState', { detail: 'DROPOFF' }));
        if(typeof map !== 'undefined') map.setView([data.dropoffCoords.lat, data.dropoffCoords.lng], 16, {animate: false});
        
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('wizardState', { detail: 'PICKUP' }));
            if(typeof map !== 'undefined') map.setView([data.pickupCoords.lat, data.pickupCoords.lng], 16, {animate: false});
            
            setTimeout(() => { setWizardState('FINAL'); }, 300);
        }, 300);
    };
});
