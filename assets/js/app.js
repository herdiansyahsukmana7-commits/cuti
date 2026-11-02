/**
 * assets/js/app.js
 * E-Cuti Dinas Kesehatan Kota Tangerang Selatan
 * Aplikasi Pengelolaan Cuti, Cetak Dokumen Resmi A4 & Rekapitulasi Periodik
 */

// Endpoint API mendukung Netlify Serverless Proxy (/api/gas) & Google Apps Script Web App
const DEFAULT_SCRIPT_URL = '';

    // Konfigurasi Pejabat Default yang bisa diubah lewat menu Pengaturan
    let pejabatDefault = JSON.parse(localStorage.getItem('DINKES_PEJABAT_CFG') || 'null') || {
      kadinkesNama: 'dr. Allin Hendalin Mahdaniar, M.K.M.',
      kadinkesNip: '197610152007012007',
      atasanNama: 'Ikhsan Permana, SKM',
      atasanNip: '197801081998031002',
      walikotaNama: 'Benyamin Davnie'
    };

    // Konfigurasi Akun Petugas Penginput Default
    let state = {
      apiUrl: localStorage.getItem('GAS_CUTI_API_URL') || DEFAULT_SCRIPT_URL,
      activeMenu: 'dashboard',
      cutiList: [],
      pegawaiList: [],
      selectedPrintId: '',
      isLoggedIn: sessionStorage.getItem('DINKES_LOGGED_IN') === 'true'
    };

    const DEMO_PEGAWAI = [
      { NIP: '198211012025211017', Nama: 'Rudy, S.Sos.I', Jabatan: 'Penata Layanan Operasional', Pangkat: 'IX', 'Masa Kerja': '01 Tahun 03 Bulan', 'Unit Kerja': 'Dinas Kesehatan', Telp: '085694964069' },
      { NIP: '199005282025211007', Nama: 'Deni Sueb, S.IP', Jabatan: 'Penata Layanan Operasional', Pangkat: 'IX', 'Masa Kerja': '01 Tahun 03 Bulan', 'Unit Kerja': 'Dinas Kesehatan', Telp: '085694964069' },
      { NIP: '197505072025212006', Nama: 'Evie Ervina Rahmawati, SE', Jabatan: 'Penata Layanan Operasional', Pangkat: 'IX', 'Masa Kerja': '01 Tahun 04 Bulan', 'Unit Kerja': 'Dinas Kesehatan', Telp: '0817-222-771' }
    ];

    const DEMO_CUTI = [
      {
        id_pengajuan: 'CUTI-20261016-1001',
        tanggal_surat: '2026-10-16',
        nip: '198211012025211017',
        nama: 'Rudy, S.Sos.I',
        jabatan: 'Penata Layanan Operasional',
        pangkat_gol: 'IX',
        masa_kerja: '01 Tahun 03 Bulan',
        unit_kerja: 'Dinas Kesehatan',
        jenis_cuti: 'Cuti Tahunan',
        tanggal_mulai: '2026-11-09',
        tanggal_selesai: '2026-11-10',
        lama_cuti: 2,
        alasan_cuti: 'Pulang Kampung ke Rangkas Bitung',
        alamat_cuti: 'Rangkas Bitung',
        telp: '085694964069',
        sisa_cuti_tahunan: 'N=10',
        jenis_pejabat: 'kadinkes',
        atasan_nama: 'Ikhsan Permana, SKM',
        atasan_nip: '197801081998031002',
        pejabat_nama: 'dr. Allin Hendalin Mahdaniar, M.K.M.',
        pejabat_nip: '197610152007012007',
        status_pengajuan: 'Disetujui'
      },
      {
        id_pengajuan: 'CUTI-20261019-1002',
        tanggal_surat: '2026-10-19',
        nip: '199005282025211007',
        nama: 'Deni Sueb, S.IP',
        jabatan: 'Penata Layanan Operasional',
        pangkat_gol: 'IX',
        masa_kerja: '01 Tahun 03 Bulan',
        unit_kerja: 'Dinas Kesehatan',
        jenis_cuti: 'Cuti Tahunan',
        tanggal_mulai: '2026-10-23',
        tanggal_selesai: '2026-10-23',
        lama_cuti: 1,
        alasan_cuti: 'Acara Keluarga',
        alamat_cuti: 'Kota Tangerang Selatan',
        telp: '085694964069',
        sisa_cuti_tahunan: 'N=11',
        jenis_pejabat: 'kadinkes',
        atasan_nama: 'Ikhsan Permana, SKM',
        atasan_nip: '197801081998031002',
        pejabat_nama: 'dr. Allin Hendalin Mahdaniar, M.K.M.',
        pejabat_nip: '197610152007012007',
        status_pengajuan: 'Disetujui'
      },
      {
        id_pengajuan: 'CUTI-20261026-1003',
        tanggal_surat: '2026-10-26',
        nip: '197505072025212006',
        nama: 'Evie Ervina Rahmawati, SE',
        jabatan: 'Penata Layanan Operasional',
        pangkat_gol: 'IX',
        masa_kerja: '01 Tahun 04 Bulan',
        unit_kerja: 'Dinas Kesehatan',
        jenis_cuti: 'Cuti Tahunan',
        tanggal_mulai: '2026-11-09',
        tanggal_selesai: '2026-11-09',
        lama_cuti: 1,
        alasan_cuti: 'Acara Keluarga',
        alamat_cuti: 'Jl. Matahari Cigado III No. 25, Baleendah -Bandung',
        telp: '0817-222-771',
        sisa_cuti_tahunan: 'N=11',
        jenis_pejabat: 'kadinkes',
        atasan_nama: 'Ikhsan Permana, SKM',
        atasan_nip: '197801081998031002',
        pejabat_nama: 'dr. Allin Hendalin Mahdaniar, M.K.M.',
        pejabat_nip: '197610152007012007',
        status_pengajuan: 'Menunggu'
      }
    ];

    const DEMO_REKAP = {
      '198211012025211017': { 'NI PPPK': '198211012025211017', Nama: 'Rudy, S.Sos.I', 'Jatah Cuti': 12, 'Diambil': 2, 'Catatan Cuti': 'N=10' },
      '199005282025211007': { 'NI PPPK': '199005282025211007', Nama: 'Deni Sueb, S.IP', 'Jatah Cuti': 12, 'Diambil': 1, 'Catatan Cuti': 'N=11' },
      '197505072025212006': { 'NI PPPK': '197505072025212006', Nama: 'Evie Ervina Rahmawati, SE', 'Jatah Cuti': 12, 'Diambil': 1, 'Catatan Cuti': 'N=11' }
    };

    window.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      document.getElementById('sidebarPejabatNama').textContent = pejabatDefault.kadinkesNama;
      document.getElementById('sidebarPetugasNama').textContent = petugasAuth.nama || petugasAuth.username;
      checkAuthSession();
      updateApiBadge();

      // Instant Cache First supaya aplikasi terasa sangat ringan & cepat
      const cachedCuti = localStorage.getItem('CACHE_CUTI_LIST');
      const cachedPeg = localStorage.getItem('CACHE_PEGAWAI_LIST');
      if (cachedCuti) {
        try {
          state.cutiList = JSON.parse(cachedCuti);
          state.pegawaiList = cachedPeg ? JSON.parse(cachedPeg) : [];
          renderAllUI();
        } catch (e) {}
      }
      refreshAllData();
    });

    function toggleMobileSidebar() {
      const sb = document.getElementById('sidebar');
      const ov = document.getElementById('sidebarOverlay');
      sb.classList.toggle('-translate-x-full');
      ov.classList.toggle('hidden');
    }

    function switchMenu(menuName) {
      state.activeMenu = menuName;
      const menus = ['dashboard', 'daftar', 'cetak', 'laporan', 'rekap', 'pegawai'];
      const titles = {
        dashboard: ['Dashboard Kepegawaian', 'Sistem Informasi Permohonan dan Pemberian Cuti Dinas Kesehatan Kota Tangerang Selatan'],
        daftar: ['Data Pengajuan Cuti', 'Kelola permohonan cuti pegawai, status persetujuan, dan unduh laporan'],
        cetak: ['Cetak Formulir & Surat Permohonan', 'Pratinjau dan cetak Formulir Permintaan Cuti serta Surat Permohonan Cuti ukuran A4'],
        laporan: ['Cetak Laporan Rekapitulasi Cuti', 'Kelengkapan laporan periodik Triwulan, Semester, dan Tahunan Dinas Kesehatan Kota Tangerang Selatan'],
        rekap: ['Cek Sisa & Rekapitulasi Cuti', 'Lihat sisa cuti tahunan (N) dan riwayat pengajuan cuti pegawai'],
        pegawai: ['Master Data Pegawai', 'Direktori pegawai Dinas Kesehatan Kota Tangerang Selatan']
      };

      menus.forEach(m => {
        const sec = document.getElementById(`menu-${m}`);
        const nav = document.getElementById(`nav-${m}`);
        if (m === menuName) {
          sec.classList.remove('hidden');
          if (nav) nav.className = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/60 transition';
        } else {
          sec.classList.add('hidden');
          if (nav) nav.className = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition';
        }
      });

      if (titles[menuName]) {
        document.getElementById('pageHeaderTitle').textContent = titles[menuName][0];
        document.getElementById('pageHeaderSubtitle').textContent = titles[menuName][1];
      }

      if (menuName === 'cetak') {
        populatePrintSelector();
        renderPrintDocument();
      }
      if (menuName === 'laporan') {
        renderLaporanRekap();
      }

      document.getElementById('sidebar').classList.add('-translate-x-full');
      document.getElementById('sidebarOverlay').classList.add('hidden');
    }

    function updateApiBadge() {
      const badge = document.getElementById('apiStatusBadge');
      const dot = document.getElementById('apiStatusDot');
      const text = document.getElementById('apiStatusText');

      if (state.apiUrl) {
        badge.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition';
        dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
        text.textContent = 'Google Sheets Aktif';
      } else {
        badge.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition';
        dot.className = 'w-2 h-2 rounded-full bg-amber-500';
        text.textContent = 'Mode Demo';
      }
    }

    function showToast(msg, isError = false) {
      const toast = document.getElementById('toast');
      const box = document.getElementById('toastBox');
      const text = document.getElementById('toastMessage');

      text.textContent = msg;
      box.className = isError
        ? 'px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold bg-rose-600 text-white border-rose-700'
        : 'px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold bg-slate-900 text-white border-slate-800';

      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    /**
     * Deteksi otomatis jika baris di Google Sheets bergeser kolomnya
     * (Misal ketika kode lama menulis `CUTI-...` di kolom `nama` dan tanggal di kolom `nip`)
     */
    function normalizeCutiItem(raw) {
      const norm = {};
      Object.keys(raw || {}).forEach(k => {
        const cleanKey = k.trim().toLowerCase().replace(/\s+/g, '_');
        norm[cleanKey] = raw[k];
      });

      let id_pengajuan = String(norm.id_pengajuan || norm.id || '');
      let tanggal_surat = String(norm.tanggal_surat || norm.tgl_surat || '');
      let nip = String(norm.nip || norm.ni_pppk || '');
      let nama = String(norm.nama || norm.nama_pegawai || '');
      let jabatan = String(norm.jabatan || '');
      let pangkat_gol = String(norm.pangkat_gol || norm.pangkat || norm.golongan || '');

      // Perbaikan cerdas bila kolom di Sheet bergeser (nama berisi 'CUTI-...' dan nip berisi tanggal '2026-...')
      if (nama.startsWith('CUTI-') && /^\d{4}-\d{2}-\d{2}$/.test(nip)) {
        id_pengajuan = nama;
        tanggal_surat = nip;
        nip = jabatan;
        nama = pangkat_gol || 'Pegawai Dinkes';
        jabatan = 'Penata Layanan Operasional';
        pangkat_gol = 'IX';
      }

      return {
        id_pengajuan: id_pengajuan || ('CUTI-' + (nip || Math.floor(1000 + Math.random() * 9000))),
        tanggal_surat: tanggal_surat || new Date().toISOString().slice(0, 10),
        nip: nip,
        nama: nama,
        jabatan: jabatan || 'Penata Layanan Operasional',
        pangkat_gol: pangkat_gol || 'IX',
        masa_kerja: norm.masa_kerja || '01 Tahun 03 Bulan',
        unit_kerja: norm.unit_kerja || norm.perangkat_daerah || 'Dinas Kesehatan',
        jenis_cuti: norm.jenis_cuti || 'Cuti Tahunan',
        tanggal_mulai: norm.tanggal_mulai || norm.tgl_mulai || '',
        tanggal_selesai: norm.tanggal_selesai || norm.tgl_selesai || '',
        lama_cuti: Number(norm.lama_cuti || 1),
        alasan_cuti: norm.alasan_cuti || norm.alasan || '-',
        alamat_cuti: norm.alamat_cuti || norm.alamat || 'Kota Tangerang Selatan',
        telp: String(norm.telp || norm.telepon || norm.no_hp || '-'),
        sisa_cuti_tahunan: norm.sisa_cuti_tahunan || 'N=11',
        jenis_pejabat: norm.jenis_pejabat || 'kadinkes',
        atasan_nama: norm.atasan_nama || pejabatDefault.atasanNama,
        atasan_nip: String(norm.atasan_nip || pejabatDefault.atasanNip),
        pejabat_nama: norm.pejabat_nama || pejabatDefault.kadinkesNama,
        pejabat_nip: String(norm.pejabat_nip ?? pejabatDefault.kadinkesNip),
        status_pengajuan: norm.status_pengajuan || norm.status || 'Menunggu',
        catatan_atasan: norm.catatan_atasan || ''
      };
    }

    async function apiGet(params) {
      if (!state.apiUrl) {
        if (params.action === 'getAllCuti') {
          const saved = localStorage.getItem('DEMO_DINKES_CUTI');
          return { status: 200, data: saved ? JSON.parse(saved) : DEMO_CUTI };
        }
        if (params.action === 'getPegawai') {
          return { status: 200, data: DEMO_PEGAWAI };
        }
        if (params.action === 'getRekap') {
          const found = DEMO_REKAP[params.nip];
          if (found) return { status: 200, data: found };
          return { status: 404, error: 'Data rekap tidak ditemukan' };
        }
      }

      const url = new URL(state.apiUrl);
      Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
      const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
      return await res.json();
    }

    async function apiPost(payload) {
      if (!state.apiUrl) {
        let list = JSON.parse(localStorage.getItem('DEMO_DINKES_CUTI') || JSON.stringify(DEMO_CUTI));
        if (payload.action === 'create') {
          const newId = 'CUTI-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
          list.push({ ...payload, id_pengajuan: newId });
          localStorage.setItem('DEMO_DINKES_CUTI', JSON.stringify(list));
          return { status: 200, message: 'Permohonan cuti berhasil disimpan', id: newId };
        }
        if (payload.action === 'update') {
          list = list.map(item => item.id_pengajuan === payload.id_pengajuan ? { ...item, ...payload } : item);
          localStorage.setItem('DEMO_DINKES_CUTI', JSON.stringify(list));
          return { status: 200, message: 'Data permohonan cuti diperbarui' };
        }
        if (payload.action === 'delete') {
          list = list.filter(item => item.id_pengajuan !== payload.id_pengajuan);
          localStorage.setItem('DEMO_DINKES_CUTI', JSON.stringify(list));
          return { status: 200, message: 'Data permohonan cuti dihapus' };
        }
      }

      const res = await fetch(state.apiUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    }

    function renderAllUI() {
      if (!state.selectedPrintId && state.cutiList.length > 0) {
        state.selectedPrintId = state.cutiList[0].id_pengajuan;
      }
      renderDashboard();
      renderCutiTable();
      renderPegawaiTable();
      populatePegawaiDropdowns();
      populatePrintSelector();
      if (state.activeMenu === 'cetak') renderPrintDocument();
      if (state.activeMenu === 'laporan') renderLaporanRekap();
      lucide.createIcons();
    }

    async function refreshAllData(showNotif = false) {
      const icon = document.getElementById('refreshIcon');
      icon.classList.add('animate-spin');
      try {
        const [cutiRes, pegRes] = await Promise.all([
          apiGet({ action: 'getAllCuti' }),
          apiGet({ action: 'getPegawai' })
        ]);

        if (cutiRes.status === 200 && Array.isArray(cutiRes.data)) {
          state.cutiList = cutiRes.data
            .map(normalizeCutiItem)
            .filter(item => item.nama && !item.nama.startsWith('CUTI-'))
            .reverse();
          localStorage.setItem('CACHE_CUTI_LIST', JSON.stringify(state.cutiList));
        }
        if (pegRes.status === 200 && Array.isArray(pegRes.data)) {
          state.pegawaiList = pegRes.data;
          localStorage.setItem('CACHE_PEGAWAI_LIST', JSON.stringify(state.pegawaiList));
        }

        renderAllUI();
        if (showNotif) showToast('Data berhasil disinkronkan');
      } catch (err) {
        console.error(err);
        if (showNotif) showToast('Gagal memuat data: ' + err.message, true);
      } finally {
        icon.classList.remove('animate-spin');
      }
    }

    function onJenisCutiChange() {
      const jenis = document.getElementById('f_jenis_cuti').value;
      if (jenis === 'Cuti Pelaksanaan Ibadah Haji') {
        document.getElementById('f_jenis_pejabat').value = 'walikota';
        onChangeJenisPejabat();
        if (!document.getElementById('f_alasan_cuti').value) {
          document.getElementById('f_alasan_cuti').value = 'Cuti Pelaksanaan Ibadah Haji Pertama Kali';
        }
        if (!document.getElementById('f_alamat_cuti').value) {
          document.getElementById('f_alamat_cuti').value = 'Arab Saudi';
        }
      } else {
        document.getElementById('f_jenis_pejabat').value = 'kadinkes';
        onChangeJenisPejabat();
      }
    }

    function onChangeJenisPejabat() {
      const mode = document.getElementById('f_jenis_pejabat').value;
      if (mode === 'walikota') {
        document.getElementById('labelAtasanNama').textContent = 'Kepala Dinas Kesehatan (Kolom VII)';
        document.getElementById('labelAtasanNip').textContent = 'NIP Kepala Dinas Kesehatan';
        document.getElementById('f_atasan_nama').value = pejabatDefault.kadinkesNama;
        document.getElementById('f_atasan_nip').value = pejabatDefault.kadinkesNip;
        document.getElementById('f_pejabat_nama').value = pejabatDefault.walikotaNama;
        document.getElementById('f_pejabat_nip').value = '';
      } else {
        document.getElementById('labelAtasanNama').textContent = 'Atasan Langsung (Kolom VII)';
        document.getElementById('labelAtasanNip').textContent = 'NIP Atasan Langsung';
        document.getElementById('f_atasan_nama').value = pejabatDefault.atasanNama;
        document.getElementById('f_atasan_nip').value = pejabatDefault.atasanNip;
        document.getElementById('f_pejabat_nama').value = pejabatDefault.kadinkesNama;
        document.getElementById('f_pejabat_nip').value = pejabatDefault.kadinkesNip;
      }
    }

    function renderDashboard() {
      const total = state.cutiList.length;
      const menunggu = state.cutiList.filter(c => (c.status_pengajuan || 'Menunggu') === 'Menunggu').length;
      const disetujui = state.cutiList.filter(c => c.status_pengajuan === 'Disetujui').length;
      const ditolak = state.cutiList.filter(c => ['Tidak Disetujui', 'Ditolak', 'Ditangguhkan', 'Perubahan'].includes(c.status_pengajuan)).length;

      document.getElementById('statTotal').textContent = total;
      document.getElementById('statMenunggu').textContent = menunggu;
      document.getElementById('statDisetujui').textContent = disetujui;
      document.getElementById('statDitolak').textContent = ditolak;

      const jenisList = [
        { label: 'Cuti Tahunan', color: 'bg-teal-500' },
        { label: 'Cuti Sakit', color: 'bg-amber-500' },
        { label: 'Cuti Melahirkan', color: 'bg-pink-500' },
        { label: 'Cuti Pelaksanaan Ibadah Haji', color: 'bg-indigo-500' }
      ];

      document.getElementById('dashboardJenisBreakdown').innerHTML = jenisList.map(j => {
        const count = state.cutiList.filter(c => c.jenis_cuti === j.label).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return `
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="font-medium text-slate-600">${j.label}</span>
              <span class="font-bold text-slate-900">${count}</span>
            </div>
            <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="${j.color} h-full rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');

      const recentBody = document.getElementById('dashboardRecentBody');
      const recent = state.cutiList.slice(0, 5);
      if (recent.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400">Belum ada permohonan cuti</td></tr>`;
      } else {
        recentBody.innerHTML = recent.map(item => `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-2.5 px-3">
              <div class="font-bold text-slate-900">${escapeHtml(item.nama)}</div>
              <div class="text-[11px] text-slate-400">NI PPPK. ${escapeHtml(item.nip)}</div>
            </td>
            <td class="py-2.5 px-3">
              <div class="font-semibold text-slate-700">${escapeHtml(item.jenis_cuti)}</div>
              <div class="text-[11px] text-slate-400 truncate max-w-[180px]">${escapeHtml(item.alasan_cuti)}</div>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap">
              <div class="text-slate-700 font-medium">${formatSlashDate(item.tanggal_mulai)} s.d. ${formatSlashDate(item.tanggal_selesai)}</div>
              <span class="text-[11px] font-bold text-teal-600">${item.lama_cuti} Hari Kerja</span>
            </td>
            <td class="py-2.5 px-3">${getStatusBadge(item.status_pengajuan)}</td>
            <td class="py-2.5 px-3 text-right">
              <button onclick="bukaCetakUntuk('${escapeAttr(item.id_pengajuan)}')" class="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold inline-flex items-center gap-1 transition">
                <i data-lucide="printer" class="w-3 h-3"></i>
                <span>Cetak</span>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    function getStatusBadge(status) {
      const s = status || 'Menunggu';
      const styles = {
        'Menunggu': 'bg-amber-50 text-amber-700 border-amber-200/80',
        'Disetujui': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        'Perubahan': 'bg-sky-50 text-sky-700 border-sky-200/80',
        'Ditangguhkan': 'bg-orange-50 text-orange-700 border-orange-200/80',
        'Tidak Disetujui': 'bg-rose-50 text-rose-700 border-rose-200/80',
        'Ditolak': 'bg-rose-50 text-rose-700 border-rose-200/80'
      };
      const cls = styles[s] || styles['Menunggu'];
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${cls}">${escapeHtml(s)}</span>`;
    }

    function renderCutiTable() {
      const q = (document.getElementById('searchInput').value || '').toLowerCase();
      const jenis = document.getElementById('filterJenis').value;
      const status = document.getElementById('filterStatus').value;

      const filtered = state.cutiList.filter(item => {
        const matchQ = !q ||
          String(item.nama || '').toLowerCase().includes(q) ||
          String(item.nip || '').toLowerCase().includes(q) ||
          String(item.id_pengajuan || '').toLowerCase().includes(q) ||
          String(item.alasan_cuti || '').toLowerCase().includes(q);
        const matchJenis = !jenis || item.jenis_cuti === jenis;
        const matchStatus = !status || (item.status_pengajuan || 'Menunggu') === status;
        return matchQ && matchJenis && matchStatus;
      });

      const tbody = document.getElementById('cutiTableBody');
      const empty = document.getElementById('emptyState');

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }

      empty.classList.add('hidden');
      tbody.innerHTML = filtered.map(item => `
        <tr class="hover:bg-slate-50/70 transition">
          <td class="py-3 px-4 align-top">
            <div class="font-mono text-[11px] font-bold text-teal-700">${escapeHtml(item.id_pengajuan || '-')}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">${formatLongIndoDate(item.tanggal_surat)}</div>
          </td>
          <td class="py-3 px-4 align-top">
            <div class="font-bold text-slate-900">${escapeHtml(item.nama || '-')}</div>
            <div class="text-[11px] text-slate-500">NI PPPK. ${escapeHtml(item.nip || '-')}</div>
            <div class="text-[11px] text-slate-400">${escapeHtml(item.jabatan || '')} • Gol. ${escapeHtml(item.pangkat_gol || 'IX')}</div>
          </td>
          <td class="py-3 px-4 align-top max-w-xs">
            <div class="font-semibold text-slate-800">${escapeHtml(item.jenis_cuti || '-')}</div>
            <div class="text-[11px] text-slate-500 line-clamp-2 mt-0.5">${escapeHtml(item.alasan_cuti || '-')}</div>
          </td>
          <td class="py-3 px-4 align-top whitespace-nowrap">
            <div class="font-medium text-slate-700">${formatSlashDate(item.tanggal_mulai)} s.d. ${formatSlashDate(item.tanggal_selesai)}</div>
            <span class="inline-block mt-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-[11px] font-bold">${escapeHtml(String(item.lama_cuti || 1))} Hari Kerja</span>
          </td>
          <td class="py-3 px-4 align-top text-slate-500">
            ${item.jenis_pejabat === 'walikota' ? '<span class="font-semibold text-indigo-600">Wali Kota Tangsel</span>' : 'Kepala Dinas Kesehatan'}
          </td>
          <td class="py-3 px-4 align-top">${getStatusBadge(item.status_pengajuan)}</td>
          <td class="py-3 px-4 align-top text-right whitespace-nowrap">
            <div class="inline-flex items-center gap-1">
              <button onclick="bukaCetakUntuk('${escapeAttr(item.id_pengajuan)}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-600 text-white hover:bg-teal-700 transition inline-flex items-center gap-1">
                <i data-lucide="printer" class="w-3 h-3"></i>
                <span>Cetak</span>
              </button>
              <button onclick="openEditModal('${escapeAttr(item.id_pengajuan)}')" class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition" title="Edit">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="hapusCuti('${escapeAttr(item.id_pengajuan)}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Hapus">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    function bukaCetakUntuk(id) {
      state.selectedPrintId = id;
      switchMenu('cetak');
    }

    function populatePrintSelector() {
      const sel = document.getElementById('selectCetakCuti');
      const searchInp = document.getElementById('searchCetakCuti');
      if (!sel || !searchInp) return;

      if (state.cutiList.length === 0) {
        sel.value = '';
        searchInp.value = '';
        return;
      }

      if (!state.selectedPrintId && state.cutiList[0]) {
        state.selectedPrintId = state.cutiList[0].id_pengajuan;
      }

      const activeItem = state.cutiList.find(c => c.id_pengajuan === state.selectedPrintId) || state.cutiList[0];
      if (activeItem) {
        state.selectedPrintId = activeItem.id_pengajuan;
        sel.value = activeItem.id_pengajuan;
        searchInp.value = `${activeItem.nama} — ${activeItem.jenis_cuti} (${formatSlashDate(activeItem.tanggal_mulai)})`;
      }
    }

    function showSuggestCetak(query) {
      ALL_SUGGEST_BOXES.forEach(id => {
        if (id !== 'suggestBoxCetak') {
          const el = document.getElementById(id);
          if (el) el.classList.add('hidden');
        }
      });

      const box = document.getElementById('suggestBoxCetak');
      if (!box) return;

      const q = String(query || '').trim().toLowerCase();
      // Jika teks di input masih sama persis dengan label yang sedang terpilih, tampilkan semua agar mudah ganti
      const currentItem = state.cutiList.find(c => c.id_pengajuan === state.selectedPrintId);
      const currentLabel = currentItem ? `${currentItem.nama} — ${currentItem.jenis_cuti} (${formatSlashDate(currentItem.tanggal_mulai)})`.toLowerCase() : '';
      const effectiveQ = (q === currentLabel) ? '' : q;

      const matches = state.cutiList.filter(c => {
        if (!effectiveQ) return true;
        return String(c.nama || '').toLowerCase().includes(effectiveQ) ||
               String(c.nip || '').toLowerCase().includes(effectiveQ) ||
               String(c.jenis_cuti || '').toLowerCase().includes(effectiveQ) ||
               String(c.id_pengajuan || '').toLowerCase().includes(effectiveQ);
      });

      if (matches.length === 0) {
        box.innerHTML = `<div class="px-3.5 py-2.5 text-[11px] text-slate-400 italic">Permohonan tidak ditemukan</div>`;
        box.classList.remove('hidden');
        return;
      }

      box.innerHTML = matches.map(c => `
        <button type="button" onclick="selectCetakItem('${escapeAttr(c.id_pengajuan)}')" class="w-full text-left px-3.5 py-2 hover:bg-teal-50/80 transition flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-xs font-bold text-slate-800 truncate">${highlightMatch(c.nama, effectiveQ)}</div>
            <div class="text-[10px] text-slate-500 truncate">NI PPPK/NIP: ${highlightMatch(c.nip, effectiveQ)} • ${escapeHtml(c.jenis_cuti)} (${formatSlashDate(c.tanggal_mulai)})</div>
          </div>
          <span class="shrink-0 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">Cetak</span>
        </button>
      `).join('');

      box.classList.remove('hidden');
    }

    function selectCetakItem(id) {
      state.selectedPrintId = id;
      const sel = document.getElementById('selectCetakCuti');
      if (sel) sel.value = id;
      populatePrintSelector();
      closeAllSuggestBoxes();
      renderPrintDocument();
    }

    function clearSearchCetak() {
      const inp = document.getElementById('searchCetakCuti');
      if (inp) {
        inp.value = '';
        inp.focus();
        showSuggestCetak('');
      }
    }

    function openEditFromPrint() {
      const id = document.getElementById('selectCetakCuti').value;
      if (id) openEditModal(id);
    }

    function terbilangHari(n) {
      const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
      n = parseInt(n, 10);
      if (isNaN(n) || n <= 0) return 'Satu';
      if (n < 12) return angka[n];
      if (n < 20) return angka[n - 10] + ' Belas';
      if (n < 100) {
        const puluh = Math.floor(n / 10);
        const sisa = n % 10;
        return angka[puluh] + ' Puluh' + (sisa > 0 ? ' ' + angka[sisa] : '');
      }
      return String(n);
    }

    function renderPrintDocument() {
      const id = document.getElementById('selectCetakCuti').value || state.selectedPrintId;
      state.selectedPrintId = id;
      const mode = document.getElementById('selectModeDokumen').value || 'both';
      const item = state.cutiList.find(c => c.id_pengajuan === id) || state.cutiList[0];

      const previewBox = document.getElementById('printPreviewBox');
      const printArea = document.getElementById('printArea');

      if (!item) {
        previewBox.innerHTML = `<div class="py-20 text-center text-slate-400 text-xs">Pilih atau buat data pengajuan cuti terlebih dahulu.</div>`;
        printArea.innerHTML = '';
        return;
      }

      const isWalikota = item.jenis_pejabat === 'walikota';
      const ythTujuan = isWalikota
        ? `Wali Kota Tangerang Selatan`
        : `Kepala Dinas Kesehatan <br>Kota Tangerang Selatan`;

      const isTahunan = item.jenis_cuti === 'Cuti Tahunan';
      const isSakit = item.jenis_cuti === 'Cuti Sakit';
      const isMelahirkan = item.jenis_cuti === 'Cuti Melahirkan';
      const isHaji = item.jenis_cuti === 'Cuti Pelaksanaan Ibadah Haji';

      const judulBagianVII = isWalikota
        ? 'PERTIMBANGAN KEPALA DINAS KESEHATAN KOTA TANGERANG SELATAN'
        : 'PERTIMBANGAN ATASAN LANGSUNG';

      const blokTtdVII = isWalikota
        ? `<div>Kepala,</div>
           <div style="height: 44px;"></div>
           <div class="font-bold underline">${escapeHtml(item.atasan_nama || pejabatDefault.kadinkesNama)}</div>
           <div>NIP. ${escapeHtml(item.atasan_nip || pejabatDefault.kadinkesNip)}</div>`
        : `<div style="height: 48px;"></div>
           <div class="font-bold underline">${escapeHtml(item.atasan_nama || pejabatDefault.atasanNama)}</div>
           <div>NIP. ${escapeHtml(item.atasan_nip || pejabatDefault.atasanNip)}</div>`;

      const blokTtdVIII = isWalikota
        ? `<div>Wali Kota Tangerang Selatan</div>
           <div style="height: 44px;"></div>
           <div class="font-bold underline">${escapeHtml(item.pejabat_nama || pejabatDefault.walikotaNama)}</div>`
        : `<div style="height: 48px;"></div>
           <div class="font-bold underline">${escapeHtml(item.pejabat_nama || pejabatDefault.kadinkesNama)}</div>
           <div>NIP. ${escapeHtml(item.pejabat_nip || pejabatDefault.kadinkesNip)}</div>`;

      const sameDay = item.tanggal_mulai === item.tanggal_selesai;
      const periodeNarasi = sameDay
        ? `terhitung mulai tanggal ${formatLongIndoDate(item.tanggal_mulai)}`
        : `terhitung mulai tanggal ${formatLongIndoDate(item.tanggal_mulai)} s.d. ${formatLongIndoDate(item.tanggal_selesai)}`;

      const formulirHtml = `
        <div class="print-sheet text-[12px]">
          <div class="flex justify-end mb-3">
            <div class="w-72 text-[12px] leading-snug">
              <div>Tangerang Selatan, ${formatLongIndoDate(item.tanggal_surat)}</div>
              <div class="mt-1">Kepada :</div>
              <div class="flex gap-1">
                <span>Yth.</span>
                <div>
                  <div>${ythTujuan}</div>
                  <div>di</div>
                  <div class="pl-6">Tangerang Selatan</div>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center font-bold text-[13px] uppercase tracking-wide my-2">
            FORMULIR PERMINTAAN DAN PEMBERIAN CUTI
          </div>

          <table class="print-table mb-2">
            <tr><td colspan="4" class="font-bold uppercase">I. DATA PEGAWAI</td></tr>
            <tr>
              <td style="width: 18%;">Nama</td>
              <td style="width: 35%;">${escapeHtml(item.nama)}</td>
              <td style="width: 15%;">NI PPPK</td>
              <td style="width: 32%;">${escapeHtml(item.nip)}</td>
            </tr>
            <tr>
              <td>Jabatan</td>
              <td>${escapeHtml(item.jabatan)}</td>
              <td>Masa Kerja</td>
              <td>${escapeHtml(item.masa_kerja)}</td>
            </tr>
            <tr>
              <td>Perangkat Daerah</td>
              <td colspan="3">${escapeHtml(item.unit_kerja || 'Dinas Kesehatan')}</td>
            </tr>
          </table>

          <table class="print-table mb-2">
            <tr><td colspan="2" class="font-bold uppercase">II. JENIS CUTI YANG DIAMBIL</td></tr>
            <tr>
              <td style="width: 70%;">1. Cuti Tahunan</td>
              <td class="text-center font-bold" style="width: 30%;">${isTahunan ? '&#10003;' : ''}</td>
            </tr>
            <tr>
              <td>2. Cuti Sakit</td>
              <td class="text-center font-bold">${isSakit ? '&#10003;' : ''}</td>
            </tr>
            <tr>
              <td>3. Cuti Melahirkan</td>
              <td class="text-center font-bold">${isMelahirkan ? '&#10003;' : ''}</td>
            </tr>
            <tr>
              <td>4. Cuti Pelaksanaan Ibadah Haji</td>
              <td class="text-center font-bold">${isHaji ? '&#10003;' : ''}</td>
            </tr>
          </table>

          <table class="print-table mb-2">
            <tr><td class="font-bold uppercase">III. ALASAN CUTI</td></tr>
            <tr><td class="py-1.5">${escapeHtml(item.alasan_cuti)}</td></tr>
          </table>

          <table class="print-table mb-2">
            <tr><td colspan="6" class="font-bold uppercase">IV. LAMANYA CUTI</td></tr>
            <tr>
              <td style="width: 12%;">Selama</td>
              <td style="width: 24%;">${escapeHtml(String(item.lama_cuti))} hari/<del>bulan</del>/<del>tahun</del></td>
              <td style="width: 18%;">mulai tanggal</td>
              <td style="width: 18%;">${formatSlashDate(item.tanggal_mulai)}</td>
              <td style="width: 8%;" class="text-center">s.d.</td>
              <td style="width: 20%;">${formatSlashDate(item.tanggal_selesai)}</td>
            </tr>
          </table>

          <table class="print-table mb-2">
            <tr><td colspan="2" class="font-bold uppercase">V. CATATAN CUTI</td></tr>
            <tr>
              <td style="width: 70%;">1. Cuti Tahunan</td>
              <td style="width: 30%;" class="text-center font-semibold">${isTahunan ? escapeHtml(item.sisa_cuti_tahunan || '') : ''}</td>
            </tr>
            <tr><td>2. Cuti Sakit</td><td></td></tr>
            <tr><td>3. Cuti Melahirkan</td><td></td></tr>
            <tr><td>4. Cuti Pelaksanaan Ibadah Haji</td><td></td></tr>
          </table>

          <table class="print-table mb-2">
            <tr><td colspan="3" class="font-bold uppercase">VI. ALAMAT SELAMA MENJALANKAN CUTI</td></tr>
            <tr>
              <td style="width: 55%;">${escapeHtml(item.alamat_cuti)}</td>
              <td style="width: 12%;" class="font-semibold">TELP</td>
              <td style="width: 33%;">${escapeHtml(item.telp)}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #000;"></td>
              <td colspan="2" class="text-center py-2">
                <div>Hormat Saya,</div>
                <div style="height: 46px;"></div>
                <div class="font-bold underline">${escapeHtml(item.nama)}</div>
                <div>NI PPPK. ${escapeHtml(item.nip)}</div>
              </td>
            </tr>
          </table>

          <table class="print-table mb-2">
            <tr><td colspan="4" class="font-bold uppercase">VII. ${judulBagianVII}</td></tr>
            <tr class="text-center font-semibold">
              <td style="width: 25%;">DISETUJUI</td>
              <td style="width: 25%;">PERUBAHAN</td>
              <td style="width: 25%;">DITANGGUHKAN</td>
              <td style="width: 25%;">TIDAK DISETUJUI</td>
            </tr>
            <tr class="text-center" style="height: 22px;">
              <td>${item.status_pengajuan === 'Disetujui' ? '&#10003;' : ''}</td>
              <td>${item.status_pengajuan === 'Perubahan' ? '&#10003;' : ''}</td>
              <td>${item.status_pengajuan === 'Ditangguhkan' ? '&#10003;' : ''}</td>
              <td>${item.status_pengajuan === 'Tidak Disetujui' ? '&#10003;' : ''}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-right: none;"></td>
              <td colspan="2" class="text-center py-2" style="border-left: none;">${blokTtdVII}</td>
            </tr>
          </table>

          <table class="print-table">
            <tr><td colspan="4" class="font-bold uppercase">VIII. KEPUTUSAN PEJABAT YANG BERWENANG MEMBERIKAN CUTI</td></tr>
            <tr class="text-center font-semibold">
              <td style="width: 25%;">DISETUJUI</td>
              <td style="width: 25%;">PERUBAHAN</td>
              <td style="width: 25%;">DITANGGUHKAN</td>
              <td style="width: 25%;">TIDAK DISETUJUI</td>
            </tr>
            <tr class="text-center" style="height: 22px;">
              <td>${item.status_pengajuan === 'Disetujui' ? '&#10003;' : ''}</td>
              <td>${item.status_pengajuan === 'Perubahan' ? '&#10003;' : ''}</td>
              <td>${item.status_pengajuan === 'Ditangguhkan' ? '&#10003;' : ''}</td>
              <td>${item.status_pengajuan === 'Tidak Disetujui' ? '&#10003;' : ''}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-right: none;"></td>
              <td colspan="2" class="text-center py-2" style="border-left: none;">${blokTtdVIII}</td>
            </tr>
          </table>
        </div>
      `;

      const suratHtml = `
        <div class="print-sheet text-[13.5px] leading-relaxed pt-2">
          <div class="flex justify-end mb-8">
            <div class="w-80 leading-snug">
              <div>Tangerang Selatan, ${formatLongIndoDate(item.tanggal_surat)}</div>
              <div class="mt-2">Kepada :</div>
              <div class="flex gap-1.5">
                <span>Yth.</span>
                <div>
                  <div>${ythTujuan}</div>
                  <div>di</div>
                  <div class="pl-8">Tangerang Selatan</div>
                </div>
              </div>
            </div>
          </div>

          <p class="mb-4">Yang bertanda tangan di bawah ini:</p>

          <table class="mb-6 ml-2" style="border-collapse: collapse; width: 95%;">
            <tr>
              <td class="py-1" style="width: 210px;">Nama</td>
              <td class="py-1" style="width: 15px;">:</td>
              <td class="py-1 font-semibold">${escapeHtml(item.nama)}</td>
            </tr>
            <tr>
              <td class="py-1">NI PPPK</td>
              <td class="py-1">:</td>
              <td class="py-1">${escapeHtml(item.nip)}</td>
            </tr>
            <tr>
              <td class="py-1">Pangkat/Golongan Ruang</td>
              <td class="py-1">:</td>
              <td class="py-1">${escapeHtml(item.pangkat_gol || 'IX')}</td>
            </tr>
            <tr>
              <td class="py-1">Jabatan</td>
              <td class="py-1">:</td>
              <td class="py-1">${escapeHtml(item.jabatan)}</td>
            </tr>
            <tr>
              <td class="py-1">Unit Kerja</td>
              <td class="py-1">:</td>
              <td class="py-1">${escapeHtml(item.unit_kerja || 'Dinas Kesehatan')}</td>
            </tr>
          </table>

          <p class="mb-4 text-justify leading-7">
            Memberitahukan dengan hormat, bahwa saya mengajukan permohonan ${escapeHtml((item.jenis_cuti || 'cuti tahunan').toLowerCase())} selama ${escapeHtml(String(item.lama_cuti))} (${terbilangHari(item.lama_cuti)}) Hari Kerja ${periodeNarasi} dikarenakan ${escapeHtml(item.alasan_cuti)}.
          </p>

          <p class="mb-10 text-justify leading-7">
            Demikianlah, permintaan ini saya buat untuk dapat dipertimbangkan sebagaimana mestinya.
          </p>

          <div class="flex justify-end mb-16 pr-8">
            <div class="text-center w-64">
              <div>Hormat Saya,</div>
              <div style="height: 68px;"></div>
              <div class="font-bold underline">${escapeHtml(item.nama)}</div>
              <div>NI PPPK. ${escapeHtml(item.nip)}</div>
            </div>
          </div>

          <div class="text-[12.5px]">
            <div class="underline font-semibold">Tembusan:</div>
            <div>Yth. Kepala BKPSDM Kota Tangerang Selatan.</div>
          </div>
        </div>
      `;

      if (mode === 'formulir') {
        previewBox.innerHTML = formulirHtml;
        printArea.innerHTML = formulirHtml;
      } else if (mode === 'surat') {
        previewBox.innerHTML = suratHtml;
        printArea.innerHTML = suratHtml;
      } else {
        previewBox.innerHTML = `
          ${formulirHtml}
          <div class="my-10 border-t border-dashed border-slate-300 relative no-print">
            <span class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">Halaman 2: Surat Permohonan Cuti</span>
          </div>
          ${suratHtml}
        `;
        printArea.innerHTML = `${formulirHtml}<div class="page-break"></div>${suratHtml}`;
      }
    }

    // =========================================================================
    // CETAK LAPORAN REKAPITULASI CUTI (TRIWULAN, SEMESTER, TAHUNAN)
    // =========================================================================
    function onChangeJenisPeriodeLaporan() {
      const jenis = document.getElementById('lapJenisPeriode').value;
      const wrap = document.getElementById('wrapSubPeriode');
      const label = document.getElementById('labelSubPeriode');
      const sel = document.getElementById('lapSubPeriode');

      if (jenis === 'triwulan') {
        wrap.classList.remove('hidden');
        label.textContent = 'Pilih Triwulan:';
        sel.innerHTML = `
          <option value="TW1">Triwulan I (Januari – Maret)</option>
          <option value="TW2">Triwulan II (April – Juni)</option>
          <option value="TW3">Triwulan III (Juli – September)</option>
          <option value="TW4" selected>Triwulan IV (Oktober – Desember)</option>
        `;
      } else if (jenis === 'semester') {
        wrap.classList.remove('hidden');
        label.textContent = 'Pilih Semester:';
        sel.innerHTML = `
          <option value="SEM1">Semester I (Januari – Juni)</option>
          <option value="SEM2" selected>Semester II (Juli – Desember)</option>
        `;
      } else {
        wrap.classList.add('hidden');
      }
      renderLaporanRekap();
    }

    function getFilteredLaporanData() {
      const jenis = document.getElementById('lapJenisPeriode').value;
      const sub = document.getElementById('lapSubPeriode').value;
      const tahun = parseInt(document.getElementById('lapTahun').value, 10) || 2026;
      const statusFilter = document.getElementById('lapStatusFilter').value;

      let minMonth = 1, maxMonth = 12, labelPeriode = `TAHUN ANGGARAN ${tahun}`;
      if (jenis === 'triwulan') {
        if (sub === 'TW1') { minMonth = 1; maxMonth = 3; labelPeriode = `TRIWULAN I (JANUARI – MARET) TAHUN ${tahun}`; }
        if (sub === 'TW2') { minMonth = 4; maxMonth = 6; labelPeriode = `TRIWULAN II (APRIL – JUNI) TAHUN ${tahun}`; }
        if (sub === 'TW3') { minMonth = 7; maxMonth = 9; labelPeriode = `TRIWULAN III (JULI – SEPTEMBER) TAHUN ${tahun}`; }
        if (sub === 'TW4') { minMonth = 10; maxMonth = 12; labelPeriode = `TRIWULAN IV (OKTOBER – DESEMBER) TAHUN ${tahun}`; }
      } else if (jenis === 'semester') {
        if (sub === 'SEM1') { minMonth = 1; maxMonth = 6; labelPeriode = `SEMESTER I (JANUARI – JUNI) TAHUN ${tahun}`; }
        if (sub === 'SEM2') { minMonth = 7; maxMonth = 12; labelPeriode = `SEMESTER II (JULI – DESEMBER) TAHUN ${tahun}`; }
      }

      const rows = state.cutiList.filter(item => {
        const refDate = item.tanggal_mulai || item.tanggal_surat;
        if (!refDate) return false;
        const d = new Date(refDate);
        if (isNaN(d.getTime())) return false;
        const yr = d.getFullYear();
        const mo = d.getMonth() + 1;
        const matchPeriod = (yr === tahun && mo >= minMonth && mo <= maxMonth);
        const matchStatus = (statusFilter === 'ALL' || item.status_pengajuan === statusFilter);
        return matchPeriod && matchStatus;
      });

      return { rows, labelPeriode, tahun };
    }

    function renderLaporanRekap() {
      const { rows, labelPeriode } = getFilteredLaporanData();
      const previewBox = document.getElementById('laporanPreviewBox');
      if (!previewBox) return;

      const totalHari = rows.reduce((acc, r) => acc + (Number(r.lama_cuti) || 0), 0);
      const countTahunan = rows.filter(r => r.jenis_cuti === 'Cuti Tahunan').length;
      const countSakit = rows.filter(r => r.jenis_cuti === 'Cuti Sakit').length;
      const countMelahirkan = rows.filter(r => r.jenis_cuti === 'Cuti Melahirkan').length;
      const countHaji = rows.filter(r => r.jenis_cuti === 'Cuti Pelaksanaan Ibadah Haji').length;

      const tableRowsHtml = rows.length === 0
        ? `<tr><td colspan="9" class="text-center py-6">Tidak ada data permohonan cuti pada periode ini.</td></tr>`
        : rows.map((r, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td>
                <div class="font-bold">${escapeHtml(r.nama)}</div>
                <div>NI PPPK/NIP. ${escapeHtml(r.nip)}</div>
              </td>
              <td>
                <div>${escapeHtml(r.jabatan)}</div>
                <div>Gol. ${escapeHtml(r.pangkat_gol || 'IX')}</div>
              </td>
              <td>${escapeHtml(r.jenis_cuti)}</td>
              <td class="text-center">${formatSlashDate(r.tanggal_mulai)} s.d. ${formatSlashDate(r.tanggal_selesai)}</td>
              <td class="text-center font-bold">${escapeHtml(String(r.lama_cuti))} Hari</td>
              <td>${escapeHtml(r.alasan_cuti)}</td>
              <td class="text-center font-semibold">${escapeHtml(r.sisa_cuti_tahunan || '-')}</td>
              <td class="text-center font-bold uppercase">${escapeHtml(r.status_pengajuan || 'Menunggu')}</td>
            </tr>
          `).join('');

      const html = `
        <div class="print-sheet text-[11.5px]">
          <!-- KOP LAPORAN DINAS KESEHATAN -->
          <div class="text-center border-b-2 border-black pb-3 mb-4">
            <div class="text-[13px] font-bold uppercase">PEMERINTAH KOTA TANGERANG SELATAN</div>
            <div class="text-[16px] font-extrabold uppercase tracking-wide">DINAS KESEHATAN</div>
            <div class="text-[11px] font-normal mt-0.5">Laporan Rekapitulasi Permohonan dan Pemberian Cuti Pegawai</div>
          </div>

          <div class="text-center mb-4">
            <div class="font-bold text-[12.5px] uppercase underline">LAPORAN REKAPITULASI CUTI PEGAWAI</div>
            <div class="font-bold text-[11.5px] uppercase mt-0.5">PERIODE: ${escapeHtml(labelPeriode)}</div>
          </div>

          <!-- RINGKASAN PERIODE -->
          <table class="print-table mb-3">
            <tr class="font-bold text-center bg-slate-50">
              <td>Total Permohonan</td>
              <td>Cuti Tahunan</td>
              <td>Cuti Sakit</td>
              <td>Cuti Melahirkan</td>
              <td>Cuti Ibadah Haji</td>
              <td>Total Hari Kerja Cuti</td>
            </tr>
            <tr class="text-center font-bold">
              <td>${rows.length} Pegawai</td>
              <td>${countTahunan}</td>
              <td>${countSakit}</td>
              <td>${countMelahirkan}</td>
              <td>${countHaji}</td>
              <td>${totalHari} Hari Kerja</td>
            </tr>
          </table>

          <!-- TABEL UTAMA REKAPITULASI -->
          <table class="print-table mb-6">
            <thead>
              <tr class="font-bold text-center bg-slate-50">
                <th style="width: 4%;">No</th>
                <th style="width: 20%;">Nama / NI PPPK</th>
                <th style="width: 16%;">Jabatan / Gol</th>
                <th style="width: 13%;">Jenis Cuti</th>
                <th style="width: 14%;">Tanggal Pelaksanaan</th>
                <th style="width: 7%;">Lama</th>
                <th style="width: 12%;">Alasan Cuti</th>
                <th style="width: 6%;">Sisa (N)</th>
                <th style="width: 8%;">Ket / Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <!-- TANDA TANGAN PENGESAHAN LAPORAN -->
          <div class="flex justify-end mt-6 pr-6">
            <div class="text-center w-72 text-[12px]">
              <div>Tangerang Selatan, ${formatLongIndoDate(new Date().toISOString().slice(0, 10))}</div>
              <div class="font-semibold mt-0.5">Kepala Dinas Kesehatan</div>
              <div>Kota Tangerang Selatan,</div>
              <div style="height: 60px;"></div>
              <div class="font-bold underline">${escapeHtml(pejabatDefault.kadinkesNama)}</div>
              <div>NIP. ${escapeHtml(pejabatDefault.kadinkesNip)}</div>
            </div>
          </div>
        </div>
      `;

      previewBox.innerHTML = html;
    }

    function cetakLaporanRekap() {
      renderLaporanRekap();
      document.getElementById('printArea').innerHTML = document.getElementById('laporanPreviewBox').innerHTML;
      window.print();
    }

    function exportLaporanCSV() {
      const { rows, labelPeriode } = getFilteredLaporanData();
      if (rows.length === 0) {
        showToast('Tidak ada data pada periode yang dipilih', true);
        return;
      }
      const headers = ['No','ID Pengajuan','Tanggal Surat','NI PPPK / NIP','Nama Pegawai','Jabatan','Golongan','Masa Kerja','Jenis Cuti','Tanggal Mulai','Tanggal Selesai','Lama Cuti (Hari)','Alasan Cuti','Sisa Cuti Tahunan','Status'];
      const csvRows = [
        headers.join(','),
        ...rows.map((r, i) => [
          i + 1, r.id_pengajuan, r.tanggal_surat, r.nip, r.nama, r.jabatan, r.pangkat_gol, r.masa_kerja,
          r.jenis_cuti, r.tanggal_mulai, r.tanggal_selesai, r.lama_cuti, r.alasan_cuti, r.sisa_cuti_tahunan, r.status_pengajuan
        ].map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan-Rekap-Cuti-${labelPeriode.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
      a.click();
    }

    function hitungLamaCuti() {
      const startStr = document.getElementById('f_tanggal_mulai').value;
      const endStr = document.getElementById('f_tanggal_selesai').value;
      if (!startStr || !endStr) return;

      const start = new Date(startStr);
      const end = new Date(endStr);
      if (end < start) {
        showToast('Tanggal selesai tidak boleh lebih awal dari tanggal mulai', true);
        document.getElementById('f_lama_cuti').value = 1;
        return;
      }

      let count = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
      }
      document.getElementById('f_lama_cuti').value = count || 1;
    }

    function openFormModal() {
      document.getElementById('cutiForm').reset();
      const qInp = document.getElementById('quickSearchPegawaiInput');
      if (qInp) qInp.value = '';
      closeAllSuggestBoxes();
      document.getElementById('f_id_pengajuan').value = '';
      document.getElementById('f_tanggal_surat').value = new Date().toISOString().slice(0, 10);
      document.getElementById('f_pangkat_gol').value = 'IX';
      document.getElementById('f_masa_kerja').value = '01 Tahun 03 Bulan';
      document.getElementById('f_unit_kerja').value = 'Dinas Kesehatan';
      document.getElementById('f_sisa_cuti_tahunan').value = 'N=11';
      document.getElementById('f_jenis_pejabat').value = 'kadinkes';
      onChangeJenisPejabat();
      document.getElementById('f_status_pengajuan').value = 'Menunggu';
      document.getElementById('formModalTitle').textContent = 'Buat Permohonan Cuti Pegawai';
      document.getElementById('formModal').classList.remove('hidden');
    }

    function openEditModal(id) {
      const item = state.cutiList.find(c => c.id_pengajuan === id);
      if (!item) return;

      closeAllSuggestBoxes();
      const qInp = document.getElementById('quickSearchPegawaiInput');
      if (qInp) qInp.value = `${item.nama} (${item.nip})`;
      document.getElementById('f_id_pengajuan').value = item.id_pengajuan;
      document.getElementById('f_tanggal_surat').value = item.tanggal_surat || '';
      document.getElementById('f_nip').value = item.nip || '';
      document.getElementById('f_nama').value = item.nama || '';
      document.getElementById('f_jabatan').value = item.jabatan || '';
      document.getElementById('f_pangkat_gol').value = item.pangkat_gol || 'IX';
      document.getElementById('f_masa_kerja').value = item.masa_kerja || '01 Tahun 03 Bulan';
      document.getElementById('f_unit_kerja').value = item.unit_kerja || 'Dinas Kesehatan';
      document.getElementById('f_sisa_cuti_tahunan').value = item.sisa_cuti_tahunan || 'N=11';
      document.getElementById('f_jenis_cuti').value = item.jenis_cuti || 'Cuti Tahunan';
      document.getElementById('f_tanggal_mulai').value = item.tanggal_mulai || '';
      document.getElementById('f_tanggal_selesai').value = item.tanggal_selesai || '';
      document.getElementById('f_lama_cuti').value = item.lama_cuti || 1;
      document.getElementById('f_alasan_cuti').value = item.alasan_cuti || '';
      document.getElementById('f_alamat_cuti').value = item.alamat_cuti || '';
      document.getElementById('f_telp').value = item.telp || '';
      document.getElementById('f_jenis_pejabat').value = item.jenis_pejabat || 'kadinkes';
      document.getElementById('f_atasan_nama').value = item.atasan_nama || pejabatDefault.atasanNama;
      document.getElementById('f_atasan_nip').value = item.atasan_nip || pejabatDefault.atasanNip;
      document.getElementById('f_pejabat_nama').value = item.pejabat_nama || pejabatDefault.kadinkesNama;
      document.getElementById('f_pejabat_nip').value = item.pejabat_nip ?? pejabatDefault.kadinkesNip;
      document.getElementById('f_status_pengajuan').value = item.status_pengajuan || 'Menunggu';
      document.getElementById('f_catatan_atasan').value = item.catatan_atasan || '';

      document.getElementById('formModalTitle').textContent = `Edit Permohonan Cuti (${item.nama})`;
      document.getElementById('formModal').classList.remove('hidden');
    }

    function closeFormModal() {
      document.getElementById('formModal').classList.add('hidden');
    }

    async function submitCutiForm(e) {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitForm');
      const id = document.getElementById('f_id_pengajuan').value;

      const payload = {
        action: id ? 'update' : 'create',
        id_pengajuan: id || undefined,
        tanggal_surat: document.getElementById('f_tanggal_surat').value,
        nip: document.getElementById('f_nip').value.trim(),
        nama: document.getElementById('f_nama').value.trim(),
        jabatan: document.getElementById('f_jabatan').value.trim(),
        pangkat_gol: document.getElementById('f_pangkat_gol').value.trim(),
        masa_kerja: document.getElementById('f_masa_kerja').value.trim(),
        unit_kerja: document.getElementById('f_unit_kerja').value.trim(),
        sisa_cuti_tahunan: document.getElementById('f_sisa_cuti_tahunan').value.trim(),
        jenis_cuti: document.getElementById('f_jenis_cuti').value,
        tanggal_mulai: document.getElementById('f_tanggal_mulai').value,
        tanggal_selesai: document.getElementById('f_tanggal_selesai').value,
        lama_cuti: Number(document.getElementById('f_lama_cuti').value),
        alasan_cuti: document.getElementById('f_alasan_cuti').value.trim(),
        alamat_cuti: document.getElementById('f_alamat_cuti').value.trim(),
        telp: document.getElementById('f_telp').value.trim(),
        jenis_pejabat: document.getElementById('f_jenis_pejabat').value,
        atasan_nama: document.getElementById('f_atasan_nama').value.trim(),
        atasan_nip: document.getElementById('f_atasan_nip').value.trim(),
        pejabat_nama: document.getElementById('f_pejabat_nama').value.trim(),
        pejabat_nip: document.getElementById('f_pejabat_nip').value.trim(),
        status_pengajuan: document.getElementById('f_status_pengajuan').value,
        catatan_atasan: document.getElementById('f_catatan_atasan').value.trim()
      };

      btn.disabled = true;
      btn.innerHTML = `<span>Menyimpan...</span>`;

      try {
        const res = await apiPost(payload);
        if (res.status === 200) {
          showToast(res.message || 'Data berhasil disimpan');
          if (res.id) state.selectedPrintId = res.id;
          closeFormModal();
          await refreshAllData();
        } else {
          showToast(res.error || 'Terjadi kesalahan saat menyimpan', true);
        }
      } catch (err) {
        showToast('Gagal menghubungi server: ' + err.message, true);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" class="w-3.5 h-3.5"></i><span>Simpan Permohonan</span>`;
        lucide.createIcons();
      }
    }

    async function hapusCuti(id) {
      if (!confirm(`Hapus data permohonan cuti ${id}?`)) return;
      try {
        const res = await apiPost({ action: 'delete', id_pengajuan: id });
        if (res.status === 200) {
          showToast('Permohonan cuti dihapus');
          await refreshAllData();
        } else {
          showToast(res.error || 'Gagal menghapus data', true);
        }
      } catch (err) {
        showToast('Gagal menghapus: ' + err.message, true);
      }
    }

    function openConfigModal() {
      document.getElementById('inputApiUrl').value = state.apiUrl;
      document.getElementById('cfgKadinkesNama').value = pejabatDefault.kadinkesNama;
      document.getElementById('cfgKadinkesNip').value = pejabatDefault.kadinkesNip;
      document.getElementById('cfgAtasanNama').value = pejabatDefault.atasanNama;
      document.getElementById('cfgAtasanNip').value = pejabatDefault.atasanNip;
      document.getElementById('cfgPetugasNama').value = petugasAuth.nama || 'Admin Kepegawaian';
      document.getElementById('cfgPetugasUser').value = petugasAuth.username || 'admin';
      document.getElementById('cfgPetugasPass').value = petugasAuth.password || 'dinkes123';
      document.getElementById('configModal').classList.remove('hidden');
    }

    function closeConfigModal() {
      document.getElementById('configModal').classList.add('hidden');
    }

    function saveConfig() {
      const val = document.getElementById('inputApiUrl').value.trim();
      state.apiUrl = val;
      localStorage.setItem('GAS_CUTI_API_URL', val);

      pejabatDefault.kadinkesNama = document.getElementById('cfgKadinkesNama').value.trim() || 'dr. Allin Hendalin Mahdaniar, M.K.M.';
      pejabatDefault.kadinkesNip = document.getElementById('cfgKadinkesNip').value.trim() || '197610152007012007';
      pejabatDefault.atasanNama = document.getElementById('cfgAtasanNama').value.trim() || 'Ikhsan Permana, SKM';
      pejabatDefault.atasanNip = document.getElementById('cfgAtasanNip').value.trim() || '197801081998031002';
      localStorage.setItem('DINKES_PEJABAT_CFG', JSON.stringify(pejabatDefault));

      petugasAuth.nama = document.getElementById('cfgPetugasNama').value.trim() || 'Admin Kepegawaian';
      petugasAuth.username = document.getElementById('cfgPetugasUser').value.trim() || 'admin';
      petugasAuth.password = document.getElementById('cfgPetugasPass').value || 'dinkes123';
      localStorage.setItem('DINKES_PETUGAS_AUTH', JSON.stringify(petugasAuth));

      document.getElementById('sidebarPejabatNama').textContent = pejabatDefault.kadinkesNama;
      document.getElementById('sidebarPetugasNama').textContent = petugasAuth.nama;
      updateApiBadge();
      closeConfigModal();
      showToast('Pengaturan berhasil disimpan');
      refreshAllData();
    }

    function resetDemoData() {
      localStorage.removeItem('DEMO_DINKES_CUTI');
      localStorage.removeItem('CACHE_CUTI_LIST');
      document.getElementById('inputApiUrl').value = '';
      saveConfig();
    }

    function exportCSV() {
      if (state.cutiList.length === 0) {
        showToast('Tidak ada data untuk diunduh', true);
        return;
      }
      const headers = ['id_pengajuan','tanggal_surat','nip','nama','jabatan','pangkat_gol','masa_kerja','unit_kerja','jenis_cuti','tanggal_mulai','tanggal_selesai','lama_cuti','alasan_cuti','alamat_cuti','telp','sisa_cuti_tahunan','status_pengajuan'];
      const csvRows = [
        headers.join(','),
        ...state.cutiList.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap-cuti-dinkes-tangsel-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    }

    function formatLongIndoDate(dateStr) {
      if (!dateStr) return '..........';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function formatSlashDate(dateStr) {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    function escapeHtml(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escapeAttr(str) {
      return String(str ?? '').replace(/'/g, "\\'");
    }
