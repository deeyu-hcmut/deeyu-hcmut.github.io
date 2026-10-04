import React, { useState } from 'react';
import { Mail, Phone, CircuitBoard } from 'lucide-react';
import { BCHMember } from '../types';
import { sizedImage } from '../utils/image';

interface AboutOrgSectionProps {
  bchMembers: BCHMember[];
}

export const AboutOrgSection: React.FC<AboutOrgSectionProps> = ({ bchMembers }) => {
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<'ALL' | 'DOAN_KHOA' | 'HOI_SINH_VIEN' | 'DOI_CTV'>('ALL');

  const filteredMembers = bchMembers.filter(m => 
    selectedOrgFilter === 'ALL' || m.organization === selectedOrgFilter
  );

  return (
    <div className="py-14 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-100/90 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4 shadow-2xs">
            <CircuitBoard className="w-4 h-4" />
            <span>Tổ chức & Bản sắc Đoàn - Hội FEE</span>
          </div>
          <h2 className="font-tech text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            SƠ ĐỒ CƠ CẤU TỔ CHỨC
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Đại diện quyền lợi hợp pháp, đồng hành cùng đoàn viên, hội viên và sinh viên Khoa Điện - Điện tử trong học tập, nghiên cứu và rèn luyện.
          </p>
        </div>

        {/* Interactive Org Chart & Leadership Directory */}
        <div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-tech text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                BAN CHẤP HÀNH & ĐỘI CỘNG TÁC VIÊN ĐOÀN - HỘI KHOA ĐIỆN - ĐIỆN TỬ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Đội ngũ cán bộ Đoàn - Hội nòng cốt phụ trách các mảng công tác</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <button
                onClick={() => setSelectedOrgFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedOrgFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300'
                }`}
              >
                Tất cả ({bchMembers.length})
              </button>
              <button
                onClick={() => setSelectedOrgFilter('DOAN_KHOA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedOrgFilter === 'DOAN_KHOA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300'
                }`}
              >
                Đoàn Thanh niên
              </button>
              <button
                onClick={() => setSelectedOrgFilter('HOI_SINH_VIEN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedOrgFilter === 'HOI_SINH_VIEN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300'
                }`}
              >
                Hội Sinh viên
              </button>
              <button
                onClick={() => setSelectedOrgFilter('DOI_CTV')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedOrgFilter === 'DOI_CTV'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300'
                }`}
              >
                Đội Cộng tác viên Đoàn - Hội khoa Điện - Điện tử
              </button>
            </div>
          </div>

          {/* Members Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div 
                key={member.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 hover:border-blue-300 dark:hover:border-blue-400/30 hover:shadow-lg transition-all group relative overflow-hidden shadow-sm"
              >
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img 
                      src={sizedImage(member.avatarUrl, 160)} 
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-blue-200 dark:border-blue-400/30 group-hover:border-blue-500 transition-colors"
                    />
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white dark:bg-slate-900">
                      <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30">
                        {member.department}
                      </span>
                    </div>
                    <h4 className="font-tech text-base font-bold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
                      {member.name}
                    </h4>
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-300">
                      {member.position}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Chi đoàn: <span className="text-slate-700 dark:text-slate-200 font-medium">{member.classGroup}</span>
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {member.bio}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <a 
                    href={`mailto:${member.email}`} 
                    className="flex items-center space-x-1.5 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                    <span className="truncate max-w-[140px]">{member.email}</span>
                  </a>
                  <a 
                    href={`tel:${member.phone.replace(/\s+/g, '')}`} 
                    className="flex items-center space-x-1 hover:text-orange-600 dark:hover:text-orange-300 transition-colors font-mono"
                  >
                    <Phone className="w-3 h-3 text-orange-600 dark:text-orange-300" />
                    <span>{member.phone}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
