/**
 * assets/js/loader-pegawai.js
 * E-Cuti Dinas Kesehatan Kota Tangerang Selatan
 * Modul Khusus Master Data Pegawai, Live Auto-Suggest & Cek Rekapitulasi Cuti
 */

function getPegawaiField(obj, keys) {
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== '') return String(obj[k]);
        const foundKey = Object.keys(obj).find(actual => actual.toLowerCase().trim() === k.toLowerCase());
        if (foundKey && obj[foundKey] !== '') return String(obj[foundKey]);
      }
      return '';
    }

    function populatePegawaiDropdowns() {
      // Dropdown lama sudah digantikan dengan sistem live-search (searchable ketik manual)
    }

    // =========================================================================
    // SISTEM SEARCHABLE (AUTO-SUGGEST KETIK MANUAL) PEGAWAI & PEJABAT
    // =========================================================================
    const ALL_SUGGEST_BOXES = [
      'suggestBoxFormMain', 'suggestBoxFormNip', 'suggestBoxFormNama',
      'suggestBoxFormAtasan', 'suggestBoxFormPejabat',
      'suggestBoxCfgKadinkes', 'suggestBoxCfgAtasan',
      'suggestBoxRekap', 'suggestBoxCetak'
    ];

    function closeAllSuggestBoxes() {
      ALL_SUGGEST_BOXES.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
    }

    // Tutup daftar saran saat klik di luar input pencarian
    document.addEventListener('click', (e) => {
      if (!e.target.closest('input') && !e.target.closest('[id^="suggestBox"]')) {
        closeAllSuggestBoxes();
      }
    });

    // Gabungkan direktori pegawai dari Master Pegawai, riwayat pengajuan, & pejabat default
    function getUnifiedPegawaiPool() {
      const map = new Map();

      // 1. Dari Master Pegawai
      state.pegawaiList.forEach(p => {
        const nip = getPegawaiField(p, ['NIP', 'NI PPPK', 'nip']).trim();
        const nama = getPegawaiField(p, ['Nama', 'nama']).trim();
        if (!nama && !nip) return;
        const key = (nip || nama).toLowerCase();
        map.set(key, {
          nip: nip,
          nama: nama,
          jabatan: getPegawaiField(p, ['Jabatan', 'jabatan']) || 'Penata Layanan Operasional',
          pangkat: getPegawaiField(p, ['Pangkat', 'pangkat_gol', 'Golongan']) || 'IX',
          masa_kerja: getPegawaiField(p, ['Masa Kerja', 'masa_kerja']) || '01 Tahun 03 Bulan',
          unit_kerja: getPegawaiField(p, ['Unit Kerja', 'unit_kerja']) || 'Dinas Kesehatan',
          telp: getPegawaiField(p, ['Telp', 'telp', 'Telepon']) || ''
        });
      });

      // 2. Dari Riwayat Pengajuan Cuti (jika belum ada di masterpegawai)
      state.cutiList.forEach(c => {
        const nip = String(c.nip || '').trim();
        const nama = String(c.nama || '').trim();
        if (!nama) return;
        const key = (nip || nama).toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            nip: nip,
            nama: nama,
            jabatan: c.jabatan || 'Penata Layanan Operasional',
            pangkat: c.pangkat_gol || 'IX',
            masa_kerja: c.masa_kerja || '01 Tahun 03 Bulan',
            unit_kerja: c.unit_kerja || 'Dinas Kesehatan',
            telp: c.telp || ''
          });
        }
      });

      // 3. Tambahkan kandidat Pejabat Default agar selalu muncul saat dicari di Pengaturan / Form Pejabat
      const officials = [
        { nip: pejabatDefault.kadinkesNip, nama: pejabatDefault.kadinkesNama, jabatan: 'Kepala Dinas Kesehatan', pangkat: 'IV/b' },
        { nip: pejabatDefault.atasanNip, nama: pejabatDefault.atasanNama, jabatan: 'Atasan Langsung', pangkat: 'III/d' },
        { nip: '197610152007012007', nama: 'dr. Allin Hendalin Mahdaniar, M.K.M.', jabatan: 'Kepala Dinas Kesehatan', pangkat: 'IV/b' },
        { nip: '197801081998031002', nama: 'Ikhsan Permana, SKM', jabatan: 'Kasubag Umum dan Kepegawaian', pangkat: 'III/d' },
        { nip: '', nama: 'Benyamin Davnie', jabatan: 'Wali Kota Tangerang Selatan', pangkat: '-' }
      ];
      officials.forEach(o => {
        if (!o.nama) return;
        const key = (o.nip || o.nama).toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            nip: o.nip || '',
            nama: o.nama,
            jabatan: o.jabatan,
            pangkat: o.pangkat || 'IX',
            masa_kerja: '-',
            unit_kerja: 'Dinas Kesehatan',
            telp: ''
          });
        }
      });

      return Array.from(map.values());
    }

    function highlightMatch(text, query) {
      const safeText = escapeHtml(text || '');
      if (!query) return safeText;
      const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return safeText.replace(new RegExp(`(${escapedQ})`, 'gi'), '<mark class="bg-teal-100 text-teal-900 font-bold rounded px-0.5">$1</mark>');
    }

    function showSuggestPegawai(query, targetMode) {
      const boxMap = {
        form_main: 'suggestBoxFormMain',
        form_nip: 'suggestBoxFormNip',
        form_nama: 'suggestBoxFormNama',
        form_atasan: 'suggestBoxFormAtasan',
        form_pejabat: 'suggestBoxFormPejabat',
        cfg_kadinkes: 'suggestBoxCfgKadinkes',
        cfg_atasan: 'suggestBoxCfgAtasan',
        rekap: 'suggestBoxRekap'
      };

      const boxId = boxMap[targetMode];
      if (!boxId) return;

      ALL_SUGGEST_BOXES.forEach(id => {
        if (id !== boxId) {
          const el = document.getElementById(id);
          if (el) el.classList.add('hidden');
        }
      });

      const box = document.getElementById(boxId);
      const q = String(query || '').trim().toLowerCase();
      const pool = getUnifiedPegawaiPool();

      const matches = pool.filter(p => {
        if (!q) return true;
        return p.nama.toLowerCase().includes(q) ||
               p.nip.toLowerCase().includes(q) ||
               p.jabatan.toLowerCase().includes(q);
      }).slice(0, 12);

      if (matches.length === 0) {
        box.innerHTML = `<div class="px-3.5 py-2.5 text-[11px] text-slate-400 italic">Tidak ada kecocokan di Master Pegawai (tetap bisa diketik manual)</div>`;
        box.classList.remove('hidden');
        return;
      }

      box.innerHTML = matches.map((p, idx) => `
        <button type="button" onclick="applySelectedPegawai(${idx}, '${escapeAttr(q)}', '${targetMode}')" class="w-full text-left px-3.5 py-2 hover:bg-teal-50/80 transition flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-xs font-bold text-slate-800 truncate">${highlightMatch(p.nama, query.trim())}</div>
            <div class="text-[10px] text-slate-500 truncate">${p.nip ? 'NI PPPK/NIP: ' + highlightMatch(p.nip, query.trim()) : 'Pejabat'} • ${escapeHtml(p.jabatan)}</div>
          </div>
          <span class="shrink-0 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">Pilih</span>
        </button>
      `).join('');

      box.classList.remove('hidden');
    }

    function applySelectedPegawai(matchIndex, queryLower, targetMode) {
      const pool = getUnifiedPegawaiPool();
      const matches = pool.filter(p => {
        if (!queryLower) return true;
        return p.nama.toLowerCase().includes(queryLower) ||
               p.nip.toLowerCase().includes(queryLower) ||
               p.jabatan.toLowerCase().includes(queryLower);
      }).slice(0, 12);

      const chosen = matches[matchIndex];
      closeAllSuggestBoxes();
      if (!chosen) return;

      if (targetMode === 'form_main' || targetMode === 'form_nip' || targetMode === 'form_nama') {
        const qInput = document.getElementById('quickSearchPegawaiInput');
        if (qInput) qInput.value = `${chosen.nama}${chosen.nip ? ' (' + chosen.nip + ')' : ''}`;
        document.getElementById('f_nip').value = chosen.nip || '';
        document.getElementById('f_nama').value = chosen.nama || '';
        document.getElementById('f_jabatan').value = chosen.jabatan || 'Penata Layanan Operasional';
        document.getElementById('f_pangkat_gol').value = chosen.pangkat || 'IX';
        if (chosen.masa_kerja && chosen.masa_kerja !== '-') {
          document.getElementById('f_masa_kerja').value = chosen.masa_kerja;
        }
        document.getElementById('f_unit_kerja').value = chosen.unit_kerja || 'Dinas Kesehatan';
        if (chosen.telp) document.getElementById('f_telp').value = chosen.telp;
      } else if (targetMode === 'form_atasan') {
        document.getElementById('f_atasan_nama').value = chosen.nama || '';
        document.getElementById('f_atasan_nip').value = chosen.nip || '';
      } else if (targetMode === 'form_pejabat') {
        document.getElementById('f_pejabat_nama').value = chosen.nama || '';
        document.getElementById('f_pejabat_nip').value = chosen.nip || '';
      } else if (targetMode === 'cfg_kadinkes') {
        document.getElementById('cfgKadinkesNama').value = chosen.nama || '';
        document.getElementById('cfgKadinkesNip').value = chosen.nip || '';
      } else if (targetMode === 'cfg_atasan') {
        document.getElementById('cfgAtasanNama').value = chosen.nama || '';
        document.getElementById('cfgAtasanNip').value = chosen.nip || '';
      } else if (targetMode === 'rekap') {
        document.getElementById('rekapNipInput').value = chosen.nip || chosen.nama;
        cariRekapNip(chosen.nip, chosen.nama);
      }
    }

    function onSelectMasterPegawai(nip) {
      if (!nip) return;
      const pool = getUnifiedPegawaiPool();
      const chosen = pool.find(item => item.nip === nip);
      if (!chosen) return;

      const qInput = document.getElementById('quickSearchPegawaiInput');
      if (qInput) qInput.value = `${chosen.nama} (${chosen.nip})`;
      document.getElementById('f_nip').value = chosen.nip;
      document.getElementById('f_nama').value = chosen.nama;
      document.getElementById('f_jabatan').value = chosen.jabatan || 'Penata Layanan Operasional';
      document.getElementById('f_pangkat_gol').value = chosen.pangkat || 'IX';
      document.getElementById('f_masa_kerja').value = chosen.masa_kerja || '01 Tahun 03 Bulan';
      document.getElementById('f_unit_kerja').value = chosen.unit_kerja || 'Dinas Kesehatan';
      document.getElementById('f_telp').value = chosen.telp || '';
    }

