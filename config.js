// ========== KONFIGURASI GITHUB ==========
// GANTI DENGAN DATA REPOSITORY ANDA!
const GITHUB_CONFIG = {
    owner: 'vannkyz',      // Ganti dengan username GitHub Anda
    repo: 'yolaundrylocker',                  // Ganti dengan nama repository
    token: 'github_pat_xxx_xxx',         // Ganti dengan Personal Access Token
    filePath: 'data/loker_data.json'     // Lokasi file di repository
};

// URL API GitHub
const API_URL = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`;

// Data awal untuk 40 loker
const DEFAULT_DATA = {
    lastUpdated: new Date().toISOString(),
    lokers: []
};

// Inisialisasi data untuk 40 loker
for (let i = 1; i <= 40; i++) {
    DEFAULT_DATA.lokers.push({
        nomor: i,
        namaCustomer: '',
        pinLoker: '',
        status: 'belum',
        tanggal: '',
        petugas: '',
        fotoBase64: ''
    });
}
