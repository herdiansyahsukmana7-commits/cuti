/**
 * ============================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS) - SISTEM PENGAJUAN & REKAP 6 JENIS CUTI ASN
 * ============================================================================
 * 1. Sheet `masterpegawai` (Data Master Pegawai Sesuai Permintaan):
 *    - Nama
 *    - NIP
 *    - NIK
 *    - Jabatan
 *    - Jenis Kelamin
 *    - Golongan
 *    - Status
 *
 * 2. Sheet `masterdatarekap` (Rekap Kuota & 6 Jenis Cuti Pegawai, Otomatis Sinkron dengan masterpegawai):
 *    - Nama
 *    - NIP
 *    - NIK
 *    - Jabatan
 *    - Jenis Kelamin
 *    - Golongan
 *    - Status
 *    - Bidang/UPT
 *    - jatah_tahunan
 *    - cuti_tahunan          (Rekap Cuti Tahunan Disetujui)
 *    - sisa_kuota            (Sisa Kuota Cuti Tahunan)
 *    - cuti_besar            (Rekap Cuti Besar Disetujui)
 *    - cuti_sakit            (Rekap Cuti Sakit Disetujui)
 *    - cuti_melahirkan       (Rekap Cuti Melahirkan Disetujui)
 *    - cuti_alasan_penting   (Rekap Cuti Karena Alasan Penting / CAP Disetujui)
 *    - cuti_cltn             (Rekap Cuti di Luar Tanggungan Negara / CLTN Disetujui)
 *    - n2
 *    - n1
 *    - n
 *
 * 3. Sheet `pengajuancuti` (29 Kolom Template Instansi) & 6 Sheet Terpisah per Jenis Cuti:
 *    - Cuti Tahunan
 *    - Cuti Besar
 *    - Cuti Sakit
 *    - Cuti Melahirkan
 *    - Cuti Alasan Penting
 *    - Cuti CLTN
 * ============================================================================
 */

const SHEET_MASTER_PEGAWAI = 'masterpegawai';
const SHEET_PEGAWAI = 'masterdatarekap';
const SHEET_CUTI = 'pengajuancuti';

const JENIS_CUTI_SHEETS = {
  'Cuti Tahunan': 'Cuti Tahunan',
  'Cuti Besar': 'Cuti Besar',
  'Cuti Sakit': 'Cuti Sakit',
  'Cuti Melahirkan': 'Cuti Melahirkan',
  'Cuti Karena Alasan Penting': 'Cuti Alasan Penting',
  'Cuti di Luar Tanggungan Negara': 'Cuti CLTN'
};

// Header Sheet `masterpegawai` (7 Kolom Sesuai Permintaan)
const HEADERS_SHEET_MASTERPEGAWAI = [
  'Nama',
  'NIP',
  'NIK',
  'Jabatan',
  'Jenis Kelamin',
  'Golongan',
  'Status'
];

// Header Sheet `masterdatarekap` (Lengkap dengan identitas masterpegawai + rekap 6 jenis cuti)
const HEADERS_MASTER_REKAP = [
  'Nama',
  'NIP',
  'NIK',
  'Jabatan',
  'Jenis Kelamin',
  'Golongan',
  'Status',
  'Bidang/UPT',
  'jatah_tahunan',
  'cuti_tahunan',
  'sisa_kuota',
  'cuti_besar',
  'cuti_sakit',
  'cuti_melahirkan',
  'cuti_alasan_penting',
  'cuti_cltn',
  'n2',
  'n1',
  'n'
];

// Header Sheet `pengajuancuti` (29 Kolom Template Instansi)
const HEADERS_PENGAJUAN_CUTI = [
  'Nama',
  'NIP',
  'Pangkat/Gol',
  'Jabatan',
  'Lama Cuti',
  'Tanggal Cuti',
  'Tanggal Surat',
  'ALASAN',
  'Tembusan',
  'NO. Surat',
  'Barcode',
  'ALASAN PENTING',
  'Ket',
  'PPK',
  'SAKIT',
  'Pangkat',
  'TMT Saat Ini',
  'TMT Yang Akan Datang',
  'Keterangan',
  'N2',
  'N1',
  'N',
  'Pangkat - GOL RUANG',
  'TMT',
  'PANGKAT SELANJUTNYA - GOL RUANG',
  'PAK - PANGKAT TERAKHIR',
  'PAK YANG DIBUTUHKAN SELANJTNYA',
  'Tahun Lahir',
  'BUP'
];

// Data Contoh Awal Master Pegawai (Sesuai Dokumen Dinas Kesehatan Kota Tangerang Selatan)
const DEFAULT_DATA_MASTERPEGAWAI = [
  [
    'Rudy, S.Sos.I',
    '198211012025211017',
    '3674010111820001',
    'Penata Layanan Operasional',
    'Laki-laki',
    'IX',
    'PPPK'
  ],
  [
    'Deni Sueb, S.IP',
    '199005282025211007',
    '3674012805900002',
    'Penata Layanan Operasional',
    'Laki-laki',
    'IX',
    'PPPK'
  ],
  [
    'Evie Ervina Rahmawati, SE',
    '197505072025212006',
    '3674014705750003',
    'Penata Layanan Operasional',
    'Perempuan',
    'IX',
    'PPPK'
  ]
];