function renderPegawaiTable() {
      const q = (document.getElementById('searchPegawaiInput').value || '').toLowerCase();
      const tbody = document.getElementById('pegawaiTableBody');

      const filtered = state.pegawaiList.filter(p => {
        const nip = getPegawaiField(p, ['NIP', 'NI PPPK', 'nip']).toLowerCase();
        const nama = getPegawaiField(p, ['Nama', 'nama']).toLowerCase();
        return !q || nip.includes(q) || nama.includes(q);
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400">Data pegawai tidak ditemukan</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(p => {
        const nip = getPegawaiField(p, ['NIP', 'NI PPPK', 'nip']);
        const nama = getPegawaiField(p, ['Nama', 'nama']);
        const jabatan = getPegawaiField(p, ['Jabatan', 'jabatan']) || 'Penata Layanan Operasional';
        const pangkat = getPegawaiField(p, ['Pangkat', 'pangkat_gol']) || 'IX';
        const mk = getPegawaiField(p, ['Masa Kerja', 'masa_kerja']) || '-';

        return `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-3 px-4 font-mono font-semibold text-slate-700">${escapeHtml(nip)}</td>
            <td class="py-3 px-4 font-bold text-slate-900">${escapeHtml(nama)}</td>
            <td class="py-3 px-4 text-slate-600">${escapeHtml(jabatan)}</td>
            <td class="py-3 px-4 text-slate-500">Gol. ${escapeHtml(pangkat)} • ${escapeHtml(mk)}</td>
            <td class="py-3 px-4 text-right space-x-1.5">
              <button onclick="cekRekapDariPegawai('${escapeAttr(nip)}')" class="px-2.5 py-1 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition">Rekap</button>
              <button onclick="buatCutiDariPegawai('${escapeAttr(nip)}')" class="px-2.5 py-1 rounded-lg font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 transition">+ Buat Cuti</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    function buatCutiDariPegawai(nip) {
      openFormModal();
      onSelectMasterPegawai(nip);
    }

    function cekRekapDariPegawai(nip) {
      switchMenu('rekap');
      document.getElementById('rekapNipInput').value = nip;
      cariRekapNip(nip);
    }

    async function cariRekapNip(forcedNip, forcedNama) {
      let rawInput = (forcedNip !== undefined ? forcedNip : document.getElementById('rekapNipInput').value).trim();
      if (!rawInput && !forcedNama) {
        showToast('Ketik Nama Pegawai atau NI PPPK / NIP terlebih dahulu', true);
        return;
      }

      // Jika pengguna mengetik nama pegawai secara manual, cari NIP yang cocok dari pool pegawai
      let nip = rawInput;
      let matchedPerson = null;
      const pool = getUnifiedPegawaiPool();
      if (forcedNama) {
        matchedPerson = pool.find(p => p.nama.toLowerCase() === forcedNama.toLowerCase());
      }
      if (!matchedPerson) {
        matchedPerson = pool.find(p =>
          p.nip.toLowerCase() === rawInput.toLowerCase() ||
          p.nama.toLowerCase().includes(rawInput.toLowerCase())
        );
      }
      if (matchedPerson && matchedPerson.nip) {
        nip = matchedPerson.nip;
      }

      try {
        const res = await apiGet({ action: 'getRekap', nip: nip });
        const container = document.getElementById('rekapResultContainer');
        const grid = document.getElementById('rekapKeyValueGrid');
        const historyBody = document.getElementById('rekapHistoryBody');

        container.classList.remove('hidden');
        const titleLabel = matchedPerson ? `${matchedPerson.nama} (${nip})` : nip;

        if (res.status === 200 && res.data) {
          document.getElementById('rekapHeaderTitle').textContent = titleLabel;
          grid.innerHTML = Object.entries(res.data).map(([k, v]) => `
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div class="text-[11px] text-slate-400 font-semibold">${escapeHtml(k)}</div>
              <div class="text-sm font-extrabold text-slate-900 mt-0.5">${escapeHtml(String(v ?? '-'))}</div>
            </div>
          `).join('');
        } else {
          document.getElementById('rekapHeaderTitle').textContent = titleLabel;
          grid.innerHTML = `<div class="col-span-full p-3.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs">Data pada sheet <b>masterdatarekap</b> untuk <b>${escapeHtml(titleLabel)}</b> belum terdaftar. Menampilkan riwayat pengajuan cuti di bawah ini.</div>`;
        }

        const riwayat = state.cutiList.filter(c =>
          String(c.nip).trim() === nip ||
          (matchedPerson && String(c.nama).toLowerCase().includes(matchedPerson.nama.toLowerCase()))
        );
        if (riwayat.length === 0) {
          historyBody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400">Belum ada riwayat permohonan cuti</td></tr>`;
        } else {
          historyBody.innerHTML = riwayat.map(r => `
            <tr>
              <td class="py-2.5 px-3 font-mono text-teal-700 font-bold">${escapeHtml(r.id_pengajuan)}</td>
              <td class="py-2.5 px-3 font-semibold">${escapeHtml(r.jenis_cuti)}</td>
              <td class="py-2.5 px-3">${formatSlashDate(r.tanggal_mulai)} s.d. ${formatSlashDate(r.tanggal_selesai)}</td>
              <td class="py-2.5 px-3 font-bold">${escapeHtml(String(r.lama_cuti))} Hari</td>
              <td class="py-2.5 px-3 text-slate-500">${escapeHtml(r.alasan_cuti)}</td>
              <td class="py-2.5 px-3">${getStatusBadge(r.status_pengajuan)}</td>
              <td class="py-2.5 px-3 text-right">
                <button onclick="bukaCetakUntuk('${escapeAttr(r.id_pengajuan)}')" class="font-bold text-teal-600 hover:underline">Cetak</button>
              </td>
            </tr>
          `).join('');
        }
      } catch (err) {
        showToast('Gagal mengambil data rekap: ' + err.message, true);
      }
    }
