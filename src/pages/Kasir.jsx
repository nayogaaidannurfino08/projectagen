import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ProductGrid from "../components/Kasir/ProductGrid";
import CartPanel from "../components/Kasir/CartPanel";
import PaymentModal from "../components/Kasir/PaymentModal";
import ReceiptModal from "../components/Kasir/ReceiptModal";
import { subscribeProduk, seedInitialProduk } from "../services/produkService";
import { subscribePelanggan } from "../services/pelangganService";
import { executeCheckout } from "../services/transaksiService";
import { ShoppingCart, RotateCcw, AlertCircle } from "lucide-react";

export default function Kasir() {
  const { agenId, nama, currentUser } = useAuth();

  const [products, setProducts] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [errorToast, setErrorToast] = useState("");

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  // Mobile cart drawer toggle (for mobile portrait)
  const [showMobileCartDrawer, setShowMobileCartDrawer] = useState(false);

  // 1. Auto-rotate to landscape on mount, revert to portrait on unmount
  useEffect(() => {
    try {
      if (window.screen?.orientation?.lock) {
        window.screen.orientation.lock("landscape").catch(() => {
          // User gesture / permissions policy may reject, fallback gracefully
        });
      }
    } catch (e) {
      // Ignored
    }

    return () => {
      try {
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        }
      } catch (e) {
        // Ignored
      }
    };
  }, []);

  // 2. Subscribe to real-time products
  useEffect(() => {
    const unsub = subscribeProduk(agenId, (data) => {
      setProducts(data);
    });
    return () => unsub?.();
  }, [agenId]);

  // 3. Subscribe to real-time customers
  useEffect(() => {
    const unsub = subscribePelanggan(agenId, (data) => {
      setPelangganList(data);
    });
    return () => unsub?.();
  }, [agenId]);

  // Show auto-dismiss soft warning toast
  const triggerToast = (msg) => {
    setErrorToast(msg);
    setTimeout(() => {
      setErrorToast("");
    }, 3000);
  };

  // Add product to cart with stock validation
  const handleAddToCart = (product) => {
    const availableStock = product.stok || 0;
    if (availableStock <= 0) {
      triggerToast(`Stok "${product.nama}" sudah habis.`);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.produkId === product.id);
      if (existing) {
        if (existing.qty >= availableStock) {
          triggerToast(`Maksimal stok tercapai untuk "${product.nama}" (${availableStock} ${product.satuan || "pcs"}).`);
          return prev;
        }
        return prev.map((item) =>
          item.produkId === product.id
            ? {
                ...item,
                qty: item.qty + 1,
                subtotal: (item.qty + 1) * item.hargaSatuan
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            produkId: product.id,
            nama: product.nama,
            hargaSatuan: product.hargaJual,
            hargaModal: product.hargaModal || 0,
            satuan: product.satuan || "pcs",
            stokTersedia: availableStock,
            qty: 1,
            subtotal: product.hargaJual
          }
        ];
      }
    });
  };

  // Update quantity in cart
  const handleUpdateQty = (produkId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(produkId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.produkId === produkId) {
          if (newQty > item.stokTersedia) {
            triggerToast(`Maksimal stok tercapai (${item.stokTersedia} ${item.satuan || "pcs"}).`);
            return item;
          }
          return {
            ...item,
            qty: newQty,
            subtotal: newQty * item.hargaSatuan
          };
        }
        return item;
      })
    );
  };

  // Remove single item from cart
  const handleRemoveItem = (produkId) => {
    setCartItems((prev) => prev.filter((i) => i.produkId !== produkId));
  };

  // Clear entire cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Seed demo staple goods if product list is empty
  const handleSeedDemoProducts = async () => {
    setIsSeeding(true);
    try {
      await seedInitialProduk(agenId);
      triggerToast("10 produk sembako berhasil diinisialisasi!");
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menginisialisasi produk: " + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Execute checkout transaction
  const handleConfirmPayment = async (paymentData) => {
    setIsProcessingCheckout(true);
    try {
      const totalBelanja = cartItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

      const txResult = await executeCheckout({
        items: cartItems,
        totalBelanja,
        metodeBayar: paymentData.metodeBayar,
        uangDiterima: paymentData.uangDiterima,
        kembalian: paymentData.kembalian,
        pelangganId: paymentData.pelangganId,
        pelangganNama: paymentData.pelangganNama,
        kasirId: nama || currentUser?.email || "Kasir Toko",
        agenId: agenId
      });

      // Save transaction result for receipt modal
      setLastTransaction(txResult);
      setIsPaymentOpen(false);
      setShowMobileCartDrawer(false);
      setIsReceiptOpen(true);
      setCartItems([]); // Reset cart
    } catch (err) {
      console.error("Checkout transaction error:", err);
      triggerToast("Transaksi gagal: " + (err.message || "Terjadi kesalahan sistem"));
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const totalBelanjaCart = cartItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
  const totalQtyCart = cartItems.reduce((acc, curr) => acc + (curr.qty || 0), 0);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] flex flex-col relative">
      {/* Toast Notification */}
      {errorToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-xl text-xs shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Main Responsive 2-Panel Layout (Left: Grid, Right: Cart in Landscape & Desktop) */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 h-full overflow-hidden">
        {/* LEFT PANEL: Products Grid (65% on large screens) */}
        <div className="flex-1 md:w-3/5 lg:w-2/3 h-full overflow-hidden flex flex-col">
          <ProductGrid
            products={products}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onSeedDemo={handleSeedDemoProducts}
            isSeeding={isSeeding}
          />
        </div>

        {/* RIGHT PANEL: Cart Summary (35% on large screens / visible in landscape) */}
        <div className="hidden md:flex flex-col md:w-2/5 lg:w-1/3 h-full">
          <CartPanel
            cartItems={cartItems}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOpenPayment={() => setIsPaymentOpen(true)}
          />
        </div>
      </div>

      {/* MOBILE PORTRAIT FLOATING CHECKOUT BAR */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl z-30">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowMobileCartDrawer(true)}
            className="flex-1 flex items-center justify-between px-3 py-2 bg-slate-100 rounded-xl text-xs"
          >
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">{totalQtyCart} item</span>
            </div>
            <span className="font-extrabold text-slate-900">{formatRupiah(totalBelanjaCart)}</span>
          </button>

          <button
            onClick={() => setIsPaymentOpen(true)}
            disabled={cartItems.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            Bayar
          </button>
        </div>
      </div>

      {/* MOBILE CART SLIDE-UP DRAWER */}
      {showMobileCartDrawer && (
        <div className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 bg-slate-100 flex items-center justify-between border-b border-slate-200">
              <span className="font-bold text-slate-800 text-sm">Daftar Belanjaan</span>
              <button
                onClick={() => setShowMobileCartDrawer(false)}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 font-semibold"
              >
                Tutup
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartPanel
                cartItems={cartItems}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onOpenPayment={() => {
                  setShowMobileCartDrawer(false);
                  setIsPaymentOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalBelanja={totalBelanjaCart}
        pelangganList={pelangganList}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessingCheckout}
      />

      {/* RECEIPT MODAL */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaksiData={lastTransaction}
        onNewTransaction={() => {
          setIsReceiptOpen(false);
          setLastTransaction(null);
        }}
      />
    </div>
  );
}
