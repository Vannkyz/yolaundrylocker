// State Management
let currentLoker = 1;
let allData = null;
let syncInterval = null;
let isSaving = false;

// DOM Elements
const lokerGrid = document.getElementById('lokerGrid');
const lokerNumber = document.getElementById('lokerNumber');
const lokerStatusBadge = document.getElementById('lokerStatusBadge');
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
        syncStatus.style.opacity = '1';
        
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            await createInitialData();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = atob(data.content);
        allData = JSON.parse(content);
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
        syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal sync, pakai data lokal';
        syncStatus.className = 'sync-status error';
        
        const localData = localStorage.getItem('loker_backup');
        if (localData) {
            allData = JSON.parse(localData);
            updateUI();
        }
    }
}

async function createInitialData() {
    try {
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(DEFAULT_DATA, null, 2))));
        
        const response = await fetch(API_URL, {
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
        
        const result = await response.json();
        allData = { ...DEFAULT_DATA };
        if (result.content) allData.sha = result.content.sha;
        
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
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        if (result.content) allData.sha = result.content.sha;
        
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
        localStorage.setItem('loker_backup', JSON.stringify(allData));
    } finally {
        isSaving = false;
    }
}

// ========== FUNGSI NAVIGASI LOKER (GRID) ==========
function renderLokerGrid() {
    if (!allData) return;
    
    lokerGrid.innerHTML = '';
    
    for (let i = 1; i <= 40; i++) {
        const lokerData = allData.lokers[i - 1];
        const isFilled = lokerData && lokerData.namaCustomer && lokerData.namaCustomer.trim() !== '';
        
        const btn = document.createElement('button');
        btn.className = 'loker-btn';
        
        // Tambah class filled jika sudah terisi data
        if (isFilled) {
            btn.classList.add('filled');
        }
        
        // Tambah class active jika sedang dipilih
        if (currentLoker === i) {
            btn.classList.add('active');
        }
        
        btn.innerHTML = `
            <span class="loker-num">${i}</span>
            <i class="loker-icon ${isFilled ? 'fas fa-check-circle' : 'far fa-circle'}"></i>
        `;
        
        btn.onclick = (function(lokerNum) {
            return function() { selectLoker(lokerNum); };
        })(i);
        
        lokerGrid.appendChild(btn);
    }
}

function selectLoker(num) {
    currentLoker = num;
    lokerNumber.textContent = num;
    
    // Update grid styling
    const allLokerBtns = document.querySelectorAll('.loker-btn');
    allLokerBtns.forEach((btn, index) => {
        if (index + 1 === num) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update form dengan data loker
    const lokerData = allData.lokers[num - 1];
    const isFilled = lokerData && lokerData.namaCustomer && lokerData.namaCustomer.trim() !== '';
    
    // Update status badge
    if (isFilled) {
        lokerStatusBadge.className = 'loker-status-badge filled';
        lokerStatusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Terisi';
    } else {
        lokerStatusBadge.className = 'loker-status-badge';
        lokerStatusBadge.innerHTML = '<i class="fas fa-circle"></i> Kosong';
    }
    
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

function updateUI() {
    if (!allData) return;
    renderLokerGrid();
    displayData();
    updateCurrentForm();
}

function updateCurrentForm() {
    const lokerData = allData.lokers[currentLoker - 1];
    const isFilled = lokerData && lokerData.namaCustomer && lokerData.namaCustomer.trim() !== '';
    
    if (isFilled) {
        lokerStatusBadge.className = 'loker-status-badge filled';
        lokerStatusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Terisi';
    } else {
        lokerStatusBadge.className = 'loker-status-badge';
        lokerStatusBadge.innerHTML = '<i class="fas fa-circle"></i> Kosong';
    }
    
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
}

function displayData() {
    const lokerData = allData.lokers[currentLoker - 1];
    if (!lokerData) return;
    
    const hasData = lokerData.namaCustomer && lokerData.namaCustomer.trim() !== '';
    
    if (!hasData) {
        dataDisplay.innerHTML = '<div class="empty-data"><i class="fas fa-inbox"></i><br>Belum ada data untuk loker ini</div>';
        return;
    }
    
    dataDisplay.innerHTML = `
        <div class="data-item">
            <strong><i class="fas fa-user"></i> Nama Customer:</strong>
            <span>${escapeHtml(lokerData.namaCustomer)}</span>
        </div>
        <div class="data-item">
            <strong><i class="fas fa-tag"></i> PIN Loker:</strong>
            <span>${escapeHtml(lokerData.pinLoker) || '-'}</span>
        </div>
        <div class="data-item">
            <strong><i class="fas fa-check-circle"></i> Status:</strong>
            <span class="status-badge ${lokerData.status === 'sudah' ? 'status-taken' : 'status-pending'}">
                ${lokerData.status === 'sudah' ? '✓ Sudah Diambil' : '⏳ Belum Diambil'}
            </span>
        </div>
        <div class="data-item">
            <strong><i class="fas fa-calendar-alt"></i> Tanggal:</strong>
            <span>${escapeHtml(lokerData.tanggal) || '-'}</span>
        </div>
        <div class="data-item">
            <strong><i class="fas fa-user-check"></i> Petugas:</strong>
            <span>${escapeHtml(lokerData.petugas) || '-'}</span>
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

// Helper function untuk escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== FUNGSI FORM ==========
async function saveData() {
    const pin = pinLoker.value.trim();
    if (pin && pin.length < 4) {
        alert('PIN minimal 4 digit!');
        return;
    }
    
    const petugas = selectPetugas.value;
    if (!petugas) {
        alert('Silakan pilih petugas terlebih dahulu!');
        return;
    }
    
    const now = new Date();
    const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    
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
    
    // Update UI
    renderLokerGrid();
    displayData();
    updateCurrentForm();
    
    uploadFoto.value = '';
    
    // Efek animasi
    const formContainer = document.querySelector('.form-container');
    formContainer.classList.add('saving-effect');
    setTimeout(() => formContainer.classList.remove('saving-effect'), 500);
}

function clearForm() {
    namaCustomer.value = '';
    pinLoker.value = '';
    statusLoker.value = 'belum';
    tanggalLoker.value = '';
    previewFoto.innerHTML = '';
    uploadFoto.value = '';
}

async function clearAllData() {
    if (confirm('⚠️ PERINGATAN! Ini akan menghapus SEMUA data dari 40 loker. Lanjutkan?')) {
        if (confirm('Data akan dihapus PERMANEN dari GitHub. Yakin ingin melanjutkan?')) {
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
            renderLokerGrid();
            selectLoker(1);
            alert('✅ Semua data telah dihapus!');
        }
    }
}

// Handle foto upload
uploadFoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran foto maksimal 5MB!');
            uploadFoto.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64 = event.target.result;
            previewFoto.innerHTML = `<img src="${base64}" class="preview-img" onclick="zoomPhoto('${base64}')">`;
            allData.lokers[currentLoker - 1].fotoBase64 = base64;
        };
        reader.readAsDataURL(file);
    }
});

// Zoom photo function
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
    }, 30000);
}

// Initialize
loadDataFromGitHub().then(() => {
    startAutoSync();
    selectLoker(1);
});
