import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Tag,
  ExternalLink
} from 'lucide-react';
import { Lead } from '../types.js';

export const LeadsManager: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (id: string, status: Lead['status']) => {
    try {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) return;
    const headers = ['ID', 'Card Owner', 'Lead Name', 'Email', 'Phone', 'Service Interest', 'Message', 'Status', 'Date'];
    const rows = leads.map((l) => [
      l.id,
      l.cardOwnerName,
      `"${l.name}"`,
      l.email,
      l.phone || '',
      `"${l.serviceInterest || ''}"`,
      `"${l.message.replace(/"/g, '""')}"`,
      l.status,
      l.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cardflow_crm_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.cardOwnerName.toLowerCase().includes(search.toLowerCase()) ||
      l.message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">CRM Lead Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Inquiries captured from public digital business cards (/card/slug).
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-2 text-xs transition-all"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, or card..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {['all', 'new', 'contacted', 'qualified', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Prospect</th>
                <th className="p-4">Assigned Card</th>
                <th className="p-4">Service Interest & Message</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading CRM leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No leads found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-bold text-white text-sm">{lead.name}</p>
                        <p className="text-slate-400 text-[11px] flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-blue-400" />
                          <span>{lead.email}</span>
                        </p>
                        {lead.phone && (
                          <p className="text-slate-400 text-[11px] flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{lead.phone}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-bold text-blue-400">{lead.cardOwnerName}</p>
                        <span className="text-[10px] text-slate-500 font-mono">/card/{lead.cardSlug}</span>
                      </div>
                    </td>

                    <td className="p-4 max-w-xs">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] font-bold">
                          {lead.serviceInterest || 'General Inquiry'}
                        </span>
                        <p className="text-slate-300 text-xs line-clamp-2">{lead.message}</p>
                        <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none bg-slate-950 ${
                          lead.status === 'new'
                            ? 'text-amber-400 border-amber-500/30'
                            : lead.status === 'contacted'
                            ? 'text-blue-400 border-blue-500/30'
                            : lead.status === 'qualified'
                            ? 'text-emerald-400 border-emerald-500/30'
                            : 'text-slate-500 border-slate-700'
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>

                    <td className="p-4 text-right">
                      <a
                        href={`mailto:${lead.email}?subject=Re: Inquiry from ${lead.cardOwnerName}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center space-x-1"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </a>
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
