import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../data/products';
import {
  ProductVariantRow,
  deleteProductAdmin,
  fetchVariantsAdmin,
  formatRupiah,
  updateProductPriceStockAdmin,
  updateVariantStockAdmin,
} from '../../services/supabaseService';

export const AdminProductsPage: React.FC = () => {
  const { products, loadCatalog, showToast } = useStore();
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [productPriceEdits, setProductPriceEdits] = useState<
    Record<string, { price: number; inStock: boolean }>
  >({});
  const [variantStockEdits, setVariantStockEdits] = useState<Record<string, number>>({});

  const loadData = useCallback(async () => {
    setLoadingVariants(true);
    const varData = await fetchVariantsAdmin();
    setVariants(varData);

    const vEdits: Record<string, number> = {};
    varData.forEach((v) => {
      vEdits[v.id] = v.stock_qty;
    });
    setVariantStockEdits(vEdits);

    const pEdits: Record<string, { price: number; inStock: boolean }> = {};
    products.forEach((p) => {
      pEdits[p.id] = { price: p.price, inStock: p.inStock };
    });
    setProductPriceEdits(pEdits);
    setLoadingVariants(false);
  }, [products]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSavePriceStock = async (productId: string) => {
    const edit = productPriceEdits[productId];
    if (!edit) return;
    const res = await updateProductPriceStockAdmin(productId, {
      price: Number(edit.price) || 0,
      in_stock: edit.inStock,
    });
    if (res.error) {
      showToast(`Gagal update produk: ${res.error}`);
      return;
    }
    await loadCatalog();
    showToast('Harga & status produk berhasil disimpan ke Supabase!');
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Hapus produk "${product.name}" (${product.sku}) dari database?`)) return;
    const res = await deleteProductAdmin(product.id);
    if (res.error) {
      showToast(`Gagal menghapus produk: ${res.error}`);
      return;
    }
    await loadCatalog();
    await loadData();
    showToast(`Produk "${product.name}" telah dihapus.`);
  };

  const handleSaveVariantStock = async (variantId: string) => {
    const qty = Math.max(0, Number(variantStockEdits[variantId] ?? 0));
    const res = await updateVariantStockAdmin(variantId, qty);
    if (res.error) {
      showToast(`Gagal update stok varian: ${res.error}`);
      return;
    }
    showToast('Stok varian berhasil diperbarui!');
    await loadData();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-5">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            CATALOG &amp; STOCK CONTROL
          </span>
          <h1 className="font-headline-sm text-2xl text-primary">
            Produk &amp; Inventory ({products.length})
          </h1>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:bg-neutral-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Tambah Produk Baru
        </Link>
      </div>

      {/* Product Table */}
      <section className="bg-surface-card border border-border-ecru overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
              <th className="p-3">SKU</th>
              <th className="p-3">Produk</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Harga (IDR)</th>
              <th className="p-3">Ready Stock</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-ecru">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted">
                  Belum ada produk di database. Klik <strong>+ Tambah Produk Baru</strong> untuk memulai.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const edit = productPriceEdits[p.id] || { price: p.price, inStock: p.inStock };
                return (
                  <tr key={p.id}>
                    <td className="p-3 font-mono text-text-muted">{p.sku}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-12 object-cover bg-surface-muted shrink-0"
                        />
                        <div>
                          <p className="font-medium text-primary">{p.name}</p>
                          <p className="text-[11px] text-text-muted">{formatRupiah(p.price)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 uppercase text-text-muted">{p.category}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={edit.price}
                        onChange={(e) =>
                          setProductPriceEdits((prev) => ({
                            ...prev,
                            [p.id]: { ...edit, price: Number(e.target.value) },
                          }))
                        }
                        className="w-28 h-8 px-2 bg-surface border border-border-ecru text-primary"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={edit.inStock}
                        onChange={(e) =>
                          setProductPriceEdits((prev) => ({
                            ...prev,
                            [p.id]: { ...edit, inStock: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-primary"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSavePriceStock(p.id)}
                          className="px-2.5 py-1 bg-primary text-on-primary text-[10px] font-label-uppercase uppercase cursor-pointer"
                        >
                          Update
                        </button>
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="px-2.5 py-1 border border-border-ecru text-primary text-[10px] font-label-uppercase uppercase hover:bg-surface-muted"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDeleteProduct(p)}
                          className="px-2.5 py-1 border border-error/40 text-error text-[10px] font-label-uppercase uppercase hover:bg-error-container/50 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* Variant Stock Table */}
      <section className="space-y-3">
        <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
          Stok Per Varian (Warna &amp; Ukuran)
        </h2>
        <div className="bg-surface-card border border-border-ecru overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                <th className="p-3">Produk ID</th>
                <th className="p-3">Warna</th>
                <th className="p-3">Ukuran</th>
                <th className="p-3">Stok Qty</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ecru">
              {loadingVariants ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-text-muted">
                    Memuat varian stok...
                  </td>
                </tr>
              ) : variants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-text-muted">
                    Belum ada data varian.
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v.id}>
                    <td className="p-3 font-mono text-text-muted">{v.product_id}</td>
                    <td className="p-3 text-primary">{v.color_name}</td>
                    <td className="p-3 font-medium text-primary">{v.size}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        value={variantStockEdits[v.id] ?? v.stock_qty}
                        onChange={(e) =>
                          setVariantStockEdits((prev) => ({
                            ...prev,
                            [v.id]: Number(e.target.value),
                          }))
                        }
                        className="w-20 h-8 px-2 bg-surface border border-border-ecru text-primary"
                      />
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => void handleSaveVariantStock(v.id)}
                        className="px-3 py-1 bg-primary text-on-primary text-[10px] font-label-uppercase uppercase cursor-pointer"
                      >
                        Simpan Stok
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
