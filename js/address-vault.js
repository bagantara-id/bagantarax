// ==========================================
// MESIN GUDANG KREDENSIAL ALAMAT (VAULT)
// ==========================================

window.AddressVault = {
    init: function() {
        const btnOpenVault = document.getElementById('btnOpenVault');
        const vaultOverlay = document.getElementById('vault-overlay');
        const btnCloseVault = document.getElementById('btnCloseVault');
        
        const btnTriggerFile = document.getElementById('btnTriggerFile');
        const fileBgnUpload = document.getElementById('fileBgnUpload');
        
        const btnProcessToken = document.getElementById('btnProcessToken');
        const inputToken = document.getElementById('inputToken');

        // Buka / Tutup Brankas
        if (btnOpenVault) btnOpenVault.addEventListener('click', () => vaultOverlay.classList.remove('hidden'));
        if (btnCloseVault) btnCloseVault.addEventListener('click', () => vaultOverlay.classList.add('hidden'));
        
        // Mode 1: Unggah File .bgn
        if (btnTriggerFile) btnTriggerFile.addEventListener('click', () => fileBgnUpload.click());
        if (fileBgnUpload) {
            fileBgnUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => this.processData(e.target.result);
                reader.readAsText(file);
            });
        }

        // Mode 2: Proses Token Alamat
        if (btnProcessToken) {
            btnProcessToken.addEventListener('click', () => {
                try {
                    const decoded = atob(inputToken.value.trim());
                    this.processData(decoded);
                } catch(err) {
                    alert("Token yang Anda tempelkan rusak atau tidak valid.");
                }
            });
        }
    },

    processData: function(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.dropoff || !data.pickup) throw new Error("Format rusak");
            
            document.getElementById('vault-overlay').classList.add('hidden');
            
            // Lemparkan data ke Mesin Wizard Flow untuk diproses
            if (window.applyVaultData) {
                window.applyVaultData(data);
            }
        } catch(e) {
            alert("File .bgn atau Token tidak valid untuk sistem BAGANTARA.");
        }
    },

    showSaveButton: function() {
        const actionArea = document.querySelector('.action-area');
        if (!document.getElementById('btnSaveVaultFinal')) {
            const btn = document.createElement('button');
            btn.id = 'btnSaveVaultFinal';
            btn.className = 'btn-primary w-full mt-2';
            btn.style.background = 'var(--void-black)';
            btn.style.color = 'var(--neon-gold)';
            btn.style.borderColor = 'var(--neon-gold)';
            btn.style.fontSize = '0.75rem';
            btn.innerHTML = '<i class="fa-solid fa-download"></i> SIMPAN ALAMAT INI (.BGN)';
            
            btn.addEventListener('click', () => {
                this.exportVault();
            });
            
            actionArea.parentElement.appendChild(btn);
        } else {
            document.getElementById('btnSaveVaultFinal').classList.remove('hidden');
        }
    },

    exportVault: function() {
        // Karena variabel dari map.js bersifat global, kita bisa menariknya
        const payload = {
            service: window.BAGANTARA_SERVICE || 'RIDE',
            dropoffCoords: typeof dropoffCoords !== 'undefined' ? dropoffCoords : null,
            pickupCoords: typeof pickupCoords !== 'undefined' ? pickupCoords : null,
            dropoff: window.BAGANTARA_DROPOFF_DETAIL,
            pickup: window.BAGANTARA_PICKUP_DETAIL
        };

        const jsonStr = JSON.stringify(payload);
        
        // Cetak File Fisik
        const blob = new Blob([jsonStr], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Alamat_Rumah.bgn';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Cetak Token
        const token = btoa(jsonStr);
        prompt("File .bgn berhasil diunduh ke HP Anda.\n\nAlternatif: Salin TOKEN ALAMAT di bawah ini untuk Anda simpan di Notes/WhatsApp:", token);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.AddressVault.init();
});