/**
 * Inisialisasi otomatis Sheet `masterpegawai`, `masterdatarekap`, `pengajuancuti`, & 6 Sheet Jenis Cuti
 */
function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Pastikan sheet `masterpegawai` (Nama, NIP, NIK, Jabatan, Jenis Kelamin, Golongan, Status) ada
  let shMasterPegawai = ss.getSheetByName(SHEET_MASTER_PEGAWAI);
  if (!shMasterPegawai) {
    shMasterPegawai = ss.insertSheet(SHEET_MASTER_PEGAWAI);
    shMasterPegawai.appendRow(HEADERS_SHEET_MASTERPEGAWAI);
    styleHeaderRow(shMasterPegawai, HEADERS_SHEET_MASTERPEGAWAI.length);
    DEFAULT_DATA_MASTERPEGAWAI.forEach(r => shMasterPegawai.appendRow(r));
    formatSheetTable(shMasterPegawai);
  } else if (shMasterPegawai.getLastColumn() === 0) {
    shMasterPegawai.appendRow(HEADERS_SHEET_MASTERPEGAWAI);
    styleHeaderRow(shMasterPegawai, HEADERS_SHEET_MASTERPEGAWAI.length);
    DEFAULT_DATA_MASTERPEGAWAI.forEach(r => shMasterPegawai.appendRow(r));
    formatSheetTable(shMasterPegawai);
  } else {
    // Pastikan kolom sesuai 7 kolom: Nama, NIP, NIK, Jabatan, Jenis Kelamin, Golongan, Status
    const curHeaders = shMasterPegawai.getRange(1, 1, 1, shMasterPegawai.getLastColumn()).getValues()[0].map(h => String(h).trim().toLowerCase());
    if (curHeaders.indexOf('nik') === -1 || curHeaders.indexOf('jenis kelamin') === -1) {
      shMasterPegawai.getRange(1, 1, 1, HEADERS_SHEET_MASTERPEGAWAI.length).setValues([HEADERS_SHEET_MASTERPEGAWAI]);
      styleHeaderRow(shMasterPegawai, HEADERS_SHEET_MASTERPEGAWAI.length);
    }
  }

  // 2. Pastikan sheet `masterdatarekap` ada
  let shPegawai = ss.getSheetByName(SHEET_PEGAWAI);
  if (!shPegawai) {
    shPegawai = ss.insertSheet(SHEET_PEGAWAI);
    shPegawai.appendRow(HEADERS_MASTER_REKAP);
    styleHeaderRow(shPegawai, HEADERS_MASTER_REKAP.length);
    syncMasterPegawaiToRekap(shMasterPegawai, shPegawai);
  } else {
    const lastCol = shPegawai.getLastColumn();
    if (lastCol === 0) {
      shPegawai.appendRow(HEADERS_MASTER_REKAP);
      styleHeaderRow(shPegawai, HEADERS_MASTER_REKAP.length);
      syncMasterPegawaiToRekap(shMasterPegawai, shPegawai);
    } else {
      const currentHeaders = shPegawai.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim().toLowerCase());
      if (currentHeaders.indexOf('nik') === -1 || currentHeaders.indexOf('jenis kelamin') === -1 || currentHeaders.indexOf('cuti_besar') === -1) {
        migrateMasterRekapSheet(shPegawai);
      }
      syncMasterPegawaiToRekap(shMasterPegawai, shPegawai);
    }
  }

  // 3. Pastikan sheet utama `pengajuancuti` (29 kolom) ada
  let shCuti = ss.getSheetByName(SHEET_CUTI);
  if (!shCuti) {
    shCuti = ss.insertSheet(SHEET_CUTI);
    shCuti.appendRow(HEADERS_PENGAJUAN_CUTI);
    styleHeaderRow(shCuti, HEADERS_PENGAJUAN_CUTI.length);
  } else {
    const lastCol = shCuti.getLastColumn();
    if (lastCol === 0) {
      shCuti.appendRow(HEADERS_PENGAJUAN_CUTI);
      styleHeaderRow(shCuti, HEADERS_PENGAJUAN_CUTI.length);
    } else {
      const firstRow = shCuti.getRange(1, 1, 1, Math.max(lastCol, HEADERS_PENGAJUAN_CUTI.length)).getValues()[0];
      if (String(firstRow[0]).toLowerCase() === 'id') {
        shCuti.getRange(1, 1, 1, HEADERS_PENGAJUAN_CUTI.length).setValues([HEADERS_PENGAJUAN_CUTI]);
        styleHeaderRow(shCuti, HEADERS_PENGAJUAN_CUTI.length);
      }
    }
  }

  // 4. Pastikan ke-6 Sheet masing-masing Jenis Cuti tersedia dengan template 29 kolom
  Object.keys(JENIS_CUTI_SHEETS).forEach(key => {
    const sheetName = JENIS_CUTI_SHEETS[key];
    let shJenis = ss.getSheetByName(sheetName);
    if (!shJenis) {
      shJenis = ss.insertSheet(sheetName);
      shJenis.appendRow(HEADERS_PENGAJUAN_CUTI);
      styleHeaderRow(shJenis, HEADERS_PENGAJUAN_CUTI.length);
    } else if (shJenis.getLastColumn() === 0) {
      shJenis.appendRow(HEADERS_PENGAJUAN_CUTI);
      styleHeaderRow(shJenis, HEADERS_PENGAJUAN_CUTI.length);
    }
  });

  return { ss, shMasterPegawai, shPegawai, shCuti };
}

