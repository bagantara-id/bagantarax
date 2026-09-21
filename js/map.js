// ==========================================
// MESIN PETA DINAMIS & KOMPENSASI JARAK
// ==========================================

let map;
let pickupCoords = null;
let dropoffCoords = null;
let activeMode = 'DROPOFF'; // Sesuai Wizard Flow (Tujuan dulu)
let routingLine = null;
let markerPickup = null;
let markerDropoff = null;

// Elemen Peta
const centerPinContainer = document.createElement('div');
const pinLabel = document.createElement('div');
const pinImgWrapper = document.createElement('div');
const pinImg = document.createElement('img');

document.addEventListener('DOMContentLoaded', () => {
    // Kita menunda inisiasi peta sampai layar peta benar-benar dipanggil
    // Ini mencegah bug abu-abu pada Leaflet saat di-render di display:none
});

function initMapEngine() {
    if (map) return; // Jangan inisiasi dua kali

    const mapContainer = document.getElementById('map-container');
    
    // Koordinat Default (Indonesia / Netral)
    map = L.map('map-container', { zoomControl: false, attributionControl: false }).setView([-7.768851, 112.196443], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // Kunci Satelit GPS Klien otomatis
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            map.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
        }, (err) => {
            console.warn("GPS Tidak Terkunci, menggunakan lokasi default.");
        });
    }

    setupCenterPin(mapContainer);
    
    // Tombol Floating GPS
    document.getElementById('btnMyGPS').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { duration: 1 });
            });
        }
    });
}

function setupCenterPin(mapContainer) {
    centerPinContainer.className = 'center-pin-container';
    pinLabel.className = 'pin-label';
    pinImgWrapper.className = 'pin-img-wrapper';
    
    pinImg.src = './assets/dropoff.png'; // Default Tujuan Biru
    pinImg.onerror = () => { console.warn("Aset dropoff.png tidak ditemukan!"); };
    
    pinImgWrapper.appendChild(pinImg);
    centerPinContainer.appendChild(pinLabel);
    centerPinContainer.appendChild(pinImgWrapper);
    mapContainer.appendChild(centerPinContainer);

    updatePinVisual(activeMode);

    map.on('movestart', () => {
        mapContainer.classList.add('map-is-moving');
        pinLabel.innerText = "MEMINDAI AREA...";
    });

    map.on('moveend', () => {
        mapContainer.classList.remove('map-is-moving');
        if (navigator.vibrate) navigator.vibrate(40); 

        const center = map.getCenter();
        updatePinVisual(activeMode); // Kembalikan Teks
        
        // Terjemahkan kordinat ke Alamat Kecamatan/Desa, simpan di Memori Sementara untuk Form (Tahap 3)
        fetchAddressForForm(center.lat, center.lng);
        
        // Simpan koordinat saat ini
        if (activeMode === 'DROPOFF') {
            dropoffCoords = center;
        } else if (activeMode === 'PICKUP') {
            pickupCoords = center;
        }
    });
}

function updatePinVisual(mode) {
    if (mode === 'DROPOFF') {
        pinLabel.innerText = 'TITIK TUJUAN (GESER PETA)';
        pinLabel.style.borderColor = '#3b82f6';
        pinImg.src = './assets/dropoff.png';
    } else {
        pinLabel.innerText = 'TITIK JEMPUT (GESER PETA)';
        pinLabel.style.borderColor = 'var(--neon-green)';
        pinImg.src = './assets/pickup.png';
    }
}

// Menanamkan Pin Statis setelah form disubmit
function dropStaticMarker(mode, coords) {
    const iconUrl = mode === 'PICKUP' ? './assets/pickup.png' : './assets/dropoff.png';
    
    const customIcon = L.divIcon({
        className: 'custom-static-pin',
        html: `<img src="${iconUrl}" style="width: 35px; height: 35px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));">`,
        iconSize: [35, 35],
        iconAnchor: [17.5, 35] // Anchor di bagian bawah gambar pin
    });

    if (mode === 'PICKUP') {
        if (markerPickup) map.removeLayer(markerPickup);
        markerPickup = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);
    } else {
        if (markerDropoff) map.removeLayer(markerDropoff);
        markerDropoff = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);
    }
}

