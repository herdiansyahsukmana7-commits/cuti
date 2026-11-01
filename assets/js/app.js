/**
 * assets/js/app.js
 * Aplikasi Ringan & Cepat: Input 6 Jenis Cuti & Output Cetak Formulir Cuti + Surat Permohonan Resmi
 */

const STORAGE_GAS_KEY = 'CUTI_ASN_GAS_URL';
const STORAGE_CONFIG_KEY = 'CUTI_ASN_APP_CONFIG_V2';

const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbx_CONTOH_GANTI_DI_MODAL_PENGATURAN/exec";

function getGasUrl() {
    return localStorage.getItem(STORAGE_GAS_KEY) || DEFAULT_GAS_URL;
}

let daftarCuti = [];
let editingId = null;
let activeFilterJenis = 'ALL';

// Default Konfigurasi Pejabat sesuai contoh Dinas Kesehatan Kota Tangerang Selatan
const defaultConfig = {
    kota: 'Tangerang Selatan',
    unitKerja: 'Dinas Kesehatan',
    atasanNama: 'Ikhsan Permana, SKM',
    atasanNip: '197801081998031002',
    pejabatNama: 'dr. Allin Hendalin Mahdaniar, M.K.M.',
    pejabatNip: '197610152007012007',
    pejabatJabatan: 'Kepala Dinas Kesehatan Kota Tangerang Selatan',
    tembusan: 'Kepala BKPSDM Kota Tangerang Selatan'
};

function getAppConfig() {
    try {
        const data = localStorage.getItem(STORAGE_CONFIG_KEY);
        return data ? { ...defaultConfig, ...JSON.parse(data) } : defaultConfig;
    } catch {
        return defaultConfig;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadMasterPegawai();
    loadDaftarCuti();
    setupEventHandlers();
    loadConfigToModal();
});

function setupEventHandlers() {
    const formCuti = document.getElementById('formCuti');
    if (formCuti) formCuti.addEventListener('submit', handleFormSubmit);

    const btnSync = document.getElementById('btnSyncData');
    if (btnSync) {
        btnSync.addEventListener('click', () => {
            loadMasterPegawai();
            loadDaftarCuti();
        });
    }

    const btnExport = document.getElementById('btnExportCsv');
    if (btnExport) btnExport.addEventListener('click', exportToCsv);

    // Filter Tab 6 Jenis Cuti
    const filterBtns = document.querySelectorAll('.filter-cuti-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activeFilterJenis = btn.getAttribute('data-filter') || 'ALL';
            filterBtns.forEach(b => {
                b.className = 'filter-cuti-btn px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200';
            });
            btn.className = 'filter-cuti-btn px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-white';
            renderTabelCuti(daftarCuti);
        });
    });

    // Modal Konfigurasi Pejabat & GAS
    const btnOpenConfig = document.getElementById('btnOpenConfig');
    const modalConfig = document.getElementById('modalConfig');
    const btnCloseConfig = document.getElementById('btnCloseConfig');
    const formConfig = document.getElementById('formConfig');

    if (btnOpenConfig && modalConfig) {
        btnOpenConfig.addEventListener('click', () => {
            loadConfigToModal();
            modalConfig.classList.remove('hidden');
        });
    }
    if (btnCloseConfig && modalConfig) {
        btnCloseConfig.addEventListener('click', () => modalConfig.classList.add('hidden'));
    }
    if (formConfig) {
        formConfig.addEventListener('submit', (e) => {
            e.preventDefault();
            saveConfig();
            modalConfig.classList.add('hidden');
            showToast('Pengaturan Pejabat & URL GAS tersimpan!', 'success');
        });
    }

    // Modal Tambah Master Pegawai
    const btnOpenModalPegawai = document.getElementById('btnOpenModalPegawai');
    const modalPegawai = document.getElementById('modalPegawai');
    const btnCloseModalPegawai = document.getElementById('btnCloseModalPegawai');
    const formMasterPegawai = document.getElementById('formMasterPegawai');

    if (btnOpenModalPegawai && modalPegawai) {
        btnOpenModalPegawai.addEventListener('click', () => modalPegawai.classList.remove('hidden'));
    }
    if (btnCloseModalPegawai && modalPegawai) {
        btnCloseModalPegawai.addEventListener('click', () => modalPegawai.classList.add('hidden'));
    }
    if (formMasterPegawai) {
        formMasterPegawai.addEventListener('submit', handlePegawaiSubmit);
    }
}