/**
 * Menyinkronkan data dari sheet `masterpegawai` (Nama, NIP, NIK, Jabatan, Jenis Kelamin, Golongan, Status)
 * ke sheet `masterdatarekap` agar setiap penambahan pegawai di `masterpegawai` otomatis muncul di rekap kuota.
 */
function syncMasterPegawaiToRekap(shMasterPegawai, shPegawai) {
  if (!shMasterPegawai || !shPegawai) return;

  const masterRows = shMasterPegawai.getDataRange().getValues();
  const rekapRows = shPegawai.getDataRange().getValues();

  // Map data yang sudah ada di masterdatarekap berdasarkan NIP
  const existingRekapMap = {};
  if (rekapRows.length > 1) {
    const rHeaders = rekapRows[0].map(h => String(h).trim().toLowerCase());
    const idxNip = rHeaders.indexOf('nip');
    for (let i = 1; i < rekapRows.length; i++) {
      const r = rekapRows[i];
      const nip = String(idxNip !== -1 ? r[idxNip] : r[1] || '').trim();
      if (!nip) continue;
      const obj = {};
      rHeaders.forEach((h, colIdx) => {
        obj[h] = r[colIdx];
      });
      existingRekapMap[nip] = obj;
    }
  }

  // Jika masterpegawai masih kosong tapi masterdatarekap punya data, salin ke masterpegawai
  if (masterRows.length <= 1 && Object.keys(existingRekapMap).length > 0) {
    Object.keys(existingRekapMap).forEach(nip => {
      const d = existingRekapMap[nip];
      shMasterPegawai.appendRow([
        d['nama'] || d['nama_pegawai'] || '',
        nip,
        d['nik'] || '-',
        d['jabatan'] || '-',
        d['jenis kelamin'] || d['jenis_kelamin'] || '-',
        d['golongan'] || d['pangkat_gol'] || '-',
        d['status'] || d['status_asn'] || 'PNS'
      ]);
    });
    formatSheetTable(shMasterPegawai);
    return;
  }

  if (masterRows.length <= 1) return;

  const mHeaders = masterRows[0].map(h => String(h).trim().toLowerCase());
  const getMVal = (row, keys, fallback = '') => {
    for (let k of keys) {
      const idx = mHeaders.indexOf(k);
      if (idx !== -1 && row[idx] !== undefined && row[idx] !== '') return row[idx];
    }
    return fallback;
  };

  const newRekapData = [HEADERS_MASTER_REKAP];
  const seenNips = {};

  for (let i = 1; i < masterRows.length; i++) {
    const mRow = masterRows[i];
    if (mRow.every(c => c === '' || c === null)) continue;

    const nama = getMVal(mRow, ['nama', 'nama_pegawai'], mRow[0] || '');
    const nip = String(getMVal(mRow, ['nip'], mRow[1] || '')).trim();
    if (!nip) continue;
    seenNips[nip] = true;

    const nik = getMVal(mRow, ['nik'], mRow[2] || '-');
    const jabatan = getMVal(mRow, ['jabatan'], mRow[3] || '-');
    const jk = getMVal(mRow, ['jenis kelamin', 'jenis_kelamin', 'jk'], mRow[4] || '-');
    const golongan = getMVal(mRow, ['golongan', 'pangkat/gol', 'pangkat_gol'], mRow[5] || '-');
    const status = getMVal(mRow, ['status', 'status_asn'], mRow[6] || 'PNS');

    const prev = existingRekapMap[nip] || {};
    const bidang = prev['bidang/upt'] || prev['divisi'] || jabatan || '-';
    const jatah = Number(prev['jatah_tahunan'] !== undefined && prev['jatah_tahunan'] !== '' ? prev['jatah_tahunan'] : 12);
    const cTahunan = Number(prev['cuti_tahunan'] || 0);
    const sisa = Number(prev['sisa_kuota'] !== undefined && prev['sisa_kuota'] !== '' ? prev['sisa_kuota'] : Math.max(0, jatah - cTahunan));

    newRekapData.push([
      nama,
      nip,
      nik,
      jabatan,
      jk,
      golongan,
      status,
      bidang,
      jatah,
      cTahunan,
      sisa,
      Number(prev['cuti_besar'] || 0),
      Number(prev['cuti_sakit'] || 0),
      Number(prev['cuti_melahirkan'] || 0),
      Number(prev['cuti_alasan_penting'] || 0),
      Number(prev['cuti_cltn'] || 0),
      Number(prev['n2'] || 0),
      Number(prev['n1'] || 0),
      Number(prev['n'] !== undefined && prev['n'] !== '' ? prev['n'] : sisa)
    ]);
  }

  shPegawai.clearContents();
  shPegawai.getRange(1, 1, newRekapData.length, HEADERS_MASTER_REKAP.length).setValues(newRekapData);
  styleHeaderRow(shPegawai, HEADERS_MASTER_REKAP.length);
  formatSheetTable(shPegawai);
}

/**
 * Migrasi otomatis data lama di masterdatarekap ke struktur 19 kolom baru (dengan NIK & Jenis Kelamin)
 */
