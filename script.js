// State Management
let currentLoker = 1;
let allData = null;
let syncInterval = null;
let isSaving = false;

// DOM Elements
const lokerNavList = document.getElementById('lokerNavList');
const lokerNumber = document.getElementById('lokerNumber');
const namaCustomer = document.getElementById('namaCustomer');
const pinLoker = document.getElementById('pinLoker');
const statusLoker = document.getElementById('statusLoker');
const tanggalLoker = document.getElementById('tanggalLoker');
const petugasInput = document.getElementById('petugasInput');
const selectPetugas = document.getElementById('selectPetugas');
const uploadFoto = document.getElementById('uploadFoto');
const previewFoto = document.getElementById('previewFoto');
const dataDisplay = document.getElementById('dataDisplay');
const btnSave = document.getElementById('btnSave');
const btnClearForm = document.getElementById('btnClearForm');
const btnClearAllData = document.getElementById('btnClearAllData');
const syncStatus = document.getElementById('syncStatus');
const modalZoom = document.getElementById('modalZoom');
const zoomImage = document.getElementById('zoomImage');

// ========== FUNGSI GITHUB API ==========
async function loadDataFromGitHub() {
    try {
        syncStatus.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Mengambil data...';
        syncStatus.className = 'sync-status syncing';
        
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            // File belum ada, buat baru
            await createInitialData();
            return;
        }

        const data = await response.json();
        const content = atob(data.content);
        allData = JSON.parse(content);
        
        // Update SHA untuk commit berikutnya
        allData.sha = data.sha;
        
        updateUI();
        syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Tersinkronasi';
        syncStatus.className = 'sync-status synced';
        
        setTimeout(() => {
            if (syncStatus.className !== 'syncing') {
                syncStatus.style.opacity = '0';
            }
        }, 2000);
    } catch (error) {
        console.error('Error loading data:', error);
        syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal sync, coba lagi';
        syncStatus.className = 'sync-status error';
        
        // Fallback ke local storage jika offline
        const localData = localStorage.getItem('loker_backup');
        if (localData) {
            allData = JSON.parse(localData);
            updateUI();
        }
    }
}

async function createInitialData() {
    try {
        // Buat folder data dulu
        const content = btoa(JSON.stringify(DEFAULT_DATA, null, 2));
        
        await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Initial data for lockers',
                content: content
            })
        });
        
        allData = { ...DEFAULT_DATA };
        updateUI();
    } catch (error) {
        console.error('Error creating data:', error);
        allData = { ...DEFAULT_DATA };
        updateUI();
    }
}

