// ==================== GLOBAL VARIABLES ====================
const TOTAL_LOKER = 40;
let currentLoker = 1;
let lokerData = {};

// ==================== LOCAL STORAGE ====================
const STORAGE_KEY = 'loker_app_data';

function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        lokerData = JSON.parse(saved);
        console.log('Data loaded from localStorage');
    } else {
        // Initialize empty data
        for (let i = 1; i <= TOTAL_LOKER; i++) {
            lokerData[i] = {
                id: i,
                nama: '',
                pin: '',
                status: 'belum',
                tanggal: '',
                petugas: '',
                foto: ''
            };
        }
    }
    updateTotalFilled();
    renderLokerGrid();
    displayCurrentLoker();
}

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lokerData));
    updateTotalFilled();
    renderLokerGrid();
}

// ==================== UI FUNCTIONS ====================

function updateTotalFilled() {
    let count = 0;
    for (let i = 1; i <= TOTAL_LOKER; i++) {
        if (lokerData[i] && lokerData[i].nama && lokerData[i].nama !== '') {
            count++;
        }
    }
    document.getElementById('totalFilled').textContent = `${count}/${TOTAL_LOKER}`;
}

function renderLokerGrid() {
    const grid = document.getElementById('lokerGrid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= TOTAL_LOKER; i++) {
        const btn = document.createElement('button');
        btn.className = `loker-btn ${currentLoker === i ? 'active' : ''}`;
        
        const data = lokerData[i];
        if (data && data.nama && data.nama !== '') {
            btn.classList.add('has-data');
        }
        
        btn.innerHTML = `<i class="fas fa-door-closed"></i><span>${i}</span>`;
        btn.onclick = () => {
            currentLoker = i;
            renderLokerGrid();
            displayCurrentLoker();
            document.getElementById('lokerNumber').textContent = i;
            clearFormOnly();
        };
        
        grid.appendChild(btn);
    }
}

function displayCurrentLoker() {
    const data = lokerData[currentLoker] || {
        nama: '', pin: '', status: 'belum', tanggal: '', petugas: '', foto: ''
    };
    
    // Update status chip
    const statusChip = document.getElementById('lokerStatusChip');
    const hasData = data.nama && data.nama !== '';
    if (hasData) {
        statusChip.innerHTML = '<i class="fas fa-circle"></i> Terisi';
        statusChip.classList.add('filled');
    } else {
        statusChip.innerHTML = '<i class="fas fa-circle"></i> Kosong';
        statusChip.classList.remove('filled');
    }
    
    // Update display values
    document.getElementById('displayNama').textContent = data.nama || '-';
    document.getElementById('displayPin').innerHTML = data.pin ? `<span class="pin-code">${escapeHtml(data.pin)}</span>` : '-';
    
    const statusHtml = data.status === 'sudah' 
        ? '<span class="status-badge sudah"><i class="fas fa-check"></i> Sudah Diambil</span>'
        : '<span class="status-badge belum"><i class="fas fa-clock"></i> Belum Diambil</span>';
    document.getElementById('displayStatus').innerHTML = statusHtml;
    
    document.getElementById('displayTanggal').textContent = data.tanggal || '-';
    document.getElementById('displayPetugas').textContent = data.petugas || '-';
    
    // Foto display
    const fotoDisplay = document.getElementById('fotoDisplay');
    if (data.foto && data.foto !== '') {
        fotoDisplay.innerHTML = `<img src="${data.foto}" alt="Bukti Loker" onclick="openModal('${data.foto}', ${currentLoker})">`;
    } else {
        fotoDisplay.innerHTML = '<span class="no-foto"><i class="fas fa-camera-slash"></i> Tidak ada foto</span>';
    }
    
    // Fill form
    document.getElementById('namaCustomer').value = data.nama || '';
    document.getElementById('pinLoker').value = data.pin || '';
    document.getElementById('statusPengambilan').value = data.status || 'belum';
    document.getElementById('tanggal').value = data.tanggal || '';
    
    // Set petugas from dropdown or saved data
    const petugasSelect = document.getElementById('petugasSelect');
    const namaPetugas = document.getElementById('namaPetugas');
    if (petugasSelect.value) {
        namaPetugas.value = petugasSelect.value;
    } else if (data.petugas) {
        namaPetugas.value = data.petugas;
        petugasSelect.value = data.petugas;
        updateActivePetugas(data.petugas);
    } else {
        namaPetugas.value = '';
    }
    
    // Preview foto
    const previewWrapper = document.getElementById('previewWrapper');
    const fotoPreview = document.getElementById('fotoPreview');
    if (data.foto) {
        fotoPreview.src = data.foto;
        previewWrapper.style.display = 'inline-block';
    } else {
        previewWrapper.style.display = 'none';
    }
}