function migrateMasterRekapSheet(shPegawai) {
  const allValues = shPegawai.getDataRange().getValues();
  if (allValues.length === 0) {
    shPegawai.getRange(1, 1, 1, HEADERS_MASTER_REKAP.length).setValues([HEADERS_MASTER_REKAP]);
    styleHeaderRow(shPegawai, HEADERS_MASTER_REKAP.length);
    return;
  }

  const oldHeaders = allValues[0].map(h => String(h).trim().toLowerCase());
  const newRows = [HEADERS_MASTER_REKAP];

  for (let i = 1; i < allValues.length; i++) {
    const row = allValues[i];
    if (row.every(c => c === '' || c === null)) continue;

    const getVal = (keys, fallback = '') => {
      for (let k of keys) {
        const idx = oldHeaders.indexOf(k);
        if (idx !== -1 && row[idx] !== undefined && row[idx] !== '') return row[idx];
      }
      return fallback;
    };

    const jatah = Number(getVal(['jatah_tahunan'], 12));
    const tahTerpakai = Number(getVal(['cuti_tahunan', 'cuti_terpakai'], 0));
    const sisa = Number(getVal(['sisa_kuota'], Math.max(0, jatah - tahTerpakai)));

    newRows.push([
      getVal(['nama', 'nama_pegawai'], ''),
      getVal(['nip'], ''),
      getVal(['nik'], '-'),
      getVal(['jabatan'], '-'),
      getVal(['jenis kelamin', 'jenis_kelamin'], '-'),
      getVal(['golongan', 'pangkat_gol', 'pangkat/gol'], '-'),
      getVal(['status', 'status_asn'], 'PNS'),
      getVal(['bidang/upt', 'divisi', 'unit_kerja'], '-'),
      jatah,
      tahTerpakai,
      sisa,
      Number(getVal(['cuti_besar'], 0)),
      Number(getVal(['cuti_sakit'], 0)),
      Number(getVal(['cuti_melahirkan'], 0)),
      Number(getVal(['cuti_alasan_penting'], 0)),
      Number(getVal(['cuti_cltn'], 0)),
      Number(getVal(['n2'], 0)),
      Number(getVal(['n1'], 0)),
      Number(getVal(['n'], sisa))
    ]);
  }

  shPegawai.clearContents();
  shPegawai.getRange(1, 1, newRows.length, HEADERS_MASTER_REKAP.length).setValues(newRows);
  styleHeaderRow(shPegawai, HEADERS_MASTER_REKAP.length);
  formatSheetTable(shPegawai);
}

/**
 * Merapikan tampilan header & tabel Spreadsheet (warna biru tua, border, perataan)
 */
function styleHeaderRow(sheet, numCols) {
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange
    .setBackground('#1b4f72')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontFamily('Arial')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 34);
}

function formatSheetTable(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return;

  const fullRange = sheet.getRange(1, 1, lastRow, lastCol);
  fullRange.setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  fullRange.setVerticalAlignment('middle');

  if (lastRow > 1) {
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    dataRange.setFontFamily('Arial').setFontSize(10);
  }
}

/**
 * Jalankan fungsi ini dari Editor Apps Script untuk membuat & merapikan seluruh Sheet sekaligus
 */
function setupSheets() {
  const { shMasterPegawai, shPegawai, shCuti } = ensureSheets();
  migrateMasterRekapSheet(shPegawai);
  syncMasterPegawaiToRekap(shMasterPegawai, shPegawai);
  shCuti.getRange(1, 1, 1, HEADERS_PENGAJUAN_CUTI.length).setValues([HEADERS_PENGAJUAN_CUTI]);
  styleHeaderRow(shCuti, HEADERS_PENGAJUAN_CUTI.length);
  formatSheetTable(shCuti);
  syncJenisCutiSheets();
  recalculateQuotas();
}

/**
 * Menyinkronkan data dari sheet utama `pengajuancuti` ke 6 sheet terpisah berdasarkan jenis cuti
 */
function syncJenisCutiSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shCuti = ss.getSheetByName(SHEET_CUTI);
  if (!shCuti) return;

  const allRows = shCuti.getDataRange().getValues();
  const grouped = {
    'Cuti Tahunan': [],
    'Cuti Besar': [],
    'Cuti Sakit': [],
    'Cuti Melahirkan': [],
    'Cuti Alasan Penting': [],
    'Cuti CLTN': []
  };

  for (let i = 1; i < allRows.length; i++) {
    const r = allRows[i];
    if (r.every(c => c === '' || c === null)) continue;
    const jenisRaw = String(r[12] || 'Cuti Tahunan');
    const targetSheetName = resolveJenisSheetName(jenisRaw);
    if (grouped[targetSheetName]) {
      grouped[targetSheetName].push(r);
    }
  }

  Object.keys(grouped).forEach(sheetName => {
    let sh = ss.getSheetByName(sheetName);
    if (!sh) {
      sh = ss.insertSheet(sheetName);
    }
    sh.clearContents();
    const rowsToWrite = [HEADERS_PENGAJUAN_CUTI].concat(grouped[sheetName]);
    sh.getRange(1, 1, rowsToWrite.length, HEADERS_PENGAJUAN_CUTI.length).setValues(rowsToWrite);
    styleHeaderRow(sh, HEADERS_PENGAJUAN_CUTI.length);
    formatSheetTable(sh);
  });
}

