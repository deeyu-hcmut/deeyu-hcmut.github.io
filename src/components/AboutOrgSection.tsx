import React, { useState } from 'react';
import { Mail, CircuitBoard, UserRound } from 'lucide-react';
import { BCHMember, BCH_LEVEL_LABELS, BchOrganization, inferBchLevel } from '../types';
import { sizedImage } from '../utils/image';

interface AboutOrgSectionProps {
  bchMembers: BCHMember[];
}

const ORG_TABS: { id: BchOrganization; label: string }[] = [
  { id: 'DOAN_KHOA', label: 'Đoàn Thanh niên' },
  { id: 'HOI_SINH_VIEN', label: 'Hội Sinh viên' },
  { id: 'DOI_CTV', label: 'Đội CTV Đoàn - Hội' },
];

const MemberCard: React.FC<{ member: BCHMember }> = ({ member }) => (
  <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-6 hover:border-blue-400/60 dark:hover:border-blue-400/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden shadow-xs flex flex-col justify-between">
    <div>
      <div className="flex items-start space-x-4">
        <div className="relative flex-shrink-0">
          {member.avatarUrl ? (
            <img
              src={sizedImage(member.avatarUrl, 160)}
              alt={member.name}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-200 dark:border-blue-400/30 group-hover:border-blue-500 transition-colors"
            />
          ) : (
            <span className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-400 flex items-center justify-center border-2 border-blue-200 dark:border-blue-400/30">
              <UserRound className="w-7 h-7" />
            </span>
          )}
          <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white dark:bg-slate-900">
            <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {member.department && (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-400/30">
                {member.department}
              </span>
            </div>
          )}
          <h4 className="font-tech text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
            {member.name}
          </h4>
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
            {member.position}
          </p>
          {member.classGroup && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Chi đoàn: <span className="text-slate-700 dark:text-slate-200 font-medium">{member.classGroup}</span>
            </p>
          )}
        </div>
      </div>

      {member.bio && (
        <p className="mt-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          {member.bio}
        </p>
      )}
    </div>

    {/* Only the email is public; phone numbers are not published */}
    {member.email && (
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
        <a
          href={`mailto:${member.email}`}
          className="flex items-center space-x-1.5 hover:text-blue-600 dark:hover:text-blue-300 transition-colors min-w-0"
        >
          <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300 flex-shrink-0" />
          <span className="truncate">{member.email}</span>
        </a>
      </div>
    )}
  </div>
);

const MemberGrid: React.FC<{ members: BCHMember[] }> = ({ members }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {members.map(member => <MemberCard key={member.id} member={member} />)}
  </div>
);

export const AboutOrgSection: React.FC<AboutOrgSectionProps> = ({ bchMembers }) => {
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<BchOrganization>('DOAN_KHOA');

  const filteredMembers = bchMembers.filter(m => m.organization === selectedOrgFilter);

  // Legacy members saved before `level` existed fall back to a guess from their position text.
  const byLevel = (level: BCHMember['level']) =>
    filteredMembers.filter(m => (m.level ?? inferBchLevel(m.position)) === level);

  const biThu = byLevel('BI_THU');
  const phoBiThu = byLevel('PHO_BI_THU');
  const uyVienBtv = byLevel('UY_VIEN_BTV');
  const uyVien = byLevel('UY_VIEN');

  // Trưởng ban and Phó ban are grouped together, by the specific ban they lead,
  // not lumped into one flat "Trưởng/Phó ban" list.
  const banLeaders = [...byLevel('TRUONG_BAN'), ...byLevel('PHO_BAN')];
  const departments = Array.from(new Set(banLeaders.map(m => m.department || 'Khác'))).sort((a, b) => a.localeCompare(b, 'vi'));
  const banGroups = departments.map(department => ({
    department,
    members: banLeaders
      .filter(m => (m.department || 'Khác') === department)
      .sort((a, b) => ((a.level ?? inferBchLevel(a.position)) === 'TRUONG_BAN' ? 0 : 1) - ((b.level ?? inferBchLevel(b.position)) === 'TRUONG_BAN' ? 0 : 1)),
  }));

  return (
    <section className="relative pt-20 sm:pt-24 pb-16 sm:pb-20 overflow-hidden scroll-mt-24">
      {/* Soft ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-10">
          {/* One line at every width: the size scales with the viewport (see .org-title) */}
          <h2 className="org-title font-tech whitespace-nowrap font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            BAN CHẤP HÀNH & ĐỘI CỘNG TÁC VIÊN
          </h2>
          <p className="mt-3 max-w-3xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Đại diện tiếng nói, quyền lợi hợp pháp và đồng hành cùng sinh viên Khoa Điện - Điện tử trong mọi chặng đường học tập và rèn luyện.
          </p>

          {/* Centered Segmented Filter Tabs */}
          <div className="mt-7 inline-flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm gap-1.5">
            {ORG_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedOrgFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedOrgFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
            <div className="space-y-12">
              {biThu.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-4">{BCH_LEVEL_LABELS.BI_THU}</h3>
                  <MemberGrid members={biThu} />
                </div>
              )}
              {phoBiThu.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-4">{BCH_LEVEL_LABELS.PHO_BI_THU}</h3>
                  <MemberGrid members={phoBiThu} />
                </div>
              )}
              {uyVienBtv.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-4">{BCH_LEVEL_LABELS.UY_VIEN_BTV}</h3>
                  <MemberGrid members={uyVienBtv} />
                </div>
              )}
              {banGroups.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-4">Trưởng, Phó ban</h3>
                  <div className="space-y-8">
                    {banGroups.map(group => (
                      <div key={group.department}>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">{group.department}</h4>
                        <MemberGrid members={group.members} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {uyVien.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-4">{BCH_LEVEL_LABELS.UY_VIEN}</h3>
                  <MemberGrid members={uyVien} />
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