async function saveDataToGitHub() {
    if (isSaving) return;
    isSaving = true;
    
    try {
        syncStatus.innerHTML = '<i class="fas fa-save"></i> Menyimpan...';
        syncStatus.className = 'sync-status syncing';
        syncStatus.style.opacity = '1';
        
        allData.lastUpdated = new Date().toISOString();
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(allData, null, 2))));
        
        const body = {
            message: `Update data loker ${currentLoker} - ${new Date().toLocaleString()}`,
            content: content,
            sha: allData.sha
        };
        
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const result = await response.json();
        allData.sha = result.content.sha;
        
        // Backup ke local storage
        localStorage.setItem('loker_backup', JSON.stringify(allData));
        
        syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Tersimpan!';
        syncStatus.className = 'sync-status synced';
        
        setTimeout(() => {
            if (syncStatus.className !== 'syncing') {
                syncStatus.style.opacity = '0';
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error saving:', error);
        syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal simpan';
        syncStatus.className = 'sync-status error';
        
        // Backup ke local storage
        localStorage.setItem('loker_backup', JSON.stringify(allData));
    } finally {
        isSaving = false;
    }
}

// ========== FUNGSI UTAMA ==========
function updateUI() {
    if (!allData) return;
    
    // Update navigasi
    renderNavButtons();
    
    // Update form dengan data loker saat ini
    const lokerData = allData.lokers[currentLoker - 1];
    if (lokerData) {
        namaCustomer.value = lokerData.namaCustomer || '';
        pinLoker.value = lokerData.pinLoker || '';
        statusLoker.value = lokerData.status || 'belum';
        tanggalLoker.value = lokerData.tanggal || '';
        petugasInput.value = lokerData.petugas || '';
        
        // Tampilkan foto jika ada
        if (lokerData.fotoBase64) {
            previewFoto.innerHTML = `<img src="${lokerData.fotoBase64}" class="preview-img" onclick="zoomPhoto('${lokerData.fotoBase64}')">`;
        } else {
            previewFoto.innerHTML = '';
        }
        
        // Update display data
        displayData();
    }
}

function renderNavButtons() {
    lokerNavList.innerHTML = '';
    for (let i = 1; i <= 40; i++) {
        const btn = document.createElement('button');
        btn.className = `loker-nav-btn ${currentLoker === i ? 'active' : ''}`;
        
        const lokerData = allData.lokers[i - 1];
        const hasData = lokerData && lokerData.namaCustomer;
        
        btn.innerHTML = `
            <span class="loker-num">${i}</span>
            ${hasData ? '<i class="fas fa-check-circle has-data"></i>' : ''}
        `;
        
        btn.onclick = () => selectLoker(i);
        lokerNavList.appendChild(btn);
    }
}

function selectLoker(num) {
    currentLoker = num;
    lokerNumber.textContent = num;
    renderNavButtons();
    
    const lokerData = allData.lokers[num - 1];
    namaCustomer.value = lokerData.namaCustomer || '';
    pinLoker.value = lokerData.pinLoker || '';
    statusLoker.value = lokerData.status || 'belum';
    tanggalLoker.value = lokerData.tanggal || '';
    petugasInput.value = lokerData.petugas || '';
    
    if (lokerData.fotoBase64) {
        previewFoto.innerHTML = `<img src="${lokerData.fotoBase64}" class="preview-img" onclick="zoomPhoto('${lokerData.fotoBase64}')">`;
    } else {
        previewFoto.innerHTML = '';
    }
    
    displayData();
}

function displayData() {
    const lokerData = allData.lokers[currentLoker - 1];
    if (!lokerData) return;
    
    const hasData = lokerData.namaCustomer;
    
    if (!hasData) {
        dataDisplay.innerHTML = '<p class="empty-data"><i class="fas fa-inbox"></i><br>Belum ada data untuk loker ini</p>';
        return;
    }
    
    dataDisplay.innerHTML = `
        <div class="data-item">
            <strong><i class="fas fa-user"></i> Nama:</strong> 
            <span>${lokerData.namaCustomer || '-'}</span>
        </div>
        <div class="data-item">
            <strong><i class="fas fa-tag"></i> PIN:</strong> 
            <span>${lokerData.pinLoker || '-'}</span>
        </div>
        <div class="data-item">
            <strong><i class="fas fa-check-circle"></i> Status:</strong> 
            <span class="status-badge ${lokerData.status === 'sudah' ? 'status-taken' : 'status-pending'}">
                ${lokerData.status === 'sudah' ? '✓ Sudah Diambil' : '⏳ Belum Diambil'}
            </span>
        </div>
        <div class="data-item">
            <strong><i class="fas fa-calendar"></i> Tanggal:</strong> 
            <span>${lokerData.tanggal || '-'}</span>
        </div>
        <div class="data-item">
            <strong><i class="fas fa-user-check"></i> Petugas:</strong> 
            <span>${lokerData.petugas || '-'}</span>
        </div>
        ${lokerData.fotoBase64 ? `
            <div class="data-item">
                <strong><i class="fas fa-camera"></i> Foto Bukti:</strong>
                <div class="saved-photo">
                    <img src="${lokerData.fotoBase64}" class="saved-img" onclick="zoomPhoto('${lokerData.fotoBase64}')">
                </div>
            </div>
        ` : ''}
    `;
}

// ========== FUNGSI FORM ==========
async function saveData() {
    // Validasi PIN minimal 4 digit
    const pin = pinLoker.value.trim();
    if (pin && pin.length < 4) {
        alert('PIN minimal 4 digit!');
        return;
    }
    
    // Validasi petugas
    const petugas = selectPetugas.value;
    if (!petugas) {
        alert('Silakan pilih petugas terlebih dahulu!');
        return;
    }
    
    // Get current date
    const now = new Date();
    const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    
    // Update data
    allData.lokers[currentLoker - 1] = {
        ...allData.lokers[currentLoker - 1],
        nomor: currentLoker,
        namaCustomer: namaCustomer.value.trim(),
        pinLoker: pin,
        status: statusLoker.value,
        tanggal: tanggal,
        petugas: petugas,
        fotoBase64: allData.lokers[currentLoker - 1]?.fotoBase64 || ''
    };
    
    await saveDataToGitHub();
    renderNavButtons();
    displayData();
    
    // Reset upload foto jika sudah disimpan
    uploadFoto.value = '';
}

function clearForm() {
    namaCustomer.value = '';
    pinLoker.value = '';
    statusLoker.value = 'belum';
    tanggalLoker.value = '';
    // Petugas tetap dari dropdown
    previewFoto.innerHTML = '';
    uploadFoto.value = '';
}

async function clearAllData() {
    if (confirm('PERINGATAN! Ini akan menghapus SEMUA data dari 40 loker. Lanjutkan?')) {
        if (confirm('Data akan dihapus PERMANEN dari GitHub. Yakin?')) {
            allData.lokers = [];
            for (let i = 1; i <= 40; i++) {
                allData.lokers.push({
                    nomor: i,
                    namaCustomer: '',
                    pinLoker: '',
                    status: 'belum',
                    tanggal: '',
                    petugas: '',
                    fotoBase64: ''
                });
            }
            await saveDataToGitHub();
            selectLoker(1);
            alert('Semua data telah dihapus!');
        }
    }
}

// Handle foto upload
uploadFoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64 = event.target.result;
            previewFoto.innerHTML = `<img src="${base64}" class="preview-img" onclick="zoomPhoto('${base64}')">`;
            allData.lokers[currentLoker - 1].fotoBase64 = base64;
        };
        reader.readAsDataURL(file);
    }
});

// Zoom photo function (global)
window.zoomPhoto = (src) => {
    modalZoom.style.display = 'flex';
    zoomImage.src = src;
};

// Close modal
document.querySelector('.close-modal').onclick = () => {
    modalZoom.style.display = 'none';
};

modalZoom.onclick = (e) => {
    if (e.target === modalZoom) {
        modalZoom.style.display = 'none';
    }
};

// Navigation
document.getElementById('prevNav').onclick = () => {
    if (currentLoker > 1) selectLoker(currentLoker - 1);
};
document.getElementById('nextNav').onclick = () => {
    if (currentLoker < 40) selectLoker(currentLoker + 1);
};

// Event listeners
btnSave.onclick = saveData;
btnClearForm.onclick = clearForm;
btnClearAllData.onclick = clearAllData;
selectPetugas.onchange = () => {
    petugasInput.value = selectPetugas.value;
};

// Auto sync setiap 30 detik
function startAutoSync() {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
        loadDataFromGitHub();
    }, 30000); // 30 detik
}

// Initialize
loadDataFromGitHub().then(() => {
    startAutoSync();
    selectLoker(1);
});
