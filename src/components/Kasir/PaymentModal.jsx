import React, { useState, useEffect } from "react";
import { 
  X, 
  QrCode, 
  Banknote, 
  BookOpen, 
  Check, 
  UserPlus, 
  Search, 
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { addPelanggan } from "../../services/pelangganService";

export default function PaymentModal({
  isOpen,
  onClose,
  totalBelanja = 0,
  pelangganList = [],
  onConfirmPayment,
  isProcessing = false
}) {
  const [metode, setMetode] = useState("cash"); // "cash" | "qris" | "bon"
  
  // State for Cash
  const [uangDiterima, setUangDiterima] = useState("");
  const [kembalian, setKembalian] = useState(0);

  // State for Bon
  const [selectedPelangganId, setSelectedPelangganId] = useState("");
  const [searchPelanggan, setSearchPelanggan] = useState("");
  const [showAddPelanggan, setShowAddPelanggan] = useState(false);
  const [newPelangganNama, setNewPelangganNama] = useState("");
  const [newPelangganHp, setNewPelangganHp] = useState("");
  const [newPelangganAlamat, setNewPelangganAlamat] = useState("");
  const [localPelangganList, setLocalPelangganList] = useState(pelangganList);

  useEffect(() => {
    setLocalPelangganList(pelangganList);
  }, [pelangganList]);

  // Recalculate change for cash
  useEffect(() => {
    const received = Number(uangDiterima) || 0;
    const change = received - totalBelanja;
    setKembalian(change >= 0 ? change : 0);
  }, [uangDiterima, totalBelanja]);

  if (!isOpen) return null;

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // Quick cash buttons
  const setQuickCash = (amount) => {
    if (amount === "pas") {
      setUangDiterima(totalBelanja.toString());
    } else {
      setUangDiterima(amount.toString());
    }
  };

  // Selected customer object
  const selectedPelanggan = localPelangganList.find((p) => p.id === selectedPelangganId);

  // Filtered customer list for bon
  const filteredPelanggan = localPelangganList.filter((p) => {
    const q = searchPelanggan.toLowerCase();
    return (p.nama || "").toLowerCase().includes(q) || (p.noHp || "").includes(q);
  });

  // Handle inline add customer
  const handleAddNewPelanggan = async (e) => {
    e.preventDefault();
    if (!newPelangganNama.trim()) return;
    try {
      const created = await addPelanggan({
        nama: newPelangganNama.trim(),
        noHp: newPelangganHp.trim() || null,
        alamat: newPelangganAlamat.trim() || null,
        totalHutang: 0
      });
      setLocalPelangganList([created, ...localPelangganList]);
      setSelectedPelangganId(created.id);
      setShowAddPelanggan(false);
      setNewPelangganNama("");
      setNewPelangganHp("");
      setNewPelangganAlamat("");
    } catch (err) {
      console.error(err);
    }
  };

  // Validation for "Selesai" button
  const isValidToSubmit = () => {
    if (metode === "qris") return true;
    if (metode === "cash") return Number(uangDiterima) >= totalBelanja;
    if (metode === "bon") return !!selectedPelangganId;
    return false;
  };

  const handleSubmit = () => {
    if (!isValidToSubmit() || isProcessing) return;

    onConfirmPayment({
      metodeBayar: metode,
      uangDiterima: metode === "cash" ? Number(uangDiterima) : null,
      kembalian: metode === "cash" ? kembalian : null,
      pelangganId: metode === "bon" ? selectedPelangganId : null,
      pelangganNama: metode === "bon" ? selectedPelanggan?.nama : null
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header Modal */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Pilih Metode Pembayaran</h3>
            <p className="text-xs text-slate-300">Total Transaksi: <span className="font-bold text-emerald-400">{formatRupiah(totalBelanja)}</span></p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 p-3 gap-2 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMetode("cash")}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition ${
              metode === "cash"
                ? "bg-white text-emerald-700 shadow-sm border border-emerald-500/30"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
            <span>Tunai (Cash)</span>
          </button>

          <button
            type="button"
            onClick={() => setMetode("qris")}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition ${
              metode === "qris"
                ? "bg-white text-blue-700 shadow-sm border border-blue-500/30"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <QrCode className="w-5 h-5 mb-1 text-blue-600" />
            <span>QRIS Statis</span>
          </button>

          <button
            type="button"
            onClick={() => setMetode("bon")}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition ${
              metode === "bon"
                ? "bg-white text-amber-700 shadow-sm border border-amber-500/30"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1 text-amber-600" />
            <span>Bon / Hutang</span>
          </button>
        </div>

        {/* Method Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: CASH */}
          {metode === "cash" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Uang Tunai Diterima (Rp)
                </label>
                <input
                  type="number"
                  autoFocus
                  placeholder="0"
                  value={uangDiterima}
                  onChange={(e) => setUangDiterima(e.target.value)}
                  className="w-full text-2xl font-bold p-3 border-2 border-slate-300 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                />
              </div>

              {/* Quick Nominal Shortcuts */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Tombol Cepat Nominal:
                </span>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setQuickCash("pas")}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-300 transition"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCash(20000)}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 transition"
                  >
                    20 rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCash(50000)}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 transition"
                  >
                    50 rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCash(100000)}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 transition"
                  >
                    100 rb
                  </button>
                </div>
              </div>

              {/* Kembalian Calculation Box */}
              <div className={`p-4 rounded-xl border transition ${
                Number(uangDiterima) >= totalBelanja
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {Number(uangDiterima) >= totalBelanja ? "Uang Kembalian:" : "Uang Masih Kurang:"}
                  </span>
                  <span className="text-2xl font-extrabold">
                    {Number(uangDiterima) >= totalBelanja
                      ? formatRupiah(kembalian)
                      : formatRupiah(totalBelanja - (Number(uangDiterima) || 0))}
                  </span>
                </div>
                {Number(uangDiterima) < totalBelanja && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    * Uang yang diterima belum mencukupi total belanja.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QRIS */}
          {metode === "qris" && (
            <div className="text-center space-y-4 py-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner">
                {/* Static QR Code representation */}
                <div className="w-48 h-48 mx-auto bg-white p-2 border border-slate-300 rounded-xl flex flex-col items-center justify-center relative">
                  <QrCode className="w-36 h-36 text-slate-800" />
                  <div className="absolute inset-x-0 bottom-2 text-center text-[10px] font-bold text-slate-600 bg-white/90 py-0.5">
                    QRIS APS AGEN SEMBAKO
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500">Total yang harus dibayar:</div>
                <div className="text-2xl font-black text-slate-900">{formatRupiah(totalBelanja)}</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1">
                  Minta pembeli scan kode QRIS menggunakan e-wallet (GoPay, OVO, DANA) atau aplikasi m-Banking.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: BON / HUTANG */}
          {metode === "bon" && (
            <div className="space-y-3">
              {!showAddPelanggan ? (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Pilih Nama Pelanggan:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddPelanggan(true)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Tambah Baru</span>
                    </button>
                  </div>

                  {/* Search Pelanggan */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchPelanggan}
                      onChange={(e) => setSearchPelanggan(e.target.value)}
                      placeholder="Cari pelanggan / nomor HP..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Pelanggan Selector List */}
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-1.5 divide-y divide-slate-100">
                    {filteredPelanggan.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Tidak ada pelanggan ditemukan. Silakan klik "+ Tambah Baru".
                      </div>
                    ) : (
                      filteredPelanggan.map((p) => {
                        const isSelected = selectedPelangganId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPelangganId(p.id)}
                            className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition text-xs ${
                              isSelected
                                ? "bg-amber-500 text-white font-semibold"
                                : "hover:bg-slate-100 text-slate-800"
                            }`}
                          >
                            <div>
                              <div className="font-bold">{p.nama}</div>
                              <div className={`text-[11px] ${isSelected ? "text-amber-100" : "text-slate-400"}`}>
                                {p.noHp || "Tanpa No HP"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-[10px] ${isSelected ? "text-amber-100" : "text-slate-400"}`}>Hutang saat ini:</div>
                              <div className="font-bold">{formatRupiah(p.totalHutang || 0)}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selected Customer Preview */}
                  {selectedPelanggan && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-950">
                      <div className="flex justify-between">
                        <span>Hutang Berjalan:</span>
                        <span className="font-semibold">{formatRupiah(selectedPelanggan.totalHutang || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tambahan Bon Ini:</span>
                        <span className="font-bold text-amber-700">+{formatRupiah(totalBelanja)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-amber-300 font-extrabold text-sm">
                        <span>Total Hutang Baru:</span>
                        <span className="text-amber-900">{formatRupiah((selectedPelanggan.totalHutang || 0) + totalBelanja)}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Inline Add Customer Form */
                <form onSubmit={handleAddNewPelanggan} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                    <span className="font-bold text-slate-800">Tambah Pelanggan Baru</span>
                    <button
                      type="button"
                      onClick={() => setShowAddPelanggan(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Batal
                    </button>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={newPelangganNama}
                      onChange={(e) => setNewPelangganNama(e.target.value)}
                      placeholder="Contoh: Ibu Rina Warung"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Nomor WhatsApp / HP</label>
                    <input
                      type="tel"
                      value={newPelangganHp}
                      onChange={(e) => setNewPelangganHp(e.target.value)}
                      placeholder="08123456789"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Alamat (Opsional)</label>
                    <input
                      type="text"
                      value={newPelangganAlamat}
                      onChange={(e) => setNewPelangganAlamat(e.target.value)}
                      placeholder="Jl. Mawar No. 5"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                  >
                    Simpan Pelanggan
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 text-sm font-semibold rounded-xl transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValidToSubmit() || isProcessing}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg transition flex items-center space-x-2"
          >
            <span>{isProcessing ? "Memproses..." : "Selesaikan Transaksi"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
