import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Target, 
  HeartHandshake, 
  Cpu, 
  BookOpen, 
  Radio, 
  Award, 
  Mail, 
  Phone, 
  ChevronRight,
  Sparkles,
  CircuitBoard,
  Compass
} from 'lucide-react';
import { BCHMember } from '../types';
import { sizedImage } from '../utils/image';

interface AboutOrgSectionProps {
  bchMembers: BCHMember[];
}

export const AboutOrgSection: React.FC<AboutOrgSectionProps> = ({ bchMembers }) => {
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<'ALL' | 'DOAN_KHOA' | 'HOI_SINH_VIEN' | 'CLB_TRUC_THUOC'>('ALL');

  const filteredMembers = bchMembers.filter(m => 
    selectedOrgFilter === 'ALL' || m.organization === selectedOrgFilter
  );

  const coreValues = [
    {
      title: 'Tiên phong Công nghệ',
      desc: 'Đi đầu trong chuyển đổi số công tác Đoàn - Hội, ứng dụng IoT, AI và vi mạch bán dẫn vào các phong trào học thuật.',
      icon: Cpu,
      color: 'text-blue-600 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-400/30',
      bg: 'bg-blue-50/60 dark:bg-blue-950/40'
    },
    {
      title: 'Kỷ luật & Trách nhiệm',
      desc: 'Tác phong kỹ thuật chuẩn mực, minh bạch trong quản lý điểm rèn luyện, tôn trọng cam kết và tận tâm phục vụ sinh viên.',
      icon: ShieldCheck,
      color: 'text-indigo-600 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-400/30',
      bg: 'bg-indigo-50/60 dark:bg-indigo-950/40'
    },
    {
      title: 'Sáng tạo & Đột phá',
      desc: 'Không ngừng đổi mới nội dung và hình thức tổ chức sự kiện, mở rộng sân chơi NCKH và liên kết doanh nghiệp.',
      icon: Sparkles,
      color: 'text-orange-600 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-400/30',
      bg: 'bg-orange-50/60 dark:bg-orange-950/40'
    },
    {
      title: 'Đoàn kết & Cống hiến',
      desc: 'Gắn kết hơn 3.800 sinh viên toàn khoa, lan tỏa tinh thần tình nguyện vì cộng đồng qua các chiến dịch Mùa Hè Xanh, Xuân Tình Nguyện.',
      icon: HeartHandshake,
      color: 'text-emerald-600 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-400/30',
      bg: 'bg-emerald-50/60 dark:bg-emerald-950/40'
    }
  ];

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
            SƠ ĐỒ CƠ CẤU TỔ CHỨC & SỨ MỆNH
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Đại diện quyền lợi hợp pháp, đồng hành cùng đoàn viên, hội viên và sinh viên Khoa Điện - Điện tử trong học tập, nghiên cứu và rèn luyện.
          </p>
        </div>

        {/* Mission & History Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-4">
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30">
                <Compass className="w-5 h-5" />
              </span>
              <h3 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">Sứ mệnh Đoàn - Hội</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Xây dựng thế hệ sinh viên Khoa Điện - Điện tử bản lĩnh vững vàng, đạo đức trong sáng, có tư duy kỹ thuật xuất sắc, năng lực tự chủ công nghệ cao và hội nhập quốc tế.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-4">
              <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-400/30">
                <Target className="w-5 h-5" />
              </span>
              <h3 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">Tầm nhìn 2026 - 2030</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Trở thành tổ chức Đoàn - Hội kiểu mẫu hàng đầu toàn trường về chuyển đổi số, ươm mầm các tài năng thiết kế vi mạch bán dẫn, robot thông minh và kỹ sư điện tự động hóa toàn cầu.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-4">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/30">
                <Award className="w-5 h-5" />
              </span>
              <h3 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">Thành tích Tiêu biểu</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Liên tục nhiều năm liền đạt danh hiệu <strong className="text-blue-700 dark:text-blue-300 font-bold">"Đoàn cơ sở Xuất sắc dẫn đầu Khối Kỹ thuật"</strong>, Bằng khen của Trung ương Đoàn TNCS Hồ Chí Minh và Hội Sinh viên Việt Nam.
            </p>
          </div>
        </div>

        {/* 4 Core Values Grid */}
        <div className="mb-16">
          <h3 className="font-tech text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-6">
            4 GIÁ TRỊ CỐT LÕI CỦA SINH VIÊN KHOA ĐIỆN - ĐIỆN TỬ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div 
                  key={idx}
                  className={`p-5 rounded-2xl border ${val.border} ${val.bg} hover:shadow-md transition-all`}
                >
                  <Icon className={`w-6 h-6 ${val.color} mb-3`} />
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5">{val.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Org Chart & Leadership Directory */}
        <div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-tech text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                BAN CHẤP HÀNH & BAN ĐIỀU HÀNH CÁC CLB
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
                Đoàn Khoa
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
                onClick={() => setSelectedOrgFilter('CLB_TRUC_THUOC')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedOrgFilter === 'CLB_TRUC_THUOC'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300'
                }`}
              >
                CLB / Đội / Nhóm
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

          {/* CLB Trực thuộc Spotlight */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-50 dark:from-blue-950/40 via-indigo-50 dark:via-indigo-950/40 to-blue-50 dark:to-blue-950/40 border border-blue-200 dark:border-blue-400/30 shadow-sm">
            <h4 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              <span>Hệ sinh thái Câu lạc bộ Học thuật & Kỹ năng Trực thuộc FEE</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="font-bold text-blue-700 dark:text-blue-300 text-sm mb-1">CLB Robofee & Hệ thống Nhúng</div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">Đào tạo lập trình vi điều khiển, thiết kế PCB, tham gia Robocon, Cuộc thi xe tự hành.</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="font-bold text-orange-600 dark:text-orange-300 text-sm mb-1">CLB IoT & AIoT Hub</div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">Nghiên cứu ứng dụng cảm biến thông minh, hệ thống Smart City, điện toán biên và TinyML.</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm mb-1">Đội Tình nguyện Xanh & Chuyên Điện</div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">Thực hiện công trình sửa chữa điện, đèn chiếu sáng mặt trời, tổ chức lớp học STEM thiếu nhi.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
