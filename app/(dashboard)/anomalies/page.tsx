'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { AnomalyTable } from '@/components/anomalies/anomaly-table';
import { AnomalyDetailDrawer } from '@/components/anomalies/anomaly-detail-drawer';
import { Anomaly, AnomalyStatus } from '@/types/database';

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchAnomalies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('pageSize', '100');

      const res = await fetch(`/api/anomalies?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAnomalies(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, severityFilter, statusFilter]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const handleUpdateStatus = async (id: string, newStatus: AnomalyStatus, notes: string) => {
    try {
      const res = await fetch('/api/anomalies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomaly_id: id,
          status: newStatus,
          reviewer_notes: notes
        })
      });

      if (res.ok) {
        await fetchAnomalies();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Anomaly Resolution Desk"
        subtitle="Field Supervisor Review Desk for Hard Violations, Soft Quality Flags & ML Outliers"
        onRefresh={fetchAnomalies}
        isRefreshing={isLoading}
      />

      <div className="p-6 space-y-6 flex-1">
        <AnomalyTable
          anomalies={anomalies}
          total={total}
          selectedId={selectedAnomaly?.id || null}
          onSelectAnomaly={(anom) => setSelectedAnomaly(anom)}
          searchQuery={searchQuery}
          onSearchChange={(val) => setSearchQuery(val)}
          severityFilter={severityFilter}
          onSeverityChange={(val) => setSeverityFilter(val)}
          statusFilter={statusFilter}
          onStatusChange={(val) => setStatusFilter(val)}
          onUpdateStatus={(id, stat) => handleUpdateStatus(id, stat, '')}
        />
      </div>

      <AnomalyDetailDrawer
        anomaly={selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