function resolveJenisSheetName(jenisStr) {
  const j = String(jenisStr || '').toLowerCase();
  if (j.indexOf('besar') !== -1) return 'Cuti Besar';
  if (j.indexOf('sakit') !== -1) return 'Cuti Sakit';
  if (j.indexOf('melahirkan') !== -1 || j.indexOf('lahir') !== -1) return 'Cuti Melahirkan';
  if (j.indexOf('penting') !== -1 || j.indexOf('cap') !== -1) return 'Cuti Alasan Penting';
  if (j.indexOf('luar tanggungan') !== -1 || j.indexOf('cltn') !== -1) return 'Cuti CLTN';
  return 'Cuti Tahunan';
}

/**
 * Handler HTTP GET
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'read';
    const { shMasterPegawai, shPegawai, shCuti } = ensureSheets();

    if (action === 'getPegawai') {
      syncMasterPegawaiToRekap(shMasterPegawai, shPegawai);
      recalculateQuotas();
      const dataPegawai = getMasterPegawaiList(shPegawai);
      return jsonResponse({ status: 'success', data: dataPegawai });
    }

    if (action === 'read') {
      const dataCuti = getPengajuanCutiList(shCuti).reverse();
      return jsonResponse({ status: 'success', data: dataCuti });
    }

    return jsonResponse({ status: 'error', message: 'Action GET tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Handler HTTP POST
 * Mendukung:
 * - createPegawai : Menambah pegawai baru ke sheet `masterpegawai` & `masterdatarekap`
 * - create        : Mengajukan permohonan cuti baru
 * - update        : Memperbarui pengajuan cuti
 * - updateStatus  : Menyetujui / menolak cuti
 * - delete        : Menghapus pengajuan cuti
 */