function updateActivePetugas(petugas) {
    const activeDiv = document.getElementById('activePetugas');
    if (petugas) {
        activeDiv.innerHTML = `<i class="fas fa-user-check"></i><span>${petugas}</span>`;
    } else {
        activeDiv.innerHTML = `<i class="fas fa-user-clock"></i><span>Belum dipilih</span>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function clearFormOnly() {
    document.getElementById('namaCustomer').value = '';
    document.getElementById('pinLoker').value = '';
    document.getElementById('statusPengambilan').value = 'belum';
    document.getElementById('fotoBukti').value = '';
    document.getElementById('previewWrapper').style.display = 'none';
    document.getElementById('fotoPreview').src = '';
    document.getElementById('tanggal').value = '';
    
    const petugas = document.getElementById('petugasSelect').value;
    if (petugas) {
        document.getElementById('namaPetugas').value = petugas;
    } else {
        document.getElementById('namaPetugas').value = '';
    }
}

// ==================== SAVE DATA ====================

async function saveLokerData(event) {
    event.preventDefault();
    
    const nama = document.getElementById('namaCustomer').value.trim();
    const pin = document.getElementById('pinLoker').value.trim();
    const status = document.getElementById('statusPengambilan').value;
    const petugas = document.getElementById('petugasSelect').value;
    const petugasFinal = petugas || document.getElementById('namaPetugas').value;
    
    // Validation
    if (!nama) {
        showToast('❌ Nama customer harus diisi!', 'error');
        return;
    }
    if (!pin || pin.length < 4 || !/^\d+$/.test(pin)) {
        showToast('❌ PIN harus minimal 4 digit angka!', 'error');
        return;
    }
    if (!petugasFinal) {
        showToast('❌ Pilih petugas terlebih dahulu!', 'error');
        return;
    }
    
    const saveBtn = document.querySelector('.btn-primary');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Menyimpan...';
    
    try {
        const now = new Date();
        const tanggalString = now.toLocaleString('id-ID', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
        
        let fotoUrl = lokerData[currentLoker]?.foto || '';
        const fileInput = document.getElementById('fotoBukti');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fotoUrl = await fileToBase64(file);
        }
        
        lokerData[currentLoker] = {
            id: currentLoker,
            nama: nama,
            pin: pin,
            status: status,
            tanggal: tanggalString,
            petugas: petugasFinal,
            foto: fotoUrl
        };
        
        saveToLocalStorage();
        
        showToast(`✅ Data Loker ${currentLoker} berhasil disimpan!`, 'success');
        
        renderLokerGrid();
        displayCurrentLoker();
        clearFormOnly();
        
    } catch (error) {
        console.error('Save error:', error);
        showToast('❌ Terjadi kesalahan saat menyimpan data', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Data';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function clearTotalForm() {
    if (confirm(`⚠️ Hapus SEMUA data untuk Loker ${currentLoker}?\n\nData akan hilang permanen!`)) {
        lokerData[currentLoker] = {
            id: currentLoker,
            nama: '',
            pin: '',
            status: 'belum',
            tanggal: '',
            petugas: '',
            foto: ''
        };
        saveToLocalStorage();
        clearFormOnly();
        displayCurrentLoker();
        renderLokerGrid();
        showToast(`🗑️ Data Loker ${currentLoker} telah dihapus!`, 'success');
    }
}

function deleteCurrentLokerData() {
    if (confirm(`⚠️ Hapus SEMUA data untuk Loker ${currentLoker}?`)) {
        clearTotalForm();
    }
}

// ==================== SYNC FUNCTION ====================

function syncData() {
    showToast('🔄 Data tersimpan di localStorage. Untuk sync ke device lain, gunakan fitur Export/Import di bawah!', 'info');
}

// ==================== EXPORT/IMPORT FOR MULTI-DEVICE ====================

function exportData() {
    const dataStr = JSON.stringify(lokerData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loker_backup_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Data berhasil diexport!', 'success');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported && typeof imported === 'object') {
                lokerData = imported;
                saveToLocalStorage();
                renderLokerGrid();
                displayCurrentLoker();
                showToast('📤 Data berhasil diimport!', 'success');
            } else {
                throw new Error('Invalid data');
            }
        } catch (error) {
            showToast('❌ File tidak valid!', 'error');
        }
    };
    reader.readAsText(file);
}

// ========== EXPORT/IMPORT BUTTONS (add to UI) ==========
function addExportImportButtons() {
    const header = document.querySelector('.main-header');
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'sync-group';
    buttonGroup.style.display = 'flex';
    buttonGroup.style.gap = '10px';
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'sync-btn';
    exportBtn.innerHTML = '<i class="fas fa-download"></i><span>Export</span>';
    exportBtn.onclick = exportData;
    
    const importBtn = document.createElement('button');
    importBtn.className = 'sync-btn';
    importBtn.innerHTML = '<i class="fas fa-upload"></i><span>Import</span>';
    
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.onchange = (e) => {
        if (e.target.files[0]) importData(e.target.files[0]);
        importInput.value = '';
    };
    importBtn.onclick = () => importInput.click();
    
    buttonGroup.appendChild(exportBtn);
    buttonGroup.appendChild(importBtn);
    buttonGroup.appendChild(importInput);
    header.appendChild(buttonGroup);
}

// ==================== MODAL ZOOM ====================

function openModal(imgSrc, lokerId) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const modalCaption = document.getElementById('modalCaption');
    modal.style.display = 'block';
    modalImg.src = imgSrc;
    modalCaption.textContent = `Foto Bukti Loker ${lokerId}`;
}

// ==================== TOAST ====================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== EVENT LISTENERS ====================

document.getElementById('lokerForm').addEventListener('submit', saveLokerData);
document.getElementById('clearFormBtn').addEventListener('click', clearTotalForm);
document.getElementById('deleteDataBtn').addEventListener('click', deleteCurrentLokerData);
document.getElementById('syncBtn').addEventListener('click', syncData);

document.getElementById('petugasSelect').addEventListener('change', function(e) {
    const petugas = e.target.value;
    document.getElementById('namaPetugas').value = petugas;
    updateActivePetugas(petugas);
});

// Upload area
const uploadArea = document.getElementById('uploadArea');
const fotoInput = document.getElementById('fotoBukti');

uploadArea.addEventListener('click', () => fotoInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary)';
    uploadArea.style.background = 'var(--light)';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'transparent';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        fotoInput.files = e.dataTransfer.files;
        previewPhoto(file);
    }
    uploadArea.style.borderColor = 'var(--border)';
});

fotoInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        previewPhoto(e.target.files[0]);
    }
});

function previewPhoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('fotoPreview');
        const wrapper = document.getElementById('previewWrapper');
        preview.src = e.target.result;
        wrapper.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
}

document.getElementById('removePhoto').addEventListener('click', () => {
    fotoInput.value = '';
    document.getElementById('previewWrapper').style.display = 'none';
    document.getElementById('fotoPreview').src = '';
});

// Modal close
document.querySelector('.modal-close').onclick = () => {
    document.getElementById('imageModal').style.display = 'none';
};
window.onclick = (event) => {
    const modal = document.getElementById('imageModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// ==================== INITIALIZATION ====================

function init() {
    loadFromLocalStorage();
    addExportImportButtons();
    console.log('🚀 Loker App Started!');
}

init();
