import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  QrCode,
  Users,
  Smartphone,
  Globe,
  Award,
  PieChart
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics/overview');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading analytics engine...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Platform Performance & Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time metrics for digital visiting cards, QR scan trends, and lead conversion rates.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Profile Views</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">{data?.totalViews || 0}</p>
          <p className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>+24% this week</span>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>QR Code Scans</span>
            <QrCode className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white">{data?.totalScans || 0}</p>
          <p className="text-[11px] text-indigo-400 font-bold">Physical Card Interactions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Leads Captured</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">{data?.totalLeads || 0}</p>
          <p className="text-[11px] text-amber-400 font-bold">Inquiries Received</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Conversion Rate</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{data?.conversionRate || '0%'}</p>
          <p className="text-[11px] text-slate-400">Views to Lead Submissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Cards Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Top Performing Digital Profiles</span>
          </h2>
          <div className="space-y-3">
            {data?.topCards?.map((card: any, index: number) => (
              <div key={card.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-[11px]">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-white">{card.name}</p>
                    <p className="text-slate-400 text-[10px]">{card.company} • /card/{card.slug}</p>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-bold text-emerald-400">{card.viewsCount} views</p>
                  <p className="text-[10px] text-slate-500">{card.qrScansCount} scans</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Category Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <span>Industry Category Breakdown</span>
          </h2>

          <div className="space-y-3">
            {Object.entries(data?.categoryDistribution || {}).map(([cat, count]: any) => {
              const percentage = Math.round((count / (data?.totalCards || 1)) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{cat}</span>
                    <span className="font-mono text-slate-400">{count} profiles ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
