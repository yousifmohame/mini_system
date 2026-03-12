import React, { useState, useEffect } from 'react';
import {
  Wifi, WifiOff, Server, Activity,
  Database, ShieldCheck, Zap, Globe,
  CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../../api/axios';

const SystemFooter = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverStatus, setServerStatus] = useState('checking');
  const [latency, setLatency] = useState(null);
  const [dbStatus, setDbStatus] = useState('connected');

  /* Network status */
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  /* Server Health */
  useEffect(() => {
    const check = async () => {
      const start = Date.now();
      try {
        await api.get('/clients', { params: { limit: 1 }, timeout: 5000 });
        setLatency(Date.now() - start);
        setServerStatus('online');
        setDbStatus('connected');
      } catch (e) {
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          setLatency(Date.now() - start);
          setServerStatus('online');
        } else {
          setServerStatus('offline');
          setLatency(null);
          setDbStatus('disconnected');
        }
      }
    };
    check();
    const i = setInterval(check, 10000);
    return () => clearInterval(i);
  }, []);

  const latencyLevel =
    latency === null ? 'down' :
    latency < 150 ? 'good' :
    latency < 400 ? 'warn' : 'bad';

  const latencyConfig = {
    good: { color: 'bg-emerald-500', glow: 'shadow-emerald-500/50', text: 'text-emerald-400' },
    warn: { color: 'bg-amber-500', glow: 'shadow-amber-500/50', text: 'text-amber-400' },
    bad: { color: 'bg-red-500', glow: 'shadow-red-500/50', text: 'text-red-400' },
    down: { color: 'bg-slate-600', glow: 'shadow-slate-600/30', text: 'text-slate-500' }
  }[latencyLevel];

  return (
    <footer 
      className="fixed bottom-0 z-40 w-full h-9 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 backdrop-blur-md text-[11px] text-slate-300 flex items-center justify-between px-4 font-mono shadow-2xl shadow-black/20"
      dir="rtl"
    >
      {/* ✨ Right Section - Brand & Security */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-blue-300 tracking-tight">Engineering System</span>
        </div>
        <span className="text-slate-500">•</span>
        <span className="text-slate-400">v2.1.0</span>
        <span className="text-slate-500">•</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Stable
        </span>
      </div>

      {/* ✨ Left Section - Status Indicators */}
      <div className="flex items-center gap-4">

        {/* 🌐 Network Status */}
        <StatusItem
          status={isOnline ? 'online' : 'offline'}
          label={isOnline ? 'Network' : 'Offline'}
          icon={isOnline ? Wifi : WifiOff}
          subLabel={isOnline ? 'Connected' : 'Disconnected'}
        />

        {/* 🔗 API Server */}
        <StatusItem
          status={serverStatus}
          label="API Server"
          icon={Server}
          subLabel={serverStatus === 'online' ? 'Responsive' : 'Unavailable'}
        />

        {/* 🗄️ Database */}
        <StatusItem
          status={dbStatus === 'connected' ? 'online' : 'offline'}
          label="Database"
          icon={Database}
          subLabel={dbStatus === 'connected' ? 'Active' : 'Disconnected'}
        />

        {/* ⚡ Latency Meter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <Activity className={clsx('w-3.5 h-3.5', latencyConfig.text)} />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500 ease-out shadow-lg',
                    latencyConfig.color,
                    latencyConfig.glow
                  )}
                  style={{ 
                    width: latency ? `${Math.min(latency / 6, 100)}%` : '0%',
                    boxShadow: latency ? `0 0 8px ${latencyConfig.color.replace('bg-', 'var(--tw-shadow-color, ')}` : 'none'
                  }}
                />
              </div>
              <span className={clsx('font-bold min-w-[45px]', latencyConfig.text)}>
                {latency ? `${latency}ms` : '--'}
              </span>
            </div>
            <span className="text-[9px] text-slate-500">
              {latencyLevel === 'good' && 'Excellent'}
              {latencyLevel === 'warn' && 'Moderate'}
              {latencyLevel === 'bad' && 'High Latency'}
              {latencyLevel === 'down' && 'Checking...'}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

/* 🎨 Reusable Status Item Component - Enhanced */
const StatusItem = ({ status, label, icon: Icon, subLabel }) => {
  const isOnline = status === 'online';
  const isChecking = status === 'checking';
  
  const config = {
    online: { 
      dot: 'bg-emerald-400', 
      glow: 'shadow-emerald-400/50',
      text: 'text-emerald-400',
      icon: CheckCircle2 
    },
    offline: { 
      dot: 'bg-red-500', 
      glow: 'shadow-red-500/50',
      text: 'text-red-400',
      icon: XCircle 
    },
    checking: { 
      dot: 'bg-amber-400 animate-pulse', 
      glow: 'shadow-amber-400/50',
      text: 'text-amber-400',
      icon: AlertCircle 
    }
  }[isChecking ? 'checking' : isOnline ? 'online' : 'offline'];

  const StatusIcon = config.icon;

  return (
    <div className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 cursor-default">
      {/* Status Dot with Glow */}
      <div className="relative">
        <span
          className={clsx(
            'w-2 h-2 rounded-full shadow-lg transition-all duration-300',
            config.dot,
            config.glow
          )}
          style={{ boxShadow: `0 0 6px ${config.dot.replace('bg-', '')}` }}
        />
        {isChecking && (
          <span className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
        )}
      </div>
      
      {/* Icon & Label */}
      <div className="flex items-center gap-1.5">
        <Icon className={clsx('w-3.5 h-3.5 transition-colors', isOnline ? config.text : 'text-slate-500')} />
        <div className="flex flex-col leading-tight">
          <span className={clsx('font-bold', isOnline ? 'text-slate-200' : 'text-slate-400')}>
            {label}
          </span>
          <span className={clsx('text-[9px]', config.text)}>
            {subLabel}
          </span>
        </div>
      </div>
      
      {/* Hover Indicator */}
      <StatusIcon className={clsx('w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity', config.text)} />
    </div>
  );
};

export default SystemFooter;