function doPost(e) {
  try {
    const { shMasterPegawai, shPegawai, shCuti } = ensureSheets();
    const rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(rawBody);
    const action = body.action;

    // Tambah Master Pegawai Baru (Nama, NIP, NIK, Jabatan, Jenis Kelamin, Golongan, Status)
    if (action === 'createPegawai') {
      const p = body.payload || {};
      const nama = String(p.nama || p.nama_pegawai || '').trim();
      const nip = String(p.nip || '').trim();
      const nik = String(p.nik || '-').trim();
      const jabatan = String(p.jabatan || '-').trim();
      const jk = String(p.jenis_kelamin || 'Laki-laki').trim();
      const golongan = String(p.golongan || '-').trim();
      const status = String(p.status || p.status_asn || 'PNS').trim();

      if (!nama || !nip) {
        return jsonResponse({ status: 'error', message: 'Nama dan NIP wajib diisi!' });
      }

      shMasterPegawai.appendRow([nama, nip, nik, jabatan, jk, golongan, status]);
      formatSheetTable(shMasterPegawai);
      syncMasterPegawaiToRekap(shMasterPegawai, shPegawai);
      recalculateQuotas();

      return jsonResponse({
        status: 'success',
        message: 'Data pegawai berhasil ditambahkan ke sheet masterpegawai & masterdatarekap!'
      });
    }

    if (action === 'create') {
      const p = body.payload || {};
      const newId = 'ASN-' + new Date().getTime();
      const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

      const listPegawai = getMasterPegawaiList(shPegawai);
      const peg = listPegawai.find(x => String(x.nip).trim() === String(p.nip).trim()) || {};

      const durasi = hitungDurasiHari(p.tanggal_mulai, p.tanggal_selesai);
      const tglCutiFormatted = formatRentangTanggal(p.tanggal_mulai, p.tanggal_selesai);
      const jenisCuti = String(p.jenis_cuti || 'Cuti Tahunan');
      const alasan = String(p.alasan || '');

      const isCAP = jenisCuti.toLowerCase().indexOf('penting') !== -1;
      const isSakit = jenisCuti.toLowerCase().indexOf('sakit') !== -1;

      const golPegawai = String(p.golongan || p.pangkat_gol || peg.golongan || peg.pangkat_gol || '-');
      const jabPegawai = String(p.jabatan || peg.jabatan || peg.bidang_upt || '-');

      const rowBaru = [
        String(p.nama_pegawai || peg.nama_pegawai || ''),         // 1. Nama
        String(p.nip || ''),                                      // 2. NIP
        golPegawai,                                               // 3. Pangkat/Gol
        jabPegawai,                                               // 4. Jabatan
        durasi + ' Hari',                                         // 5. Lama Cuti
        tglCutiFormatted,                                         // 6. Tanggal Cuti
        todayStr,                                                 // 7. Tanggal Surat
        alasan,                                                   // 8. ALASAN
        String(p.alamat_cuti || p.tembusan || '-'),               // 9. Tembusan / Alamat Cuti
        newId,                                                    // 10. NO. Surat
        String(p.no_telp || p.barcode || ''),                     // 11. Barcode / No Telp
        isCAP ? alasan : '',                                      // 12. ALASAN PENTING
        jenisCuti,                                                // 13. Ket (Jenis Cuti)
        String(p.masa_kerja || p.ppk || '01 Tahun 03 Bulan'),     // 14. PPK / Masa Kerja
        isSakit ? alasan : '',                                    // 15. SAKIT
        String(p.pangkat || golPegawai),                          // 16. Pangkat
        String(p.tmt_saat_ini || ''),                             // 17. TMT Saat Ini
        String(p.tmt_yad || ''),                                  // 18. TMT Yang Akan Datang
        'Menunggu Approval',                                      // 19. Keterangan (Status Approval)
        peg.n2 !== undefined ? peg.n2 : 0,                        // 20. N2
        peg.n1 !== undefined ? peg.n1 : 0,                        // 21. N1
        peg.sisa_kuota !== undefined ? peg.sisa_kuota : 12,       // 22. N
        String(p.pangkat_gol_ruang || golPegawai),                // 23. Pangkat - GOL RUANG
        String(p.tmt || ''),                                      // 24. TMT
        String(p.pangkat_selanjutnya || ''),                      // 25. PANGKAT SELANJUTNYA - GOL RUANG
        String(p.pak_terakhir || ''),                             // 26. PAK - PANGKAT TERAKHIR
        String(p.pak_selanjutnya || ''),                          // 27. PAK YANG DIBUTUHKAN SELANJTNYA
        ambilTahunLahirDariNip(p.nip),                            // 28. Tahun Lahir
        String(p.bup || '58')                                     // 29. BUP
      ];

      shCuti.appendRow(rowBaru);
      formatSheetTable(shCuti);
      syncJenisCutiSheets();
      recalculateQuotas();

      const targetSheet = resolveJenisSheetName(jenisCuti);
      return jsonResponse({
        status: 'success',
        message: `Permohonan ${jenisCuti} berhasil disimpan ke sheet pengajuancuti & sheet ${targetSheet}!`,
        id: newId
      });
    }

    if (action === 'update') {
      const p = body.payload || {};
      const targetId = String(p.id || '');
      const rowIndex = findRowIndexByIdOrRow(shCuti, targetId);

      if (rowIndex !== -1) {
        const listPegawai = getMasterPegawaiList(shPegawai);
        const peg = listPegawai.find(x => String(x.nip).trim() === String(p.nip).trim()) || {};

        const durasi = hitungDurasiHari(p.tanggal_mulai, p.tanggal_selesai);
        const tglCutiFormatted = formatRentangTanggal(p.tanggal_mulai, p.tanggal_selesai);
        const jenisCuti = String(p.jenis_cuti || 'Cuti Tahunan');
        const alasan = String(p.alasan || '');
        const isCAP = jenisCuti.toLowerCase().indexOf('penting') !== -1;
        const isSakit = jenisCuti.toLowerCase().indexOf('sakit') !== -1;

        shCuti.getRange(rowIndex, 1).setValue(String(p.nama_pegawai || peg.nama_pegawai || ''));
        shCuti.getRange(rowIndex, 2).setValue(String(p.nip || ''));
        shCuti.getRange(rowIndex, 3).setValue(String(peg.golongan || '-'));
        shCuti.getRange(rowIndex, 4).setValue(String(peg.jabatan || '-'));
        shCuti.getRange(rowIndex, 5).setValue(durasi + ' Hari');
        shCuti.getRange(rowIndex, 6).setValue(tglCutiFormatted);
        shCuti.getRange(rowIndex, 8).setValue(alasan);
        shCuti.getRange(rowIndex, 9).setValue(String(p.alamat_cuti || '-'));
        shCuti.getRange(rowIndex, 11).setValue(String(p.no_telp || ''));
        shCuti.getRange(rowIndex, 12).setValue(isCAP ? alasan : '');
        shCuti.getRange(rowIndex, 13).setValue(jenisCuti);
        shCuti.getRange(rowIndex, 14).setValue(String(p.masa_kerja || '01 Tahun 03 Bulan'));
        shCuti.getRange(rowIndex, 15).setValue(isSakit ? alasan : '');

        syncJenisCutiSheets();
        recalculateQuotas();
        return jsonResponse({ status: 'success', message: 'Data pengajuan cuti berhasil diperbarui!' });
      }
      return jsonResponse({ status: 'error', message: 'Data pengajuan tidak ditemukan.' });
    }

    if (action === 'updateStatus') {
      const targetId = String(body.id || '');
      const newStatus = String(body.status || 'Menunggu Approval');
      const rowIndex = findRowIndexByIdOrRow(shCuti, targetId);

      if (rowIndex !== -1) {
        shCuti.getRange(rowIndex, 19).setValue(newStatus);
        syncJenisCutiSheets();
        recalculateQuotas();
        return jsonResponse({ status: 'success', message: 'Status cuti diubah menjadi ' + newStatus });
      }
      return jsonResponse({ status: 'error', message: 'Data pengajuan tidak ditemukan.' });
    }

    if (action === 'delete') {
      const targetId = String(body.id || '');
      const rowIndex = findRowIndexByIdOrRow(shCuti, targetId);

      if (rowIndex !== -1) {
        shCuti.deleteRow(rowIndex);
        syncJenisCutiSheets();
        recalculateQuotas();
        return jsonResponse({ status: 'success', message: 'Data pengajuan cuti berhasil dihapus.' });
      }
      return jsonResponse({ status: 'error', message: 'Data pengajuan tidak ditemukan.' });
    }

    return jsonResponse({ status: 'error', message: 'Action POST tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Membaca sheet pengajuancuti (29 kolom)
 */
function getPengajuanCutiList(shCuti) {
  const rows = shCuti.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.every(cell => cell === '' || cell === null)) continue;

    const nama = String(r[0] || '');
    const nip = String(r[1] || '');
    const pangkatGol = String(r[2] || '');
    const jabatan = String(r[3] || '');
    const lamaCutiRaw = String(r[4] || '1');
    const tglCutiRaw = formatCellDate(r[5]);
    const tglSuratRaw = formatCellDate(r[6]);
    const alasan = String(r[7] || r[11] || r[14] || '');
    const noSurat = String(r[9] || ('ROW-' + (i + 1)));
    const ketJenis = String(r[12] || 'Cuti Tahunan');
    const statusKet = String(r[18] || 'Menunggu Approval');

    let tglMulai = tglCutiRaw;
    let tglSelesai = tglCutiRaw;
    if (tglCutiRaw.indexOf(' s/d ') !== -1) {
      const parts = tglCutiRaw.split(' s/d ');
      tglMulai = parts[0].trim();
      tglSelesai = parts[1].trim();
    } else if (tglCutiRaw.indexOf(' s.d ') !== -1) {
      const parts = tglCutiRaw.split(' s.d ');
      tglMulai = parts[0].trim();
      tglSelesai = parts[1].trim();
    }

    result.push({
      id: noSurat,
      nip: nip,
      nama_pegawai: nama,
      golongan: pangkatGol,
      pangkat_gol: pangkatGol,
      jabatan: jabatan,
      lama_cuti: parseInt(lamaCutiRaw, 10) || 1,
      jenis_cuti: ketJenis || 'Cuti Tahunan',
      tanggal_mulai: tglMulai,
      tanggal_selesai: tglSelesai,
      tanggal_cuti: tglCutiRaw,
      created_at: tglSuratRaw,
      alasan: alasan,
      alamat_cuti: String(r[8] || ''),
      tembusan: String(r[8] || ''),
      no_surat: noSurat,
      no_telp: String(r[10] || ''),
      barcode: String(r[10] || ''),
      alasan_penting: String(r[11] || ''),
      masa_kerja: String(r[13] || '01 Tahun 03 Bulan'),
      ppk: String(r[13] || ''),
      sakit: String(r[14] || ''),
      pangkat: String(r[15] || ''),
      tmt_saat_ini: formatCellDate(r[16]),
      tmt_yad: formatCellDate(r[17]),
      status: statusKet || 'Menunggu Approval',
      n2: r[19],
      n1: r[20],
      n: r[21],
      pangkat_gol_ruang: String(r[22] || ''),
      tmt: formatCellDate(r[23]),
      pangkat_selanjutnya: String(r[24] || ''),
      pak_terakhir: String(r[25] || ''),
      pak_selanjutnya: String(r[26] || ''),
      tahun_lahir: String(r[27] || ''),
      bup: String(r[28] || '')
    });
  }
  return result;
}

/**
 * Membaca sheet masterdatarekap (yang sudah tersinkron dengan masterpegawai)
 */
function getMasterPegawaiList(shPegawai) {
  const rows = shPegawai.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every(cell => cell === '' || cell === null)) continue;

    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = formatCellDate(row[idx]);
    });

    obj.nama_pegawai = obj['nama'] || obj.nama_pegawai || row[0] || '';
    obj.nama = obj.nama_pegawai;
    obj.nip = obj.nip || row[1] || '';
    obj.nik = obj.nik || row[2] || '-';
    obj.jabatan = obj.jabatan || row[3] || '-';
    obj.jenis_kelamin = obj['jenis kelamin'] || obj.jenis_kelamin || row[4] || '-';
    obj.golongan = obj.golongan || obj['pangkat_gol'] || obj['pangkat/gol'] || row[5] || '-';
    obj.pangkat_gol = obj.golongan;
    obj.status_asn = obj['status'] || obj.status_asn || row[6] || 'PNS';
    obj.status = obj.status_asn;
    obj.bidang_upt = obj['bidang/upt'] || obj['bidang_upt'] || obj.divisi || obj.unit_kerja || row[7] || '-';
    obj.divisi = obj.bidang_upt;

    obj.jatah_tahunan = Number(obj.jatah_tahunan !== undefined && obj.jatah_tahunan !== '' ? obj.jatah_tahunan : 12);
    obj.cuti_tahunan = Number(obj.cuti_tahunan !== undefined && obj.cuti_tahunan !== '' ? obj.cuti_tahunan : (obj.cuti_terpakai || 0));
    obj.cuti_terpakai = obj.cuti_tahunan;
    obj.sisa_kuota = Number(obj.sisa_kuota !== undefined && obj.sisa_kuota !== '' ? obj.sisa_kuota : Math.max(0, obj.jatah_tahunan - obj.cuti_tahunan));

    obj.cuti_besar = Number(obj.cuti_besar || 0);
    obj.cuti_sakit = Number(obj.cuti_sakit || 0);
    obj.cuti_melahirkan = Number(obj.cuti_melahirkan || 0);
    obj.cuti_alasan_penting = Number(obj.cuti_alasan_penting || 0);
    obj.cuti_cltn = Number(obj.cuti_cltn || 0);

    result.push(obj);
  }
  return result;
}

