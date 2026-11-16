import React, { useCallback, useEffect, useState } from 'react';
import { SubscriberRow, fetchSubscribersAdmin } from '../../services/supabaseService';

export const AdminSubscribersPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    const data = await fetchSubscribersAdmin();
    setSubscribers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSubscribers();
  }, [loadSubscribers]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-border-ecru pb-5">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            VIP DROP LIST
          </span>
          <h1 className="font-headline-sm text-2xl text-primary">
            Newsletter Subscribers ({subscribers.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void loadSubscribers()}
          className="px-4 py-2 border border-border-ecru bg-surface-card text-primary font-label-uppercase text-[11px] uppercase tracking-wider cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <div className="bg-surface-card border border-border-ecru overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
              <th className="p-3">Email Subscriber</th>
              <th className="p-3">Sumber</th>
              <th className="p-3">Tanggal Bergabung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-ecru">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-text-muted">
                  Memuat data subscriber...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-text-muted">
                  Belum ada subscriber terdaftar.
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id}>
                  <td className="p-3 font-medium text-primary">{sub.email}</td>
                  <td className="p-3 uppercase text-secondary">{sub.source || '-'}</td>
                  <td className="p-3 text-text-muted">
                    {new Date(sub.subscribed_at).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
