import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Masters() {
  const navigate = useNavigate();

  const masterModules = [
    {
      id: 'employee-master',
      title: 'Employee Master',
      subtitle: 'Employee Master',
      description: 'Manage employee records, departments, designations, and contact details.',
      iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'customer-master',
      title: 'Customer Master',
      subtitle: 'Customer Master',
      description: 'Manage customer records, contact numbers, locations, and active status.',
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">Masters</h2>
              <p className="text-sm text-slate-500 font-medium">
                Centralized directory and master records directory
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {masterModules.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/admin-dashboard/masters/${item.id}`)}
            className="bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 hover:border-indigo-300"
          >
            <div>
              <div className="flex justify-between items-start mb-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${item.iconBg} transition-transform group-hover:scale-110 shadow-xs`}>
                  {item.icon}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.badgeColor}`}>
                  {item.subtitle}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 flex items-center gap-2">
                {item.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              <span>Open {item.title}</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
