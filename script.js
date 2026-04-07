// State Management
let currentLoker = 1;
let allData = null;

// DOM Elements
const lokerGrid = document.getElementById('lokerGrid');
const lokerNumber = document.getElementById('lokerNumber');
const lokerStatusBadge = document.getElementById('lokerStatusBadge');
const totalTerisi = document.getElementById('totalTerisi');
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
const btnExport = document.getElementById('btnExport');
const btnResetData = document.getElementById('btnResetData');
const fileImport = document.getElementById('fileImport');
const modalZoom = document.getElementById('modalZoom');
const zoomImage = document.getElementById('zoomImage');

// Data awal untuk 40 loker
function getDefaultData() {
    const lokers = [];
    for (let i = 1; i <= 40; i++) {
        lokers.push({
            nomor: i,
            namaCustomer: '',
            pinLoker: '',
            status: 'belum',
            tanggal: '',
            petugas: '',
            fotoBase64: ''
        });
    }
    return {
        lastUpdated: new Date().toISOString(),
        lokers: lokers
    };
}

// Load data dari LocalStorage
function loadData() {
    const savedData = localStorage.getItem('loker_data');
    if (savedData) {
        try {
            allData = JSON.parse(savedData);
            // Pastikan ada 40 loker
            if (!allData.lokers || allData.lokers.length !== 40) {
                allData = getDefaultData();
            }
        } catch(e) {
            allData = getDefaultData();
        }
    } else {
        allData = getDefaultData();
    }
    updateUI();
}

// Save data ke LocalStorage
function saveToLocalStorage() {
    allData.lastUpdated = new Date().toISOString();
    localStorage.setItem('loker_data', JSON.stringify(allData));
    
    // Update status
    const syncStatus = document.getElementById('syncStatus');
    syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Data tersimpan di browser ini';
    syncStatus.style.background = '#d4edda';
    syncStatus.style.color = '#155724';
    
    setTimeout(() => {
        syncStatus.style.background = '#e3f2fd';
        syncStatus.style.color = '#1976d2';
        syncStatus.innerHTML = '<i class="fas fa-database"></i> Mode LocalStorage - Data tersimpan di browser ini';
    }, 2000);
}

// Render grid loker
function renderLokerGrid() {
    if (!allData) return;
    
    lokerGrid.innerHTML = '';
    let filledCount = 0;
    
    for (let i = 1; i <= 40; i++) {
        const lokerData = allData.lokers[i - 1];
        const isFilled = lokerData && lokerData.namaCustomer && lokerData.namaCustomer.trim() !== '';
        
        if (isFilled) filledCount++;
        
        const btn = document.createElement('button');
        btn.className = 'loker-btn';
        if (isFilled) btn.classList.add('filled');
        if (currentLoker === i) btn.classList.add('active');
        
        btn.innerHTML = `
            <span class="loker-num">${i}</span>
            <i class="loker-icon ${isFilled ? 'fas fa-check-circle' : 'far fa-circle'}"></i>
        `;
        
        btn.onclick = (function(lokerNum) {
            return function() { selectLoker(lokerNum); };
        })(i);
        
        lokerGrid.appendChild(btn);
    }
    
    totalTerisi.textContent = `${filledCount}/40 terisi`;
}

// Select loker
function selectLoker(num) {
    currentLoker = num;
    lokerNumber.textContent = num;
    
    // Update active class
    document.querySelectorAll('.loker-btn').forEach((btn, index) => {
        if (index + 1 === num) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update form
    const lokerData = allData.lokers[num - 1];
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
    
    displayData();
}

// Display data
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateUI() {
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

// Save data
function saveData() {
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
    
    saveToLocalStorage();
    renderLokerGrid();
    displayData();
    updateCurrentForm();
    
    uploadFoto.value = '';
    
    // Efek notifikasi
    const btn = document.getElementById('btnSave');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Tersimpan!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 1000);
}

// Clear form
function clearForm() {
    namaCustomer.value = '';
    pinLoker.value = '';
    statusLoker.value = 'belum';
    tanggalLoker.value = '';
    previewFoto.innerHTML = '';
    uploadFoto.value = '';
}

// Clear all data
function clearAllData() {
    if (confirm('⚠️ PERINGATAN! Ini akan menghapus SEMUA data dari 40 loker. Lanjutkan?')) {
        if (confirm('Data akan dihapus PERMANEN. Yakin?')) {
            allData = getDefaultData();
            saveToLocalStorage();
            renderLokerGrid();
            selectLoker(1);
            alert('✅ Semua data telah dihapus!');
        }
    }
}

// Export data
function exportData() {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_loker_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Data berhasil diexport!');
}

// Import data
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.lokers && importedData.lokers.length === 40) {
                allData = importedData;
                saveToLocalStorage();
                renderLokerGrid();
                selectLoker(1);
                alert('✅ Import data berhasil!');
            } else {
                alert('File tidak valid! Pastikan file backup yang benar.');
            }
        } catch(err) {
            alert('Gagal membaca file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// Reset data
function resetData() {
    if (confirm('Reset semua data ke kondisi awal? Semua data akan hilang!')) {
        allData = getDefaultData();
        saveToLocalStorage();
        renderLokerGrid();
        selectLoker(1);
        alert('Data telah direset!');
    }
}

// Foto upload
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

// Zoom photo
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
btnExport.onclick = exportData;
btnResetData.onclick = resetData;
selectPetugas.onchange = () => {
    petugasInput.value = selectPetugas.value;
};
fileImport.onchange = (e) => {
    if (e.target.files[0]) {
        importData(e.target.files[0]);
        fileImport.value = '';
    }
};

// Initialize
loadData();
selectLoker(1);