// Membaca Alamat dari Satelit OpenStreetMap
async function fetchAddressForForm(lat, lng) {
    window.TEMPORARY_GEOCODE = "Mengambil data satelit...";
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.address) {
            // Ekstrak nama Desa dan Kecamatan
            const village = data.address.village || data.address.suburb || data.address.neighbourhood || '';
            const district = data.address.city_district || data.address.town || data.address.county || '';
            const city = data.address.city || data.address.state || '';
            
            // Format: "Desa Tulungrejo, Kec. Pare, Kab. Kediri"
            let finalName = [];
            if(village) finalName.push(village);
            if(district) finalName.push(district);
            if(city) finalName.push(city);
            
            window.TEMPORARY_GEOCODE = finalName.length > 0 ? finalName.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
        } else {
            window.TEMPORARY_GEOCODE = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    } catch (error) {
        window.TEMPORARY_GEOCODE = "Gagal memuat alamat. Ketik manual.";
    }
}

// Rumus Jarak Garis Lurus (Pembanding Anti-Kecurangan OSRM)
function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Menerima Komando dari Wizard Flow
window.addEventListener('wizardState', (e) => {
    const state = e.detail;
    
    // Inisiasi peta jika belum
    initMapEngine();
    
    if (state === 'DROPOFF') {
        activeMode = 'DROPOFF';
        centerPinContainer.style.display = 'flex';
        updatePinVisual('DROPOFF');
    } 
    else if (state === 'PICKUP') {
        activeMode = 'PICKUP';
        // Tancapkan pin statis Tujuan yang baru saja dikunci klien
        if(dropoffCoords) dropStaticMarker('DROPOFF', dropoffCoords);
        centerPinContainer.style.display = 'flex';
        updatePinVisual('PICKUP');
        
        // Pindah kamera otomatis ke titik jemput awal (berdasar GPS HP) agar klien tidak usah geser jauh dari titik tujuan tadi
        if (navigator.geolocation && !pickupCoords) {
            navigator.geolocation.getCurrentPosition((pos) => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
            });
        }
    }
    else if (state === 'CALCULATE') {
        // Tancapkan pin statis Jemput
        if(pickupCoords) dropStaticMarker('PICKUP', pickupCoords);
        
        // Matikan pin tengah (melayang)
        centerPinContainer.style.display = 'none';
        
        // Hitung Rute OSRM
        if (pickupCoords && dropoffCoords) {
            calculatePrecisionRoute(pickupCoords, dropoffCoords);
            // Sesuaikan Zoom Kamera agar mencakup kedua titik
            const group = new L.featureGroup([markerPickup, markerDropoff]);
            map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }
});

async function calculatePrecisionRoute(start, end) {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    let finalDistanceKm = 0;

    try {
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code === 'Ok') {
            const route = data.routes[0];
            const osrmDistance = route.distance / 1000; 
            const haversineDistance = getHaversineDistance(start.lat, start.lng, end.lat, end.lng);
            
            // KOMPENSASI MULTIPLIER: OSRM Gratisan kita tambah 15% agar harga relevan
            const compensatedOsrm = osrmDistance * 1.15;
            
            if (compensatedOsrm > haversineDistance * 2) {
                finalDistanceKm = haversineDistance * 1.30;
            } else {
                finalDistanceKm = compensatedOsrm;
            }

            if (routingLine) map.removeLayer(routingLine);

            routingLine = L.geoJSON(route.geometry, {
                style: { color: 'var(--neon-gold)', weight: 5, opacity: 0.8, dashArray: '10, 10' }
            }).addTo(map);
        }
    } catch (error) {
        finalDistanceKm = getHaversineDistance(start.lat, start.lng, end.lat, end.lng) * 1.30;
    }

    finalDistanceKm = parseFloat(finalDistanceKm.toFixed(2));

    // Kirim harga ke Wizard Flow untuk diproses
    window.dispatchEvent(new CustomEvent('priceCalculated', {
        detail: { distance: finalDistanceKm }
    }));
}
