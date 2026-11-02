/**
 * BACKEND API GOOGLE APPS SCRIPT - SISTEM PENGAJUAN CUTI
 * DINAS KESEHATAN KOTA TANGERANG SELATAN
 * Simpan kode ini di Google Sheet -> Extensions -> Apps Script -> Code.gs
 */

const SHEET_NAMES = {
  CUTI: 'pengajuancuti',
  PEGAWAI: 'masterpegawai',
  REKAP: 'masterdatarekap'
};

// Header standar untuk masing-masing sheet
const SHEET_HEADERS = {
  CUTI: [
    'id_pengajuan', 'tanggal_surat', 'nip', 'nama', 'jabatan', 'pangkat_gol',
    'jenis_cuti', 'tanggal_mulai', 'tanggal_selesai', 'lama_cuti',
    'alasan_cuti', 'alamat_cuti', 'status_pengajuan', 'catatan_atasan',
    'is_deleted', 'created_at', 'updated_at',
    'masa_kerja', 'unit_kerja', 'telp', 'sisa_cuti_tahunan',
    'jenis_pejabat', 'atasan_nama', 'atasan_nip', 'pejabat_nama', 'pejabat_nip'
  ],
  PEGAWAI: ['NIP', 'Nama', 'Jabatan', 'Pangkat', 'Masa Kerja', 'Unit Kerja', 'Telp', 'Atasan Nama', 'Atasan NIP'],
  REKAP: ['NIP', 'Nama', 'Jatah Cuti N', 'Sisa Cuti N-1', 'Sisa Cuti N-2', 'Total Hak Cuti', 'Cuti Diambil', 'Sisa Cuti Saat Ini']
};