/**
 * Menghitung ulang rekap ke-6 Jenis Cuti yang berstatus "Disetujui" per NIP di sheet masterdatarekap
 */
function recalculateQuotas() {
  const { shPegawai, shCuti } = ensureSheets();
  const cutiList = getPengajuanCutiList(shCuti);

  const rekapMap = {};

  cutiList.forEach(item => {
    const status = String(item.status || '').trim();
    const jenis = String(item.jenis_cuti || '').toLowerCase();
    const nip = String(item.nip || '').trim();

    if (status === 'Disetujui' && nip) {
      if (!rekapMap[nip]) {
        rekapMap[nip] = {
          tahunan: 0,
          besar: 0,
          sakit: 0,
          melahirkan: 0,
          cap: 0,
          cltn: 0
        };
      }
      const durasi = Number(item.lama_cuti) || hitungDurasiHari(item.tanggal_mulai, item.tanggal_selesai);

      if (jenis.indexOf('besar') !== -1) {
        rekapMap[nip].besar += durasi;
      } else if (jenis.indexOf('sakit') !== -1) {
        rekapMap[nip].sakit += durasi;
      } else if (jenis.indexOf('melahirkan') !== -1 || jenis.indexOf('lahir') !== -1) {
        rekapMap[nip].melahirkan += durasi;
      } else if (jenis.indexOf('penting') !== -1 || jenis.indexOf('cap') !== -1) {
        rekapMap[nip].cap += durasi;
      } else if (jenis.indexOf('luar tanggungan') !== -1 || jenis.indexOf('cltn') !== -1) {
        rekapMap[nip].cltn += durasi;
      } else {
        rekapMap[nip].tahunan += durasi;
      }
    }
  });

  const dataPegawai = shPegawai.getDataRange().getValues();
  if (dataPegawai.length <= 1) return;

  const headers = dataPegawai[0].map(h => String(h).trim().toLowerCase());
  const idxNip = headers.indexOf('nip');
  const idxJatah = headers.indexOf('jatah_tahunan');
  const idxTahunan = headers.indexOf('cuti_tahunan') !== -1 ? headers.indexOf('cuti_tahunan') : headers.indexOf('cuti_terpakai');
  const idxSisa = headers.indexOf('sisa_kuota');
  const idxBesar = headers.indexOf('cuti_besar');
  const idxSakit = headers.indexOf('cuti_sakit');
  const idxLahir = headers.indexOf('cuti_melahirkan');
  const idxCap = headers.indexOf('cuti_alasan_penting');
  const idxCltn = headers.indexOf('cuti_cltn');
  const idxN = headers.indexOf('n');

  if (idxNip === -1) return;

  for (let i = 1; i < dataPegawai.length; i++) {
    const nip = String(dataPegawai[i][idxNip]).trim();
    const jatah = idxJatah !== -1 ? (Number(dataPegawai[i][idxJatah]) || 12) : 12;
    const r = rekapMap[nip] || { tahunan: 0, besar: 0, sakit: 0, melahirkan: 0, cap: 0, cltn: 0 };
    const sisa = Math.max(0, jatah - r.tahunan);

    if (idxTahunan !== -1) shPegawai.getRange(i + 1, idxTahunan + 1).setValue(r.tahunan);
    if (idxSisa !== -1) shPegawai.getRange(i + 1, idxSisa + 1).setValue(sisa);
    if (idxBesar !== -1) shPegawai.getRange(i + 1, idxBesar + 1).setValue(r.besar);
    if (idxSakit !== -1) shPegawai.getRange(i + 1, idxSakit + 1).setValue(r.sakit);
    if (idxLahir !== -1) shPegawai.getRange(i + 1, idxLahir + 1).setValue(r.melahirkan);
    if (idxCap !== -1) shPegawai.getRange(i + 1, idxCap + 1).setValue(r.cap);
    if (idxCltn !== -1) shPegawai.getRange(i + 1, idxCltn + 1).setValue(r.cltn);
    if (idxN !== -1) shPegawai.getRange(i + 1, idxN + 1).setValue(sisa);
  }
}

