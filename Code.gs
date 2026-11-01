/**
 * BACKEND GOOGLE APPS SCRIPT (GAS) - RINGKAS & CEPAT
 * Sheet `pengajuancuti` (Hanya 13 Kolom):
 * Nama | NIP | Pangkat/Gol | Jabatan | Tanggal Surat | Tanggal Cuti | Lama Cuti | Ket | Jenis Cuti | Status Pegawai | N2 | N1 | N
 */

const SHEET_MASTER_PEGAWAI = 'masterpegawai';
const SHEET_PEGAWAI = 'masterdatarekap';
const SHEET_CUTI = 'pengajuancuti';

const HEADERS_PENGAJUAN_CUTI = [
  'Nama',
  'NIP',
  'Pangkat/Gol',
  'Jabatan',
  'Tanggal Surat',
  'Tanggal Cuti',
  'Lama Cuti',
  'Ket',
  'Jenis Cuti',
  'Status Pegawai',
  'N2',
  'N1',
  'N'
];

const HEADERS_SHEET_MASTERPEGAWAI = [
  'Nama', 'NIP', 'NIK', 'Jabatan', 'Jenis Kelamin', 'Golongan', 'Status'
];

const HEADERS_MASTER_REKAP = [
  'Nama', 'NIP', 'NIK', 'Jabatan', 'Jenis Kelamin', 'Golongan', 'Status', 'Bidang/UPT',
  'jatah_tahunan', 'cuti_tahunan', 'sisa_kuota',
  'cuti_besar', 'cuti_sakit', 'cuti_melahirkan', 'cuti_alasan_penting', 'cuti_cltn',
  'n2', 'n1', 'n'
];

function getSheetsFast() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let shMasterPegawai = ss.getSheetByName(SHEET_MASTER_PEGAWAI);
  if (!shMasterPegawai) {
    shMasterPegawai = ss.insertSheet(SHEET_MASTER_PEGAWAI);
    shMasterPegawai.appendRow(HEADERS_SHEET_MASTERPEGAWAI);
  }

  let shPegawai = ss.getSheetByName(SHEET_PEGAWAI);
  if (!shPegawai) {
    shPegawai = ss.insertSheet(SHEET_PEGAWAI);
    shPegawai.appendRow(HEADERS_MASTER_REKAP);
  }

  let shCuti = ss.getSheetByName(SHEET_CUTI);
  if (!shCuti) {
    shCuti = ss.insertSheet(SHEET_CUTI);
    shCuti.appendRow(HEADERS_PENGAJUAN_CUTI);
  }

  return { ss, shMasterPegawai, shPegawai, shCuti };
}

/**
 * Jalankan fungsi ini 1x di editor Apps Script untuk:
 * 1. Menghapus 6 sheet jenis cuti lama
 * 2. Mengatur header `pengajuancuti` menjadi 13 kolom saja
 */
