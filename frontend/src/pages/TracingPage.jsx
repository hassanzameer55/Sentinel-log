import React, { useState } from 'react';
import { Search, Activity, ArrowRight, Clock, Hash } from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';

const TracingPage = () => {
  const [requestId, setRequestId] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!requestId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/logs/trace/${requestId}`);
      setTraceData(data);
    } catch (err) {
      setError('No trace found for this ID');
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-[#020617] min-h-screen text-slate-300">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          <header className="mb-12">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-500" />
              Distributed Tracing
            </h1>
            <p className="text-slate-500 mt-1">Reconstruct request lifecycles across your microservices.</p>
          </header>

          {/* Search Bar */}
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl mb-8">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Hash className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  placeholder="Enter Request ID (UUID v4)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 px-8 rounded-2xl text-white font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
              >
                {loading ? 'Searching...' : <><Search className="w-5 h-5" /> Trace</>}
              </button>
            </form>
            {error && <p className="text-red-400 text-sm mt-4 ml-2">{error}</p>}
          </div>

          {/* Trace Results */}
          {traceData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Duration</p>
                  <p className="text-2xl font-bold text-white">{traceData.metadata.duration_ms}ms</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Service Hops</p>
                  <p className="text-2xl font-bold text-white">{traceData.metadata.hop_count}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-2xl font-bold text-emerald-500">COMPLETED</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative mt-12 pb-12">
                <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-slate-800" />
                
                {traceData.data.map((log, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={log._id} 
                    className="relative pl-16 mb-12 last:mb-0"
                  >
                    {/* Timeline Node */}
                    <div className={`absolute left-0 top-1 w-14 h-14 rounded-full border-4 border-[#020617] flex items-center justify-center z-10 ${
                      log.level === 'ERROR' ? 'bg-red-500 text-white' : 'bg-slate-800 text-blue-400'
                    }`}>
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl group hover:border-slate-700 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white uppercase">{log.service_id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${
                            log.level === 'ERROR' ? 'bg-red-400/10 text-red-400 border-red-400/20' : 'bg-blue-400/10 text-blue-400 border-blue-400/20'
                          }`}>
                            {log.level}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toISOString()}
                        </span>
                      </div>
                      <p className="text-slate-400 font-mono text-sm">{log.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {!traceData && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600">
              <ArrowRight className="w-8 h-8 mb-4 opacity-20" />
              <p>Enter a Request ID to begin tracing.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TracingPage;
