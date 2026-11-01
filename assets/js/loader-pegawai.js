/**
 * assets/js/loader-pegawai.js
 * Modul Sinkronisasi Master Data Pegawai & Rekap Kuota 6 Jenis Cuti (Ringan & Cepat)
 */

let masterPegawai = [];

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function loadMasterPegawai(silent = false) {
    const loadingState = document.getElementById('loadingPegawai');
    if (!silent && loadingState) loadingState.classList.remove('hidden');

    try {
        const response = await fetch(`${getGasUrl()}?action=getPegawai`);
        const resJson = await response.json();

        if (resJson.status === 'success') {
            masterPegawai = resJson.data || [];
            renderTabelPegawai(masterPegawai);
            populateDropdownPegawai(masterPegawai);
            if (!silent) showToast('Data disinkronkan', 'success');
        } else {
            renderDefaultPegawai();
        }
    } catch (err) {
        renderDefaultPegawai();
    } finally {
        if (loadingState) loadingState.classList.add('hidden');
    }
}

// Data contoh sesuai data pegawai Dinas Kesehatan Kota Tangerang Selatan
function renderDefaultPegawai() {
    if (masterPegawai.length === 0) {
        masterPegawai = [
            {
                nama_pegawai: 'Rudy, S.Sos.I',
                nip: '198211012025211017',
                nik: '3674010111820001',
                jabatan: 'Penata Layanan Operasional',
                jenis_kelamin: 'Laki-laki',
                golongan: 'IX',
                status_asn: 'PPPK',
                bidang_upt: 'Dinas Kesehatan',
                jatah_tahunan: 12,
                cuti_tahunan: 2,
                sisa_kuota: 10,
                cuti_besar: 0,
                cuti_sakit: 0,
                cuti_melahirkan: 0,
                cuti_alasan_penting: 0,
                cuti_cltn: 0
            },
            {
                nama_pegawai: 'Deni Sueb, S.IP',
                nip: '199005282025211007',
                nik: '3674012805900002',
                jabatan: 'Penata Layanan Operasional',
                jenis_kelamin: 'Laki-laki',
                golongan: 'IX',
                status_asn: 'PPPK',
                bidang_upt: 'Dinas Kesehatan',
                jatah_tahunan: 12,
                cuti_tahunan: 1,
                sisa_kuota: 11,
                cuti_besar: 0,
                cuti_sakit: 0,
                cuti_melahirkan: 0,
                cuti_alasan_penting: 0,
                cuti_cltn: 0
            },
            {
                nama_pegawai: 'Evie Ervina Rahmawati, SE',
                nip: '197505072025212006',
                nik: '3674014705750003',
                jabatan: 'Penata Layanan Operasional',
                jenis_kelamin: 'Perempuan',
                golongan: 'IX',
                status_asn: 'PPPK',
                bidang_upt: 'Dinas Kesehatan',
                jatah_tahunan: 12,
                cuti_tahunan: 1,
                sisa_kuota: 11,
                cuti_besar: 0,
                cuti_sakit: 0,
                cuti_melahirkan: 0,
                cuti_alasan_penting: 0,
                cuti_cltn: 0
            }
        ];
        renderTabelPegawai(masterPegawai);
        populateDropdownPegawai(masterPegawai);
    }
}

function renderTabelPegawai(list) {
    const tbody = document.getElementById('tablePegawaiBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="py-4 text-center text-slate-400">Belum ada data pegawai</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(item => {
        const jatah = Number(item.jatah_tahunan || 12);
        const tahTerpakai = Number(item.cuti_tahunan !== undefined ? item.cuti_tahunan : (item.cuti_terpakai || 0));
        const sisa = item.sisa_kuota !== undefined ? Number(item.sisa_kuota) : Math.max(0, jatah - tahTerpakai);

        const cBesar = Number(item.cuti_besar || 0);
        const cSakit = Number(item.cuti_sakit || 0);
        const cLahir = Number(item.cuti_melahirkan || 0);
        const cCap = Number(item.cuti_alasan_penting || 0);
        const cCltn = Number(item.cuti_cltn || 0);

        const statusVal = item.status || item.status_asn || 'PPPK';
        const isPNS = String(statusVal).toUpperCase().includes('PNS');
        const badgeColor = isPNS ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';

        const nama = item.nama || item.nama_pegawai || '-';
        const nip = item.nip || '-';
        const nik = item.nik || '-';
        const jk = item.jenis_kelamin || item['jenis kelamin'] || '-';
        const golongan = item.golongan || item.pangkat_gol || '-';
        const jabatan = item.jabatan || '-';

        return `
        <tr class="hover:bg-slate-50">
            <td class="py-2.5 px-3">
                <div class="font-bold text-slate-800">${escapeHtml(nama)}</div>
                <div class="font-mono text-[11px] text-slate-500">NIP: ${escapeHtml(nip)} | NIK: ${escapeHtml(nik)}</div>
            </td>
            <td class="py-2.5 px-3 text-slate-600">${escapeHtml(jk)}</td>
            <td class="py-2.5 px-3">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeColor}">${escapeHtml(statusVal)}</span>
                <span class="text-slate-600 font-medium ml-1">Gol. ${escapeHtml(golongan)}</span>
            </td>
            <td class="py-2.5 px-3 text-slate-700">${escapeHtml(jabatan)}</td>
            <td class="py-2.5 px-3 text-center bg-blue-50/30 font-semibold">
                <span class="text-amber-600">${tahTerpakai}</span> / <span class="text-emerald-600 font-bold">N=${sisa}</span>
            </td>
            <td class="py-2.5 px-3 text-center">${cBesar} hr</td>
            <td class="py-2.5 px-3 text-center">${cSakit} hr</td>
            <td class="py-2.5 px-3 text-center">${cLahir} hr</td>
            <td class="py-2.5 px-3 text-center">${cCap} hr</td>
            <td class="py-2.5 px-3 text-center">${cCltn} hr</td>
        </tr>
        `;
    }).join('');
}

function populateDropdownPegawai(list) {
    const select = document.getElementById('selectPegawai');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Pilih Pegawai --</option>';

    list.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.nip;
        const nama = p.nama || p.nama_pegawai || '';
        opt.textContent = `${p.nip} - ${nama}`;
        opt.dataset.nama = nama;
        opt.dataset.golongan = p.golongan || p.pangkat_gol || 'IX';
        opt.dataset.jabatan = p.jabatan || 'Penata Layanan Operasional';
        opt.dataset.unit = p.bidang_upt || p['bidang/upt'] || p.divisi || 'Dinas Kesehatan';
        opt.dataset.status = p.status || p.status_asn || 'PPPK';
        select.appendChild(opt);
    });

    if (currentVal) select.value = currentVal;
}
