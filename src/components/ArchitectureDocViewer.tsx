import React, { useState } from 'react';
import { 
  Layers, 
  Database, 
  FolderTree, 
  Code2, 
  Copy, 
  Check, 
  Server, 
  Smartphone, 
  Mail, 
  Bell, 
  ShieldCheck,
  Cpu,
  ArrowRight,
  Terminal
} from 'lucide-react';

export const ArchitectureDocViewer: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'ARCHITECTURE' | 'SCHEMA' | 'FOLDER_STRUCTURE' | 'API_SPEC'>('ARCHITECTURE');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const prismaSchemaCode = `// schema.prisma - PostgreSQL / Cloud SQL / Supabase

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  EDITOR
  EVENT_MANAGER
  STUDENT
}

enum EventStatus {
  UPCOMING
  REGISTRATION_OPEN
  REGISTRATION_CLOSED
  COMPLETED
}

enum EventType {
  ACADEMIC_CONTEST
  VOLUNTEER
  SPORTS_CULTURE
  SEMINAR_WORKSHOP
  UNION_CONFERENCE
}

model User {
  id             String         @id @default(uuid())
  mssv           String?        @unique
  fullName       String
  email          String         @unique
  phone          String?
  role           Role           @default(STUDENT)
  classGroup     String?        // e.g. D22_DKTD01
  avatarUrl      String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  registrations  Registration[]
  articles       News[]
}

model Event {
  id                    String         @id @default(uuid())
  title                 String
  slug                  String         @unique
  description           String         @db.Text
  content               String         @db.Text
  type                  EventType
  status                EventStatus    @default(UPCOMING)
  location              String
  eventDate             DateTime
  startTime             String
  endTime               String
  registrationDeadline  DateTime
  maxParticipants       Int            @default(200)
  currentParticipants   Int            @default(0)
  bannerUrl             String
  organizer             String
  contactEmail          String
  requirements          String[]
  isMandatoryCheckIn    Boolean        @default(true)
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  registrations         Registration[]
}

model Registration {
  id                    String    @id @default(uuid())
  eventId               String
  event                 Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId                String?
  user                  User?     @relation(fields: [userId], references: [id])
  fullName              String
  mssv                  String
  email                 String
  phone                 String
  classGroup            String
  faculty               String    @default("Khoa Điện - Điện tử")
  registeredAt          DateTime  @default(now())
  ticketCode            String    @unique // e.g. FEE-TECH-88392
  checkedIn             Boolean   @default(false)
  checkedInAt           DateTime?
  note                  String?

  @@index([eventId, mssv])
}

model News {
  id           String   @id @default(uuid())
  title        String
  slug         String   @unique
  summary      String   @db.Text
  content      String   @db.Text
  category     String
  categoryName String
  authorId     String?
  author       User?    @relation(fields: [authorId], references: [id])
  authorName   String
  authorRole   String
  coverImage   String
  tags         String[]
  views        Int      @default(0)
  featured     Boolean  @default(false)
  publishedAt  DateTime @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  title     String
  message   String
  type      String   // EVENT, NEWS, REMINDER, URGENT
  targetAudience String @default("ALL")
  createdAt DateTime @default(now())
  isRead    Boolean  @default(false)
}

model EmailLog {
  id             String   @id @default(uuid())
  recipientEmail String
  recipientName  String
  subject        String
  type           String   // REGISTRATION_CONFIRMATION, REMINDER_24H, ATTENDANCE_SUCCESS
  ticketCode     String?
  sentAt         DateTime @default(now())
  status         String   @default("DELIVERED")
}`;

  const folderStructureCode = `fee-portal-fullstack/
├── prisma/
│   └── schema.prisma                 # Sơ đồ cơ sở dữ liệu PostgreSQL / Supabase
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                # Thanh điều hướng đa nền tảng & RBAC switcher
│   │   ├── MobileBottomNav.tsx       # Bottom bar navigation tối ưu Mobile-first
│   │   ├── HeroSection.tsx           # Banner chính, slogan và bộ đếm số liệu
│   │   ├── AboutOrgSection.tsx       # Sơ đồ cơ cấu tổ chức & danh bạ BCH Đoàn - Hội
│   │   ├── NewsFeed.tsx              # Bảng tin tức, bộ lọc chuyên mục, tìm kiếm & bài viết
│   │   ├── EventsHub.tsx             # Quản lý sự kiện (Calendar, List, Grid view)
│   │   ├── RegistrationModal.tsx     # Form đăng ký tham gia trực tuyến tự động đóng
│   │   ├── TicketModal.tsx           # Thẻ vé điện tử QR Code (Canvas render, Print, Download)
│   │   ├── EventDetailModal.tsx      # Modal chi tiết chương trình, yêu cầu tham dự
│   │   ├── QRCheckInScanner.tsx      # Trạm quét mã QR/MSSV điểm danh tự động
│   │   ├── StudentPortalLookup.tsx   # Tra cứu lịch sử hoạt động & vé điện tử theo MSSV
│   │   ├── AdminDashboard.tsx        # Quản trị viên, xuất file Excel XLSX, RBAC & Email
│   │   └── ArchitectureDocViewer.tsx # Tài liệu kiến trúc hệ thống & Database schema
│   ├── types/
│   │   └── index.ts                  # TypeScript interface definitions
│   ├── data/
│   │   └── mockData.ts               # Dữ liệu hạt giống chuẩn thực tế Khoa Điện - Điện tử
│   ├── services/
│   │   └── api.ts                    # REST API Client kết nối Backend
│   ├── index.css                     # Tailwind CSS & custom circuit styles
│   ├── main.tsx                      # Entry point React 19
│   └── App.tsx                       # Root Component & Route state management
├── server.ts                         # Node.js Express REST Backend & Vite Middleware
├── metadata.json                     # Application metadata & permissions
├── package.json                      # Full-stack dependencies & build scripts
├── tsconfig.json                     # TypeScript strict configuration
└── vite.config.ts                    # Vite build configuration`;

  return (
    <div className="py-8 bg-slate-50 min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Đặc tả Thiết kế & Tài liệu Kỹ thuật Mục 4</span>
          </div>
          <h2 className="font-tech text-2xl sm:text-4xl font-extrabold text-slate-900">
            KIẾN TRÚC HỆ THỐNG & DATABASE SCHEMA
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Tài liệu tổng thể về System Architecture, Sơ đồ Cơ sở Dữ liệu Prisma/PostgreSQL, Cấu trúc Thư mục Clean Architecture và API Specifications.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
          <button
            onClick={() => setActiveSection('ARCHITECTURE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSection === 'ARCHITECTURE'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>1. Kiến trúc Hệ thống (Architecture)</span>
          </button>

          <button
            onClick={() => setActiveSection('SCHEMA')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSection === 'SCHEMA'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Sơ đồ Database & Prisma Schema</span>
          </button>

          <button
            onClick={() => setActiveSection('FOLDER_STRUCTURE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSection === 'FOLDER_STRUCTURE'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>3. Cấu trúc Thư mục Dự án</span>
          </button>
        </div>

        {/* 1. SYSTEM ARCHITECTURE DIAGRAM */}
        {activeSection === 'ARCHITECTURE' && (
          <div className="space-y-8 animate-in fade-in">
            
            {/* Architecture Visual Grid */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-tech text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <span>Mô hình Kiến trúc Hệ thống Đa tầng (Multi-tier Full-stack Architecture)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                
                {/* Client Layer */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-blue-200 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-700 font-bold font-tech text-sm">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>1. Client Tier (Mobile-First)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Giao diện Responsive tối ưu trên mọi thiết bị điện thoại, máy tính bảng và desktop.
                  </p>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    <li>• React 19 + TypeScript</li>
                    <li>• Tailwind CSS + Lucide Icons</li>
                    <li>• QR Code Canvas Renderer</li>
                    <li>• XLSX Excel Exporter</li>
                    <li>• Web Camera QR Scanner</li>
                  </ul>
                </div>

                {/* API Gateway & Server */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-indigo-200 space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-700 font-bold font-tech text-sm">
                    <Server className="w-4 h-4 text-indigo-600" />
                    <span>2. API & Server Tier</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Xử lý nghiệp vụ đăng ký sự kiện, cấp vé QR, xác thực và phân quyền RBAC.
                  </p>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    <li>• Node.js + Express REST API</li>
                    <li>• Quota & Deadline Validator</li>
                    <li>• Attendance Point Calculator</li>
                    <li>• Role-Based Access Control</li>
                  </ul>
                </div>

                {/* Automation & Notification */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-orange-200 space-y-3">
                  <div className="flex items-center space-x-2 text-orange-700 font-bold font-tech text-sm">
                    <Mail className="w-4 h-4 text-orange-600" />
                    <span>3. Services & Automation</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Tự động hóa phát hành vé điện tử và gửi thông báo nhắc nhở 24h trước giờ G.
                  </p>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    <li>• Resend / Nodemailer Service</li>
                    <li>• HTML Ticket Email Dispatcher</li>
                    <li>• Web Push Notification API</li>
                    <li>• Scheduled 24h Reminder Cron</li>
                  </ul>
                </div>

                {/* Data Persistence */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-700 font-bold font-tech text-sm">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>4. Data Persistence Tier</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Lưu trữ dữ liệu toàn diện về thành viên, sự kiện, điểm danh và bài viết.
                  </p>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    <li>• Prisma ORM</li>
                    <li>• PostgreSQL / Supabase / Cloud SQL</li>
                    <li>• Unique Ticket Indexes</li>
                    <li>• Relational Integrity Rules</li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Workflow Pipeline */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h4 className="font-tech text-base font-bold text-slate-900 mb-4">
                Quy trình Tự động hóa Đăng ký & Điểm danh (Automated Workflow)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-blue-700">BƯỚC 1</span>
                  <h5 className="font-bold text-slate-900 mt-1">Đăng ký Trực tuyến</h5>
                  <p className="text-slate-600 text-[11px] mt-1">Sinh viên nhập MSSV, email. Hệ thống kiểm tra slot và hạn chót.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-blue-700">BƯỚC 2</span>
                  <h5 className="font-bold text-slate-900 mt-1">Cấp Vé QR & Gửi Email</h5>
                  <p className="text-slate-600 text-[11px] mt-1">Tạo mã vé duy nhất #FEE-XXXX, phát vé điện tử QR và dispatch email.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-orange-600">BƯỚC 3</span>
                  <h5 className="font-bold text-slate-900 mt-1">Nhắc nhở 24h Tự động</h5>
                  <p className="text-slate-600 text-[11px] mt-1">Gửi thông báo và email nhắc nhở kèm địa điểm và giờ tập trung.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-emerald-600">BƯỚC 4</span>
                  <h5 className="font-bold text-slate-900 mt-1">Quét QR Điểm danh</h5>
                  <p className="text-slate-600 text-[11px] mt-1">Quét mã tại cửa, hệ thống lập tức xác thực và cập nhật trạng thái có mặt.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 2. DATABASE & PRISMA SCHEMA */}
        {activeSection === 'SCHEMA' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="font-tech text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span>Sơ đồ Cơ sở Dữ liệu Prisma (schema.prisma)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bao gồm các thực thể: User (Sinh viên/BCH), Event (Sự kiện), Registration (Đăng ký & Vé QR), News (Bản tin), EmailLog.
                  </p>
                </div>

                <button
                  onClick={() => copyToClipboard(prismaSchemaCode, 'prisma')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200 transition-colors shadow-2xs"
                >
                  {copiedKey === 'prisma' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
                  <span>{copiedKey === 'prisma' ? 'Đã sao chép' : 'Sao chép Schema'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-[500px]">
                {prismaSchemaCode}
              </pre>
            </div>
          </div>
        )}

        {/* 3. FOLDER STRUCTURE */}
        {activeSection === 'FOLDER_STRUCTURE' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="font-tech text-base font-bold text-slate-900 flex items-center space-x-2">
                    <FolderTree className="w-5 h-5 text-orange-600" />
                    <span>Cấu trúc Thư mục Dự án (Project Directory Tree)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thiết kế theo mô hình Clean Modular Full-stack: Phân chia rõ rệt giữa Frontend Components, Service Client, Types và Express Backend.
                  </p>
                </div>

                <button
                  onClick={() => copyToClipboard(folderStructureCode, 'folder')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-orange-700 border border-slate-200 transition-colors shadow-2xs"
                >
                  {copiedKey === 'folder' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-orange-600" />}
                  <span>{copiedKey === 'folder' ? 'Đã sao chép' : 'Sao chép cấu trúc'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 text-cyan-300 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
                {folderStructureCode}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
