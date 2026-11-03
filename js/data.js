// ===== DATA STORE =====
const DB = {
  users: [
    { id: 1, firstName: 'สมชาย', lastName: 'ใจดี', email: 'user@demo.com', password: '123456', phone: '081-234-5678', address: 'กรุงเทพฯ', status: 'active', role: 'user', joinDate: '2024-01-15' },
    { id: 2, firstName: 'สมหญิง', lastName: 'รักปลา', email: 'member@demo.com', password: '123456', phone: '089-876-5432', address: 'นนทบุรี', status: 'active', role: 'user', joinDate: '2024-02-20' },
    { id: 3, firstName: 'นายเดิน', lastName: 'ขาดเสียว', email: 'test@demo.com', password: '123456', phone: '062-345-6789', address: 'ปทุมธานี', status: 'active', role: 'user', joinDate: '2024-03-10' }
  ],
  admin: { username: 'admin', password: 'admin1234' },
  ponds: [
    {
      id: 1, name: 'บ่อที่ 1 - น้ำใสสุขใจ', type: 'ทั่วไป',
      price: 200, openTime: '06:00', closeTime: '20:00',
      capacity: 15, status: 'open',
      image: 'images/pond1.jpg',
      desc: 'บ่อตกปลาขนาดกลาง น้ำใสสะอาด ปลาชุกชุม เหมาะสำหรับครอบครัวและผู้เริ่มต้น มีอุปกรณ์ให้เช่า และร้านอาหารใกล้เคียง บรรยากาศร่มรื่น ล้อมรอบด้วยต้นไม้ใหญ่',
      facilities: ['ห้องน้ำ', 'ที่จอดรถ', 'ร้านอาหาร', 'เช่าอุปกรณ์', 'ไฟฟ้า'],
      fishTypes: ['ปลาตะเพียน', 'ปลานิล', 'ปลาดุก', 'ปลาบึก']
    },
    {
      id: 2, name: 'บ่อที่ 2 - เขาม่านหมอก', type: 'พรีเมียม',
      price: 350, openTime: '05:00', closeTime: '22:00',
      capacity: 20, status: 'open',
      image: 'images/pond2.jpg',
      desc: 'บ่อตกปลาขนาดใหญ่พรีเมียม มีปลาขนาดใหญ่ให้จับ บรรยากาศเหมือนธรรมชาติ มองเห็นวิวภูเขา เหมาะสำหรับนักตกปลาที่มีประสบการณ์ มีแพนั่งตกปลาหลายจุด',
      facilities: ['ห้องน้ำสะอาด', 'ที่จอดรถกว้าง', 'ร้านอาหาร', 'ห้องพัก', 'เช่าอุปกรณ์', 'WiFi', 'ไฟฟ้า'],
      fishTypes: ['ปลาบึก', 'ปลาชะโด', 'ปลากด', 'ปลาสวาย', 'ปลาตะเพียน']
    },
    {
      id: 3, name: 'บ่อที่ 3 - VIP สระแก้ว', type: 'VIP',
      price: 600, openTime: '06:00', closeTime: '22:00',
      capacity: 8, status: 'open',
      image: 'images/pond3.jpg',
      desc: 'บ่อ VIP สุดหรูหรา ปลาญี่ปุ่นและปลาแฟนซี สระน้ำใสสะอาดตลอดเวลา มีศาลาพัก อุปกรณ์ครบ บริการส่วนตัว เหมาะสำหรับกลุ่มเพื่อน งานสังสรรค์ หรือ Corporate Event',
      facilities: ['ห้องน้ำ VIP', 'ที่จอดรถ', 'ร้านอาหาร', 'ศาลาพักผ่อน', 'อุปกรณ์พรีเมียม', 'WiFi', 'ไฟฟ้า', 'แม่บ้าน', 'เครื่องดื่ม'],
      fishTypes: ['ปลาคาร์ปญี่ปุ่น', 'ปลาแฟนซี', 'ปลาบึกยักษ์', 'ปลาอะราไพม่า']
    }
  ],
  bookings: [
    {
      id: 1, ref: 'BK2024001', userId: 1, userName: 'สมชาย ใจดี', userPhone: '081-234-5678', userEmail: 'user@demo.com',
      pondId: 1, pondName: 'บ่อที่ 1 - น้ำใสสุขใจ',
      date: '2024-12-25', slot: 'เช้า (06:00-12:00)', persons: 2, note: '',
      status: 'confirmed', paymentMethod: 'transfer', paymentStatus: 'verified',
      amount: 1200, createdAt: '2024-12-20'
    },
    {
      id: 2, ref: 'BK2024002', userId: 2, userName: 'สมหญิง รักปลา', userPhone: '089-876-5432', userEmail: 'member@demo.com',
      pondId: 2, pondName: 'บ่อที่ 2 - เขาม่านหมอก',
      date: '2024-12-26', slot: 'บ่าย (12:00-18:00)', persons: 3, note: 'ต้องการอุปกรณ์พิเศษ',
      status: 'pending', paymentMethod: 'promptpay', paymentStatus: 'pending',
      amount: 2100, createdAt: '2024-12-21'
    },
    {
      id: 3, ref: 'BK2024003', userId: 1, userName: 'สมชาย ใจดี', userPhone: '081-234-5678', userEmail: 'user@demo.com',
      pondId: 3, pondName: 'บ่อที่ 3 - VIP สระแก้ว',
      date: '2024-12-28', slot: 'เต็มวัน (06:00-22:00)', persons: 4, note: 'งานวันเกิด',
      status: 'completed', paymentMethod: 'cash', paymentStatus: 'verified',
      amount: 9600, createdAt: '2024-12-18'
    },
    {
      id: 4, ref: 'BK2024004', userId: 3, userName: 'นายเดิน ขาดเสียว', userPhone: '062-345-6789', userEmail: 'test@demo.com',
      pondId: 1, pondName: 'บ่อที่ 1 - น้ำใสสุขใจ',
      date: '2025-01-05', slot: 'เย็น (18:00-22:00)', persons: 1, note: '',
      status: 'cancelled', paymentMethod: 'transfer', paymentStatus: 'rejected',
      amount: 800, createdAt: '2024-12-22'
    }
  ],
  news: [
    {
      id: 1, title: 'โปรโมชั่นพิเศษ! จองบ่อ VIP ลด 30%', category: 'โปรโมชั่น',
      content: 'สิ้นปีนี้พิเศษสุด! จองบ่อ VIP สระแก้ว ลดราคา 30% ทุกการจองในเดือนธันวาคม พร้อมรับของขวัญพิเศษจากทางบ่อ',
      image: '', startDate: '2024-12-01', endDate: '2024-12-31', status: 'active', createdAt: '2024-11-25'
    },
    {
      id: 2, title: 'เปิดบ่อใหม่! บ่อที่ 2 เขาม่านหมอก', category: 'ข่าวสาร',
      content: 'ยินดีต้อนรับบ่อใหม่ล่าสุด บ่อที่ 2 เขาม่านหมอก ขนาดใหญ่พรีเมียม มีปลาหลากชนิด บรรยากาศธรรมชาติ',
      image: '', startDate: '2024-11-01', endDate: '2025-01-31', status: 'active', createdAt: '2024-11-01'
    },
    {
      id: 3, title: 'กิจกรรม: แข่งขันตกปลาประจำปี 2025', category: 'กิจกรรม',
      content: 'ขอเชิญทุกท่านร่วมแข่งขันตกปลาประจำปี 2025 ชิงรางวัลรวมมูลค่ากว่า 50,000 บาท สมัครได้ตั้งแต่วันนี้',
      image: '', startDate: '2025-01-01', endDate: '2025-01-31', status: 'active', createdAt: '2024-12-01'
    },
    {
      id: 4, title: 'โปรนี้ตั้งใจให้แก๊งเรา: มากัน 5 จ่าย 4 & ส่วนลดนักศึกษา 10%', category: 'โปรโมชั่น',
      content: 'มาเป็นแก๊งยิ่งคุ้ม โปรนี้ตั้งใจให้นักศึกษาและวัยรุ่นได้ออกไปเที่ยวด้วยกันแบบไม่ปวดกระเป๋า! ชวนเพื่อนครบทุก 5 คน รับคนที่ 5 ฟรีทันที และสิทธิ์พิเศษแสดงบัตรนักศึกษา รับส่วนลดทันที 10%',
      image: '', startDate: '2025-01-01', endDate: '2025-12-31', status: 'active', createdAt: '2025-01-01'
    }
  ],
  nextId: { users: 4, bookings: 5, news: 5, ponds: 4 }
};

// Current logged in user
let currentUser = null;
let isAdmin = false;

// Save to localStorage
function saveDB() {
  localStorage.setItem('fishingpark_db', JSON.stringify(DB));
}

// Load from localStorage
function loadDB() {
  const saved = localStorage.getItem('fishingpark_db');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(DB, parsed);
      // Ensure bookings status and paymentStatus consistency
      if (Array.isArray(DB.bookings)) {
        let changed = false;
        DB.bookings.forEach(b => {
          if (b.status !== 'cancelled' && (b.ref === 'BK97696291' || b.paymentStatus === 'verified' || b.status === 'confirmed' || b.status === 'completed')) {
            if (b.status === 'pending') { b.status = 'confirmed'; changed = true; }
            if (b.paymentStatus === 'pending') { b.paymentStatus = 'verified'; changed = true; }
          }
        });
        if (changed) saveDB();
      }
    } catch (e) {
      console.error('Failed to parse DB:', e);
    }
  }
}

// Init
loadDB();
