import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";

export const TripleCurrencyInput = ({ valueSar, onChangeSar, rates }) => {
  const usdRate = rates.find((r) => r.currency === "USD")?.rate || 0.266;
  const egpRate = rates.find((r) => r.currency === "EGP")?.rate || 13.2;
  const handleFocus = (e) => e.target.select();

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">SAR</span>
        <input
          type="number"
          value={valueSar || ""}
          onChange={(e) => onChangeSar(e.target.value)}
          onFocus={handleFocus}
          className="w-full bg-white border border-gray-300 rounded-md py-1.5 pl-8 pr-2 text-xs font-mono font-bold focus:border-blue-500 outline-none"
        />
      </div>
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">EGP</span>
        <input
          type="number"
          value={valueSar ? (valueSar * egpRate).toFixed(2) : ""}
          onChange={(e) => onChangeSar(e.target.value ? (e.target.value / egpRate).toFixed(2) : "")}
          onFocus={handleFocus}
          className="w-full bg-slate-50 border border-gray-200 rounded-md py-1.5 pl-8 pr-2 text-xs font-mono focus:border-blue-500 outline-none"
        />
      </div>
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">USD</span>
        <input
          type="number"
          value={valueSar ? (valueSar * usdRate).toFixed(2) : ""}
          onChange={(e) => onChangeSar(e.target.value ? (e.target.value / usdRate).toFixed(2) : "")}
          onFocus={handleFocus}
          className="w-full bg-slate-50 border border-gray-200 rounded-md py-1.5 pl-8 pr-2 text-xs font-mono focus:border-blue-500 outline-none"
        />
      </div>
    </div>
  );
};

export const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-bold bg-white flex justify-between items-center cursor-pointer focus:border-blue-500 h-[34px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate text-gray-700 pr-2">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pr-8 pl-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-blue-500 bg-gray-50"
                placeholder="ابحث هنا..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs font-bold text-gray-700 rounded transition-colors"
                  onClick={() => { onChange(opt.value, opt); setIsOpen(false); setSearch(""); }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-400 text-center font-bold">لا توجد نتائج مطابقة</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};