// Tambah Master Pegawai
async function handlePegawaiSubmit(e) {
    e.preventDefault();
    const nama = document.getElementById('mpNama').value.trim();
    const nip = document.getElementById('mpNip').value.trim();
    const nik = document.getElementById('mpNik').value.trim();
    const jabatan = document.getElementById('mpJabatan').value.trim();
    const jk = document.getElementById('mpJk').value;
    const golongan = document.getElementById('mpGolongan').value.trim();
    const status = document.getElementById('mpStatus').value;

    const payload = {
        nama: nama,
        nama_pegawai: nama,
        nip: nip,
        nik: nik,
        jabatan: jabatan,
        jenis_kelamin: jk,
        golongan: golongan,
        status: status,
        status_asn: status
    };

    const btn = document.getElementById('btnSubmitPegawai');
    const oldText = btn.innerHTML;
    btn.innerHTML = 'Menyimpan...';
    btn.disabled = true;

    try {
        const response = await fetch(getGasUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'createPegawai', payload: payload })
        });
        const resJson = await response.json();
        if (resJson.status === 'success') {
            showToast('Pegawai berhasil disimpan!', 'success');
            document.getElementById('formMasterPegawai').reset();
            document.getElementById('modalPegawai').classList.add('hidden');
            loadMasterPegawai();
        } else {
            showToast('Gagal: ' + (resJson.message || 'Error'), 'error');
        }
    } catch {
        masterPegawai.push({
            ...payload,
            jatah_tahunan: 12,
            cuti_tahunan: 0,
            sisa_kuota: 12,
            cuti_besar: 0,
            cuti_sakit: 0,
            cuti_melahirkan: 0,
            cuti_alasan_penting: 0,
            cuti_cltn: 0
        });
        renderTabelPegawai(masterPegawai);
        populateDropdownPegawai(masterPegawai);
        document.getElementById('formMasterPegawai').reset();
        document.getElementById('modalPegawai').classList.add('hidden');
        showToast('Pegawai ditambahkan', 'success');
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

// Ambil Daftar Cuti
async function loadDaftarCuti() {
    const loadingState = document.getElementById('loadingCuti');
    if (loadingState) loadingState.classList.remove('hidden');

    try {
        const response = await fetch(`${getGasUrl()}?action=read`);
        const resJson = await response.json();

        if (resJson.status === 'success') {
            daftarCuti = resJson.data || [];
            renderTabelCuti(daftarCuti);
        } else {
            renderFallbackCuti();
        }
    } catch {
        renderFallbackCuti();
    } finally {
        if (loadingState) loadingState.classList.add('hidden');
    }
}

// Data contoh persis seperti dokumen user (Rudy, Deni Sueb, Evie Ervina)
function renderFallbackCuti() {
    if (daftarCuti.length === 0) {
        daftarCuti = [
            {
                id: 'ASN-1001',
                nip: '198211012025211017',
                nama_pegawai: 'Rudy, S.Sos.I',
                golongan: 'IX',
                jabatan: 'Penata Layanan Operasional',
                masa_kerja: '01 Tahun 03 Bulan',
                jenis_cuti: 'Cuti Tahunan',
                tanggal_mulai: '2026-11-09',
                tanggal_selesai: '2026-11-10',
                lama_cuti: 2,
                alasan: 'Pulang Kampung ke Rangkas Bitung',
                alamat_cuti: 'Rangkas Bitung',
                no_telp: '085694964069',
                status: 'Disetujui',
                created_at: '2026-10-16'
            },
            {
                id: 'ASN-1002',
                nip: '199005282025211007',
                nama_pegawai: 'Deni Sueb, S.IP',
                golongan: 'IX',
                jabatan: 'Penata Layanan Operasional',
                masa_kerja: '01 Tahun 03 Bulan',
                jenis_cuti: 'Cuti Tahunan',
                tanggal_mulai: '2026-10-23',
                tanggal_selesai: '2026-10-23',
                lama_cuti: 1,
                alasan: 'Acara Keluarga',
                alamat_cuti: 'Kota Tangerang Selatan',
                no_telp: '085694964069',
                status: 'Disetujui',
                created_at: '2026-10-19'
            },
            {
                id: 'ASN-1003',
                nip: '197505072025212006',
                nama_pegawai: 'Evie Ervina Rahmawati, SE',
                golongan: 'IX',
                jabatan: 'Penata Layanan Operasional',
                masa_kerja: '01 Tahun 04 Bulan',
                jenis_cuti: 'Cuti Tahunan',
                tanggal_mulai: '2026-11-09',
                tanggal_selesai: '2026-11-09',
                lama_cuti: 1,
                alasan: 'Acara Keluarga',
                alamat_cuti: 'Jl. Matahari Cigado III No. 25, Baleendah - Bandung',
                no_telp: '0817-222-771',
                status: 'Disetujui',
                created_at: '2026-10-26'
            }
        ];
    }
    renderTabelCuti(daftarCuti);
}

function updateFilterCounters(list) {
    const counts = { ALL: list.length, Tahunan: 0, Besar: 0, Sakit: 0, Melahirkan: 0, CAP: 0, CLTN: 0 };
    list.forEach(item => {
        const j = String(item.jenis_cuti || '').toLowerCase();
        if (j.includes('besar')) counts.Besar++;
        else if (j.includes('sakit')) counts.Sakit++;
        else if (j.includes('melahirkan') || j.includes('lahir')) counts.Melahirkan++;
        else if (j.includes('penting') || j.includes('cap')) counts.CAP++;
        else if (j.includes('luar tanggungan') || j.includes('cltn')) counts.CLTN++;
        else counts.Tahunan++;
    });
    Object.keys(counts).forEach(k => {
        const el = document.getElementById(`count-${k}`);
        if (el) el.textContent = counts[k];
    });
}

function renderTabelCuti(list) {
    const tbody = document.getElementById('tableCutiBody');
    if (!tbody) return;

    updateFilterCounters(list || []);

    const filteredList = (!list || activeFilterJenis === 'ALL')
        ? (list || [])
        : list.filter(item => String(item.jenis_cuti || '').toLowerCase() === activeFilterJenis.toLowerCase());

    if (filteredList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-5 text-center text-slate-400">Belum ada data pengajuan cuti.</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredList.map(item => {
        const durasi = hitungHari(item.tanggal_mulai, item.tanggal_selesai, item.lama_cuti);
        const rentangTgl = (item.tanggal_mulai && item.tanggal_selesai && item.tanggal_mulai !== item.tanggal_selesai)
            ? `${formatTglSlash(item.tanggal_mulai)} s.d. ${formatTglSlash(item.tanggal_selesai)}`
            : formatTglSlash(item.tanggal_mulai);

        let statusBadge = '<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">Menunggu</span>';
        if (item.status === 'Disetujui') {
            statusBadge = '<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">Disetujui</span>';
        } else if (item.status === 'Ditolak') {
            statusBadge = '<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">Ditolak</span>';
        }

        return `
        <tr class="hover:bg-slate-50">
            <td class="py-2.5 px-3">
                <div class="font-bold text-slate-800">${escapeHtml(item.nama_pegawai)}</div>
                <div class="text-[11px] text-slate-500 font-mono">${escapeHtml(item.nip)}</div>
            </td>
            <td class="py-2.5 px-3">
                <div class="font-semibold text-blue-800">${escapeHtml(item.jenis_cuti)} (${durasi} Hari)</div>
                <div class="text-[11px] text-slate-500">${escapeHtml(rentangTgl)}</div>
            </td>
            <td class="py-2.5 px-3">
                <div class="text-slate-800 font-medium">${escapeHtml(item.alasan || '-')}</div>
                <div class="text-[11px] text-slate-500">📍 ${escapeHtml(item.alamat_cuti || '-')} ${item.no_telp ? ' | 📞 ' + escapeHtml(item.no_telp) : ''}</div>
            </td>
            <td class="py-2.5 px-3">${statusBadge}</td>
            <td class="py-2.5 px-3 text-center">
                <div class="inline-flex items-center gap-1">
                    <button onclick="cetakSurat('${item.id}')" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-[11px] shadow-sm transition" title="Cetak Formulir & Surat Cuti">
                        🖨️ Cetak Surat
                    </button>
                    <button onclick="updateStatus('${item.id}', 'Disetujui')" class="p-1 hover:bg-emerald-50 rounded" title="Setujui">✅</button>
                    <button onclick="updateStatus('${item.id}', 'Ditolak')" class="p-1 hover:bg-rose-50 rounded" title="Tolak">❌</button>
                    <button onclick="editPengajuan('${item.id}')" class="p-1 hover:bg-amber-50 rounded" title="Edit">✏️</button>
                    <button onclick="hapusPengajuan('${item.id}')" class="p-1 hover:bg-red-50 rounded" title="Hapus">🗑️</button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Submit Form Input Cuti
async function handleFormSubmit(e) {
    e.preventDefault();

    const selectPegawai = document.getElementById('selectPegawai');
    const jenisCuti = document.getElementById('jenisCuti').value;
    const tglMulai = document.getElementById('tglMulai').value;
    const tglSelesai = document.getElementById('tglSelesai').value;
    const masaKerja = document.getElementById('masaKerja').value.trim() || '01 Tahun 03 Bulan';
    const noTelp = document.getElementById('noTelp').value.trim();
    const alamatCuti = document.getElementById('alamatCuti').value.trim();
    const alasan = document.getElementById('alasanCuti').value.trim();

    const selectedOption = selectPegawai.options[selectPegawai.selectedIndex];
    const nip = selectPegawai.value;
    const namaPegawai = selectedOption ? selectedOption.dataset.nama : '';

    if (!nip) {
        showToast('Pilih pegawai terlebih dahulu!', 'error');
        return;
    }
    if (new Date(tglSelesai) < new Date(tglMulai)) {
        showToast('Tanggal selesai tidak boleh lebih awal dari tanggal mulai!', 'error');
        return;
    }

    const payload = {
        id: editingId,
        nip: nip,
        nama_pegawai: namaPegawai,
        golongan: selectedOption ? selectedOption.dataset.golongan : 'IX',
        jabatan: selectedOption ? selectedOption.dataset.jabatan : 'Penata Layanan Operasional',
        status_pegawai: selectedOption ? selectedOption.dataset.status : 'PPPK',
        bidang_upt: selectedOption ? selectedOption.dataset.unit : 'Dinas Kesehatan',
        jenis_cuti: jenisCuti,
        tanggal_mulai: tglMulai,
        tanggal_selesai: tglSelesai,
        masa_kerja: masaKerja,
        no_telp: noTelp,
        alamat_cuti: alamatCuti,
        alasan: alasan
    };

    const action = editingId ? 'update' : 'create';
    const tempId = editingId || ('ROW-TEMP-' + Date.now());
    const itemOptimistik = {
        ...payload,
        id: tempId,
        lama_cuti: hitungHari(tglMulai, tglSelesai, 1),
        status: 'Disetujui',
        created_at: new Date().toISOString().split('T')[0]
    };

    // Tampilkan instan di tabel tanpa menunggu server selesai
    if (editingId) {
        const idx = daftarCuti.findIndex(x => x.id === editingId);
        if (idx !== -1) daftarCuti[idx] = itemOptimistik;
    } else {
        daftarCuti.unshift(itemOptimistik);
    }
    renderTabelCuti(daftarCuti);
    resetForm();
    showToast('Data cuti disimpan & siap dicetak!', 'success');

    // Kirim ke Google Sheets di background agar UI langsung bebas & tidak menunggu lama
    fetch(getGasUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, payload: payload })
    })
    .then(r => r.json())
    .then(resJson => {
        if (resJson.status === 'success') {
            if (resJson.id && !editingId) {
                const target = daftarCuti.find(x => x.id === tempId);
                if (target) target.id = resJson.id;
                renderTabelCuti(daftarCuti);
            }
            loadMasterPegawai(true);
        }
    })
    .catch(() => {});
}

async function updateStatus(id, newStatus) {
    try {
        const response = await fetch(getGasUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'updateStatus', id: id, status: newStatus })
        });
        const resJson = await response.json();
        if (resJson.status === 'success') {
            showToast(resJson.message, 'success');
            loadDaftarCuti();
            loadMasterPegawai(true);
            return;
        }
    } catch {}
    const target = daftarCuti.find(x => x.id === id);
    if (target) target.status = newStatus;
    renderTabelCuti(daftarCuti);
    showToast(`Status diubah menjadi ${newStatus}`, 'success');
}

function editPengajuan(id) {
    const item = daftarCuti.find(x => x.id === id);
    if (!item) return;

    editingId = id;
    document.getElementById('selectPegawai').value = item.nip;
    document.getElementById('jenisCuti').value = item.jenis_cuti || 'Cuti Tahunan';
    document.getElementById('tglMulai').value = item.tanggal_mulai;
    document.getElementById('tglSelesai').value = item.tanggal_selesai;
    document.getElementById('masaKerja').value = item.masa_kerja || '01 Tahun 03 Bulan';
    document.getElementById('noTelp').value = item.no_telp || '';
    document.getElementById('alamatCuti').value = item.alamat_cuti || '';
    document.getElementById('alasanCuti').value = item.alasan || '';

    const btnSubmit = document.getElementById('btnSubmitForm');
    btnSubmit.innerHTML = '💾 Perbarui Data Cuti';
    document.getElementById('btnCancelEdit').classList.remove('hidden');
    document.getElementById('formCuti').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
    editingId = null;
    document.getElementById('formCuti').reset();
    document.getElementById('btnSubmitForm').innerHTML = '💾 Simpan & Buat Formulir Cuti';
    document.getElementById('btnCancelEdit').classList.add('hidden');
}

async function hapusPengajuan(id) {
    if (!confirm('Hapus data pengajuan cuti ini?')) return;
    try {
        await fetch(getGasUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'delete', id: id })
        });
    } catch {}
    daftarCuti = daftarCuti.filter(x => x.id !== id);
    renderTabelCuti(daftarCuti);
    showToast('Data dihapus', 'success');
}

/**
 * ============================================================================
 * OUTPUT KELUARAN CETAK (2 HALAMAN PERSIS CONTOH DOKUMEN TANGERANG SELATAN)
 * Halaman 1: FORMULIR PERMINTAAN DAN PEMBERIAN CUTI
 * Halaman 2: SURAT PERMOHONAN CUTI ("Yang bertanda tangan di bawah ini...")
 * ============================================================================
 */
function cetakSurat(id) {
    const item = daftarCuti.find(x => x.id === id);
    if (!item) {
        showToast('Data tidak ditemukan', 'error');
        return;
    }

    const cfg = getAppConfig();
    const peg = masterPegawai.find(p => String(p.nip) === String(item.nip)) || {};

    const nama = item.nama_pegawai || peg.nama_pegawai || '-';
    const nip = item.nip || '-';
    const statusAsn = String(peg.status || peg.status_asn || (nip.length >= 18 ? 'PPPK' : 'PNS')).toUpperCase();
    const labelNip = statusAsn.includes('PPPK') ? 'NI PPPK' : 'NIP';
    const golongan = item.golongan || peg.golongan || peg.pangkat_gol || 'IX';
    const jabatan = item.jabatan || peg.jabatan || 'Penata Layanan Operasional';
    const masaKerja = item.masa_kerja || '01 Tahun 03 Bulan';
    const unitKerja = item.bidang_upt || peg.bidang_upt || cfg.unitKerja || 'Dinas Kesehatan';
    const alasan = item.alasan || '-';
    const alamatCuti = item.alamat_cuti || cfg.kota || 'Kota Tangerang Selatan';
    const noTelp = item.no_telp || '-';

    const durasi = hitungHari(item.tanggal_mulai, item.tanggal_selesai, item.lama_cuti);
    const terbilangHari = angkaKeTerbilang(durasi);
    const tglSuratStr = formatTglLengkapIndo(item.created_at || new Date().toISOString().split('T')[0]);
    const tglMulaiSlash = formatTglSlash(item.tanggal_mulai);
    const tglSelesaiSlash = formatTglSlash(item.tanggal_selesai);

    const rentangTglNarasi = (item.tanggal_mulai === item.tanggal_selesai)
        ? formatTglLengkapIndo(item.tanggal_mulai)
        : `${formatTglLengkapIndo(item.tanggal_mulai)} s.d. ${formatTglLengkapIndo(item.tanggal_selesai)}`;

    // Ceklis (√) untuk 6 Jenis Cuti
    const jLower = String(item.jenis_cuti || 'Cuti Tahunan').toLowerCase();
    const isTahunan = jLower.includes('tahunan');
    const isBesar = jLower.includes('besar') || jLower.includes('haji');
    const isSakit = jLower.includes('sakit');
    const isMelahirkan = jLower.includes('melahirkan') || jLower.includes('lahir');
    const isCap = jLower.includes('penting') || jLower.includes('cap');
    const isCltn = jLower.includes('luar tanggungan') || jLower.includes('cltn');

    // Hitung sisa kuota N untuk catatan cuti tahunan
    const sisaN = peg.sisa_kuota !== undefined ? peg.sisa_kuota : Math.max(0, 12 - durasi);

    const printArea = document.getElementById('printArea');
    printArea.innerHTML = `
        <!-- ==================== HALAMAN 1: FORMULIR PERMINTAAN DAN PEMBERIAN CUTI ==================== -->
        <div class="surat-resmi">
            <table class="tbl-no-border" style="width:100%; margin-bottom: 6px;">
                <tr>
                    <td style="width: 52%;"></td>
                    <td style="width: 48%; font-size: 10.5pt;">
                        ${escapeHtml(cfg.kota)}, ${escapeHtml(tglSuratStr)}<br>
                        Kepada :<br>
                        Yth. ${escapeHtml(cfg.pejabatJabatan)}<br>
                        di<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${escapeHtml(cfg.kota)}
                    </td>
                </tr>
            </table>

            <div style="text-align:center; font-weight:bold; font-size:11.5pt; margin: 6px 0 8px 0;">
                FORMULIR PERMINTAAN DAN PEMBERIAN CUTI
            </div>

            <!-- I. DATA PEGAWAI -->
            <table class="tbl-form-cuti" style="margin-bottom: 6px;">
                <tr>
                    <td colspan="4" style="font-weight:bold;">I. DATA PEGAWAI</td>
                </tr>
                <tr>
                    <td style="width:18%;">Nama</td>
                    <td style="width:35%;">${escapeHtml(nama)}</td>
                    <td style="width:17%;">${labelNip}</td>
                    <td style="width:30%;">${escapeHtml(nip)}</td>
                </tr>
                <tr>
                    <td>Jabatan</td>
                    <td>${escapeHtml(jabatan)}</td>
                    <td>Masa Kerja</td>
                    <td>${escapeHtml(masaKerja)}</td>
                </tr>
                <tr>
                    <td>Perangkat Daerah</td>
                    <td colspan="3">${escapeHtml(unitKerja)}</td>
                </tr>
            </table>

            <!-- II. JENIS CUTI YANG DIAMBIL (6 JENIS CUTI ASN) -->
            <table class="tbl-form-cuti" style="margin-bottom: 6px;">
                <tr>
                    <td colspan="4" style="font-weight:bold;">II. JENIS CUTI YANG DIAMBIL</td>
                </tr>
                <tr>
                    <td style="width:38%;">1. Cuti Tahunan</td>
                    <td style="width:12%; text-align:center; font-weight:bold;">${isTahunan ? '&#8730;' : ''}</td>
                    <td style="width:38%;">2. Cuti Besar / Ibadah Haji</td>
                    <td style="width:12%; text-align:center; font-weight:bold;">${isBesar ? '&#8730;' : ''}</td>
                </tr>
                <tr>
                    <td>3. Cuti Sakit</td>
                    <td style="text-align:center; font-weight:bold;">${isSakit ? '&#8730;' : ''}</td>
                    <td>4. Cuti Melahirkan</td>
                    <td style="text-align:center; font-weight:bold;">${isMelahirkan ? '&#8730;' : ''}</td>
                </tr>
                <tr>
                    <td>5. Cuti Karena Alasan Penting (CAP)</td>
                    <td style="text-align:center; font-weight:bold;">${isCap ? '&#8730;' : ''}</td>
                    <td>6. Cuti di Luar Tanggungan Negara (CLTN)</td>
                    <td style="text-align:center; font-weight:bold;">${isCltn ? '&#8730;' : ''}</td>
                </tr>
            </table>

            <!-- III. ALASAN CUTI -->
            <table class="tbl-form-cuti" style="margin-bottom: 6px;">
                <tr>
                    <td style="font-weight:bold;">III. ALASAN CUTI</td>
                </tr>
                <tr>
                    <td>${escapeHtml(alasan)}</td>
                </tr>
            </table>

            <!-- IV. LAMANYA CUTI -->
            <table class="tbl-form-cuti" style="margin-bottom: 6px;">
                <tr>
                    <td colspan="6" style="font-weight:bold;">IV. LAMANYA CUTI</td>
                </tr>
                <tr>
                    <td style="width:12%;">Selama</td>
                    <td style="width:24%;">${durasi} hari/bulan/tahun</td>
                    <td style="width:18%;">mulai tanggal</td>
                    <td style="width:18%; text-align:center;">${escapeHtml(tglMulaiSlash)}</td>
                    <td style="width:8%; text-align:center;">s.d.</td>
                    <td style="width:20%; text-align:center;">${escapeHtml(tglSelesaiSlash)}</td>
                </tr>
            </table>

            <!-- V. CATATAN CUTI -->
            <table class="tbl-form-cuti" style="margin-bottom: 6px;">
                <tr>
                    <td colspan="4" style="font-weight:bold;">V. CATATAN CUTI</td>
                </tr>
                <tr>
                    <td style="width:38%;">1. Cuti Tahunan</td>
                    <td style="width:12%; text-align:center; font-weight:bold;">${isTahunan ? 'N=' + sisaN : ''}</td>
                    <td style="width:38%;">2. Cuti Besar / Ibadah Haji</td>
                    <td style="width:12%; text-align:center;">${isBesar ? durasi + ' Hari' : ''}</td>
                </tr>
                <tr>
                    <td>3. Cuti Sakit</td>
                    <td style="text-align:center;">${isSakit ? durasi + ' Hari' : ''}</td>
                    <td>4. Cuti Melahirkan</td>
                    <td style="text-align:center;">${isMelahirkan ? durasi + ' Hari' : ''}</td>
                </tr>
                <tr>
                    <td>5. Cuti Karena Alasan Penting</td>
                    <td style="text-align:center;">${isCap ? durasi + ' Hari' : ''}</td>
                    <td>6. Cuti di Luar Tanggungan Negara</td>
                    <td style="text-align:center;">${isCltn ? durasi + ' Hari' : ''}</td>
                </tr>
            </table>

            <!-- VI. ALAMAT SELAMA MENJALANKAN CUTI -->
            <table class="tbl-form-cuti" style="margin-bottom: 6px;">
                <tr>
                    <td colspan="3" style="font-weight:bold;">VI. ALAMAT SELAMA MENJALANKAN CUTI</td>
                </tr>
                <tr>
                    <td style="width:52%;">${escapeHtml(alamatCuti)}</td>
                    <td style="width:12%;">TELP</td>
                    <td style="width:36%;">${escapeHtml(noTelp)}</td>
                </tr>
                <tr>
                    <td></td>
                    <td colspan="2" style="text-align:center; padding-top:6px;">
                        Hormat Saya,<br><br><br><br>
                        <b><u>${escapeHtml(nama)}</u></b><br>
                        ${labelNip}. ${escapeHtml(nip)}
                    </td>
                </tr>
            </table>

            <!-- VII. PERTIMBANGAN ATASAN LANGSUNG -->
            <table class="tbl-form-cuti" style="margin-bottom: 6px;">
                <tr>
                    <td colspan="4" style="font-weight:bold;">VII. PERTIMBANGAN ATASAN LANGSUNG</td>
                </tr>
                <tr style="text-align:center; font-weight:bold;">
                    <td style="width:25%;">DISETUJUI</td>
                    <td style="width:25%;">PERUBAHAN</td>
                    <td style="width:25%;">DITANGGUHKAN</td>
                    <td style="width:25%;">TIDAK DISETUJUI</td>
                </tr>
                <tr style="height:22px; text-align:center;">
                    <td>${item.status === 'Disetujui' ? '&#8730;' : ''}</td>
                    <td></td>
                    <td></td>
                    <td>${item.status === 'Ditolak' ? '&#8730;' : ''}</td>
                </tr>
                <tr>
                    <td colspan="2" style="border-right:none;"></td>
                    <td colspan="2" style="border-left:none; text-align:center; padding-top:6px;">
                        Atasan Langsung,<br><br><br><br>
                        <b><u>${escapeHtml(cfg.atasanNama)}</u></b><br>
                        NIP. ${escapeHtml(cfg.atasanNip)}
                    </td>
                </tr>
            </table>

            <!-- VIII. KEPUTUSAN PEJABAT YANG BERWENANG MEMBERIKAN CUTI -->
            <table class="tbl-form-cuti">
                <tr>
                    <td colspan="4" style="font-weight:bold;">VIII. KEPUTUSAN PEJABAT YANG BERWENANG MEMBERIKAN CUTI</td>
                </tr>
                <tr style="text-align:center; font-weight:bold;">
                    <td style="width:25%;">DISETUJUI</td>
                    <td style="width:25%;">PERUBAHAN</td>
                    <td style="width:25%;">DITANGGUHKAN</td>
                    <td style="width:25%;">TIDAK DISETUJUI</td>
                </tr>
                <tr style="height:22px; text-align:center;">
                    <td>${item.status === 'Disetujui' ? '&#8730;' : ''}</td>
                    <td></td>
                    <td></td>
                    <td>${item.status === 'Ditolak' ? '&#8730;' : ''}</td>
                </tr>
                <tr>
                    <td colspan="2" style="border-right:none;"></td>
                    <td colspan="2" style="border-left:none; text-align:center; padding-top:6px;">
                        Kepala,<br><br><br><br>
                        <b><u>${escapeHtml(cfg.pejabatNama)}</u></b><br>
                        NIP. ${escapeHtml(cfg.pejabatNip)}
                    </td>
                </tr>
            </table>
        </div>

        <!-- ==================== HALAMAN 2: SURAT PERMOHONAN CUTI PRIBADI ==================== -->
        <div class="surat-resmi page-break" style="padding-top: 15px;">
            <table class="tbl-no-border" style="width:100%; margin-bottom: 24px;">
                <tr>
                    <td style="width: 50%;"></td>
                    <td style="width: 50%;">
                        ${escapeHtml(cfg.kota)}, ${escapeHtml(tglSuratStr)}<br><br>
                        Kepada :<br>
                        Yth. ${escapeHtml(cfg.pejabatJabatan)}<br>
                        di<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${escapeHtml(cfg.kota)}
                    </td>
                </tr>
            </table>

            <p style="margin-bottom: 12px;">Yang bertanda tangan di bawah ini:</p>

            <table class="tbl-no-border" style="width:100%; margin-bottom: 18px; margin-left: 15px;">
                <tr>
                    <td style="width: 28%;">Nama</td>
                    <td style="width: 72%;">: ${escapeHtml(nama)}</td>
                </tr>
                <tr>
                    <td>${labelNip}</td>
                    <td>: ${escapeHtml(nip)}</td>
                </tr>
                <tr>
                    <td>Pangkat/Golongan Ruang</td>
                    <td>: ${escapeHtml(golongan)}</td>
                </tr>
                <tr>
                    <td>Jabatan</td>
                    <td>: ${escapeHtml(jabatan)}</td>
                </tr>
                <tr>
                    <td>Unit Kerja</td>
                    <td>: ${escapeHtml(unitKerja)}</td>
                </tr>
            </table>

            <p style="text-align: justify; margin-bottom: 14px; text-indent: 35px;">
                Memberitahukan dengan hormat, bahwa saya mengajukan permohonan <b>${escapeHtml(item.jenis_cuti.toLowerCase())}</b> selama ${durasi} (${escapeHtml(terbilangHari)}) Hari Kerja terhitung mulai tanggal ${escapeHtml(rentangTglNarasi)} dikarenakan ${escapeHtml(alasan)}.
            </p>

            <p style="text-align: justify; margin-bottom: 35px; text-indent: 35px;">
                Demikianlah, permintaan ini saya buat untuk dapat dipertimbangkan sebagaimana mestinya.
            </p>

            <table class="tbl-no-border" style="width:100%; margin-bottom: 40px;">
                <tr>
                    <td style="width: 55%;"></td>
                    <td style="width: 45%; text-align:center;">
                        Hormat Saya,<br><br><br><br><br>
                        <b><u>${escapeHtml(nama)}</u></b><br>
                        ${labelNip}. ${escapeHtml(nip)}
                    </td>
                </tr>
            </table>

            <div>
                <b>Tembusan:</b><br>
                Yth. ${escapeHtml(cfg.tembusan)}.
            </div>
        </div>
    `;

    window.print();
}

// Unduh CSV
function exportToCsv() {
    if (!masterPegawai || masterPegawai.length === 0) {
        showToast('Tidak ada data untuk diunduh', 'error');
        return;
    }

    let csv = "Nama,NIP,NIK,Jabatan,Jenis Kelamin,Golongan,Status,Jatah Tahunan,Cuti Tahunan Terpakai,Sisa Kuota Tahunan,Cuti Besar,Cuti Sakit,Cuti Melahirkan,Cuti Alasan Penting (CAP),Cuti CLTN\n";
    masterPegawai.forEach(p => {
        const nama = p.nama || p.nama_pegawai || '';
        const nip = p.nip || '';
        const nik = p.nik || '';
        const jab = p.jabatan || '';
        const jk = p.jenis_kelamin || p['jenis kelamin'] || '';
        const gol = p.golongan || p.pangkat_gol || '';
        const status = p.status || p.status_asn || '';
        const jatah = p.jatah_tahunan || 12;
        const tahTerpakai = p.cuti_tahunan !== undefined ? p.cuti_tahunan : (p.cuti_terpakai || 0);
        const sisa = p.sisa_kuota !== undefined ? p.sisa_kuota : (jatah - tahTerpakai);
        csv += `"${nama}","${nip}","${nik}","${jab}","${jk}","${gol}","${status}","${jatah}","${tahTerpakai}","${sisa}","${p.cuti_besar || 0}","${p.cuti_sakit || 0}","${p.cuti_melahirkan || 0}","${p.cuti_alasan_penting || 0}","${p.cuti_cltn || 0}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rekap_cuti_asn_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Konfigurasi Modal
function loadConfigToModal() {
    const cfg = getAppConfig();
    document.getElementById('cfgKota').value = cfg.kota || '';
    document.getElementById('cfgUnit').value = cfg.unitKerja || '';
    document.getElementById('cfgAtasanNama').value = cfg.atasanNama || '';
    document.getElementById('cfgAtasanNip').value = cfg.atasanNip || '';
    document.getElementById('cfgPejabatNama').value = cfg.pejabatNama || '';
    document.getElementById('cfgPejabatNip').value = cfg.pejabatNip || '';
    document.getElementById('cfgPejabatJabatan').value = cfg.pejabatJabatan || '';
    document.getElementById('cfgTembusan').value = cfg.tembusan || '';
    document.getElementById('cfgGasUrl').value = getGasUrl();
}

function saveConfig() {
    const cfg = {
        kota: document.getElementById('cfgKota').value.trim(),
        unitKerja: document.getElementById('cfgUnit').value.trim(),
        atasanNama: document.getElementById('cfgAtasanNama').value.trim(),
        atasanNip: document.getElementById('cfgAtasanNip').value.trim(),
        pejabatNama: document.getElementById('cfgPejabatNama').value.trim(),
        pejabatNip: document.getElementById('cfgPejabatNip').value.trim(),
        pejabatJabatan: document.getElementById('cfgPejabatJabatan').value.trim(),
        tembusan: document.getElementById('cfgTembusan').value.trim()
    };
    const newGasUrl = document.getElementById('cfgGasUrl').value.trim();
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(cfg));
    if (newGasUrl) localStorage.setItem(STORAGE_GAS_KEY, newGasUrl);
}

// Helpers Ringan
function hitungHari(tglMulai, tglSelesai, fallback) {
    const d1 = new Date(tglMulai);
    const d2 = new Date(tglSelesai);
    if (!isNaN(d1) && !isNaN(d2)) {
        const selisih = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        return selisih > 0 ? selisih : 1;
    }
    return Number(fallback) || 1;
}

function formatTglSlash(tglStr) {
    if (!tglStr) return '-';
    const p = String(tglStr).split('-');
    if (p.length === 3) return `${parseInt(p[2], 10)}/${parseInt(p[1], 10)}/${p[0]}`;
    return tglStr;
}

function formatTglLengkapIndo(tglStr) {
    if (!tglStr) return '-';
    const p = String(tglStr).split('-');
    if (p.length === 3) {
        const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${parseInt(p[2], 10)} ${bulan[parseInt(p[1], 10) - 1]} ${p[0]}`;
    }
    return tglStr;
}

function angkaKeTerbilang(n) {
    const kamus = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas', 'Dua Belas'];
    if (n >= 1 && n <= 12) return kamus[n];
    return String(n);
}

function showToast(msg, type = 'info') {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'fixed bottom-4 right-4 px-4 py-2.5 rounded-lg shadow-lg text-xs text-white font-semibold z-50 ';
    toast.classList.add(type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-rose-600' : 'bg-slate-800'));
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}
