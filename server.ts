import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  INITIAL_EVENTS, 
  INITIAL_NEWS, 
  INITIAL_BCH, 
  INITIAL_REGISTRATIONS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_STATS 
} from './src/data/mockData.ts';
import { EDITABLE_EVENT_FIELDS, EDITABLE_NEWS_FIELDS, pickFields } from './src/services/shared.ts';
import { EventItem, NewsItem, RegistrationRecord, NotificationItem, EmailDispatchLog } from './src/types/index.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory persistent state (seeded with rich realistic records)
  let events: EventItem[] = [...INITIAL_EVENTS];
  let news: NewsItem[] = [...INITIAL_NEWS];
  let registrations: RegistrationRecord[] = [...INITIAL_REGISTRATIONS];
  let notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  let emailLogs: EmailDispatchLog[] = [
    {
      id: 'email-001',
      recipientEmail: '2211001@student.university.edu.vn',
      recipientName: 'Nguyễn Văn An',
      subject: '[Đoàn - Hội Khoa Điện - Điện tử] Xác nhận đăng ký EE TECH DAY 2026 kèm Vé Điện Tử QR',
      type: 'REGISTRATION_CONFIRMATION',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      status: 'DELIVERED',
      ticketCode: 'TECH-88392'
    },
    {
      id: 'email-002',
      recipientEmail: '2111054@student.university.edu.vn',
      recipientName: 'Lê Quang Minh',
      subject: '[Đoàn - Hội Khoa Điện - Điện tử] Nhắc nhở: Hội thảo Thiết kế Vi mạch Bán dẫn VLSI diễn ra ngày mai',
      type: 'REMINDER_24H',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      status: 'DELIVERED',
      ticketCode: 'VLSI-44211'
    }
  ];

  // ================= API ROUTES =================

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Stats
  app.get('/api/stats', (req: Request, res: Response) => {
    const totalRegs = registrations.length + 4230;
    const totalCheckins = registrations.filter(r => r.checkedIn).length + 3890;
    res.json({
      ...INITIAL_STATS,
      totalRegistrations: totalRegs,
      totalCheckIns: totalCheckins,
      totalEventsHeld: events.length + 43,
      totalNewsPublished: news.length + 120
    });
  });

  // 3. News Feed
  app.get('/api/news', (req: Request, res: Response) => {
    const category = req.query.category as string;
    const search = req.query.search as string;

    let filtered = [...news];
    if (category && category !== 'ALL') {
      filtered = filtered.filter(item => item.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.summary.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    res.json(filtered);
  });

  app.post('/api/news', (req: Request, res: Response) => {
    const newArticle: NewsItem = {
      id: `news-${Date.now()}`,
      title: req.body.title || 'Tin tức mới',
      slug: (req.body.title || 'tin-tuc-moi').toLowerCase().replace(/\s+/g, '-'),
      summary: req.body.summary || '',
      content: req.body.content || '',
      category: req.body.category || 'HOAT_DONG_KHOA',
      categoryName: req.body.categoryName || 'Hoạt động Khoa',
      author: req.body.author || 'Ban TT-SK',
      authorRole: req.body.authorRole || 'Cộng tác viên Truyền thông',
      publishedAt: new Date().toISOString(),
      coverImage: req.body.coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      tags: req.body.tags || ['Đoàn - Hội', 'Tuổi trẻ'],
      views: 1
    };
    news.unshift(newArticle);

    // Create system notification
    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Tin mới: ${newArticle.title}`,
      message: newArticle.summary,
      type: 'NEWS',
      timestamp: 'Vừa xong',
      read: false
    });

    res.status(201).json(newArticle);
  });

  // 4. Events
  app.get('/api/events', (req: Request, res: Response) => {
    const type = req.query.type as string;
    const status = req.query.status as string;

    let filtered = [...events];
    if (type && type !== 'ALL') {
      filtered = filtered.filter(evt => evt.type === type);
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter(evt => evt.status === status);
    }
    res.json(filtered);
  });

  app.post('/api/events', (req: Request, res: Response) => {
    const newEvt: EventItem = {
      id: `evt-${Date.now()}`,
      title: req.body.title || 'Sự kiện mới',
      slug: (req.body.title || 'su-kien-moi').toLowerCase().replace(/\s+/g, '-'),
      description: req.body.description || '',
      content: req.body.content || req.body.description || '',
      type: req.body.type || 'ACADEMIC_CONTEST',
      typeName: req.body.typeName || 'Học thuật & Triển lãm',
      status: req.body.status || 'REGISTRATION_OPEN',
      location: req.body.location || 'Hội trường A Khoa Điện - Điện tử',
      eventDate: req.body.eventDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      startTime: req.body.startTime || '08:00',
      endTime: req.body.endTime || '11:30',
      registrationDeadline: req.body.registrationDeadline || new Date(Date.now() + 86400000 * 6).toISOString(),
      maxParticipants: Number(req.body.maxParticipants) || 200,
      currentParticipants: 0,
      bannerUrl: req.body.bannerUrl || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      organizer: req.body.organizer || 'Đoàn - Hội Khoa Điện - Điện tử',
      contactEmail: req.body.contactEmail || 'doanhoi.fee@university.edu.vn',
      requirements: req.body.requirements || ['Thẻ sinh viên', 'Áo Đoàn / Đồng phục'],
      isMandatoryCheckIn: true
    };
    events.unshift(newEvt);

    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Sự kiện mới: ${newEvt.title}`,
      message: `Đang mở đăng ký tham gia. Hạn chót: ${newEvt.registrationDeadline.split('T')[0]}.`,
      type: 'EVENT',
      timestamp: 'Vừa xong',
      read: false
    });

    res.status(201).json(newEvt);
  });

  app.patch('/api/events/:id', (req: Request, res: Response) => {
    const event = events.find(e => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Sự kiện không tồn tại' });
    Object.assign(event, pickFields<EventItem, typeof EDITABLE_EVENT_FIELDS[number]>(req.body, EDITABLE_EVENT_FIELDS));
    registrations.forEach(r => { if (r.eventId === event.id) r.eventTitle = event.title; });
    res.json(event);
  });

  app.patch('/api/news/:id', (req: Request, res: Response) => {
    const article = news.find(n => n.id === req.params.id);
    if (!article) return res.status(404).json({ error: 'Bài viết không tồn tại' });
    Object.assign(article, pickFields<NewsItem, typeof EDITABLE_NEWS_FIELDS[number]>(req.body, EDITABLE_NEWS_FIELDS));
    res.json(article);
  });

  app.delete('/api/news/:id', (req: Request, res: Response) => {
    news = news.filter(n => n.id !== req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/events/:id', (req: Request, res: Response) => {
    const before = registrations.length;
    events = events.filter(e => e.id !== req.params.id);
    registrations = registrations.filter(r => r.eventId !== req.params.id);
    res.json({ deletedRegistrations: before - registrations.length });
  });

  // 5. Event Registration & Automated Ticket generation
  app.post('/api/events/:id/register', (req: Request, res: Response) => {
    const eventId = req.params.id;
    const { fullName, mssv, email, phone, classGroup, faculty, note } = req.body;

    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: 'Sự kiện không tồn tại' });
    }

    // Check if event is open for registration
    if (event.status !== 'REGISTRATION_OPEN') {
      return res.status(400).json({ error: 'Sự kiện hiện không mở đăng ký' });
    }

    // Check if quota full
    if (event.currentParticipants >= event.maxParticipants) {
      event.status = 'REGISTRATION_CLOSED';
      return res.status(400).json({ error: 'Sự kiện đã đủ số lượng đăng ký tối đa' });
    }

    // Check for duplicate registration by MSSV for this event
    const existing = registrations.find(r => r.eventId === eventId && r.mssv.trim().toLowerCase() === (mssv || '').trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ 
        error: `MSSV ${mssv} đã đăng ký sự kiện này trước đó với mã vé #${existing.ticketCode}`,
        existingRecord: existing 
      });
    }

    // Generate unique Ticket Code
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const prefix = event.type === 'ACADEMIC_CONTEST' ? 'ACAD' : event.type === 'SEMINAR_WORKSHOP' ? 'SEMI' : 'EVT';
    const ticketCode = `${prefix}-${randomSuffix}`;

    const newRecord: RegistrationRecord = {
      id: `reg-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      fullName: fullName.trim(),
      mssv: mssv.trim(),
      email: email.trim(),
      phone: phone.trim(),
      classGroup: classGroup ? classGroup.trim() : 'Khoa Điện - Điện tử',
      faculty: faculty || 'Khoa Điện - Điện tử',
      registeredAt: new Date().toISOString(),
      ticketCode,
      checkedIn: false,
      note
    };

    registrations.unshift(newRecord);
    event.currentParticipants += 1;

    // Check if quota reached after this registration
    if (event.currentParticipants >= event.maxParticipants) {
      event.status = 'REGISTRATION_CLOSED';
    }

    // Automated Email Dispatch Simulation
    const emailLog: EmailDispatchLog = {
      id: `email-${Date.now()}`,
      recipientEmail: newRecord.email,
      recipientName: newRecord.fullName,
      subject: `[Đoàn - Hội Khoa Điện - Điện tử] Xác nhận đăng ký "${event.title}" - Mã vé QR: ${ticketCode}`,
      type: 'REGISTRATION_CONFIRMATION',
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
      ticketCode
    };
    emailLogs.unshift(emailLog);

    // Automated In-App Notification
    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Đăng ký thành công: ${event.title}`,
      message: `Mã vé điện tử của bạn: #${ticketCode}. Vui lòng lưu mã QR để quét điểm danh tại cửa.`,
      type: 'EVENT',
      timestamp: 'Vừa xong',
      read: false
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tham gia sự kiện thành công!',
      registration: newRecord,
      eventUpdated: event
    });
  });

  // 6. QR Code / MSSV Check-In (Attendance confirmation)
  app.post('/api/attendance/check-in', (req: Request, res: Response) => {
    const { code, eventId } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Mã vé hoặc MSSV không được để trống' });
    }

    const query = code.trim().toUpperCase();

    // Find registration record by ticketCode OR by MSSV
    let target = registrations.find(r => 
      r.ticketCode.toUpperCase() === query || 
      (eventId ? (r.eventId === eventId && r.mssv.toUpperCase() === query) : r.mssv.toUpperCase() === query)
    );

    if (!target) {
      return res.status(404).json({ 
        error: `Không tìm thấy thông tin đăng ký cho mã "${code}". Vui lòng kiểm tra lại.` 
      });
    }

    if (target.checkedIn) {
      return res.status(409).json({
        warning: true,
        message: `Sinh viên ${target.fullName} (${target.mssv}) ĐÃ ĐƯỢC ĐIỂM DANH trước đó vào lúc ${new Date(target.checkedInAt!).toLocaleTimeString('vi-VN')}.`,
        record: target
      });
    }

    // Mark checked in
    target.checkedIn = true;
    target.checkedInAt = new Date().toISOString();

    // Log attendance confirmation email
    emailLogs.unshift({
      id: `email-${Date.now()}`,
      recipientEmail: target.email,
      recipientName: target.fullName,
      subject: `[Đoàn - Hội Khoa Điện - Điện tử] Ghi nhận Điểm danh tham dự thành công`,
      type: 'ATTENDANCE_SUCCESS',
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
      ticketCode: target.ticketCode
    });

    res.json({
      success: true,
      message: `Điểm danh thành công cho sinh viên ${target.fullName} (${target.mssv})!`,
      record: target
    });
  });

  // 7. Student Registration & Attendance History Lookup
  app.get('/api/attendance/student/:mssv', (req: Request, res: Response) => {
    const mssv = req.params.mssv.trim().toLowerCase();
    const records = registrations.filter(r => r.mssv.toLowerCase() === mssv);

    res.json({
      mssv: req.params.mssv,
      studentName: records[0]?.fullName || 'Sinh viên Khoa Điện - Điện tử',
      classGroup: records[0]?.classGroup || 'Khoa Điện - Điện tử',
      totalRegistered: records.length,
      totalCheckedIn: records.filter(r => r.checkedIn).length,
      history: records
    });
  });

  // 8. Registrations List for Admin
  app.get('/api/registrations', (req: Request, res: Response) => {
    const eventId = req.query.eventId as string;
    const search = req.query.search as string;

    let filtered = [...registrations];
    if (eventId && eventId !== 'ALL') {
      filtered = filtered.filter(r => r.eventId === eventId);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.fullName.toLowerCase().includes(q) ||
        r.mssv.toLowerCase().includes(q) ||
        r.ticketCode.toLowerCase().includes(q) ||
        r.classGroup.toLowerCase().includes(q)
      );
    }
    res.json(filtered);
  });

  // 9. Automated Email Reminder trigger
  app.post('/api/notifications/send-reminder', (req: Request, res: Response) => {
    const { eventId } = req.body;
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: 'Sự kiện không tồn tại' });
    }

    const participants = registrations.filter(r => r.eventId === eventId);
    let sentCount = 0;

    participants.forEach(p => {
      emailLogs.unshift({
        id: `email-${Date.now()}-${Math.random()}`,
        recipientEmail: p.email,
        recipientName: p.fullName,
        subject: `[Nhắc nhở 24h] Sự kiện "${event.title}" sắp diễn ra tại ${event.location}`,
        type: 'REMINDER_24H',
        sentAt: new Date().toISOString(),
        status: 'DELIVERED',
        ticketCode: p.ticketCode
      });
      sentCount++;
    });

    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Đã gửi thông báo nhắc nhở 24h`,
      message: `Hệ thống đã tự động gửi email nhắc nhở kèm mã vé QR đến ${sentCount} sinh viên tham gia sự kiện "${event.title}".`,
      type: 'REMINDER',
      timestamp: 'Vừa xong',
      read: false
    });

    res.json({
      success: true,
      message: `Đã tự động gửi email nhắc nhở 24h đến ${sentCount} sinh viên thành công!`,
      sentCount
    });
  });

  // 10. BCH Members
  app.get('/api/bch', (req: Request, res: Response) => {
    res.json(INITIAL_BCH);
  });

  // 11. Notifications List & Read status
  app.get('/api/notifications', (req: Request, res: Response) => {
    res.json(notifications);
  });

  app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
    notifications.forEach(n => n.read = true);
    res.json({ success: true, count: notifications.length });
  });

  // 12. Email Dispatch Logs
  app.get('/api/email-logs', (req: Request, res: Response) => {
    res.json(emailLogs);
  });

  // ================= VITE MIDDLEWARE =================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
