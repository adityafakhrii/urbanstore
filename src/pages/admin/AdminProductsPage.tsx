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
import { Button, ConfirmDialog, CurrencyInputField, getButtonClassName } from '../../components/ui';

export const AdminProductsPage: React.FC = () => {
  const { products, loadCatalog, showToast } = useStore();
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [productPriceEdits, setProductPriceEdits] = useState<
    Record<string, { price: number; inStock: boolean }>
  >({});
  const [variantStockEdits, setVariantStockEdits] = useState<Record<string, number>>({});
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

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

  const handleConfirmDeleteProduct = async () => {
    if (!pendingDeleteProduct) return;
    setDeletingProduct(true);
    const res = await deleteProductAdmin(pendingDeleteProduct.id);
    setDeletingProduct(false);
    if (res.error) {
      showToast(`Gagal menghapus produk: ${res.error}`);
      return;
    }
    const deletedName = pendingDeleteProduct.name;
    setPendingDeleteProduct(null);
    await loadCatalog();
    await loadData();
    showToast(`Produk "${deletedName}" telah dihapus.`);
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            CATALOG &amp; STOCK CONTROL
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Produk &amp; Inventory ({products.length})
          </h1>
        </div>
        <Link
          to="/admin/products/new"
          className={getButtonClassName({ variant: 'primary', size: 'md' })}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Tambah Produk Baru
        </Link>
      </div>

      {/* Product Table */}
      <section className="bg-surface-card border border-border-ecru rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                <th className="p-4">SKU</th>
                <th className="p-4">Produk</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga (IDR)</th>
                <th className="p-4">Ready Stock</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ecru">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-text-muted">
                    Belum ada produk di database. Klik <strong>+ Tambah Produk Baru</strong> untuk memulai.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const edit = productPriceEdits[p.id] || { price: p.price, inStock: p.inStock };
                  return (
                    <tr key={p.id}>
                      <td className="p-4 font-mono text-text-muted">{p.sku}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-14 object-cover rounded-xl bg-surface-muted shrink-0"
                          />
                          <div>
                            <p className="font-medium text-primary">{p.name}</p>
                            <p className="text-[11px] text-text-muted">{formatRupiah(p.price)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 uppercase text-text-muted">{p.category}</td>
                      <td className="p-4">
                        <CurrencyInputField
                          size="sm"
                          containerClassName="w-40"
                          value={edit.price}
                          onValueChange={(nextPrice) =>
                            setProductPriceEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...edit, price: nextPrice },
                            }))
                          }
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={edit.inStock}
                          onChange={(e) =>
                            setProductPriceEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...edit, inStock: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 accent-primary rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => void handleSavePriceStock(p.id)}
                          >
                            Update
                          </Button>
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className={getButtonClassName({ variant: 'outline', size: 'sm' })}
                          >
                            Edit
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setPendingDeleteProduct(p)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Variant Stock Table */}
      <section className="space-y-3">
        <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
          Stok Per Varian (Warna &amp; Ukuran)
        </h2>
        <div className="bg-surface-card border border-border-ecru rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                  <th className="p-4">Produk ID</th>
                  <th className="p-4">Warna</th>
                  <th className="p-4">Ukuran</th>
                  <th className="p-4">Stok Qty</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ecru">
                {loadingVariants ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-muted">
                      Memuat varian stok...
                    </td>
                  </tr>
                ) : variants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-muted">
                      Belum ada data varian.
                    </td>
                  </tr>
                ) : (
                  variants.map((v) => (
                    <tr key={v.id}>
                      <td className="p-4 font-mono text-text-muted">{v.product_id}</td>
                      <td className="p-4 text-primary">{v.color_name}</td>
                      <td className="p-4 font-medium text-primary">{v.size}</td>
                      <td className="p-4">
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
                          className="w-24 h-9 px-3 rounded-xl bg-surface border border-border-ecru text-primary focus:outline-none focus:border-primary"
                        />
                      </td>
                      <td className="p-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => void handleSaveVariantStock(v.id)}
                        >
                          Simpan Stok
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteProduct)}
        title="Hapus Produk?"
        description={
          pendingDeleteProduct
            ? `Produk "${pendingDeleteProduct.name}" (${pendingDeleteProduct.sku}) akan dihapus permanen dari katalog & database.`
            : ''
        }
        confirmLabel="Ya, Hapus Produk"
        cancelLabel="Batal"
        loading={deletingProduct}
        onCancel={() => setPendingDeleteProduct(null)}
        onConfirm={() => void handleConfirmDeleteProduct()}
      />
    </div>
  );
};