function findRowIndexByIdOrRow(shCuti, targetId) {
  if (!targetId) return -1;
  if (targetId.indexOf('ROW-') === 0) {
    const rIdx = parseInt(targetId.replace('ROW-', ''), 10);
    if (!isNaN(rIdx) && rIdx >= 2 && rIdx <= shCuti.getLastRow()) {
      return rIdx;
    }
  }

  const values = shCuti.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][9]) === targetId || String(values[i][0]) === targetId) {
      return i + 1;
    }
  }
  return -1;
}

function hitungDurasiHari(tglMulai, tglSelesai) {
  const d1 = new Date(tglMulai);
  const d2 = new Date(tglSelesai);
  if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
    const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }
  return 1;
}

function formatRentangTanggal(tglMulai, tglSelesai) {
  if (!tglMulai && !tglSelesai) return '';
  if (!tglSelesai || tglMulai === tglSelesai) return String(tglMulai);
  return String(tglMulai) + ' s/d ' + String(tglSelesai);
}

function ambilTahunLahirDariNip(nip) {
  const clean = String(nip || '').replace(/\D/g, '');
  if (clean.length === 18) {
    const yr = parseInt(clean.substring(0, 4), 10);
    if (yr >= 1950 && yr <= 2015) return String(yr);
  }
  return '';
}

function formatCellDate(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return val !== null && val !== undefined ? String(val) : '';
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
