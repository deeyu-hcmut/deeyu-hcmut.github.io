import { EventItem, NewsItem, BCHMember, RegistrationRecord, NotificationItem, FacultyStats } from '../types';

export const INITIAL_STATS: FacultyStats = {
  totalMembers: 3850,
  totalEventsHeld: 48,
  totalNewsPublished: 124,
  totalRegistrations: 4230,
  totalCheckIns: 3890,
  topClubsCount: 5,
  academicCompetitions: 12,
};

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Phát động Cuộc thi Thiết kế Vi mạch & Hệ thống Nhúng FEE IC-Design Contest 2026',
    slug: 'cuoc-thi-thiet-ke-vi-mach-he-thong-nhung-2026',
    summary: 'Sân chơi học thuật đỉnh cao dành cho sinh viên Khoa Điện - Điện tử với tổng giá trị giải thưởng lên đến 150 triệu đồng cùng cơ hội thực tập tại các tập đoàn bán dẫn hàng đầu.',
    content: `Cuộc thi **FEE IC-Design & Embedded Challenge 2026** do Đoàn - Hội Khoa Điện - Điện tử phối hợp cùng Hội Vi mạch Bán dẫn TP.HCM tổ chức chính thức khởi động.

### 1. Đối tượng tham gia
- Toàn thể sinh viên chuyên ngành Điện tử Viễn thông, Kỹ thuật Điều khiển & Tự động hóa, Kỹ thuật Điện, Kỹ thuật Y sinh và các ngành kỹ thuật liên quan.
- Mỗi đội gồm từ 3 đến 5 thành viên.

### 2. Các bảng thi đấu
- **Bảng A (Digital & Analog IC Design):** Thiết kế vi mạch số & tương tự sử dụng công cụ EDA tiêu chuẩn công nghiệp (Synopsys/Cadence).
- **Bảng B (AIoT & Edge Computing):** Thiết kế hệ thống nhúng thông minh tích hợp vi điều khiển ARM Cortex-M/RISC-V và mô hình TinyML.

### 3. Quyền lợi và giải thưởng
- Quán quân: 50.000.000 VNĐ + Cúp lưu niệm + Học bổng chuyên sâu IC Layout.
- Giấy chứng nhận tham gia và cơ hội phỏng vấn trực tiếp vào các tập đoàn bán dẫn đối tác (Marvell, Renesas, Synopsys, FPT Semiconductor).`,
    category: 'CUOC_THI_NCKH',
    categoryName: 'Cuộc thi NCKH & Học thuật',
    author: 'Ban Học thuật & NCKH Đoàn Khoa',
    authorRole: 'Trưởng Ban Học thuật',
    publishedAt: '2026-08-12T08:30:00Z',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    tags: ['Vi mạch', 'Bán dẫn', 'Embedded', 'FEE Contest'],
    views: 1840,
    featured: true,
  },
  {
    id: 'news-2',
    title: 'Hội nghị Kiện toàn Ban Chấp hành Đoàn - Hội Khoa Điện - Điện tử Nhiệm kỳ 2025 - 2027',
    slug: 'hoi-nghi-kien-toan-bch-doan-hoi-khoa-dien-dien-tu',
    summary: 'Đại hội đại biểu đã bầu ra 15 đồng chí ưu tú vào Ban Chấp hành Đoàn Khoa và 11 đồng chí vào Ban Thư ký Hội Sinh viên Khoa với tinh thần Tiên phong - Đột phá - Trách nhiệm.',
    content: `Trong không khí trang trọng và phấn khởi, Hội nghị Kiện toàn Ban Chấp hành Đoàn - Hội Khoa Điện - Điện tử đã diễn ra thành công tốt đẹp tại Hội trường A.

Hội nghị vinh dự đón tiếp đại diện Đảng ủy - Ban Chủ nhiệm Khoa, Thường vụ Đoàn Trường và hơn 180 đại biểu đại diện cho hơn 3.800 đoàn viên, hội viên toàn khoa.

Đại hội đã biểu quyết thông qua các phương hướng trọng tâm:
1. Đẩy mạnh chuyển đổi số trong công tác Đoàn và phong trào thanh niên (Portal trực tuyến, cấp vé điện tử QR, điểm danh thời gian thực).
2. Phát triển mạnh mẽ phong trào Sinh viên 5 Tốt và các hoạt động học thuật chuyên sâu.
3. Đồng hành cùng sinh viên trong nghiên cứu khoa học, khởi nghiệp sáng tạo và việc làm công nghệ cao.`,
    category: 'HOAT_DONG_KHOA',
    categoryName: 'Hoạt động Đoàn - Hội',
    author: 'Ban Thông tin & Truyền thông FEE Media',
    authorRole: 'Phó Bí thư Đoàn Khoa',
    publishedAt: '2026-08-08T14:15:00Z',
    coverImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
    tags: ['Đại hội', 'BCH Đoàn Khoa', 'Tuổi trẻ FEE', 'Tiên phong'],
    views: 2420,
    featured: true,
  },
  {
    id: 'news-3',
    title: 'Chiến dịch Tình nguyện Mùa Hè Xanh 2026: Đội hình Chuyên Điện mang nguồn sáng về vùng cao',
    slug: 'mua-he-xanh-2026-doi-hinh-chuyen-dien-thap-sang-duong-que',
    summary: 'Hơn 60 chiến sĩ Mùa Hè Xanh FEE đã hoàn thành xuất sắc công trình thanh niên "Thắp sáng đường quê bằng năng lượng mặt trời" với hơn 5km đèn chiếu sáng tại Huyện miền núi.',
    content: `Chiến dịch tình nguyện Mùa Hè Xanh năm 2026 của Đoàn Khoa Điện - Điện tử đã khép lại với những dấu ấn đậm nét của sức trẻ và chuyên môn kỹ thuật.

### Các công trình tiêu biểu đã hoàn thành:
- Lắp đặt **45 bộ đèn năng lượng mặt trời thông minh** dọc 5.2 km tuyến đường liên thôn.
- Sửa chữa hệ thống điện gia dụng, thay mới bảng điện an toàn cho **78 hộ gia đình chính sách**.
- Tổ chức lớp học STEM vui nhộn cho hơn 150 em thiếu nhi vùng cao với chủ đề "Khám phá thế giới Robot và Năng lượng xanh".`,
    category: 'PHONG_TRAO_SINH_VIEN',
    categoryName: 'Phong trào Sinh viên & Tình nguyện',
    author: 'Ban Chỉ huy MHX Khoa',
    authorRole: 'Chỉ huy trưởng MHX',
    publishedAt: '2026-07-28T09:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80',
    tags: ['Mùa Hè Xanh', 'Chuyên Điện', 'Tình nguyện', 'Năng lượng xanh'],
    views: 3120,
  },
  {
    id: 'news-4',
    title: 'Thông báo xét duyệt Học bổng "Thắp sáng Tài năng Điện tử" từ Tập đoàn Công nghệ 2026',
    slug: 'thong-bao-xet-duyet-hoc-bong-doanh-nghiep-2026',
    summary: 'Chương trình tài trợ 30 suất học bổng toàn phần và bán phần với tổng ngân sách 300 triệu đồng dành cho sinh viên có thành tích học tập xuất sắc và tích cực tham gia phong trào.',
    content: `Văn phòng Đoàn - Hội Khoa thông báo tiếp nhận hồ sơ xét duyệt chương trình học bổng doanh nghiệp năm học 2026 - 2027.

### Tiêu chuẩn xét chọn:
- Điểm trung bình học tập (GPA) từ 3.2/4.0 trở lên.
- Tích cực tham gia các phong trào Đoàn - Hội và nghiên cứu khoa học.
- Ưu tiên sinh viên đạt danh hiệu "Sinh viên 5 Tốt" hoặc có giải thưởng NCKH/Robocon.
- Thời hạn nộp hồ sơ: Hết ngày 30/08/2026.`,
    category: 'HOC_BONG_DOANH_NGHIEP',
    categoryName: 'Học bổng & Doanh nghiệp',
    author: 'Văn phòng Đoàn - Hội',
    authorRole: 'Chánh Văn phòng',
    publishedAt: '2026-08-01T10:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    tags: ['Học bổng', 'Doanh nghiệp', 'Sinh viên 5 Tốt', 'Hỗ trợ tài năng'],
    views: 1980,
  },
  {
    id: 'news-5',
    title: 'Thông báo quy trình Đăng ký & Xét duyệt Danh hiệu "Sinh viên 5 Tốt" cấp Khoa năm 2026',
    slug: 'quy-trinh-xet-duyet-sinh-vien-5-tot-2026',
    summary: 'Hướng dẫn chi tiết minh chứng 5 tiêu chí: Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt và Hội nhập tốt dành cho sinh viên toàn Khoa.',
    content: `Ban Thư ký Hội Sinh viên Khoa Điện - Điện tử ban hành hướng dẫn nộp hồ sơ xét duyệt danh hiệu "Sinh viên 5 Tốt" các cấp.

Sinh viên có thể nộp minh chứng trực tiếp thông qua chức năng số hóa trên cổng thông tin này để ban thư ký xét duyệt danh hiệu và thành tích thi đấu.`,
    category: 'THONG_BAO_HOC_THUAT',
    categoryName: 'Thông báo & Học vụ',
    author: 'Ban Thư ký Hội Sinh viên Khoa',
    authorRole: 'Chủ tịch Hội Sinh viên',
    publishedAt: '2026-08-05T16:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    tags: ['Sinh viên 5 Tốt', 'Hội Sinh viên', 'Học vụ', 'Minh chứng'],
    views: 1450,
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: 'EE TECH DAY 2026: Triển lãm Đồ án Tốt nghiệp & Ngày hội Tuyển dụng Kỹ thuật Điện - Điện tử',
    slug: 'ee-tech-day-2026-trien-lam-do-an-ngay-hoi-tuyen-dung',
    description: 'Sự kiện lớn nhất trong năm quy tụ hơn 50 doanh nghiệp công nghệ hàng đầu, trưng bày hơn 100 sản phẩm robot, IoT, vi mạch và tự động hóa do sinh viên FEE chế tạo.',
    content: `### Nội dung chương trình EE TECH DAY 2026
1. **08:00 - 11:30**: Lễ khai mạc & Chung kết Robocon Khoa Điện - Điện tử (FEE Arena).
2. **13:00 - 16:30**: Phỏng vấn tuyển dụng trực tiếp tại gian hàng của các tập đoàn (Intel, Bosch, Renesas, Schneider Electric, ABB).
3. **17:00 - 19:30**: Talkshow công nghệ: "Kỷ nguyên Bán dẫn & AI Edge trong công nghiệp 4.0".

### Quyền lợi người tham gia:
- Được cấp **Thẻ vé điện tử QR** qua cổng Portal.
- Quét mã QR tại cổng để xác nhận tham dự chính thức.
- Nhận quà tặng kỷ niệm từ Đoàn Khoa và Doanh nghiệp tài trợ.`,
    type: 'ACADEMIC_CONTEST',
    typeName: 'Học thuật & Triển lãm',
    status: 'REGISTRATION_OPEN',
    location: 'Hội trường Lớn & Sảnh Tòa nhà Công nghệ A1',
    eventDate: '2026-08-28',
    startTime: '08:00',
    endTime: '19:30',
    registrationDeadline: '2026-08-27T23:59:59',
    maxParticipants: 500,
    currentParticipants: 382,
    bannerUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    organizer: 'Đoàn - Hội Khoa Điện - Điện tử',
    contactEmail: 'doanhoi.fee@university.edu.vn',
    requirements: ['Mang theo thẻ sinh viên', 'Trang phục lịch sự / Áo Đoàn', 'Xuất trình vé QR khi check-in'],
    isMandatoryCheckIn: true,
  },
  {
    id: 'evt-2',
    title: 'Hội thảo Chuyên sâu: Thiết kế Vi mạch Bán dẫn VLSI & Cơ hội Nghề nghiệp Global',
    slug: 'hoi-thao-thiet-ke-vi-mach-ban-dan-vlsi-2026',
    description: 'Chia sẻ từ các chuyên gia cấp cao về quy trình thiết kế vi mạch ASIC/FPGA chuẩn công nghiệp và lộ trình nghề nghiệp cho kỹ sư trẻ.',
    content: `### Diễn giả khách mời:
- **TS. Nguyễn Hữu Dũng** - Giám đốc R&D Trung tâm Thiết kế Vi mạch Bán dẫn.
- **ThS. Lê Hoàng Long** - Trưởng nhóm Thiết kế Physical Layout tại Tập đoàn Silicon Valley.

### Nội dung trao đổi:
- Kiến trúc SoC hiện đại, RTL Design & Verification.
- Xu hướng dịch chuyển chuỗi cung ứng bán dẫn về Việt Nam.
- Kỹ năng cần chuẩn bị khi làm việc tại các phòng Lab chuẩn quốc tế.`,
    type: 'SEMINAR_WORKSHOP',
    typeName: 'Hội thảo chuyên môn',
    status: 'REGISTRATION_OPEN',
    location: 'Phòng Hội thảo Smart Lab B302',
    eventDate: '2026-08-22',
    startTime: '14:00',
    endTime: '17:00',
    registrationDeadline: '2026-08-21T18:00:00',
    maxParticipants: 150,
    currentParticipants: 142,
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    organizer: 'Ban Học thuật & NCKH Khoa Điện - Điện tử',
    contactEmail: 'hoithao.fee@university.edu.vn',
    requirements: ['Sinh viên năm 2, 3, 4 chuyên ngành Điện tử, Tự động hóa', 'Chuẩn bị câu hỏi trao đổi trước'],
    isMandatoryCheckIn: true,
  },
  {
    id: 'evt-3',
    title: 'Hội thao Truyền thống "FEE Olympic Cup 2026" - Chào đón Tân sinh viên Khóa mới',
    slug: 'hoi-thao-truyen-thong-fee-olympic-cup-2026',
    description: 'Giải thể thao thường niên tranh cúp Vô địch giữa các Chi đoàn với các bộ môn: Bóng đá nam/nữ, Bóng rổ, Cầu lông, Kéo co và E-Sports.',
    content: `Giải đấu quy tụ hơn 30 Chi đoàn toàn khoa tham gia tranh tài trong 2 tuần liên tục.

### Cơ cấu giải thưởng:
- Cúp vô địch toàn đoàn + Cờ thưởng + Tiền thưởng 10.000.000 VNĐ.
- Giải Nhất từng môn thể thao.
- Giấy khen cho vận động viên và tập thể chi đoàn xuất sắc.`,
    type: 'SPORTS_CULTURE',
    typeName: 'Thể thao & Văn nghệ',
    status: 'UPCOMING',
    location: 'Khu Liên hợp Thể thao & Nhà thi đấu Đa năng',
    eventDate: '2026-09-05',
    startTime: '07:30',
    endTime: '18:00',
    registrationDeadline: '2026-09-02T23:59:59',
    maxParticipants: 800,
    currentParticipants: 210,
    bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    organizer: 'Ban Phong trào & Thể dục Thể thao Hội Sinh viên Khoa',
    contactEmail: 'thethao.fee@university.edu.vn',
    requirements: ['Trang phục thể thao theo màu cờ sắc áo chi đoàn', 'Đăng ký danh sách thi đấu qua Bí thư Chi đoàn'],
    isMandatoryCheckIn: true,
  },
  {
    id: 'evt-4',
    title: 'Workshop Thực hành: Xây dựng Hệ thống IoT Giám sát Điện năng với ESP32 & Cloud MQTT',
    slug: 'workshop-thuc-hanh-iot-giam-sat-dien-nang-2026',
    description: 'Khóa học thực chiến 1 ngày cung cấp board mạch mẫu, hướng dẫn lập trình firmware và kết nối dashboard thời gian thực.',
    content: `Khóa huấn luyện do Đoàn - Hội Khoa Điện - Điện tử tổ chức.
Mỗi học viên được cấp kit thực hành cảm biến dòng PZEM-004T + Vi điều khiển ESP32 NodeMCU.`,
    type: 'SEMINAR_WORKSHOP',
    typeName: 'Workshop Thực hành',
    status: 'REGISTRATION_CLOSED',
    location: 'Xưởng Thực hành Điện tử E204',
    eventDate: '2026-08-18',
    startTime: '08:30',
    endTime: '16:30',
    registrationDeadline: '2026-08-14T12:00:00',
    maxParticipants: 50,
    currentParticipants: 50,
    bannerUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    organizer: 'Đoàn - Hội Khoa Điện - Điện tử',
    contactEmail: 'iot.fee@university.edu.vn',
    requirements: ['Đã học môn Kỹ thuật Lập trình C/C++', 'Tự trang bị laptop cá nhân'],
    isMandatoryCheckIn: true,
  },
  {
    id: 'evt-5',
    title: 'Hành trình Tình nguyện "Áo xanh FEE thắp sáng ước mơ em" tại Mái ấm Khuyết tật',
    slug: 'tinh-nguyen-ao-xanh-thap-sang-uoc-mo-2026',
    description: 'Chương trình thăm hỏi, sửa chữa hệ thống chiếu sáng, trao học bổng và tổ chức vui Tết Trung thu cho các em nhỏ có hoàn cảnh khó khăn.',
    content: `Chương trình tình nguyện thiện nguyện thường niên do Liên chi hội Sinh viên Khoa tổ chức.`,
    type: 'VOLUNTEER',
    typeName: 'Tình nguyện vì cộng đồng',
    status: 'COMPLETED',
    location: 'Mái ấm Ánh Sáng Tình Thương',
    eventDate: '2026-08-02',
    startTime: '07:00',
    endTime: '17:00',
    registrationDeadline: '2026-07-30T17:00:00',
    maxParticipants: 60,
    currentParticipants: 60,
    bannerUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    organizer: 'Đội Công tác Xã hội Khoa Điện - Điện tử',
    contactEmail: 'ctxh.fee@university.edu.vn',
    requirements: ['Tinh thần nhiệt huyết', 'Áo xanh tình nguyện'],
    isMandatoryCheckIn: true,
  }
];

