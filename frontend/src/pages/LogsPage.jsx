import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Search, Filter, Download, Activity } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import Sidebar from '../components/Sidebar';

const LogRow = ({ log }) => {
  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': case 'CRITICAL': case 'EMERGENCY': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'WARNING': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'INFO': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'DEBUG': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  return (
    <motion.tr 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
    >
      <td className="py-3 pl-4 pr-2 text-xs font-mono text-slate-500 whitespace-nowrap">
        {new Date(log.timestamp).toLocaleTimeString()}
      </td>
      <td className="py-3 px-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getLevelColor(log.level)}`}>
          {log.level}
        </span>
      </td>
      <td className="py-3 px-2 text-sm font-medium text-slate-300 whitespace-nowrap">
        {log.service_id}
      </td>
      <td className="py-3 px-2 text-sm text-slate-400 break-all font-mono">
        {log.message}
      </td>
    </motion.tr>
  );
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const { socket, isConnected } = useSocket();
  const scrollRef = useRef(null);

  const handleExport = async () => {
    try {
      const { data } = await api.get('/logs/export?format=csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sentinel-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('new-log', (newLog) => {
      setLogs((prev) => [newLog, ...prev].slice(0, 100)); // Keep last 100
    });

    return () => socket.off('new-log');
  }, [socket]);

  return (
    <div className="flex bg-[#020617] min-h-screen text-slate-300">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#020617]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Live Log Stream</h2>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isConnected ? 'Live' : 'Disconnected'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search logs..."
                className="bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
              <Filter className="w-5 h-5" />
            </button>
            <button 
              onClick={handleExport}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Log Viewer Area */}
        <div className="flex-1 overflow-auto bg-[#020617] custom-scrollbar" ref={scrollRef}>
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#020617] shadow-sm z-10">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-800">
                <th className="py-3 pl-4 pr-2 w-24">Time</th>
                <th className="py-3 px-2 w-24">Level</th>
                <th className="py-3 px-2 w-32">Service</th>
                <th className="py-3 px-2">Message</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                  <LogRow key={log._id || i} log={log} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Waiting for incoming logs...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LogsPage;
