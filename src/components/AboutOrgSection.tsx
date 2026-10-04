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
    <section className="relative pt-20 sm:pt-24 pb-16 sm:pb-20 overflow-hidden scroll-mt-24">
      {/* Soft ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 border border-blue-200/80 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4 shadow-2xs">
            <CircuitBoard className="w-4 h-4" />
            <span>Tổ chức & Bản sắc Đoàn - Hội</span>
          </div>
          <h2 className="font-tech text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            BAN CHẤP HÀNH & ĐỘI CỘNG TÁC VIÊN
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Đại diện tiếng nói, quyền lợi hợp pháp và đồng hành cùng sinh viên Khoa Điện - Điện tử trong mọi chặng đường học tập và rèn luyện.
          </p>

          {/* Centered Segmented Filter Tabs */}
          <div className="mt-7 inline-flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm gap-1.5">
            <button
              onClick={() => setSelectedOrgFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedOrgFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
              }`}
            >
              Tất cả ({bchMembers.length})
            </button>
            <button
              onClick={() => setSelectedOrgFilter('DOAN_KHOA')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedOrgFilter === 'DOAN_KHOA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
              }`}
            >
              Đoàn Thanh niên
            </button>
            <button
              onClick={() => setSelectedOrgFilter('HOI_SINH_VIEN')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedOrgFilter === 'HOI_SINH_VIEN'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
              }`}
            >
              Hội Sinh viên
            </button>
            <button
              onClick={() => setSelectedOrgFilter('DOI_CTV')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedOrgFilter === 'DOI_CTV'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
              }`}
            >
              Đội CTV Đoàn - Hội
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {filteredMembers.length === 0 ? (
            /* Modern Glass Empty State */
            <div className="text-center py-16 px-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-dashed border-slate-200 dark:border-slate-800 max-w-xl mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-400/30">
                <CircuitBoard className="w-7 h-7" />
              </div>
              <h4 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">
                Danh sách cán bộ đang được cập nhật
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Thông tin nhân sự Ban Chấp hành Đoàn - Hội và Đội Cộng tác viên nhiệm kỳ mới sẽ được công bố chính thức tại đây.
              </p>
            </div>
          ) : (
            /* Members Card Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <div 
                  key={member.id}
                  className="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-6 hover:border-blue-400/60 dark:hover:border-blue-400/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={sizedImage(member.avatarUrl, 160)} 
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-200 dark:border-blue-400/30 group-hover:border-blue-500 transition-colors"
                        />
                        <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white dark:bg-slate-900">
                          <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-400/30">
                            {member.department}
                          </span>
                        </div>
                        <h4 className="font-tech text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
                          {member.name}
                        </h4>
                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                          {member.position}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Chi đoàn: <span className="text-slate-700 dark:text-slate-200 font-medium">{member.classGroup}</span>
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      {member.bio}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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
          )}
        </div>

      </div>
    </section>
  );
};