function setupSheets() {
  const { ss, shMasterPegawai, shPegawai, shCuti } = getSheetsFast();

  // Hapus 6 sheet jenis cuti lama jika ada
  ['Cuti Tahunan', 'Cuti Besar', 'Cuti Sakit', 'Cuti Melahirkan', 'Cuti Alasan Penting', 'Cuti CLTN'].forEach(n => {
    const s = ss.getSheetByName(n);
    if (s) ss.deleteSheet(s);
  });

  // Pangkas kolom pengajuancuti menjadi 13 kolom saja
  const maxCols = shCuti.getMaxColumns();
  if (maxCols > 13) shCuti.deleteColumns(14, maxCols - 13);
  shCuti.getRange(1, 1, 1, 13).setValues([HEADERS_PENGAJUAN_CUTI]).setBackground('#1b4f72').setFontColor('#ffffff').setFontWeight('bold');
  shCuti.setFrozenRows(1);

  shMasterPegawai.getRange(1, 1, 1, 7).setValues([HEADERS_SHEET_MASTERPEGAWAI]).setBackground('#1b4f72').setFontColor('#ffffff').setFontWeight('bold');
  syncMasterPegawaiFast(shMasterPegawai, shPegawai);
  recalculateQuotasFast(shPegawai, shCuti);
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'read';
    const { shMasterPegawai, shPegawai, shCuti } = getSheetsFast();

    if (action === 'getPegawai') {
      syncMasterPegawaiFast(shMasterPegawai, shPegawai);
      recalculateQuotasFast(shPegawai, shCuti);
      return jsonResponse({ status: 'success', data: getMasterPegawaiList(shPegawai) });
    }

    if (action === 'read') {
      return jsonResponse({ status: 'success', data: getPengajuanCutiList(shCuti).reverse() });
    }

    return jsonResponse({ status: 'error', message: 'Action tidak dikenali' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const { shMasterPegawai, shPegawai, shCuti } = getSheetsFast();
    const body = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : '{}');
    const action = body.action;
    const p = body.payload || {};

    if (action === 'createPegawai') {
      shMasterPegawai.appendRow([
        String(p.nama || p.nama_pegawai || ''),
        String(p.nip || ''),
        String(p.nik || '-'),
        String(p.jabatan || '-'),
        String(p.jenis_kelamin || 'Laki-laki'),
        String(p.golongan || '-'),
        String(p.status || p.status_asn || 'PPPK')
      ]);
      syncMasterPegawaiFast(shMasterPegawai, shPegawai);
      return jsonResponse({ status: 'success', message: 'Pegawai ditambahkan!' });
    }

    if (action === 'create') {
      const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      const peg = getMasterPegawaiList(shPegawai).find(x => String(x.nip).trim() === String(p.nip).trim()) || {};
      const durasi = hitungDurasiHari(p.tanggal_mulai, p.tanggal_selesai);
      const tglCuti = (!p.tanggal_selesai || p.tanggal_mulai === p.tanggal_selesai)
        ? String(p.tanggal_mulai || '')
        : (p.tanggal_mulai + ' s/d ' + p.tanggal_selesai);

      const jenisCuti = String(p.jenis_cuti || 'Cuti Tahunan');
      const sisaLama = peg.sisa_kuota !== undefined ? Number(peg.sisa_kuota) : 12;
      const sisaN = jenisCuti.toLowerCase().indexOf('tahunan') !== -1 ? Math.max(0, sisaLama - durasi) : sisaLama;

      // 13 Kolom: Nama | NIP | Pangkat/Gol | Jabatan | Tanggal Surat | Tanggal Cuti | Lama Cuti | Ket | Jenis Cuti | Status Pegawai | N2 | N1 | N
      shCuti.appendRow([
        String(p.nama_pegawai || peg.nama_pegawai || ''), // 1. Nama
        String(p.nip || ''),                              // 2. NIP
        String(p.golongan || peg.golongan || '-'),        // 3. Pangkat/Gol
        String(p.jabatan || peg.jabatan || '-'),          // 4. Jabatan
        todayStr,                                         // 5. Tanggal Surat
        tglCuti,                                          // 6. Tanggal Cuti
        durasi + ' Hari',                                 // 7. Lama Cuti
        String(p.alasan || ''),                           // 8. Ket
        jenisCuti,                                        // 9. Jenis Cuti
        String(p.status_pegawai || peg.status || 'PPPK'), // 10. Status Pegawai
        peg.n2 || 0,                                      // 11. N2
        peg.n1 || 0,                                      // 12. N1
        sisaN                                             // 13. N
      ]);

      recalculateQuotasFast(shPegawai, shCuti);
      return jsonResponse({ status: 'success', message: 'Cuti berhasil disimpan!', id: 'ROW-' + shCuti.getLastRow() });
    }

    if (action === 'update') {
      const rIdx = parseInt(String(p.id || '').replace('ROW-', ''), 10);
      if (!isNaN(rIdx) && rIdx >= 2) {
        const durasi = hitungDurasiHari(p.tanggal_mulai, p.tanggal_selesai);
        const tglCuti = (!p.tanggal_selesai || p.tanggal_mulai === p.tanggal_selesai)
          ? String(p.tanggal_mulai || '')
          : (p.tanggal_mulai + ' s/d ' + p.tanggal_selesai);
        const cur = shCuti.getRange(rIdx, 1, 1, 13).getValues()[0];

        shCuti.getRange(rIdx, 1, 1, 13).setValues([[
          String(p.nama_pegawai || cur[0] || ''),
          String(p.nip || cur[1] || ''),
          String(p.golongan || cur[2] || '-'),
          String(p.jabatan || cur[3] || '-'),
          cur[4],
          tglCuti,
          durasi + ' Hari',
          String(p.alasan || ''),
          String(p.jenis_cuti || 'Cuti Tahunan'),
          String(p.status_pegawai || cur[9] || 'PPPK'),
          cur[10] || 0,
          cur[11] || 0,
          cur[12] !== undefined ? cur[12] : 12
        ]]);
        recalculateQuotasFast(shPegawai, shCuti);
      }
      return jsonResponse({ status: 'success', message: 'Data diperbarui!' });
    }

    if (action === 'delete') {
      const rIdx = parseInt(String(body.id || '').replace('ROW-', ''), 10);
      if (!isNaN(rIdx) && rIdx >= 2) {
        shCuti.deleteRow(rIdx);
        recalculateQuotasFast(shPegawai, shCuti);
      }
      return jsonResponse({ status: 'success', message: 'Data dihapus!' });
    }

    return jsonResponse({ status: 'success', message: 'OK' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function getPengajuanCutiList(shCuti) {
  const rows = shCuti.getDataRange().getValues();
  const res = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0] && !r[1]) continue;
    const tglCuti = formatCellDate(r[5]);
    const parts = tglCuti.indexOf(' s/d ') !== -1 ? tglCuti.split(' s/d ') : [tglCuti, tglCuti];

    res.push({
      id: 'ROW-' + (i + 1),
      nama_pegawai: String(r[0] || ''),
      nip: String(r[1] || ''),
      golongan: String(r[2] || ''),
      jabatan: String(r[3] || ''),
      created_at: formatCellDate(r[4]),
      tanggal_cuti: tglCuti,
      tanggal_mulai: parts[0].trim(),
      tanggal_selesai: (parts[1] || parts[0]).trim(),
      lama_cuti: parseInt(r[6], 10) || 1,
      alasan: String(r[7] || ''),
      jenis_cuti: String(r[8] || 'Cuti Tahunan'),
      status_pegawai: String(r[9] || 'PPPK'),
      status: 'Disetujui',
      n2: r[10] || 0,
      n1: r[11] || 0,
      n: r[12] !== undefined ? r[12] : 12
    });
  }
  return res;
}

function syncMasterPegawaiFast(shMasterPegawai, shPegawai) {
  const mRows = shMasterPegawai.getDataRange().getValues();
  if (mRows.length <= 1) return;

  const out = [HEADERS_MASTER_REKAP];
  for (let i = 1; i < mRows.length; i++) {
    const m = mRows[i];
    if (!m[0] && !m[1]) continue;
    out.push([m[0], m[1], m[2] || '-', m[3] || '-', m[4] || '-', m[5] || '-', m[6] || 'PPPK', 'Dinas Kesehatan', 12, 0, 12, 0, 0, 0, 0, 0, 0, 0, 12]);
  }
  shPegawai.clearContents();
  shPegawai.getRange(1, 1, out.length, HEADERS_MASTER_REKAP.length).setValues(out);
}

function recalculateQuotasFast(shPegawai, shCuti) {
  const cutiList = getPengajuanCutiList(shCuti);
  const map = {};
  cutiList.forEach(c => {
    const nip = String(c.nip).trim();
    if (!nip) return;
    if (!map[nip]) map[nip] = { tah: 0, bes: 0, sak: 0, lah: 0, cap: 0, clt: 0 };
    const d = Number(c.lama_cuti) || 1;
    const j = String(c.jenis_cuti).toLowerCase();
    if (j.indexOf('besar') !== -1) map[nip].bes += d;
    else if (j.indexOf('sakit') !== -1) map[nip].sak += d;
    else if (j.indexOf('lahir') !== -1) map[nip].lah += d;
    else if (j.indexOf('penting') !== -1 || j.indexOf('cap') !== -1) map[nip].cap += d;
    else if (j.indexOf('luar') !== -1 || j.indexOf('cltn') !== -1) map[nip].clt += d;
    else map[nip].tah += d;
  });

  const data = shPegawai.getDataRange().getValues();
  if (data.length <= 1) return;
  for (let i = 1; i < data.length; i++) {
    const nip = String(data[i][1] || '').trim();
    const r = map[nip] || { tah: 0, bes: 0, sak: 0, lah: 0, cap: 0, clt: 0 };
    const sisa = Math.max(0, 12 - r.tah);
    data[i][9] = r.tah;
    data[i][10] = sisa;
    data[i][11] = r.bes;
    data[i][12] = r.sak;
    data[i][13] = r.lah;
    data[i][14] = r.cap;
    data[i][15] = r.clt;
    data[i][18] = sisa;
  }
  shPegawai.getRange(1, 1, data.length, data[0].length).setValues(data);
}

function getMasterPegawaiList(shPegawai) {
  const rows = shPegawai.getDataRange().getValues();
  const res = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0] && !r[1]) continue;
    res.push({
      nama: r[0], nama_pegawai: r[0], nip: r[1], nik: r[2], jabatan: r[3],
      jenis_kelamin: r[4], golongan: r[5], status: r[6], status_asn: r[6], bidang_upt: r[7],
      jatah_tahunan: Number(r[8] || 12), cuti_tahunan: Number(r[9] || 0), sisa_kuota: Number(r[10] !== '' ? r[10] : 12),
      cuti_besar: Number(r[11] || 0), cuti_sakit: Number(r[12] || 0), cuti_melahirkan: Number(r[13] || 0),
      cuti_alasan_penting: Number(r[14] || 0), cuti_cltn: Number(r[15] || 0)
    });
  }
  return res;
}

function hitungDurasiHari(m, s) {
  const d1 = new Date(m), d2 = new Date(s);
  return (!isNaN(d1) && !isNaN(d2)) ? Math.max(1, Math.floor((d2 - d1) / 86400000) + 1) : 1;
}

function formatCellDate(v) {
  return (v instanceof Date) ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(v || '');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