export const INITIAL_BCH: BCHMember[] = [
  {
    id: 'bch-1',
    name: 'Đ/c Nguyễn Thành Trung',
    position: 'Bí thư Đoàn Khoa',
    organization: 'DOAN_KHOA',
    email: 'trung.nt@fee.edu.vn',
    phone: '0903 123 456',
    classGroup: 'Chi đoàn Cán bộ Giảng viên',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Thạc sĩ Kỹ thuật Viễn thông, 8 năm kinh nghiệm công tác Đoàn - Hội. Phụ trách chung công tác chính trị tư tưởng và định hướng chuyển đổi số.',
    department: 'Ban Thường vụ Đoàn Khoa',
  },
  {
    id: 'bch-2',
    name: 'Đ/c Lê Thị Hoàng Yến',
    position: 'Phó Bí thư Đoàn Khoa',
    organization: 'DOAN_KHOA',
    email: 'yen.lth@fee.edu.vn',
    phone: '0912 345 678',
    classGroup: 'D22_DKTD01',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    bio: 'Sinh viên 5 Tốt cấp Thành phố, Giải Nhì NCKH Sinh viên cấp Trường. Trực tiếp phụ trách Ban Học thuật.',
    department: 'Ban Học thuật & Nghiên cứu Khoa học',
  },
  {
    id: 'bch-3',
    name: 'Đ/c Trần Đăng Khoa',
    position: 'Chủ tịch Hội Sinh viên Khoa',
    organization: 'HOI_SINH_VIEN',
    email: 'khoa.td@fee.edu.vn',
    phone: '0988 765 432',
    classGroup: 'D22_DTVT02',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Chỉ huy trưởng Chiến dịch Mùa Hè Xanh, Thủ lĩnh Sinh viên tiêu biểu. Phụ trách phong trào Sinh viên 5 Tốt và các hoạt động văn thể mỹ.',
    department: 'Ban Thư ký Hội Sinh viên',
  },
  {
    id: 'bch-4',
    name: 'Đ/c Phạm Minh Đức',
    position: 'Phó Chủ tịch Hội Sinh viên - Trưởng Ban Truyền thông',
    organization: 'HOI_SINH_VIEN',
    email: 'duc.pm@fee.edu.vn',
    phone: '0977 112 233',
    classGroup: 'D23_KTDT03',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Trưởng Ban Kỹ thuật Cổng thông tin Đoàn - Hội FEE Portal, Đội trưởng FEE Media Production.',
    department: 'Ban Thông tin & Truyền thông (FEE Media)',
  },
  {
    id: 'bch-5',
    name: 'Đ/c Vũ Hải Đăng',
    position: 'Đội trưởng Đội Cộng tác viên',
    organization: 'DOI_CTV',
    email: 'dang.vh@robofee.org',
    phone: '0966 998 877',
    classGroup: 'D22_DKTD03',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    bio: 'Đội trưởng Đội tuyển Robocon Trường, Huy chương Vàng Thiết kế Robot tự hành cấp Khu vực 2025.',
    department: 'Đội Cộng tác viên Khoa Điện - Điện tử',
  },
  {
    id: 'bch-6',
    name: 'Đ/c Mai Phương Thảo',
    position: 'Đội phó Đội Cộng tác viên',
    organization: 'DOI_CTV',
    email: 'thao.mp@ctxh.fee.edu.vn',
    phone: '0933 445 566',
    classGroup: 'D23_Y_SINH01',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    bio: 'Gương thanh niên tình nguyện tiêu biểu, phụ trách mạng lưới hiến máu tình nguyện và dự án Nắng Ấm Biên Cương.',
    department: 'Đội Cộng tác viên Khoa Điện - Điện tử',
  }
];

