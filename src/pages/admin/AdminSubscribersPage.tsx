import React, { useCallback, useEffect, useState } from 'react';
import { SubscriberRow, fetchSubscribersAdmin } from '../../services/supabaseService';
import { Button, StatusBadge } from '../../components/ui';

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            VIP DROP LIST
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Newsletter Subscribers ({subscribers.length})
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadSubscribers()}>
          Refresh
        </Button>
      </div>

      <div className="bg-surface-card border border-border-ecru rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                <th className="p-4">Email Subscriber</th>
                <th className="p-4">Sumber</th>
                <th className="p-4">Tanggal Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ecru">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-text-muted">
                    Memuat data subscriber...
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-text-muted">
                    Belum ada subscriber terdaftar.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <tr key={sub.id}>
                    <td className="p-4 font-medium text-primary">{sub.email}</td>
                    <td className="p-4">
                      <StatusBadge label={sub.source || 'Footer'} />
                    </td>
                    <td className="p-4 text-text-muted">
                      {new Date(sub.subscribed_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
