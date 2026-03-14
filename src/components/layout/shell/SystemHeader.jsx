import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Settings,
  ChevronDown,
  MapPin,
  Clock,
  Timer,
  Wifi,
  WifiOff,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { clsx } from "clsx";

const SystemHeader = () => {
  const { user, logout } = useAuth();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatSessionTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const time12 = currentTime.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const gregDate = currentTime.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formatHijriNumeric = (date) => {
    const hFormat = new Intl.DateTimeFormat("en-US-u-ca-islamic", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const parts = hFormat.formatToParts(date);
    const day = parts.find((p) => p.type === "day").value;
    const month = parts.find((p) => p.type === "month").value;
    const year = parts.find((p) => p.type === "year").value.split(" ")[0];
    return `${day}/${month}/${year}`;
  };
  const hijriDate = formatHijriNumeric(currentTime);

  const handleLogout = () => {
    logout();
  };

  const userName = user?.name || "مستخدم النظام";
  const userPosition = user?.position || "موظف";
  const userInitials = userName.charAt(0).toUpperCase();
  const userEmail = user?.email || "user@system.com";

  return (
    <header 
      className="h-14 bg-gradient-to-r from-white via-slate-50 to-white border-b border-slate-200/80 flex items-center justify-between px-3 md:px-5 shrink-0 z-30 shadow-lg shadow-slate-900/5 backdrop-blur-sm relative"
      dir="rtl"
    >
      {/* ✨ 1. بيانات النظام الحية - تصميم محسّن */}
      <div className="flex flex-1 md:flex-none items-center justify-start md:justify-center gap-2 md:gap-5 text-[10px] md:text-[11px] font-medium md:border-l border-slate-200/60 md:mx-3 px-2 md:px-4 h-full">
        
        {/* 📍 المدينة والوقت */}
        <div className="flex items-center gap-2 md:border-l border-slate-200/60 md:pl-4">
          <div className="flex flex-col items-start leading-tight">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <div className="p-1 rounded-md bg-blue-50">
                <MapPin className="w-3 h-3 text-blue-500" />
              </div>
              <span className="hidden sm:inline">الرياض</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600 font-bold mt-0.5">
              <div className="p-1 rounded-md bg-blue-50">
                <Clock className="w-3 h-3" />
              </div>
              <span className="font-mono">{time12}</span>
            </div>
          </div>
        </div>

        {/* 📅 التاريخ الميلادي والهجري */}
        <div className="hidden sm:flex flex-col items-center justify-center font-mono text-slate-500 border-l border-slate-200/60 pl-4 h-full">
          <span className="text-slate-800 font-bold leading-none flex items-center gap-1" title="التاريخ الميلادي">
            {gregDate} 
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-sans font-bold">م</span>
          </span>
          <span className="text-slate-400 leading-none mt-1 flex items-center gap-1" title="التاريخ الهجري">
            {hijriDate} 
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-sans font-bold">هـ</span>
          </span>
        </div>

        {/* ⏱️ زمن الجلسة */}
        <div className="hidden lg:flex flex-col items-center justify-center border-l border-slate-200/60 pl-4 h-full">
          <span className="text-[9px] text-slate-400 flex items-center gap-1.5 leading-none">
            <div className="p-1 rounded-md bg-slate-100">
              <Timer className="w-3 h-3" />
            </div>
            الجلسة
          </span>
          <span className="font-mono font-bold text-slate-700 tracking-tighter leading-none mt-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
            {formatSessionTime(sessionSeconds)}
          </span>
        </div>

        {/* 🌐 حالة الاتصال - تصميم محسّن */}
        <div className="flex items-center gap-2">
          <div className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300",
            isOnline 
              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            {isOnline ? (
              <>
                <div className="relative">
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="absolute inset-0 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping opacity-30" />
                </div>
                <span className="hidden md:inline font-bold text-[10px]">متصل</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden md:inline font-bold text-[10px]">منقطع</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ✨ 2. الإجراءات والملف الشخصي - تصميم فاخر */}
      <div className="flex items-center gap-1 md:gap-2 relative">
        
        {/* 🔔 الإشعارات و ⚙️ الإعدادات */}
        <div className="hidden sm:flex items-center gap-1">
          <button className="relative p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-all duration-200 group">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              إشعارات جديدة
            </span>
          </button>
          <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-all duration-200 group">
            <Settings className="w-4.5 h-4.5" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              الإعدادات
            </span>
          </button>
        </div>

        {/* 👤 قائمة المستخدم المنسدلة - تصميم احترافي */}
        <div className="relative" ref={userMenuRef}>
          <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 group cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition-all duration-200 md:mr-1 md:border-r border-slate-200/60 md:pr-3"
          >
            <div className="text-left hidden md:block leading-tight">
              <div className="text-[12px] font-bold text-slate-800 text-right flex items-center gap-1.5 justify-end">
                {userName}
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-[9px] text-slate-400 font-medium text-right mt-0.5 flex items-center gap-1 justify-end">
                {userPosition}
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="font-mono text-[8px]">{user?.employeeCode || userEmail.split('@')[0]}</span>
              </div>
            </div>
            
            <div className="relative group/avatar">
              {/* صورة المستخدم مع تأثيرات */}
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 border-2 border-white group-hover/avatar:scale-105 transition-transform duration-200">
                <span className="font-bold text-sm">{userInitials}</span>
              </div>
              {/* مؤشر الحالة */}
              <div className={clsx(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white transition-all duration-300",
                isOnline ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" : "bg-slate-400"
              )}></div>
              {/* تأثير الوميض عند الاتصال */}
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-50" />
              )}
            </div>
            <ChevronDown className={clsx(
              "w-3.5 h-3.5 text-slate-400 transition-all duration-200",
              isUserMenuOpen ? "rotate-180 text-blue-500" : "group-hover:text-slate-600"
            )} />
          </div>

          {/* 🎨 القائمة المنسدلة - تصميم بطاقي فاخر */}
          {isUserMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/20 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
              
              {/* رأس القائمة */}
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{userEmail}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={clsx(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold",
                        isOnline ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {isOnline ? "● متصل" : "○ غير متصل"}
                      </span>
                      <span className="text-[9px] text-slate-400">{userPosition}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* عناصر القائمة */}
              <div className="py-1">
                <button className="w-full text-right px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors">
                  <User className="w-4 h-4" />
                  <span>ملفي الشخصي</span>
                </button>
                <button className="w-full text-right px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>إعدادات الحساب</span>
                </button>
              </div>

              {/* فاصل */}
              <div className="border-t border-slate-100 my-1" />

              {/* زر الخروج */}
              <button
                onClick={handleLogout}
                className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-bold transition-colors group/btn"
              >
                <LogOut className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default SystemHeader;