export const INITIAL_REGISTRATIONS: RegistrationRecord[] = [
  {
    id: 'reg-001',
    eventId: 'evt-1',
    eventTitle: 'EE TECH DAY 2026: Triển lãm Đồ án & Ngày hội Tuyển dụng',
    fullName: 'Nguyễn Văn An',
    mssv: '2211001',
    email: '2211001@student.university.edu.vn',
    phone: '0912345678',
    classGroup: 'D22_DKTD01',
    faculty: 'Khoa Điện - Điện tử',
    registeredAt: '2026-08-14T10:15:00Z',
    ticketCode: 'FEE-TECH-88392',
    checkedIn: true,
    checkedInAt: '2026-08-15T08:10:00Z',
    note: 'Đã nhận quà tặng đại biểu',
  },
  {
    id: 'reg-002',
    eventId: 'evt-1',
    eventTitle: 'EE TECH DAY 2026: Triển lãm Đồ án & Ngày hội Tuyển dụng',
    fullName: 'Trần Thị Bích Ngọc',
    mssv: '2211089',
    email: '2211089@student.university.edu.vn',
    phone: '0987654321',
    classGroup: 'D22_DTVT02',
    faculty: 'Khoa Điện - Điện tử',
    registeredAt: '2026-08-14T11:45:00Z',
    ticketCode: 'FEE-TECH-91204',
    checkedIn: false,
  },
  {
    id: 'reg-003',
    eventId: 'evt-2',
    eventTitle: 'Hội thảo Chuyên sâu: Thiết kế Vi mạch Bán dẫn VLSI',
    fullName: 'Lê Quang Minh',
    mssv: '2111054',
    email: '2111054@student.university.edu.vn',
    phone: '0909112233',
    classGroup: 'D21_DTVT01',
    faculty: 'Khoa Điện - Điện tử',
    registeredAt: '2026-08-13T09:20:00Z',
    ticketCode: 'FEE-VLSI-44211',
    checkedIn: true,
    checkedInAt: '2026-08-15T09:05:00Z',
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Xác nhận đăng ký EE TECH DAY 2026 thành công',
    message: 'Vé điện tử mã #FEE-TECH-88392 đã sẵn sàng. Hãy xuất trình mã QR tại cổng Hội trường để điểm danh tham dự.',
    type: 'EVENT',
    timestamp: '10 phút trước',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Nhắc nhở: Hội thảo Vi mạch Bán dẫn diễn ra vào ngày 22/08',
    message: 'Phòng B302 đã mở cửa đón tiếp sinh viên từ 13:30. Vui lòng mang theo vé QR.',
    type: 'REMINDER',
    timestamp: '2 giờ trước',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Tin mới: Phát động Cuộc thi Vi mạch FEE IC-Design 2026',
    message: 'Tổng giải thưởng 150 triệu đồng và cơ hội thực tập tại các tập đoàn vi mạch hàng đầu.',
    type: 'NEWS',
    timestamp: '1 ngày trước',
    read: true,
  }
];