/**
 * JALANKAN FUNGSI INI SEKALI DI APPS SCRIPT (Klik tombol Run -> setupSheets)
 * Untuk membuat 3 sheet beserta judul kolom (header) secara otomatis jika belum ada.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEET_NAMES).forEach(key => {
    const sheetName = SHEET_NAMES[key];
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    const maxCols = Math.max(sheet.getLastColumn(), SHEET_HEADERS[key].length);
    const firstRow = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
    const isEmpty = firstRow.every(cell => String(cell).trim() === '');

    if (isEmpty) {
      sheet.getRange(1, 1, 1, SHEET_HEADERS[key].length).setValues([SHEET_HEADERS[key]]);
      sheet.getRange(1, 1, 1, SHEET_HEADERS[key].length).setFontWeight('bold');
    } else {
      // Tambahkan kolom baru di ujung kanan apabila belum ada di sheet eksisting
      const existingLower = firstRow.map(c => String(c || '').trim().toLowerCase());
      SHEET_HEADERS[key].forEach(h => {
        if (!existingLower.includes(h.toLowerCase())) {
          const nextCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, nextCol).setValue(h).setFontWeight('bold');
        }
      });
    }
  });
}

// Response Helper
function jsonResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify({
    status: status,
    ...data
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET Handler: Mengambil data cuti, master pegawai, dan rekap
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAllCuti';

    if (action === 'getAllCuti') {
      const sheet = ss.getSheetByName(SHEET_NAMES.CUTI);
      if (!sheet) return jsonResponse({ error: 'Sheet pengajuancuti belum dibuat. Jalankan fungsi setupSheets() terlebih dahulu.' }, 404);

      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return jsonResponse({ data: [] });

      const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
      const data = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const isRowEmpty = row.every(cell => String(cell || '').trim() === '');
        if (isRowEmpty) continue;

        const delIdx = headers.indexOf('is_deleted');
        const isDeleted = delIdx !== -1 ? row[delIdx] : false;
        if (isDeleted === true || String(isDeleted).toLowerCase() === 'true') continue;

        let item = {};
        headers.forEach((header, index) => {
          if (!header) return;
          let val = row[index];
          if (val instanceof Date) {
            val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
          }
          item[header] = val;
        });
        data.push(item);
      }
      return jsonResponse({ data: data });
    }

    if (action === 'getPegawai') {
      const sheet = ss.getSheetByName(SHEET_NAMES.PEGAWAI);
      if (!sheet) return jsonResponse({ error: 'Sheet masterpegawai belum dibuat.' }, 404);

      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return jsonResponse({ data: [] });

      const headers = rows[0].map(h => String(h || '').trim());
      const data = [];

      for (let i = 1; i < rows.length; i++) {
        const isRowEmpty = rows[i].every(cell => String(cell || '').trim() === '');
        if (isRowEmpty) continue;

        let item = {};
        headers.forEach((header, index) => {
          if (!header) return;
          item[header] = String(rows[i][index] || '');
        });
        data.push(item);
      }
      return jsonResponse({ data: data });
    }

    if (action === 'getRekap') {
      const nip = e.parameter.nip;
      const sheet = ss.getSheetByName(SHEET_NAMES.REKAP);
      if (!sheet) return jsonResponse({ error: 'Sheet masterdatarekap belum dibuat.' }, 404);

      const rows = sheet.getDataRange().getValues();
      const headers = rows[0].map(h => String(h || '').trim());
      const nipIndex = headers.findIndex(h => h.toLowerCase() === 'nip');

      if (nipIndex === -1) {
        return jsonResponse({ error: 'Kolom NIP tidak ditemukan di masterdatarekap' }, 400);
      }

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][nipIndex]).trim() === String(nip).trim()) {
          let item = {};
          headers.forEach((header, idx) => {
            if (!header) return;
            item[header] = rows[i][idx];
          });
          return jsonResponse({ data: item });
        }
      }
      return jsonResponse({ error: 'Data rekap NIP tidak ditemukan' }, 404);
    }

    return jsonResponse({ error: 'Aksi tidak valid' }, 400);

  } catch (error) {
    return jsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * POST Handler: Create, Update, Delete (Soft-delete), & Status Update
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.CUTI);

    if (!sheet) {
      setupSheets();
      sheet = ss.getSheetByName(SHEET_NAMES.CUTI);
    }

    // Pastikan seluruh kolom terbaru sudah ada di header
    setupSheets();

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

    // 1. CREATE DATA CUTI
    if (action === 'create') {
      const newId = 'CUTI-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-") +
                    Math.floor(1000 + Math.random() * 9000);

      const record = {
        id_pengajuan: newId,
        tanggal_surat: payload.tanggal_surat || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
        nip: String(payload.nip || ''),
        nama: payload.nama || '',
        jabatan: payload.jabatan || '',
        pangkat_gol: payload.pangkat_gol || '',
        jenis_cuti: payload.jenis_cuti || '',
        tanggal_mulai: payload.tanggal_mulai || '',
        tanggal_selesai: payload.tanggal_selesai || '',
        lama_cuti: Number(payload.lama_cuti || 0),
        alasan_cuti: payload.alasan_cuti || '',
        alamat_cuti: payload.alamat_cuti || '',
        status_pengajuan: payload.status_pengajuan || 'Menunggu',
        catatan_atasan: payload.catatan_atasan || '',
        is_deleted: false,
        created_at: now,
        updated_at: now,
        masa_kerja: payload.masa_kerja || '',
        unit_kerja: payload.unit_kerja || 'Dinas Kesehatan',
        telp: String(payload.telp || ''),
        sisa_cuti_tahunan: payload.sisa_cuti_tahunan || 'N=12',
        jenis_pejabat: payload.jenis_pejabat || 'kadinkes',
        atasan_nama: payload.atasan_nama || '',
        atasan_nip: String(payload.atasan_nip || ''),
        pejabat_nama: payload.pejabat_nama || '',
        pejabat_nip: String(payload.pejabat_nip || '')
      };

      const newRow = headers.map(h => record[h] !== undefined ? record[h] : '');
      sheet.appendRow(newRow);
      return jsonResponse({ message: 'Pengajuan cuti berhasil dibuat', id: newId });
    }

    // 2. UPDATE DATA CUTI
    if (action === 'update') {
      const id = payload.id_pengajuan;
      const idIndex = headers.indexOf('id_pengajuan');
      let rowIndex = -1;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][idIndex]).trim() === String(id).trim()) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        return jsonResponse({ error: 'ID Pengajuan tidak ditemukan' }, 404);
      }

      const updateFields = [
        'tanggal_surat', 'nip', 'nama', 'jabatan', 'pangkat_gol',
        'jenis_cuti', 'tanggal_mulai', 'tanggal_selesai', 'lama_cuti',
        'alasan_cuti', 'alamat_cuti', 'status_pengajuan', 'catatan_atasan',
        'masa_kerja', 'unit_kerja', 'telp', 'sisa_cuti_tahunan',
        'jenis_pejabat', 'atasan_nama', 'atasan_nip', 'pejabat_nama', 'pejabat_nip'
      ];

      updateFields.forEach(field => {
        if (payload[field] !== undefined) {
          const colIdx = headers.indexOf(field) + 1;
          if (colIdx > 0) {
            sheet.getRange(rowIndex, colIdx).setValue(payload[field]);
          }
        }
      });

      const updatedAtCol = headers.indexOf('updated_at') + 1;
      if (updatedAtCol > 0) {
        sheet.getRange(rowIndex, updatedAtCol).setValue(now);
      }

      return jsonResponse({ message: 'Data pengajuan cuti berhasil diperbarui' });
    }

    // 3. DELETE (SOFT DELETE)
    if (action === 'delete') {
      const id = payload.id_pengajuan;
      const idIndex = headers.indexOf('id_pengajuan');
      let rowIndex = -1;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][idIndex]).trim() === String(id).trim()) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        return jsonResponse({ error: 'ID Pengajuan tidak ditemukan' }, 404);
      }

      const isDeletedCol = headers.indexOf('is_deleted') + 1;
      const updatedAtCol = headers.indexOf('updated_at') + 1;

      if (isDeletedCol > 0) sheet.getRange(rowIndex, isDeletedCol).setValue(true);
      if (updatedAtCol > 0) sheet.getRange(rowIndex, updatedAtCol).setValue(now);

      return jsonResponse({ message: 'Pengajuan cuti berhasil dihapus' });
    }

    return jsonResponse({ error: 'Aksi POST tidak valid' }, 400);

  } catch (error) {
    return jsonResponse({ error: error.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}
