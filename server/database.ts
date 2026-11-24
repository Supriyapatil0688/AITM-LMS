import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  UserProfile,
  Course,
  CourseEnrollment,
  LearningResource,
  Application,
  Meeting,
  Announcement,
  NotificationItem,
  InstituteSettings,
  CourseStatus,
  ApplicationStatus,
  AccountStatus,
  StudentEnrollmentRecord,
  StudentEnrollmentStatus,
  CourseEnrollmentReportItem,
  EnrollmentDashboardStats,
  Inquiry,
  ActivityLog,
  EnrolledStudent,
  EnrolledStudentStats,
  EnrolledStudentStatus,
  StudentGender,
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'aitm.db');
const sqlite = new DatabaseSync(DB_PATH);

sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

// ---------------------------------------------------------------------------
// Schema Initialization
// ---------------------------------------------------------------------------
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS institute_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    institute_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    head_office_address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    hours TEXT NOT NULL,
    iso_certification TEXT NOT NULL,
    nsdc_affiliation TEXT NOT NULL,
    portal_notice TEXT,
    logo_url TEXT,
    hero_badge TEXT,
    hero_headline TEXT,
    hero_subtitle TEXT,
    hero_image_url TEXT,
    hero_workshop_image_url TEXT,
    hero_workshop_label TEXT,
    hero_workshop_title TEXT,
    hero_workshop_desc TEXT,
    about_title TEXT,
    about_description TEXT,
    about_sub_description TEXT,
    about_image_1_url TEXT,
    about_image_2_url TEXT,
    placement_title TEXT,
    placement_description TEXT,
    placement_image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
    student_id TEXT,
    mobile_number TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    batch TEXT,
    joining_date TEXT,
    password_hash TEXT,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration TEXT NOT NULL,
    course_type TEXT NOT NULL,
    batch TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    instructor_name TEXT NOT NULL,
    instructor_role TEXT,
    fees TEXT,
    fee_info TEXT,
    total_seats INTEGER NOT NULL DEFAULT 40,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    syllabus_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS course_enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),
    enrolled_at TEXT NOT NULL,
    UNIQUE(student_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS student_enrollment_records (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT NOT NULL,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    batch TEXT NOT NULL,
    enrollment_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Enrolled', 'Pending', 'Completed')),
    student_id TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS learning_resources (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL,
    url_or_path TEXT NOT NULL,
    file_name TEXT,
    file_size_bytes INTEGER,
    duration_minutes INTEGER,
    is_private INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    course_title TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    meeting_url TEXT NOT NULL,
    platform TEXT NOT NULL,
    target_batch TEXT,
    host_name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    course_title TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    is_published INTEGER NOT NULL DEFAULT 1,
    target_role TEXT NOT NULL DEFAULT 'all',
    target_batch TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    education_qualification TEXT NOT NULL,
    interested_course_id TEXT NOT NULL,
    interested_course_title TEXT,
    program_type TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
    admin_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved')),
    admin_notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    type TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS enrolled_students (
    id TEXT PRIMARY KEY,
    location TEXT NOT NULL DEFAULT '',
    employee_code TEXT NOT NULL,
    student_name TEXT NOT NULL,
    mother_name TEXT NOT NULL DEFAULT '',
    father_name TEXT NOT NULL DEFAULT '',
    date_of_birth TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    mobile_number TEXT NOT NULL DEFAULT '',
    gender TEXT NOT NULL DEFAULT '',
    aadhaar_number TEXT NOT NULL DEFAULT '',
    permanent_address TEXT NOT NULL DEFAULT '',
    pan_number TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    remarks TEXT NOT NULL DEFAULT '',
    registration_date TEXT NOT NULL DEFAULT '',
    assigned_staff_name TEXT NOT NULL DEFAULT '',
    abc_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_enrolled_students_emp_code
    ON enrolled_students(LOWER(TRIM(employee_code)));
`);

// ---------------------------------------------------------------------------
// Password Hashing Utilities (scrypt + random salt + timingSafeEqual)
// ---------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derived = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(keyBuf, derived);
}

// ---------------------------------------------------------------------------
// Seed Initial Data ONLY if tables are completely empty on first boot
// ---------------------------------------------------------------------------
function seedDatabaseIfEmpty(): void {
  const settingsCount = sqlite.prepare('SELECT COUNT(*) as cnt FROM institute_settings').get() as { cnt: number };
  if (settingsCount.cnt === 0) {
    sqlite.prepare(`
      INSERT INTO institute_settings (
        id, institute_name, short_name, tagline, head_office_address, phone, email, hours,
        iso_certification, nsdc_affiliation, portal_notice, logo_url,
        hero_badge, hero_headline, hero_subtitle, hero_image_url, hero_workshop_image_url,
        hero_workshop_label, hero_workshop_title, hero_workshop_desc,
        about_title, about_description, about_sub_description, about_image_1_url, about_image_2_url,
        placement_title, placement_description, placement_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      'Abhinav Institute of Technology & Management',
      'AITM',
      'Bridging Industry Standards with Hands-On Vocational Excellence & Apprenticeship Solutions',
      'Premises 1, Manjula Arcade, 3rd Floor, Gopal Krishna Gokhale Marg, near Cosmos Bank, Naupada, Thane West, Maharashtra 400602',
      '022 49690327',
      'aitm.connect@abhinavinst.com',
      'Monday – Saturday: 9:30 AM – 6:30 PM',
      'ISO 9001:2015 Certified Quality Management',
      'Affiliated with NSDC & National Sector Skill Councils',
      'Admissions Open for NAPS & NATS 2026-27 Apprenticeship Batches. Industry stipends guaranteed.',
      '/assets/aistudio/image_e53c2b5b.png',
      'ISO 9001:2015 Certified · NSDC Training Partner · Thane',
      'Empowering Youth with Industry Apprenticeships & Technical Skills',
      'Abhinav Institute of Technology & Management (AITM) bridges the divide between corporate workforce demands and job-seeking candidates through NAPS, NATS, and YCMOU-affiliated Learn & Earn frameworks.',
      '/src/assets/images/hero_aitm_campus_1792739247335.jpg',
      '/src/assets/images/aitm_industrial_training_1792739247502.jpg',
      'Practical Training Center · Thane West',
      'Haas CNC & Automation Precision Engineering Laboratory',
      'Hands-on machine operations, G-code part programming, and PLC automation.',
      'Transforming Aspirations into Skilled Careers',
      'Abhinav Institute of Technology & Management (AITM) was founded to address one of India’s most critical industrial challenges: closing the talent gap between academic knowledge and actual shop-floor engineering requirements.',
      'Headquartered in Thane, Maharashtra, with operations across western and northern industrial corridors, AITM works directly with industrial employers, government bodies, and universities to equip trainees with real mechanical, electrical, computing, and management capabilities.',
      '/src/assets/images/aitm_it_lab_1792739250007.jpg',
      '/src/assets/images/aitm_apprenticeship_workplace_1792739247560.jpg',
      'Placement & Industry Apprenticeship Support',
      'AITM operates an active Placement Cell coordinating with manufacturing clusters in Thane-Belapur, Chakan, Sanand, and NCR industrial parks. Trainees are supported from day one with interview preparation, resume structuring, and statutory apprenticeship contracts.',
      '/src/assets/images/aitm_apprenticeship_workplace_1792739247560.jpg'
    );
  }

  const usersCount = sqlite.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (usersCount.cnt === 0) {
    const adminEnvPass = process.env.ADMIN_INITIAL_PASSWORD?.trim();
    const adminHash = adminEnvPass ? hashPassword(adminEnvPass) : null;

    const insertUser = sqlite.prepare(`
      INSERT INTO users (id, email, full_name, role, student_id, mobile_number, avatar_url, status, batch, joining_date, password_hash, must_change_password, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'user-admin-01',
      'admin@abhinavinst.com',
      'Director S. K. Kulkarni',
      'admin',
      'AITM-ADMIN-01',
      '+91 98201 44321',
      null,
      'active',
      null,
      null,
      adminHash,
      adminHash ? 0 : 1,
      '2026-01-15T09:00:00Z'
    );

    const studentSeed = [
      ['user-student-01', 'rahul.shinde@student.aitm', 'Rahul Shinde', 'AITM-2026-081', '+91 98334 11223', 'Batch 2026-A (CNC)', '2026-02-01', '2026-02-01T10:00:00Z'],
      ['user-student-02', 'sneha.patil@student.aitm', 'Sneha Patil', 'AITM-2026-104', '+91 98220 55678', 'Batch 2026-B (IT/ITES)', '2026-02-15', '2026-02-15T11:00:00Z'],
      ['user-student-03', 'amit.verma@student.aitm', 'Amit Verma', 'AITM-2026-142', '+91 97690 99881', 'Batch 2026-C (Learn & Earn)', '2026-03-01', '2026-03-01T10:00:00Z'],
    ] as const;

    for (const s of studentSeed) {
      insertUser.run(s[0], s[1], s[2], 'student', s[3], s[4], null, 'active', s[5], s[6], null, 1, s[7]);
    }
  }

  const coursesCount = sqlite.prepare('SELECT COUNT(*) as cnt FROM courses').get() as { cnt: number };
  if (coursesCount.cnt === 0) {
    const insertCourse = sqlite.prepare(`
      INSERT INTO courses (
        id, title, slug, description, category, thumbnail_url, duration, course_type, batch,
        start_date, end_date, instructor_name, instructor_role, fees, fee_info, total_seats,
        status, syllabus_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCourse.run(
      'course-cnc-01',
      'Industrial Automation & CNC Precision Manufacturing',
      'industrial-automation-cnc',
      'Practical training on Haas CNC vertical milling centers, Fanuc controllers, PLC automation, and industrial metrology under the National Apprenticeship Promotion Scheme (NAPS).',
      'Manufacturing & Automation',
      '/src/assets/images/aitm_industrial_training_1792739247502.jpg',
      '12 Months (Dual Work-Study)',
      'Apprenticeship (NAPS)',
      'Batch 2026-A (CNC)',
      '2026-02-01',
      '2027-01-31',
      'Er. Rajesh Deshpande',
      'Head of Industrial Automation',
      '₹ 45,000 (Govt Stipend Supported)',
      'Government Stipend Supported (NAPS Framework)',
      40,
      'published',
      JSON.stringify([
        'Industrial Safety, 5S & Machine Tool Fundamentals',
        'Blueprint Reading & Geometric Dimensioning & Tolerancing (GD&T)',
        'G-Code and M-Code CNC Programming for Milling & Lathe',
        'Haas & Fanuc Controller Operation & Tool Offset Setup',
        'PLC Automation, Sensors & Pneumatic Circuits',
        'Quality Control, CMM & Vernier Metrology',
      ]),
      '2026-01-10T10:00:00Z',
      '2026-02-01T10:00:00Z'
    );

    insertCourse.run(
      'course-it-02',
      'IT / ITES Software & Cloud Infrastructure Support',
      'it-ites-cloud-support',
      'Comprehensive industry-aligned training covering full-stack web engineering, Linux system administration, database management, cloud networking, and IT service desk workflows.',
      'Information Technology',
      '/src/assets/images/aitm_it_lab_1792739250007.jpg',
      '12 Months (NATS Framework)',
      'Apprenticeship (NATS)',
      'Batch 2026-B (IT/ITES)',
      '2026-02-15',
      '2027-02-14',
      'Prof. Ananya Sen',
      'Lead Cloud & Systems Architect',
      '₹ 40,000 (NATS Stipend Eligible)',
      'Monthly Stipend as per NATS norms',
      50,
      'published',
      JSON.stringify([
        'Computing Architecture, Linux Terminal & Shell Scripting',
        'Modern Web Technologies: TypeScript, React & Node.js',
        'Relational Databases (PostgreSQL) & Data Modeling',
        'Networking Fundamentals, DNS, SSL & Cloud VPCs',
        'ITIL Framework, Incident Resolution & Helpdesk Ops',
        'DevOps CI/CD Pipelines & Containerization basics',
      ]),
      '2026-01-12T10:00:00Z',
      '2026-02-15T10:00:00Z'
    );

    insertCourse.run(
      'course-mechatronics-03',
      'Learn & Earn: Work-Integrated Mechatronics Engineering',
      'learn-earn-mechatronics',
      'Work-integrated diploma & degree pathway affiliated with YCMOU. Students gain active on-the-job industrial experience at partnering automotive plants while completing academic modules.',
      'Work-Integrated Education',
      '/src/assets/images/aitm_apprenticeship_workplace_1792739247560.jpg',
      '24 Months (Diploma / Degree)',
      'Learn & Earn',
      'Batch 2026-C (Learn & Earn)',
      '2026-03-01',
      '2028-02-28',
      'Dr. Vinayak Joshi',
      'Academic Dean, Work-Integrated Learning',
      '₹ 55,000 (YCMOU Degree & Stipend)',
      'Earn monthly stipend while pursuing accredited degree',
      60,
      'published',
      JSON.stringify([
        'Mechanical Systems & Hydraulics Engineering',
        'Industrial Electrical Drives & Motor Control Systems',
        'Microcontrollers & Embedded IoT in Production Lines',
        'Plant Maintenance & Total Productive Maintenance (TPM)',
        'Automotive Assembly Systems & Quality Standards',
        'Final Work-Integrated Capstone Evaluation',
      ]),
      '2026-01-20T10:00:00Z',
      '2026-03-01T10:00:00Z'
    );

    insertCourse.run(
      'course-sixsigma-04',
      'Quality Engineering, Kaizen & Lean Six Sigma Green Belt',
      'quality-engineering-six-sigma',
      'Executive and technical skill development program covering statistical process control (SPC), root cause analysis (8D/Fishbone), ISO audits, and continuous improvement.',
      'Quality Assurance & Management',
      '/src/assets/images/hero_aitm_campus_1792739247335.jpg',
      '3 Months (Weekend & Evening)',
      'Certification',
      'Batch Q2-2026',
      '2026-04-01',
      '2026-06-30',
      'Shri Makarand Sathe',
      'Master Black Belt Consultant',
      '₹ 14,500',
      'INR 14,500 (Corporate sponsorships available)',
      30,
      'published',
      JSON.stringify([
        'DMAIC Methodology (Define, Measure, Analyze, Improve, Control)',
        'Statistical Process Control (SPC) & Control Charts',
        'Failure Mode and Effects Analysis (FMEA)',
        'Kaizen, Poka-Yoke & Poke-Error Proofing in Manufacturing',
        'ISO 9001:2015 Audit Procedures & Documentation',
      ]),
      '2026-02-01T10:00:00Z',
      '2026-03-10T10:00:00Z'
    );

    // Seed LMS course enrollments
    const insertEnr = sqlite.prepare(`
      INSERT INTO course_enrollments (id, student_id, course_id, status, enrolled_at) VALUES (?, ?, ?, ?, ?)
    `);
    insertEnr.run('enr-01', 'user-student-01', 'course-cnc-01', 'active', '2026-02-01T10:00:00Z');
    insertEnr.run('enr-02', 'user-student-02', 'course-it-02', 'active', '2026-02-15T11:00:00Z');
    insertEnr.run('enr-03', 'user-student-03', 'course-mechatronics-03', 'active', '2026-03-01T10:00:00Z');

    // Seed Student Enrollment Records (24 records across courses)
    const insertRec = sqlite.prepare(`
      INSERT INTO student_enrollment_records (
        id, full_name, mobile_number, email, course_id, course_name, batch, enrollment_date, status, student_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const recSeed: Array<[string, string, string, string, string, string, string, string, StudentEnrollmentStatus, string, string]> = [
      ['enr-rec-001', 'Rahul Shinde', '+91 98334 11223', 'rahul.shinde@student.aitm', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'Batch 2026-A (CNC)', '2026-02-01', 'Enrolled', 'AITM-2026-081', '2026-02-01T10:00:00Z'],
      ['enr-rec-002', 'Pooja Jadhav', '+91 98205 12345', 'pooja.jadhav@gmail.com', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'Batch 2026-A (CNC)', '2026-02-05', 'Enrolled', 'AITM-2026-082', '2026-02-05T11:00:00Z'],
      ['enr-rec-003', 'Kunal Deshmukh', '+91 98190 77654', 'kunal.deshmukh@gmail.com', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'Batch 2026-A (CNC)', '2026-02-10', 'Enrolled', 'AITM-2026-083', '2026-02-10T09:30:00Z'],
      ['enr-rec-004', 'Aditya Mane', '+91 98214 33211', 'aditya.mane@outlook.com', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'Batch 2026-A (CNC)', '2026-02-12', 'Enrolled', 'AITM-2026-084', '2026-02-12T14:00:00Z'],
      ['enr-rec-005', 'Gaurav Sawant', '+91 98331 44552', 'gaurav.sawant@yahoo.com', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'Batch 2026-A (CNC)', '2026-03-01', 'Pending', 'AITM-2026-085', '2026-03-01T10:15:00Z'],
      ['enr-rec-006', 'Tanvi Kadam', '+91 97690 12890', 'tanvi.kadam@gmail.com', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'Batch 2026-A (CNC)', '2026-03-05', 'Pending', 'AITM-2026-086', '2026-03-05T12:00:00Z'],
      ['enr-rec-007', 'Sneha Patil', '+91 98220 55678', 'sneha.patil@student.aitm', 'course-it-02', 'IT / ITES Software & Cloud Infrastructure Support', 'Batch 2026-B (IT/ITES)', '2026-02-15', 'Enrolled', 'AITM-2026-104', '2026-02-15T11:00:00Z'],
      ['enr-rec-008', 'Prathamesh Rane', '+91 98200 44112', 'prathamesh.rane@gmail.com', 'course-it-02', 'IT / ITES Software & Cloud Infrastructure Support', 'Batch 2026-B (IT/ITES)', '2026-02-18', 'Enrolled', 'AITM-2026-105', '2026-02-18T10:00:00Z'],
      ['enr-rec-009', 'Aishwarya Pawar', '+91 99201 88765', 'aishwarya.pawar@gmail.com', 'course-it-02', 'IT / ITES Software & Cloud Infrastructure Support', 'Batch 2026-B (IT/ITES)', '2026-02-20', 'Enrolled', 'AITM-2026-106', '2026-02-20T14:30:00Z'],
      ['enr-rec-010', 'Nikhil More', '+91 98192 33412', 'nikhil.more@hotmail.com', 'course-it-02', 'IT / ITES Software & Cloud Infrastructure Support', 'Batch 2026-B (IT/ITES)', '2026-02-22', 'Enrolled', 'AITM-2026-107', '2026-02-22T16:00:00Z'],
      ['enr-rec-011', 'Rupali Gaikwad', '+91 98337 55621', 'rupali.gaikwad@gmail.com', 'course-it-02', 'IT / ITES Software & Cloud Infrastructure Support', 'Batch 2026-B (IT/ITES)', '2026-02-25', 'Enrolled', 'AITM-2026-108', '2026-02-25T09:45:00Z'],
      ['enr-rec-012', 'Siddhesh Chavan', '+91 97693 77812', 'siddhesh.chavan@yahoo.com', 'course-it-02', 'IT / ITES Software & Cloud Infrastructure Support', 'Batch 2026-B (IT/ITES)', '2026-03-02', 'Pending', 'AITM-2026-109', '2026-03-02T11:20:00Z'],
      ['enr-rec-013', 'Amit Verma', '+91 97690 99881', 'amit.verma@student.aitm', 'course-mechatronics-03', 'Learn & Earn: Work-Integrated Mechatronics Engineering', 'Batch 2026-C (Learn & Earn)', '2026-03-01', 'Enrolled', 'AITM-2026-142', '2026-03-01T10:00:00Z'],
      ['enr-rec-014', 'Swapnil Bhosale', '+91 98208 66123', 'swapnil.bhosale@gmail.com', 'course-mechatronics-03', 'Learn & Earn: Work-Integrated Mechatronics Engineering', 'Batch 2026-C (Learn & Earn)', '2026-03-03', 'Enrolled', 'AITM-2026-143', '2026-03-03T11:30:00Z'],
      ['enr-rec-015', 'Deepak Nalawade', '+91 98199 44321', 'deepak.nalawade@gmail.com', 'course-mechatronics-03', 'Learn & Earn: Work-Integrated Mechatronics Engineering', 'Batch 2026-C (Learn & Earn)', '2026-03-04', 'Enrolled', 'AITM-2026-144', '2026-03-04T13:00:00Z'],
      ['enr-rec-016', 'Meera Salunke', '+91 98330 11987', 'meera.salunke@outlook.com', 'course-mechatronics-03', 'Learn & Earn: Work-Integrated Mechatronics Engineering', 'Batch 2026-C (Learn & Earn)', '2026-03-06', 'Enrolled', 'AITM-2026-145', '2026-03-06T15:00:00Z'],
      ['enr-rec-017', 'Harshada Thorat', '+91 98207 99221', 'harshada.thorat@gmail.com', 'course-mechatronics-03', 'Learn & Earn: Work-Integrated Mechatronics Engineering', 'Batch 2026-C (Learn & Earn)', '2026-03-08', 'Enrolled', 'AITM-2026-146', '2026-03-08T10:00:00Z'],
      ['enr-rec-018', 'Chetan Jagtap', '+91 98196 22134', 'chetan.jagtap@gmail.com', 'course-mechatronics-03', 'Learn & Earn: Work-Integrated Mechatronics Engineering', 'Batch 2026-C (Learn & Earn)', '2026-03-10', 'Enrolled', 'AITM-2026-147', '2026-03-10T12:00:00Z'],
      ['enr-rec-019', 'Omkar Sawant', '+91 97691 88456', 'omkar.sawant@gmail.com', 'course-mechatronics-03', 'Learn & Earn: Work-Integrated Mechatronics Engineering', 'Batch 2026-C (Learn & Earn)', '2026-03-12', 'Pending', 'AITM-2026-148', '2026-03-12T14:15:00Z'],
      ['enr-rec-020', 'Suresh Iyer', '+91 98202 77123', 'suresh.iyer@corporate.com', 'course-sixsigma-04', 'Quality Engineering, Kaizen & Lean Six Sigma Green Belt', 'Batch Q2-2026', '2026-03-15', 'Enrolled', 'AITM-2026-201', '2026-03-15T09:00:00Z'],
      ['enr-rec-021', 'Neelam Tambe', '+91 98335 44901', 'neelam.tambe@gmail.com', 'course-sixsigma-04', 'Quality Engineering, Kaizen & Lean Six Sigma Green Belt', 'Batch Q2-2026', '2026-03-16', 'Enrolled', 'AITM-2026-202', '2026-03-16T11:00:00Z'],
      ['enr-rec-022', 'Vikram Joshi', '+91 99203 11889', 'vikram.joshi@tata.com', 'course-sixsigma-04', 'Quality Engineering, Kaizen & Lean Six Sigma Green Belt', 'Batch Q2-2026', '2026-03-18', 'Enrolled', 'AITM-2026-203', '2026-03-18T14:00:00Z'],
      ['enr-rec-023', 'Manish Patil', '+91 98198 33201', 'manish.patil@gmail.com', 'course-sixsigma-04', 'Quality Engineering, Kaizen & Lean Six Sigma Green Belt', 'Batch Q2-2026', '2026-03-20', 'Pending', 'AITM-2026-204', '2026-03-20T16:00:00Z'],
      ['enr-rec-024', 'Abhishek Gokhale', '+91 98209 11452', 'abhishek.g@alumni.aitm', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'Batch 2025-A (CNC)', '2025-02-01', 'Completed', 'AITM-2025-012', '2025-02-01T10:00:00Z'],
    ];
    for (const r of recSeed) {
      insertRec.run(...r);
    }

    // Seed Learning Resources
    const insertRes = sqlite.prepare(`
      INSERT INTO learning_resources (
        id, course_id, title, description, resource_type, url_or_path, file_name, file_size_bytes,
        duration_minutes, is_private, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertRes.run('res-cnc-pdf-01', 'course-cnc-01', 'AITM CNC Part Programming Reference Guide & G-Code Cheat Sheet', 'Official 48-page technical manual covering all Haas and Fanuc canned cycles, spindle commands, and tool compensation math.', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'AITM_CNC_Programming_Manual_v2.pdf', 3450000, null, 1, 1, '2026-02-02T10:00:00Z');
    insertRes.run('res-cnc-yt-02', 'course-cnc-01', 'Live Workshop Video: Setting Work Coordinate Offsets (G54-G59)', 'Demonstration by Er. Rajesh Deshpande on setting mechanical edge finders and Z-axis touch probes.', 'youtube_video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', null, null, 24, 1, 2, '2026-02-04T12:00:00Z');
    insertRes.run('res-cnc-pdf-03', 'course-cnc-01', 'ISO Geometric Dimensioning & Tolerancing (GD&T) Standards', 'Blueprint interpretation guide for aerospace and automotive precision tolerances.', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'AITM_GDT_Standards_Handbook.pdf', 4200000, null, 1, 3, '2026-02-10T14:00:00Z');
    insertRes.run('res-it-pdf-01', 'course-it-02', 'Enterprise Linux Administration & Server Hardening Handbook', 'AITM IT Department guide to SSH daemon security, user groups, iptables firewalling, and cron automation.', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'AITM_Linux_Server_Administration.pdf', 2890000, null, 1, 1, '2026-02-16T10:00:00Z');
    insertRes.run('res-it-yt-02', 'course-it-02', 'Database Normalization & Indexing Performance Lecture', 'Detailed recorded video walkthrough of 1NF to 3NF, B-tree indexes, and SQL query analysis.', 'youtube_video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', null, null, 42, 1, 2, '2026-02-20T11:00:00Z');
    insertRes.run('res-mech-pdf-01', 'course-mechatronics-03', 'Hydraulic Circuit Design & Directional Control Valves', 'Standard textbook notes on pneumatic logic gates, proportional valves, and actuator sizing.', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Mechatronics_Hydraulics_Systems.pdf', 5120000, null, 1, 1, '2026-03-02T10:00:00Z');

    // Seed Meetings
    const insertMeet = sqlite.prepare(`
      INSERT INTO meetings (id, course_id, course_title, title, description, scheduled_at, duration_minutes, meeting_url, platform, target_batch, host_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertMeet.run('meet-01', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'CNC G-Code Debugging & Canned Cycles Q&A Session', 'Live interactive problem solving on G81, G83 drilling cycles and tool collision prevention.', '2026-10-25T14:30:00+05:30', 60, 'https://meet.google.com/ait-mcnc-tech', 'Google Meet', 'Batch 2026-A (CNC)', 'Er. Rajesh Deshpande', '2026-10-20T10:00:00Z');
    insertMeet.run('meet-02', 'course-it-02', 'IT / ITES Software & Cloud Infrastructure Support', 'Cloud Architecture & Microservices Deployment Lab', 'Hands-on live deployment of containerized web servers and reverse proxy configuration.', '2026-10-26T16:00:00+05:30', 90, 'https://meet.google.com/ait-mitc-loud', 'Google Meet', 'Batch 2026-B (IT/ITES)', 'Prof. Ananya Sen', '2026-10-21T11:00:00Z');
    insertMeet.run('meet-03', null, 'All Institute Students', 'AITM Pan-India Apprenticeship Placement & Industry Meet 2026', 'Comprehensive orientation by our placement cell with corporate recruitment partners regarding NAPS & NATS stipend payments and factory placement protocols.', '2026-10-28T11:00:00+05:30', 75, 'https://meet.google.com/ait-mgen-place', 'Google Meet', null, 'Director S. K. Kulkarni & Placement Cell', '2026-10-22T09:00:00Z');

    // Seed Announcements
    const insertAnn = sqlite.prepare(`
      INSERT INTO announcements (id, course_id, course_title, title, content, priority, is_published, target_role, target_batch, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAnn.run('ann-01', null, null, 'Verification of NAPS / NATS Portal Apprenticeship Registration', 'All enrolled students are requested to ensure their Aadhaar e-KYC is completed on the National Apprenticeship Promotion Portal to ensure uninterrupted monthly government stipends.', 'high', 1, 'students', null, '2026-10-21T08:00:00Z');
    insertAnn.run('ann-02', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'Batch A: Haas Machine Operator Assessment Date Announced', 'The practical hands-on evaluation for Module 2 and tool offset validation will be conducted this Saturday from 10:00 AM in the CNC Precision Workshop.', 'urgent', 1, 'course_enrolled', 'Batch 2026-A (CNC)', '2026-10-22T10:00:00Z');
    insertAnn.run('ann-03', 'course-it-02', 'IT / ITES Software & Cloud Infrastructure Support', 'Batch B: Mid-Term System Administration Project Submissions', 'Please upload your shell scripting automation scripts and network topology diagrams by next Monday 5:00 PM.', 'normal', 1, 'course_enrolled', 'Batch 2026-B (IT/ITES)', '2026-10-22T14:00:00Z');

    // Seed Applications
    const insertApp = sqlite.prepare(`
      INSERT INTO applications (
        id, full_name, email, phone, education_qualification, interested_course_id, interested_course_title,
        program_type, city, state, notes, status, admin_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertApp.run('app-001', 'Pooja Jadhav', 'pooja.jadhav@gmail.com', '98205 12345', 'Diploma in Mechanical Engineering', 'course-cnc-01', 'Industrial Automation & CNC Precision Manufacturing', 'naps', 'Thane', 'Maharashtra', 'Completed Diploma from Govt Polytechnic Thane. Interested in Haas CNC machine operation.', 'pending', null, '2026-10-22T11:20:00Z', '2026-10-22T11:20:00Z');
    insertApp.run('app-002', 'Kunal Deshmukh', 'kunal.deshmukh@gmail.com', '98190 77654', 'B.Sc Computer Science', 'course-it-02', 'IT / ITES Software & Cloud Infrastructure Support', 'nats', 'Navi Mumbai', 'Maharashtra', 'Looking for 1-year corporate apprenticeship with stipend under NATS.', 'reviewing', 'Candidate screened; excellent academic score in database management.', '2026-10-21T15:40:00Z', '2026-10-22T09:15:00Z');
    insertApp.run('app-003', 'Vikram Rane', 'vikram.rane@outlook.com', '99201 33445', 'HSC (12th Science)', 'course-mechatronics-03', 'Learn & Earn: Work-Integrated Mechatronics Engineering', 'learn_earn', 'Pune', 'Maharashtra', 'Keen to pursue Work-Integrated degree with YCMOU collaboration.', 'accepted', 'Interview cleared. Ready for student onboarding.', '2026-10-19T10:10:00Z', '2026-10-22T12:00:00Z');

    // Seed Notifications
    const insertNotif = sqlite.prepare(`
      INSERT INTO notifications (id, user_id, title, message, link_url, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertNotif.run('notif-01', 'user-student-01', 'New Study Material Uploaded', 'Er. Rajesh Deshpande uploaded "AITM CNC Part Programming Reference Guide & G-Code Cheat Sheet".', null, 'resource_added', 0, '2026-10-22T10:00:00Z');
    insertNotif.run('notif-02', 'user-student-01', 'Live Q&A Class Scheduled', 'CNC G-Code Debugging & Canned Cycles Q&A Session scheduled for Oct 25, 2:30 PM.', null, 'meeting_scheduled', 0, '2026-10-21T14:00:00Z');
    insertNotif.run('notif-03', 'user-student-02', 'New Cloud Lecture Available', 'Prof. Ananya Sen scheduled Cloud Architecture Lab for Oct 26.', null, 'meeting_scheduled', 0, '2026-10-21T12:00:00Z');

    // Seed Activity Logs
    const insertLog = sqlite.prepare(`
      INSERT INTO activity_logs (id, actor_name, actor_role, action, target, timestamp) VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertLog.run('log-1', 'Director S. K. Kulkarni', 'admin', 'Initialized AITM Academic Year 2026-27 Portal', 'System', '2026-10-22T08:30:00Z');
    insertLog.run('log-2', 'Admin', 'admin', 'Assigned Course "Industrial Automation & CNC" to Rahul Shinde', 'AITM-2026-081', '2026-10-22T09:15:00Z');
  }
}

seedDatabaseIfEmpty();

// ---------------------------------------------------------------------------
// Row Mappers
// ---------------------------------------------------------------------------
function mapSettings(row: Record<string, unknown>): InstituteSettings {
  return {
    instituteName: String(row.institute_name),
    shortName: String(row.short_name),
    tagline: String(row.tagline),
    headOfficeAddress: String(row.head_office_address),
    phone: String(row.phone),
    email: String(row.email),
    hours: String(row.hours),
    isoCertification: String(row.iso_certification),
    nsdcAffiliation: String(row.nsdc_affiliation),
    portalNotice: (row.portal_notice as string | null) ?? '',
    logoUrl: (row.logo_url as string | null) ?? '/assets/aistudio/image_e53c2b5b.png',
    heroBadge: (row.hero_badge as string | null) ?? undefined,
    heroHeadline: (row.hero_headline as string | null) ?? undefined,
    heroSubtitle: (row.hero_subtitle as string | null) ?? undefined,
    heroImageUrl: (row.hero_image_url as string | null) ?? undefined,
    heroWorkshopImageUrl: (row.hero_workshop_image_url as string | null) ?? undefined,
    heroWorkshopLabel: (row.hero_workshop_label as string | null) ?? undefined,
    heroWorkshopTitle: (row.hero_workshop_title as string | null) ?? undefined,
    heroWorkshopDesc: (row.hero_workshop_desc as string | null) ?? undefined,
    aboutTitle: (row.about_title as string | null) ?? undefined,
    aboutDescription: (row.about_description as string | null) ?? undefined,
    aboutSubDescription: (row.about_sub_description as string | null) ?? undefined,
    aboutImage1Url: (row.about_image_1_url as string | null) ?? undefined,
    aboutImage2Url: (row.about_image_2_url as string | null) ?? undefined,
    placementTitle: (row.placement_title as string | null) ?? undefined,
    placementDescription: (row.placement_description as string | null) ?? undefined,
    placementImageUrl: (row.placement_image_url as string | null) ?? undefined,
  };
}

function mapUser(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email),
    fullName: String(row.full_name),
    role: row.role as 'admin' | 'student',
    studentId: (row.student_id as string | null) ?? undefined,
    mobileNumber: (row.mobile_number as string | null) ?? undefined,
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    status: row.status as AccountStatus,
    batch: (row.batch as string | null) ?? undefined,
    joiningDate: (row.joining_date as string | null) ?? undefined,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: String(row.created_at),
  };
}

function mapCourse(row: Record<string, unknown>, enrolledCount = 0): Course {
  const totalSeats = Number(row.total_seats || 40);
  let syllabus: string[] = [];
  try {
    syllabus = JSON.parse(String(row.syllabus_json || '[]'));
  } catch {
    syllabus = [];
  }
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    description: String(row.description),
    category: String(row.category),
    thumbnailUrl: String(row.thumbnail_url),
    duration: String(row.duration),
    courseType: row.course_type as Course['courseType'],
    batch: String(row.batch),
    startDate: String(row.start_date),
    endDate: (row.end_date as string | null) ?? undefined,
    instructorName: String(row.instructor_name),
    instructorRole: (row.instructor_role as string | null) ?? undefined,
    fees: (row.fees as string | null) ?? undefined,
    feeInfo: (row.fee_info as string | null) ?? undefined,
    totalSeats,
    availableSeats: Math.max(0, totalSeats - enrolledCount),
    status: row.status as CourseStatus,
    syllabus,
    enrolledCount,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapEnrollment(row: Record<string, unknown>): CourseEnrollment {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    courseId: String(row.course_id),
    status: row.status as CourseEnrollment['status'],
    enrolledAt: String(row.enrolled_at),
  };
}

function mapStudentEnrollmentRecord(row: Record<string, unknown>): StudentEnrollmentRecord {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    mobileNumber: String(row.mobile_number),
    email: String(row.email),
    courseId: String(row.course_id),
    courseName: String(row.course_name),
    batch: String(row.batch),
    enrollmentDate: String(row.enrollment_date),
    status: row.status as StudentEnrollmentStatus,
    studentId: (row.student_id as string | null) ?? undefined,
    createdAt: String(row.created_at),
  };
}

function mapResource(row: Record<string, unknown>): LearningResource {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    title: String(row.title),
    description: (row.description as string | null) ?? undefined,
    resourceType: row.resource_type as LearningResource['resourceType'],
    urlOrPath: String(row.url_or_path),
    fileName: (row.file_name as string | null) ?? undefined,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : undefined,
    durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : undefined,
    isPrivate: Boolean(row.is_private),
    orderIndex: Number(row.order_index || 1),
    createdAt: String(row.created_at),
  };
}

function mapMeeting(row: Record<string, unknown>): Meeting {
  return {
    id: String(row.id),
    courseId: (row.course_id as string | null) ?? null,
    courseTitle: (row.course_title as string | null) ?? undefined,
    title: String(row.title),
    description: String(row.description),
    scheduledAt: String(row.scheduled_at),
    durationMinutes: Number(row.duration_minutes),
    meetingUrl: String(row.meeting_url),
    platform: row.platform as Meeting['platform'],
    targetBatch: (row.target_batch as string | null) ?? undefined,
    hostName: String(row.host_name),
    createdAt: String(row.created_at),
  };
}

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id),
    courseId: (row.course_id as string | null) ?? null,
    courseTitle: (row.course_title as string | null) ?? undefined,
    title: String(row.title),
    content: String(row.content),
    priority: row.priority as Announcement['priority'],
    isPublished: Boolean(row.is_published),
    targetRole: row.target_role as Announcement['targetRole'],
    targetBatch: (row.target_batch as string | null) ?? undefined,
    createdAt: String(row.created_at),
  };
}

function mapApplication(row: Record<string, unknown>): Application {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone),
    educationQualification: String(row.education_qualification),
    interestedCourseId: String(row.interested_course_id),
    interestedCourseTitle: (row.interested_course_title as string | null) ?? undefined,
    programType: row.program_type as Application['programType'],
    city: String(row.city),
    state: String(row.state),
    notes: (row.notes as string | null) ?? undefined,
    status: row.status as ApplicationStatus,
    adminNotes: (row.admin_notes as string | null) ?? undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapInquiry(row: Record<string, unknown>): Inquiry {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: (row.phone as string | null) ?? undefined,
    message: String(row.message),
    status: row.status as Inquiry['status'],
    adminNotes: (row.admin_notes as string | null) ?? undefined,
    createdAt: String(row.created_at),
  };
}

function mapNotification(row: Record<string, unknown>): NotificationItem {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    message: String(row.message),
    linkUrl: (row.link_url as string | null) ?? undefined,
    type: row.type as NotificationItem['type'],
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at),
  };
}

function mapActivityLog(row: Record<string, unknown>): ActivityLog {
  return {
    id: String(row.id),
    actorName: String(row.actor_name),
    actorRole: String(row.actor_role),
    action: String(row.action),
    target: String(row.target),
    timestamp: String(row.timestamp),
  };
}

function mapEnrolledStudent(row: Record<string, unknown>): EnrolledStudent {
  return {
    id: String(row.id),
    location: String(row.location ?? ''),
    employeeCode: String(row.employee_code ?? ''),
    studentName: String(row.student_name ?? ''),
    motherName: String(row.mother_name ?? ''),
    fatherName: String(row.father_name ?? ''),
    dateOfBirth: String(row.date_of_birth ?? ''),
    email: String(row.email ?? ''),
    mobileNumber: String(row.mobile_number ?? ''),
    gender: (String(row.gender ?? '') as StudentGender),
    aadhaarNumber: String(row.aadhaar_number ?? ''),
    permanentAddress: String(row.permanent_address ?? ''),
    panNumber: String(row.pan_number ?? ''),
    status: (row.status === 'Inactive' ? 'Inactive' : 'Active') as EnrolledStudentStatus,
    remarks: String(row.remarks ?? ''),
    registrationDate: String(row.registration_date ?? ''),
    assignedStaffName: String(row.assigned_staff_name ?? ''),
    abcId: String(row.abc_id ?? ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export interface EnrolledStudentInput {
  location?: string;
  employeeCode: string;
  studentName: string;
  motherName?: string;
  fatherName?: string;
  dateOfBirth?: string;
  email?: string;
  mobileNumber?: string;
  gender?: string;
  aadhaarNumber?: string;
  permanentAddress?: string;
  panNumber?: string;
  status?: string;
  remarks?: string;
  registrationDate?: string;
  assignedStaffName?: string;
  abcId?: string;
}

function normalizeEnrolledStudentInput(input: EnrolledStudentInput): Omit<EnrolledStudent, 'id' | 'createdAt' | 'updatedAt'> {
  const employeeCode = String(input.employeeCode ?? '').trim();
  const studentName = String(input.studentName ?? '').trim();
  if (!employeeCode) throw new Error('Employee Code is required.');
  if (!studentName) throw new Error('Student Name is required.');

  const location = String(input.location ?? '').trim();
  const motherName = String(input.motherName ?? '').trim();
  const fatherName = String(input.fatherName ?? '').trim();
  const dateOfBirth = String(input.dateOfBirth ?? '').trim();
  const email = String(input.email ?? '').trim().toLowerCase();
  const mobileNumber = String(input.mobileNumber ?? '').trim();
  const rawAadhaar = String(input.aadhaarNumber ?? '').trim();
  const permanentAddress = String(input.permanentAddress ?? '').trim();
  const rawPan = String(input.panNumber ?? '').trim().toUpperCase();
  const remarks = String(input.remarks ?? '').trim();
  const registrationDate = String(input.registrationDate ?? '').trim();
  const assignedStaffName = String(input.assignedStaffName ?? '').trim();
  const abcId = String(input.abcId ?? '').trim();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Invalid email format: "${email}"`);
  }

  if (mobileNumber) {
    if (/[eE][+-]?\d+/.test(mobileNumber)) {
      throw new Error(`Mobile Number appears corrupted by scientific notation: "${mobileNumber}"`);
    }
    const mobileDigits = mobileNumber.replace(/[\s+\-()]/g, '');
    if (!/^\d{10,15}$/.test(mobileDigits)) {
      throw new Error(`Mobile Number must contain 10 to 15 digits (received "${mobileNumber}").`);
    }
  }

  let aadhaarNumber = '';
  if (rawAadhaar) {
    if (/[eE][+-]?\d+/.test(rawAadhaar)) {
      throw new Error(`Aadhaar ID Number cannot use scientific notation: "${rawAadhaar}"`);
    }
    const cleanedAadhaar = rawAadhaar.replace(/[\s-]/g, '');
    if (!/^\d{12}$/.test(cleanedAadhaar)) {
      throw new Error(`Aadhaar ID Number must be exactly 12 digits (received "${rawAadhaar}").`);
    }
    aadhaarNumber = cleanedAadhaar;
  }

  if (rawPan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(rawPan)) {
    throw new Error(`PAN ID Number must follow valid 10-character format e.g. ABCDE1234F (received "${rawPan}").`);
  }

  if (abcId && /[eE][+-]?\d+/.test(abcId)) {
    throw new Error(`ABC ID cannot use scientific notation: "${abcId}"`);
  }

  const rawGender = String(input.gender ?? '').trim().toLowerCase();
  let gender: StudentGender = '';
  if (rawGender === 'male' || rawGender === 'm') gender = 'Male';
  else if (rawGender === 'female' || rawGender === 'f') gender = 'Female';
  else if (rawGender === 'other' || rawGender === 'o' || rawGender === 'transgender') gender = 'Other';
  else if (rawGender !== '') {
    throw new Error(`Invalid Gender value "${input.gender}". Allowed: Male, Female, Other.`);
  }

  const rawStatus = String(input.status ?? 'Active').trim().toLowerCase();
  let status: EnrolledStudentStatus = 'Active';
  if (rawStatus === '' || rawStatus === 'active' || rawStatus === '1' || rawStatus === 'yes' || rawStatus === 'enrolled') {
    status = 'Active';
  } else if (rawStatus === 'inactive' || rawStatus === '0' || rawStatus === 'no' || rawStatus === 'disabled') {
    status = 'Inactive';
  } else {
    throw new Error(`Invalid Status value "${input.status}". Allowed: Active, Inactive.`);
  }

  return {
    location,
    employeeCode,
    studentName,
    motherName,
    fatherName,
    dateOfBirth,
    email,
    mobileNumber,
    gender,
    aadhaarNumber,
    permanentAddress,
    panNumber: rawPan,
    status,
    remarks,
    registrationDate,
    assignedStaffName,
    abcId,
  };
}

// ---------------------------------------------------------------------------
// Database Repository API
// ---------------------------------------------------------------------------
export const serverDb = {
  // --- AUTH & BOOTSTRAP ---
  getBootstrapStatus(): {
    adminPasswordClaimed: boolean;
    adminEmail: string;
    unclaimedStudents: Array<{ email: string; fullName: string; studentId?: string }>;
  } {
    const admin = sqlite.prepare("SELECT email, password_hash FROM users WHERE role = 'admin' LIMIT 1").get() as
      | { email: string; password_hash: string | null }
      | undefined;

    const unclaimed = sqlite
      .prepare("SELECT email, full_name, student_id FROM users WHERE role = 'student' AND status = 'active' AND password_hash IS NULL ORDER BY created_at ASC")
      .all() as Array<{ email: string; full_name: string; student_id: string | null }>;

    return {
      adminPasswordClaimed: Boolean(admin?.password_hash),
      adminEmail: admin?.email || 'admin@abhinavinst.com',
      unclaimedStudents: unclaimed.map((u) => ({
        email: u.email,
        fullName: u.full_name,
        studentId: u.student_id ?? undefined,
      })),
    };
  },

  claimAdminPassword(password: string): UserProfile {
    const trimmed = password.trim();
    if (trimmed.length < 8) {
      throw new Error('Admin password must be at least 8 characters long.');
    }
    const admin = sqlite.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get() as Record<string, unknown> | undefined;
    if (!admin) throw new Error('Administrator account not found.');
    if (admin.password_hash) {
      throw new Error('Administrator password has already been claimed. Please sign in normally.');
    }
    const hash = hashPassword(trimmed);
    const res = sqlite
      .prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ? AND password_hash IS NULL')
      .run(hash, String(admin.id));
    if (res.changes === 0) {
      throw new Error('Administrator password was already claimed.');
    }
    this.logActivity(String(admin.full_name), 'admin', 'Completed first-run administrator credential setup', String(admin.email));
    return this.getUserById(String(admin.id))!;
  },

  activateStudentPassword(email: string, password: string): UserProfile {
    const trimmedPass = password.trim();
    if (trimmedPass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    const row = sqlite
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email.trim()) as Record<string, unknown> | undefined;
    if (!row) throw new Error('No account found with this email address.');
    if (row.role !== 'student') throw new Error('Use the administrator login for admin accounts.');
    if (row.status !== 'active') throw new Error('This student account is currently inactive. Contact AITM administration.');
    if (row.password_hash) {
      throw new Error('This student account already has a password configured. Please sign in with your password.');
    }
    const hash = hashPassword(trimmedPass);
    sqlite
      .prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ? AND password_hash IS NULL')
      .run(hash, String(row.id));
    this.logActivity(String(row.full_name), 'student', 'Activated student portal password', String(row.email));
    return this.getUserById(String(row.id))!;
  },

  authenticateUser(email: string, password: string): { user?: UserProfile; error?: string; needsSetup?: 'admin_claim' | 'student_activate' } {
    const row = sqlite
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email.trim()) as Record<string, unknown> | undefined;
    if (!row) {
      return { error: 'Invalid email or password.' };
    }
    if (row.status === 'inactive') {
      return { error: 'This account has been deactivated by the institute administration.' };
    }
    const storedHash = row.password_hash as string | null;
    if (!storedHash) {
      return {
        error:
          row.role === 'admin'
            ? 'Administrator password has not been claimed yet. Complete first-run setup below.'
            : 'This student account has not activated a password yet. Activate your account below.',
        needsSetup: row.role === 'admin' ? 'admin_claim' : 'student_activate',
      };
    }
    if (!verifyPassword(password, storedHash)) {
      return { error: 'Invalid email or password.' };
    }
    return { user: mapUser(row) };
  },

  setUserPassword(userId: string, newPassword: string, actorName = 'Admin'): void {
    const hash = hashPassword(newPassword.trim());
    sqlite.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hash, userId);
    const u = this.getUserById(userId);
    this.logActivity(actorName, 'admin', `Updated credentials for ${u?.fullName || userId}`, userId);
  },

  // --- SETTINGS ---
  getSettings(): InstituteSettings {
    const row = sqlite.prepare('SELECT * FROM institute_settings WHERE id = 1').get() as Record<string, unknown>;
    return mapSettings(row);
  },

  updateSettings(updates: Partial<InstituteSettings>, actorName = 'Admin'): InstituteSettings {
    const current = this.getSettings();
    const merged: InstituteSettings = { ...current, ...updates };
    sqlite
      .prepare(`
        UPDATE institute_settings SET
          institute_name = ?, short_name = ?, tagline = ?, head_office_address = ?,
          phone = ?, email = ?, hours = ?, iso_certification = ?, nsdc_affiliation = ?,
          portal_notice = ?, logo_url = ?,
          hero_badge = ?, hero_headline = ?, hero_subtitle = ?, hero_image_url = ?,
          hero_workshop_image_url = ?, hero_workshop_label = ?, hero_workshop_title = ?, hero_workshop_desc = ?,
          about_title = ?, about_description = ?, about_sub_description = ?, about_image_1_url = ?, about_image_2_url = ?,
          placement_title = ?, placement_description = ?, placement_image_url = ?
        WHERE id = 1
      `)
      .run(
        merged.instituteName,
        merged.shortName,
        merged.tagline,
        merged.headOfficeAddress,
        merged.phone,
        merged.email,
        merged.hours,
        merged.isoCertification,
        merged.nsdcAffiliation,
        merged.portalNotice ?? null,
        merged.logoUrl ?? null,
        merged.heroBadge ?? null,
        merged.heroHeadline ?? null,
        merged.heroSubtitle ?? null,
        merged.heroImageUrl ?? null,
        merged.heroWorkshopImageUrl ?? null,
        merged.heroWorkshopLabel ?? null,
        merged.heroWorkshopTitle ?? null,
        merged.heroWorkshopDesc ?? null,
        merged.aboutTitle ?? null,
        merged.aboutDescription ?? null,
        merged.aboutSubDescription ?? null,
        merged.aboutImage1Url ?? null,
        merged.aboutImage2Url ?? null,
        merged.placementTitle ?? null,
        merged.placementDescription ?? null,
        merged.placementImageUrl ?? null
      );
    this.logActivity(actorName, 'admin', 'Updated institute settings & website content', 'Institute Configuration');
    return this.getSettings();
  },

  // --- USERS ---
  getUsers(): UserProfile[] {
    const rows = sqlite.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
    return rows.map(mapUser);
  },

  getStudents(): UserProfile[] {
    const rows = sqlite.prepare("SELECT * FROM users WHERE role = 'student' ORDER BY created_at DESC").all() as Array<Record<string, unknown>>;
    return rows.map(mapUser);
  },

  getUserById(id: string): UserProfile | undefined {
    const row = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? mapUser(row) : undefined;
  },

  getUserByEmail(email: string): UserProfile | undefined {
    const row = sqlite.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim()) as Record<string, unknown> | undefined;
    return row ? mapUser(row) : undefined;
  },

  createStudent(
    data: {
      fullName: string;
      email: string;
      mobileNumber?: string;
      studentId?: string;
      batch?: string;
      joiningDate?: string;
      status?: AccountStatus;
      assignedCourseIds: string[];
      temporaryPassword?: string;
    },
    actorName = 'Admin'
  ): { student: UserProfile; tempPassword: string } {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = this.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`A user with email ${normalizedEmail} already exists.`);
    }

    const genStudentId = data.studentId?.trim() || `AITM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const tempPassword = data.temporaryPassword?.trim() || `Aitm@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = hashPassword(tempPassword);
    const id = `user-student-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();
    const joiningDate = data.joiningDate || now.split('T')[0];
    const batch = data.batch?.trim() || 'Batch 2026';
    const status: AccountStatus = data.status || 'active';

    sqlite.exec('BEGIN');
    try {
      sqlite
        .prepare(`
          INSERT INTO users (id, email, full_name, role, student_id, mobile_number, avatar_url, status, batch, joining_date, password_hash, must_change_password, created_at)
          VALUES (?, ?, ?, 'student', ?, ?, null, ?, ?, ?, ?, 1, ?)
        `)
        .run(
          id,
          normalizedEmail,
          data.fullName.trim(),
          genStudentId,
          data.mobileNumber?.trim() || '',
          status,
          batch,
          joiningDate,
          passwordHash,
          now
        );

      const courseIds = Array.isArray(data.assignedCourseIds) ? data.assignedCourseIds : [];
      for (const courseId of courseIds) {
        const course = this.getCourseById(courseId);
        if (!course) continue;
        sqlite
          .prepare(`INSERT OR IGNORE INTO course_enrollments (id, student_id, course_id, status, enrolled_at) VALUES (?, ?, ?, 'active', ?)`)
          .run(`enr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`, id, courseId, now);

        // Also register in official enrollment records if not already present for same email & course
        const existingRec = sqlite
          .prepare('SELECT id FROM student_enrollment_records WHERE LOWER(email) = LOWER(?) AND course_id = ?')
          .get(normalizedEmail, courseId);
        if (!existingRec) {
          sqlite
            .prepare(`
              INSERT INTO student_enrollment_records (id, full_name, mobile_number, email, course_id, course_name, batch, enrollment_date, status, student_id, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Enrolled', ?, ?)
            `)
            .run(
              `enr-rec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              data.fullName.trim(),
              data.mobileNumber?.trim() || '',
              normalizedEmail,
              course.id,
              course.title,
              batch || course.batch,
              joiningDate,
              genStudentId,
              now
            );
        }
      }

      if (courseIds.length > 0) {
        sqlite
          .prepare(`INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 'course_assigned', 0, ?)`)
          .run(
            `notif-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            id,
            'Welcome to AITM Portal',
            `Your student account has been created. You have been assigned ${courseIds.length} course(s).`,
            now
          );
      }

      sqlite.exec('COMMIT');
    } catch (err) {
      sqlite.exec('ROLLBACK');
      throw err;
    }

    this.logActivity(actorName, 'admin', `Created student account for ${data.fullName.trim()}`, `Student ID: ${genStudentId}`);
    return { student: this.getUserById(id)!, tempPassword };
  },

  updateStudent(studentId: string, updates: Partial<UserProfile>, actorName = 'Admin'): UserProfile {
    const existing = this.getUserById(studentId);
    if (!existing) throw new Error('Student not found');

    const fullName = updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName;
    const email = updates.email !== undefined ? updates.email.trim().toLowerCase() : existing.email;
    const mobileNumber = updates.mobileNumber !== undefined ? updates.mobileNumber.trim() : existing.mobileNumber ?? '';
    const batch = updates.batch !== undefined ? updates.batch : existing.batch ?? null;
    const status = updates.status !== undefined ? updates.status : existing.status;
    const avatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : existing.avatarUrl ?? null;
    const joiningDate = updates.joiningDate !== undefined ? updates.joiningDate : existing.joiningDate ?? null;
    const mustChangePassword =
      updates.mustChangePassword !== undefined ? (updates.mustChangePassword ? 1 : 0) : existing.mustChangePassword ? 1 : 0;

    sqlite
      .prepare(`
        UPDATE users SET
          full_name = ?, email = ?, mobile_number = ?, batch = ?, status = ?, avatar_url = ?, joining_date = ?, must_change_password = ?
        WHERE id = ?
      `)
      .run(fullName, email, mobileNumber, batch, status, avatarUrl, joiningDate, mustChangePassword, studentId);

    this.logActivity(actorName, existing.role, `Updated profile of ${fullName}`, studentId);
    return this.getUserById(studentId)!;
  },

  toggleStudentStatus(studentId: string, actorName = 'Admin'): UserProfile {
    const student = this.getUserById(studentId);
    if (!student) throw new Error('Student not found');
    const newStatus: AccountStatus = student.status === 'active' ? 'inactive' : 'active';
    return this.updateStudent(studentId, { status: newStatus }, actorName);
  },

  deleteStudent(studentId: string, actorName = 'Admin'): void {
    const student = this.getUserById(studentId);
    if (!student) throw new Error('Student not found');
    if (student.role === 'admin') throw new Error('Cannot delete administrator account.');
    sqlite.prepare('DELETE FROM users WHERE id = ?').run(studentId);
    this.logActivity(actorName, 'admin', `Deleted student portal account: ${student.fullName}`, studentId);
  },

  // --- ENROLLMENTS & ACCESS CONTROL ---
  getEnrollments(): CourseEnrollment[] {
    const rows = sqlite.prepare('SELECT * FROM course_enrollments ORDER BY enrolled_at DESC').all() as Array<Record<string, unknown>>;
    return rows.map(mapEnrollment);
  },

  getStudentEnrolledCourseIds(studentId: string): string[] {
    const rows = sqlite
      .prepare("SELECT course_id FROM course_enrollments WHERE student_id = ? AND status = 'active'")
      .all(studentId) as Array<{ course_id: string }>;
    return rows.map((r) => r.course_id);
  },

  getStudentEnrolledCourses(studentId: string): Course[] {
    const enrolledIds = this.getStudentEnrolledCourseIds(studentId);
    if (enrolledIds.length === 0) return [];
    const all = this.getCourses();
    return all.filter((c) => enrolledIds.includes(c.id));
  },

  assignCoursesToStudent(studentId: string, courseIds: string[], actorName = 'Admin'): void {
    const student = this.getUserById(studentId);
    if (!student) throw new Error('Student not found');
    const now = new Date().toISOString();

    sqlite.exec('BEGIN');
    try {
      sqlite.prepare('DELETE FROM course_enrollments WHERE student_id = ?').run(studentId);
      const insertEnr = sqlite.prepare(
        `INSERT INTO course_enrollments (id, student_id, course_id, status, enrolled_at) VALUES (?, ?, ?, 'active', ?)`
      );
      for (const courseId of courseIds) {
        if (this.getCourseById(courseId)) {
          insertEnr.run(`enr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`, studentId, courseId, now);
        }
      }
      sqlite
        .prepare(`INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 'course_assigned', 0, ?)`)
        .run(
          `notif-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          studentId,
          'Course Access Updated',
          `Your course enrollments have been updated by administration. You now have access to ${courseIds.length} course(s).`,
          now
        );
      sqlite.exec('COMMIT');
    } catch (err) {
      sqlite.exec('ROLLBACK');
      throw err;
    }
    this.logActivity(actorName, 'admin', `Updated course enrollments for ${student.fullName}`, `${courseIds.length} course(s) assigned`);
  },

  canStudentAccessCourse(studentId: string, courseId: string): boolean {
    const user = this.getUserById(studentId);
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.status !== 'active') return false;
    const row = sqlite
      .prepare("SELECT 1 FROM course_enrollments WHERE student_id = ? AND course_id = ? AND status = 'active'")
      .get(studentId, courseId);
    return Boolean(row);
  },

  // --- COURSES ---
  getCourses(): Course[] {
    const rows = sqlite
      .prepare(`
        SELECT c.*,
          (SELECT COUNT(*) FROM student_enrollment_records ser WHERE ser.course_id = c.id AND ser.status = 'Enrolled') as enrolled_cnt
        FROM courses c
        ORDER BY c.created_at DESC
      `)
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => mapCourse(r, Number(r.enrolled_cnt || 0)));
  },

  getPublishedCourses(): Course[] {
    return this.getCourses().filter((c) => c.status === 'published');
  },

  getCourseById(id: string): Course | undefined {
    const row = sqlite
      .prepare(`
        SELECT c.*,
          (SELECT COUNT(*) FROM student_enrollment_records ser WHERE ser.course_id = c.id AND ser.status = 'Enrolled') as enrolled_cnt
        FROM courses c
        WHERE c.id = ?
      `)
      .get(id) as Record<string, unknown> | undefined;
    return row ? mapCourse(row, Number(row.enrolled_cnt || 0)) : undefined;
  },

  createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrolledCount'>, actorName = 'Admin'): Course {
    const id = `course-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();
    const totalSeats = Number(courseData.totalSeats || 40);
    sqlite
      .prepare(`
        INSERT INTO courses (
          id, title, slug, description, category, thumbnail_url, duration, course_type, batch,
          start_date, end_date, instructor_name, instructor_role, fees, fee_info, total_seats,
          status, syllabus_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        courseData.title.trim(),
        courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        courseData.description.trim(),
        courseData.category.trim(),
        courseData.thumbnailUrl || '/src/assets/images/aitm_industrial_training_1792739247502.jpg',
        courseData.duration.trim(),
        courseData.courseType,
        courseData.batch.trim(),
        courseData.startDate || now.split('T')[0],
        courseData.endDate || null,
        courseData.instructorName.trim(),
        courseData.instructorRole || null,
        courseData.fees || null,
        courseData.feeInfo || null,
        totalSeats,
        courseData.status || 'published',
        JSON.stringify(Array.isArray(courseData.syllabus) ? courseData.syllabus : []),
        now,
        now
      );
    this.logActivity(actorName, 'admin', `Created new course: "${courseData.title.trim()}"`, courseData.category);
    return this.getCourseById(id)!;
  },

  updateCourse(id: string, updates: Partial<Course>, actorName = 'Admin'): Course {
    const existing = this.getCourseById(id);
    if (!existing) throw new Error('Course not found');
    const merged: Course = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    sqlite.exec('BEGIN');
    try {
      sqlite
        .prepare(`
          UPDATE courses SET
            title = ?, slug = ?, description = ?, category = ?, thumbnail_url = ?,
            duration = ?, course_type = ?, batch = ?, start_date = ?, end_date = ?,
            instructor_name = ?, instructor_role = ?, fees = ?, fee_info = ?,
            total_seats = ?, status = ?, syllabus_json = ?, updated_at = ?
          WHERE id = ?
        `)
        .run(
          merged.title,
          merged.slug,
          merged.description,
          merged.category,
          merged.thumbnailUrl,
          merged.duration,
          merged.courseType,
          merged.batch,
          merged.startDate,
          merged.endDate ?? null,
          merged.instructorName,
          merged.instructorRole ?? null,
          merged.fees ?? null,
          merged.feeInfo ?? null,
          Number(merged.totalSeats || 40),
          merged.status,
          JSON.stringify(merged.syllabus || []),
          merged.updatedAt,
          id
        );

      // Keep denormalized course titles in sync
      if (updates.title && updates.title !== existing.title) {
        sqlite.prepare('UPDATE student_enrollment_records SET course_name = ? WHERE course_id = ?').run(merged.title, id);
        sqlite.prepare('UPDATE meetings SET course_title = ? WHERE course_id = ?').run(merged.title, id);
        sqlite.prepare('UPDATE announcements SET course_title = ? WHERE course_id = ?').run(merged.title, id);
        sqlite.prepare('UPDATE applications SET interested_course_title = ? WHERE interested_course_id = ?').run(merged.title, id);
      }
      sqlite.exec('COMMIT');
    } catch (err) {
      sqlite.exec('ROLLBACK');
      throw err;
    }
    this.logActivity(actorName, 'admin', `Updated course: "${merged.title}"`, id);
    return this.getCourseById(id)!;
  },

  deleteCourse(id: string, actorName = 'Admin'): void {
    const target = this.getCourseById(id);
    if (!target) throw new Error('Course not found');
    sqlite.prepare('DELETE FROM courses WHERE id = ?').run(id);
    this.logActivity(actorName, 'admin', `Deleted course: "${target.title}"`, id);
  },

  // --- STUDENT ENROLLMENT RECORDS ---
  getStudentEnrollments(): StudentEnrollmentRecord[] {
    const rows = sqlite
      .prepare('SELECT * FROM student_enrollment_records ORDER BY created_at DESC')
      .all() as Array<Record<string, unknown>>;
    return rows.map(mapStudentEnrollmentRecord);
  },

  addStudentEnrollment(
    data: {
      fullName: string;
      mobileNumber: string;
      email: string;
      courseId: string;
      courseName?: string;
      batch: string;
      enrollmentDate: string;
      status: StudentEnrollmentStatus;
      studentId?: string;
    },
    actorName = 'Admin'
  ): StudentEnrollmentRecord {
    const course = this.getCourseById(data.courseId);
    if (!course && !data.courseName) {
      throw new Error('Selected course does not exist.');
    }
    const courseName = course ? course.title : data.courseName!;
    const studentId = data.studentId?.trim() || `AITM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const id = `enr-rec-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();

    sqlite
      .prepare(`
        INSERT INTO student_enrollment_records (
          id, full_name, mobile_number, email, course_id, course_name, batch, enrollment_date, status, student_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        data.fullName.trim(),
        data.mobileNumber.trim(),
        data.email.trim().toLowerCase(),
        data.courseId,
        courseName,
        data.batch.trim(),
        data.enrollmentDate,
        data.status,
        studentId,
        now
      );

    this.logActivity(actorName, 'admin', `Enrolled student: ${data.fullName.trim()}`, `${courseName} (${data.status})`);
    const row = sqlite.prepare('SELECT * FROM student_enrollment_records WHERE id = ?').get(id) as Record<string, unknown>;
    return mapStudentEnrollmentRecord(row);
  },

  updateStudentEnrollment(id: string, updates: Partial<StudentEnrollmentRecord>, actorName = 'Admin'): StudentEnrollmentRecord {
    const row = sqlite.prepare('SELECT * FROM student_enrollment_records WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error('Enrollment record not found');
    const existing = mapStudentEnrollmentRecord(row);

    let courseName = updates.courseName ?? existing.courseName;
    const courseId = updates.courseId ?? existing.courseId;
    if (updates.courseId && updates.courseId !== existing.courseId) {
      const c = this.getCourseById(updates.courseId);
      if (c) courseName = c.title;
    }

    const fullName = updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName;
    const mobileNumber = updates.mobileNumber !== undefined ? updates.mobileNumber.trim() : existing.mobileNumber;
    const email = updates.email !== undefined ? updates.email.trim().toLowerCase() : existing.email;
    const batch = updates.batch !== undefined ? updates.batch.trim() : existing.batch;
    const enrollmentDate = updates.enrollmentDate ?? existing.enrollmentDate;
    const status = updates.status ?? existing.status;

    sqlite
      .prepare(`
        UPDATE student_enrollment_records SET
          full_name = ?, mobile_number = ?, email = ?, course_id = ?, course_name = ?,
          batch = ?, enrollment_date = ?, status = ?
        WHERE id = ?
      `)
      .run(fullName, mobileNumber, email, courseId, courseName, batch, enrollmentDate, status, id);

    this.logActivity(actorName, 'admin', `Updated enrollment for ${fullName}`, `Status: ${status}`);
    const updatedRow = sqlite.prepare('SELECT * FROM student_enrollment_records WHERE id = ?').get(id) as Record<string, unknown>;
    return mapStudentEnrollmentRecord(updatedRow);
  },

  deleteStudentEnrollment(id: string, actorName = 'Admin'): void {
    const row = sqlite.prepare('SELECT full_name FROM student_enrollment_records WHERE id = ?').get(id) as { full_name: string } | undefined;
    if (!row) throw new Error('Enrollment record not found');
    sqlite.prepare('DELETE FROM student_enrollment_records WHERE id = ?').run(id);
    this.logActivity(actorName, 'admin', `Deleted student enrollment: ${row.full_name}`, id);
  },

  // --- DYNAMIC SQL-AGGREGATED REPORTS & DASHBOARD STATS ---
  getCourseWiseEnrollmentReport(): CourseEnrollmentReportItem[] {
    const rows = sqlite
      .prepare(`
        SELECT
          c.id as course_id,
          c.title as course_name,
          c.total_seats,
          COALESCE(c.fees, c.fee_info, 'Govt Stipend') as fees,
          c.duration,
          COUNT(CASE WHEN ser.status = 'Enrolled' THEN 1 END) as total_enrolled,
          COUNT(CASE WHEN ser.status = 'Pending' THEN 1 END) as pending_students
        FROM courses c
        LEFT JOIN student_enrollment_records ser ON ser.course_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at ASC
      `)
      .all() as Array<Record<string, unknown>>;

    return rows.map((r, idx) => {
      const totalSeats = Number(r.total_seats || 40);
      const totalEnrolledStudents = Number(r.total_enrolled || 0);
      const pendingStudents = Number(r.pending_students || 0);
      return {
        srNo: idx + 1,
        courseId: String(r.course_id),
        courseName: String(r.course_name),
        totalEnrolledStudents,
        pendingStudents,
        availableSeats: Math.max(0, totalSeats - totalEnrolledStudents),
        totalSeats,
        fees: String(r.fees || 'Govt Stipend'),
        duration: String(r.duration || ''),
      };
    });
  },

  getEnrollmentDashboardStats(): EnrollmentDashboardStats {
    const counts = sqlite
      .prepare(`
        SELECT
          COUNT(*) as total_registered,
          COUNT(CASE WHEN status = 'Enrolled' THEN 1 END) as total_enrolled,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_students,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_students
        FROM student_enrollment_records
      `)
      .get() as Record<string, unknown>;

    const courseCount = sqlite.prepare('SELECT COUNT(*) as cnt FROM courses').get() as { cnt: number };
    const batches = sqlite
      .prepare(`
        SELECT batch FROM courses WHERE batch IS NOT NULL AND batch != ''
        UNION
        SELECT batch FROM student_enrollment_records WHERE batch IS NOT NULL AND batch != ''
      `)
      .all() as Array<{ batch: string }>;

    return {
      totalRegisteredStudents: Number(counts.total_registered || 0),
      totalEnrolledStudents: Number(counts.total_enrolled || 0),
      totalAvailableCourses: Number(courseCount.cnt || 0),
      totalActiveBatches: batches.length,
      pendingStudents: Number(counts.pending_students || 0),
      completedStudents: Number(counts.completed_students || 0),
      courseReports: this.getCourseWiseEnrollmentReport(),
    };
  },

  // --- LEARNING RESOURCES ---
  getResources(): LearningResource[] {
    const rows = sqlite
      .prepare('SELECT * FROM learning_resources ORDER BY order_index ASC, created_at DESC')
      .all() as Array<Record<string, unknown>>;
    return rows.map(mapResource);
  },

  getResourcesForStudent(studentId: string): LearningResource[] {
    const enrolledIds = this.getStudentEnrolledCourseIds(studentId);
    if (enrolledIds.length === 0) return [];
    const placeholders = enrolledIds.map(() => '?').join(',');
    const rows = sqlite
      .prepare(`SELECT * FROM learning_resources WHERE course_id IN (${placeholders}) ORDER BY order_index ASC, created_at DESC`)
      .all(...enrolledIds) as Array<Record<string, unknown>>;
    return rows.map(mapResource);
  },

  addResource(resourceData: Omit<LearningResource, 'id' | 'createdAt'>, actorName = 'Admin'): LearningResource {
    const course = this.getCourseById(resourceData.courseId);
    if (!course) throw new Error('Target course not found');

    const id = `res-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();

    sqlite.exec('BEGIN');
    try {
      sqlite
        .prepare(`
          INSERT INTO learning_resources (
            id, course_id, title, description, resource_type, url_or_path, file_name,
            file_size_bytes, duration_minutes, is_private, order_index, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          id,
          resourceData.courseId,
          resourceData.title.trim(),
          resourceData.description?.trim() || null,
          resourceData.resourceType,
          resourceData.urlOrPath.trim(),
          resourceData.fileName || null,
          resourceData.fileSizeBytes ?? null,
          resourceData.durationMinutes ?? null,
          resourceData.isPrivate ? 1 : 0,
          Number(resourceData.orderIndex || 1),
          now
        );

      const enrolled = sqlite
        .prepare("SELECT student_id FROM course_enrollments WHERE course_id = ? AND status = 'active'")
        .all(resourceData.courseId) as Array<{ student_id: string }>;

      const insertNotif = sqlite.prepare(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 'resource_added', 0, ?)`
      );
      for (const e of enrolled) {
        insertNotif.run(
          `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          e.student_id,
          `New Material: ${course.title}`,
          `New resource "${resourceData.title.trim()}" (${resourceData.resourceType.toUpperCase()}) was uploaded.`,
          now
        );
      }
      sqlite.exec('COMMIT');
    } catch (err) {
      sqlite.exec('ROLLBACK');
      throw err;
    }

    this.logActivity(actorName, 'admin', `Added resource "${resourceData.title.trim()}" to ${course.title}`, resourceData.resourceType);
    const row = sqlite.prepare('SELECT * FROM learning_resources WHERE id = ?').get(id) as Record<string, unknown>;
    return mapResource(row);
  },

  updateResource(id: string, updates: Partial<LearningResource>, actorName = 'Admin'): LearningResource {
    const row = sqlite.prepare('SELECT * FROM learning_resources WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error('Resource not found');
    const existing = mapResource(row);
    const merged: LearningResource = { ...existing, ...updates };
    sqlite
      .prepare(`
        UPDATE learning_resources SET
          course_id = ?, title = ?, description = ?, resource_type = ?, url_or_path = ?,
          file_name = ?, file_size_bytes = ?, duration_minutes = ?, is_private = ?, order_index = ?
        WHERE id = ?
      `)
      .run(
        merged.courseId,
        merged.title,
        merged.description ?? null,
        merged.resourceType,
        merged.urlOrPath,
        merged.fileName ?? null,
        merged.fileSizeBytes ?? null,
        merged.durationMinutes ?? null,
        merged.isPrivate ? 1 : 0,
        Number(merged.orderIndex || 1),
        id
      );
    this.logActivity(actorName, 'admin', `Updated resource "${merged.title}"`, id);
    const updated = sqlite.prepare('SELECT * FROM learning_resources WHERE id = ?').get(id) as Record<string, unknown>;
    return mapResource(updated);
  },

  deleteResource(id: string, actorName = 'Admin'): void {
    const row = sqlite.prepare('SELECT title FROM learning_resources WHERE id = ?').get(id) as { title: string } | undefined;
    if (!row) throw new Error('Resource not found');
    sqlite.prepare('DELETE FROM learning_resources WHERE id = ?').run(id);
    this.logActivity(actorName, 'admin', `Deleted resource "${row.title}"`, id);
  },

  // --- MEETINGS ---
  getMeetings(): Meeting[] {
    const rows = sqlite.prepare('SELECT * FROM meetings ORDER BY scheduled_at ASC').all() as Array<Record<string, unknown>>;
    return rows.map(mapMeeting);
  },

  getMeetingsForStudent(studentId: string): Meeting[] {
    const enrolledIds = this.getStudentEnrolledCourseIds(studentId);
    const all = this.getMeetings();
    return all.filter((m) => !m.courseId || enrolledIds.includes(m.courseId));
  },

  createMeeting(meetingData: Omit<Meeting, 'id' | 'createdAt'>, actorName = 'Admin'): Meeting {
    const course = meetingData.courseId ? this.getCourseById(meetingData.courseId) : null;
    const courseTitle = course ? course.title : 'All Institute Students';
    const id = `meet-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();

    sqlite.exec('BEGIN');
    try {
      sqlite
        .prepare(`
          INSERT INTO meetings (
            id, course_id, course_title, title, description, scheduled_at, duration_minutes,
            meeting_url, platform, target_batch, host_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          id,
          meetingData.courseId || null,
          courseTitle,
          meetingData.title.trim(),
          meetingData.description.trim(),
          meetingData.scheduledAt,
          Number(meetingData.durationMinutes || 60),
          meetingData.meetingUrl.trim(),
          meetingData.platform,
          meetingData.targetBatch || null,
          meetingData.hostName.trim(),
          now
        );

      const recipients = meetingData.courseId
        ? (sqlite
            .prepare("SELECT student_id as id FROM course_enrollments WHERE course_id = ? AND status = 'active'")
            .all(meetingData.courseId) as Array<{ id: string }>)
        : (sqlite.prepare("SELECT id FROM users WHERE role = 'student' AND status = 'active'").all() as Array<{ id: string }>);

      const insertNotif = sqlite.prepare(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 'meeting_scheduled', 0, ?)`
      );
      for (const r of recipients) {
        insertNotif.run(
          `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          r.id,
          course ? `Live Session Scheduled: ${course.title}` : 'Institute Live Session Scheduled',
          `${meetingData.title.trim()} scheduled for ${new Date(meetingData.scheduledAt).toLocaleDateString()}.`,
          now
        );
      }
      sqlite.exec('COMMIT');
    } catch (err) {
      sqlite.exec('ROLLBACK');
      throw err;
    }

    this.logActivity(actorName, 'admin', `Scheduled live session "${meetingData.title.trim()}"`, meetingData.platform);
    const row = sqlite.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as Record<string, unknown>;
    return mapMeeting(row);
  },

  updateMeeting(id: string, updates: Partial<Meeting>, actorName = 'Admin'): Meeting {
    const row = sqlite.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error('Meeting not found');
    const existing = mapMeeting(row);
    const courseId = updates.courseId !== undefined ? updates.courseId : existing.courseId;
    const course = courseId ? this.getCourseById(courseId) : null;
    const courseTitle = course ? course.title : 'All Institute Students';
    const merged: Meeting = { ...existing, ...updates, courseId, courseTitle };

    sqlite
      .prepare(`
        UPDATE meetings SET
          course_id = ?, course_title = ?, title = ?, description = ?, scheduled_at = ?,
          duration_minutes = ?, meeting_url = ?, platform = ?, target_batch = ?, host_name = ?
        WHERE id = ?
      `)
      .run(
        merged.courseId ?? null,
        merged.courseTitle ?? 'All Institute Students',
        merged.title,
        merged.description,
        merged.scheduledAt,
        Number(merged.durationMinutes || 60),
        merged.meetingUrl,
        merged.platform,
        merged.targetBatch ?? null,
        merged.hostName,
        id
      );

    this.logActivity(actorName, 'admin', `Updated live session "${merged.title}"`, id);
    const updated = sqlite.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as Record<string, unknown>;
    return mapMeeting(updated);
  },

  deleteMeeting(id: string, actorName = 'Admin'): void {
    const row = sqlite.prepare('SELECT title FROM meetings WHERE id = ?').get(id) as { title: string } | undefined;
    if (!row) throw new Error('Meeting not found');
    sqlite.prepare('DELETE FROM meetings WHERE id = ?').run(id);
    this.logActivity(actorName, 'admin', `Cancelled meeting "${row.title}"`, id);
  },

  // --- ANNOUNCEMENTS ---
  getAnnouncements(): Announcement[] {
    const rows = sqlite.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
    return rows.map(mapAnnouncement);
  },

  getAnnouncementsForStudent(studentId: string): Announcement[] {
    const enrolledIds = this.getStudentEnrolledCourseIds(studentId);
    return this.getAnnouncements().filter((a) => {
      if (!a.isPublished) return false;
      if (!a.courseId) return true;
      return enrolledIds.includes(a.courseId);
    });
  },

  createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>, actorName = 'Admin'): Announcement {
    const course = data.courseId ? this.getCourseById(data.courseId) : null;
    const id = `ann-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();

    sqlite.exec('BEGIN');
    try {
      sqlite
        .prepare(`
          INSERT INTO announcements (
            id, course_id, course_title, title, content, priority, is_published, target_role, target_batch, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          id,
          data.courseId || null,
          course?.title || null,
          data.title.trim(),
          data.content.trim(),
          data.priority || 'normal',
          data.isPublished !== false ? 1 : 0,
          data.targetRole || 'students',
          data.targetBatch || null,
          now
        );

      if (data.isPublished !== false) {
        const recipients = data.courseId
          ? (sqlite
              .prepare("SELECT student_id as id FROM course_enrollments WHERE course_id = ? AND status = 'active'")
              .all(data.courseId) as Array<{ id: string }>)
          : (sqlite.prepare("SELECT id FROM users WHERE role = 'student' AND status = 'active'").all() as Array<{ id: string }>);

        const insertNotif = sqlite.prepare(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 'announcement', 0, ?)`
        );
        for (const r of recipients) {
          insertNotif.run(
            `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            r.id,
            `Notice: ${data.title.trim()}`,
            data.content.trim().slice(0, 140),
            now
          );
        }
      }
      sqlite.exec('COMMIT');
    } catch (err) {
      sqlite.exec('ROLLBACK');
      throw err;
    }

    this.logActivity(actorName, 'admin', `Published announcement: "${data.title.trim()}"`, data.priority);
    const row = sqlite.prepare('SELECT * FROM announcements WHERE id = ?').get(id) as Record<string, unknown>;
    return mapAnnouncement(row);
  },

  updateAnnouncement(id: string, updates: Partial<Announcement>, actorName = 'Admin'): Announcement {
    const row = sqlite.prepare('SELECT * FROM announcements WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error('Announcement not found');
    const existing = mapAnnouncement(row);
    const courseId = updates.courseId !== undefined ? updates.courseId : existing.courseId;
    const course = courseId ? this.getCourseById(courseId) : null;
    const merged: Announcement = {
      ...existing,
      ...updates,
      courseId,
      courseTitle: course?.title ?? undefined,
    };
    sqlite
      .prepare(`
        UPDATE announcements SET
          course_id = ?, course_title = ?, title = ?, content = ?, priority = ?,
          is_published = ?, target_role = ?, target_batch = ?
        WHERE id = ?
      `)
      .run(
        merged.courseId ?? null,
        merged.courseTitle ?? null,
        merged.title,
        merged.content,
        merged.priority,
        merged.isPublished ? 1 : 0,
        merged.targetRole,
        merged.targetBatch ?? null,
        id
      );
    this.logActivity(actorName, 'admin', `Updated announcement: "${merged.title}"`, id);
    const updated = sqlite.prepare('SELECT * FROM announcements WHERE id = ?').get(id) as Record<string, unknown>;
    return mapAnnouncement(updated);
  },

  deleteAnnouncement(id: string, actorName = 'Admin'): void {
    const row = sqlite.prepare('SELECT title FROM announcements WHERE id = ?').get(id) as { title: string } | undefined;
    if (!row) throw new Error('Announcement not found');
    sqlite.prepare('DELETE FROM announcements WHERE id = ?').run(id);
    this.logActivity(actorName, 'admin', `Deleted announcement: "${row.title}"`, id);
  },

  // --- APPLICATIONS ---
  getApplications(): Application[] {
    const rows = sqlite.prepare('SELECT * FROM applications ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
    return rows.map(mapApplication);
  },

  submitApplication(formData: {
    fullName: string;
    email: string;
    phone: string;
    educationQualification: string;
    interestedCourseId: string;
    programType: Application['programType'];
    city: string;
    state: string;
    notes?: string;
  }): Application {
    const course = formData.interestedCourseId ? this.getCourseById(formData.interestedCourseId) : undefined;
    const id = `app-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();
    const courseTitle = course?.title || 'General Apprenticeship';

    sqlite
      .prepare(`
        INSERT INTO applications (
          id, full_name, email, phone, education_qualification, interested_course_id, interested_course_title,
          program_type, city, state, notes, status, admin_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', null, ?, ?)
      `)
      .run(
        id,
        formData.fullName.trim(),
        formData.email.trim().toLowerCase(),
        formData.phone.trim(),
        formData.educationQualification.trim(),
        formData.interestedCourseId || '',
        courseTitle,
        formData.programType,
        formData.city.trim(),
        formData.state.trim(),
        formData.notes?.trim() || null,
        now,
        now
      );

    this.logActivity('Public User', 'applicant', `New course application submitted by ${formData.fullName.trim()}`, courseTitle);
    const row = sqlite.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Record<string, unknown>;
    return mapApplication(row);
  },

  updateApplicationStatus(id: string, status: ApplicationStatus, adminNotes?: string, actorName = 'Admin'): Application {
    const row = sqlite.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error('Application not found');
    const existing = mapApplication(row);
    const now = new Date().toISOString();
    const nextNotes = adminNotes !== undefined ? adminNotes : existing.adminNotes ?? null;

    sqlite
      .prepare('UPDATE applications SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?')
      .run(status, nextNotes, now, id);

    this.logActivity(actorName, 'admin', `Application for ${existing.fullName} updated to ${status.toUpperCase()}`, id);
    const updated = sqlite.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Record<string, unknown>;
    return mapApplication(updated);
  },

  deleteApplication(id: string, actorName = 'Admin'): void {
    const row = sqlite.prepare('SELECT full_name FROM applications WHERE id = ?').get(id) as { full_name: string } | undefined;
    if (!row) throw new Error('Application not found');
    sqlite.prepare('DELETE FROM applications WHERE id = ?').run(id);
    this.logActivity(actorName, 'admin', `Deleted application from ${row.full_name}`, id);
  },

  convertApplicationToStudent(
    applicationId: string,
    assignedCourseIds: string[],
    actorName = 'Admin'
  ): { student: UserProfile; tempPassword: string } {
    const row = sqlite.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as Record<string, unknown> | undefined;
    if (!row) throw new Error('Application not found');
    const app = mapApplication(row);

    const coursesToAssign =
      assignedCourseIds.length > 0 ? assignedCourseIds : app.interestedCourseId ? [app.interestedCourseId] : [];

    const result = this.createStudent(
      {
        fullName: app.fullName,
        email: app.email,
        mobileNumber: app.phone,
        batch: `Batch ${new Date().getFullYear()} (${app.programType.toUpperCase()})`,
        assignedCourseIds: coursesToAssign,
        status: 'active',
      },
      actorName
    );

    this.updateApplicationStatus(applicationId, 'accepted', `Converted to Student ID: ${result.student.studentId}`, actorName);
    return result;
  },

  // --- INQUIRIES ---
  getInquiries(): Inquiry[] {
    const rows = sqlite.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
    return rows.map(mapInquiry);
  },

  createInquiry(data: { name: string; email: string; phone?: string; message: string }): Inquiry {
    const id = `inq-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();
    sqlite
      .prepare(`INSERT INTO inquiries (id, name, email, phone, message, status, admin_notes, created_at) VALUES (?, ?, ?, ?, ?, 'new', null, ?)`)
      .run(id, data.name.trim(), data.email.trim().toLowerCase(), data.phone?.trim() || null, data.message.trim(), now);
    this.logActivity('Website Visitor', 'inquiry', `General query submitted by ${data.name.trim()}`, data.email.trim().toLowerCase());
    const row = sqlite.prepare('SELECT * FROM inquiries WHERE id = ?').get(id) as Record<string, unknown>;
    return mapInquiry(row);
  },

  updateInquiry(id: string, updates: { status?: Inquiry['status']; adminNotes?: string }, actorName = 'Admin'): Inquiry {
    const row = sqlite.prepare('SELECT * FROM inquiries WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error('Inquiry not found');
    const existing = mapInquiry(row);
    const status = updates.status ?? existing.status;
    const adminNotes = updates.adminNotes !== undefined ? updates.adminNotes : existing.adminNotes ?? null;
    sqlite.prepare('UPDATE inquiries SET status = ?, admin_notes = ? WHERE id = ?').run(status, adminNotes, id);
    this.logActivity(actorName, 'admin', `Updated inquiry from ${existing.name} to ${status}`, id);
    const updated = sqlite.prepare('SELECT * FROM inquiries WHERE id = ?').get(id) as Record<string, unknown>;
    return mapInquiry(updated);
  },

  deleteInquiry(id: string, actorName = 'Admin'): void {
    const row = sqlite.prepare('SELECT name FROM inquiries WHERE id = ?').get(id) as { name: string } | undefined;
    if (!row) throw new Error('Inquiry not found');
    sqlite.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
    this.logActivity(actorName, 'admin', `Deleted inquiry from ${row.name}`, id);
  },

  // --- NOTIFICATIONS ---
  getNotificationsForUser(userId: string): NotificationItem[] {
    const rows = sqlite
      .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as Array<Record<string, unknown>>;
    return rows.map(mapNotification);
  },

  markNotificationAsRead(id: string, userId: string): boolean {
    const res = sqlite.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    return Number(res.changes) > 0;
  },

  markAllNotificationsAsRead(userId: string): void {
    sqlite.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  },

  // --- ACTIVITY LOGS ---
  getActivityLogs(): ActivityLog[] {
    const rows = sqlite.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 50').all() as Array<Record<string, unknown>>;
    return rows.map(mapActivityLog);
  },

  logActivity(actorName: string, actorRole: string, action: string, target: string): void {
    sqlite
      .prepare('INSERT INTO activity_logs (id, actor_name, actor_role, action, target, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run(`log-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`, actorName, actorRole, action, target, new Date().toISOString());
  },

  // --- ADMIN OVERVIEW STATS ---
  getAdminStats() {
    const students = this.getStudents();
    const courses = this.getCourses();
    const applications = this.getApplications();
    const meetings = this.getMeetings();
    const studentEnrollmentRecords = this.getStudentEnrollments();

    const activeStudents = students.filter((s) => s.status === 'active').length;
    const pendingApplications = applications.filter((a) => a.status === 'pending').length;
    const publishedCourses = courses.filter((c) => c.status === 'published').length;

    const courseEnrollmentCounts = courses.map((course) => {
      const count = studentEnrollmentRecords.filter((e) => e.courseId === course.id && e.status === 'Enrolled').length;
      return {
        name: course.title.length > 22 ? `${course.title.substring(0, 22)}...` : course.title,
        fullTitle: course.title,
        students: count,
        category: course.category,
      };
    });

    return {
      totalStudents: students.length,
      activeStudents,
      inactiveStudents: students.length - activeStudents,
      totalCourses: courses.length,
      publishedCourses,
      totalApplications: applications.length,
      pendingApplications,
      upcomingMeetingsCount: meetings.length,
      courseEnrollmentCounts,
    };
  },

  // --- ENROLLED STUDENTS MASTER DIRECTORY (17-FIELD) ---
  getEnrolledStudents(): EnrolledStudent[] {
    const rows = sqlite
      .prepare('SELECT * FROM enrolled_students ORDER BY created_at DESC, student_name ASC')
      .all() as Array<Record<string, unknown>>;
    return rows.map(mapEnrolledStudent);
  },

  getEnrolledStudentById(id: string): EnrolledStudent | undefined {
    const row = sqlite.prepare('SELECT * FROM enrolled_students WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? mapEnrolledStudent(row) : undefined;
  },

  getEnrolledStudentStats(): EnrolledStudentStats {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const counts = sqlite
      .prepare(`
        SELECT
          COUNT(*) as total_cnt,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_cnt,
          COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive_cnt,
          COUNT(CASE
            WHEN (registration_date != '' AND registration_date >= ?)
              OR (registration_date = '' AND substr(created_at, 1, 10) >= ?)
            THEN 1
          END) as newly_enrolled_cnt
        FROM enrolled_students
      `)
      .get(thirtyDaysAgo, thirtyDaysAgo) as Record<string, unknown>;

    const locRows = sqlite
      .prepare(`
        SELECT
          CASE WHEN TRIM(location) = '' THEN 'Unspecified' ELSE TRIM(location) END as loc,
          COUNT(*) as cnt
        FROM enrolled_students
        GROUP BY loc
        ORDER BY cnt DESC, loc ASC
      `)
      .all() as Array<{ loc: string; cnt: number }>;

    const staffRows = sqlite
      .prepare(`
        SELECT DISTINCT TRIM(assigned_staff_name) as staff
        FROM enrolled_students
        WHERE TRIM(assigned_staff_name) != ''
        ORDER BY staff ASC
      `)
      .all() as Array<{ staff: string }>;

    return {
      totalStudents: Number(counts.total_cnt || 0),
      activeStudents: Number(counts.active_cnt || 0),
      inactiveStudents: Number(counts.inactive_cnt || 0),
      newlyEnrolledStudents: Number(counts.newly_enrolled_cnt || 0),
      locationCounts: locRows.map((r) => ({ location: String(r.loc), count: Number(r.cnt || 0) })),
      staffList: staffRows.map((r) => String(r.staff)),
    };
  },

  createEnrolledStudent(input: EnrolledStudentInput, actorName = 'Admin'): EnrolledStudent {
    const normalized = normalizeEnrolledStudentInput(input);
    const dup = sqlite
      .prepare('SELECT id FROM enrolled_students WHERE LOWER(TRIM(employee_code)) = LOWER(TRIM(?))')
      .get(normalized.employeeCode);
    if (dup) {
      throw new Error(`Duplicate Employee Code "${normalized.employeeCode}" already exists in the database.`);
    }

    const id = `est-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    sqlite
      .prepare(`
        INSERT INTO enrolled_students (
          id, location, employee_code, student_name, mother_name, father_name, date_of_birth,
          email, mobile_number, gender, aadhaar_number, permanent_address, pan_number, status,
          remarks, registration_date, assigned_staff_name, abc_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        normalized.location,
        normalized.employeeCode,
        normalized.studentName,
        normalized.motherName,
        normalized.fatherName,
        normalized.dateOfBirth,
        normalized.email,
        normalized.mobileNumber,
        normalized.gender,
        normalized.aadhaarNumber,
        normalized.permanentAddress,
        normalized.panNumber,
        normalized.status,
        normalized.remarks,
        normalized.registrationDate,
        normalized.assignedStaffName,
        normalized.abcId,
        now,
        now
      );

    this.logActivity(
      actorName,
      'admin',
      `Added student "${normalized.studentName}" (${normalized.employeeCode})`,
      normalized.location || 'Master Directory'
    );
    return this.getEnrolledStudentById(id)!;
  },

  updateEnrolledStudent(id: string, updates: Partial<EnrolledStudentInput>, actorName = 'Admin'): EnrolledStudent {
    const existing = this.getEnrolledStudentById(id);
    if (!existing) throw new Error('Student record not found.');

    const mergedRaw: EnrolledStudentInput = {
      location: updates.location !== undefined ? updates.location : existing.location,
      employeeCode: updates.employeeCode !== undefined ? updates.employeeCode : existing.employeeCode,
      studentName: updates.studentName !== undefined ? updates.studentName : existing.studentName,
      motherName: updates.motherName !== undefined ? updates.motherName : existing.motherName,
      fatherName: updates.fatherName !== undefined ? updates.fatherName : existing.fatherName,
      dateOfBirth: updates.dateOfBirth !== undefined ? updates.dateOfBirth : existing.dateOfBirth,
      email: updates.email !== undefined ? updates.email : existing.email,
      mobileNumber: updates.mobileNumber !== undefined ? updates.mobileNumber : existing.mobileNumber,
      gender: updates.gender !== undefined ? updates.gender : existing.gender,
      aadhaarNumber: updates.aadhaarNumber !== undefined ? updates.aadhaarNumber : existing.aadhaarNumber,
      permanentAddress: updates.permanentAddress !== undefined ? updates.permanentAddress : existing.permanentAddress,
      panNumber: updates.panNumber !== undefined ? updates.panNumber : existing.panNumber,
      status: updates.status !== undefined ? updates.status : existing.status,
      remarks: updates.remarks !== undefined ? updates.remarks : existing.remarks,
      registrationDate: updates.registrationDate !== undefined ? updates.registrationDate : existing.registrationDate,
      assignedStaffName: updates.assignedStaffName !== undefined ? updates.assignedStaffName : existing.assignedStaffName,
      abcId: updates.abcId !== undefined ? updates.abcId : existing.abcId,
    };

    const normalized = normalizeEnrolledStudentInput(mergedRaw);
    const dup = sqlite
      .prepare('SELECT id FROM enrolled_students WHERE LOWER(TRIM(employee_code)) = LOWER(TRIM(?)) AND id != ?')
      .get(normalized.employeeCode, id);
    if (dup) {
      throw new Error(`Duplicate Employee Code "${normalized.employeeCode}" is assigned to another student.`);
    }

    const now = new Date().toISOString();
    sqlite
      .prepare(`
        UPDATE enrolled_students SET
          location = ?, employee_code = ?, student_name = ?, mother_name = ?, father_name = ?,
          date_of_birth = ?, email = ?, mobile_number = ?, gender = ?, aadhaar_number = ?,
          permanent_address = ?, pan_number = ?, status = ?, remarks = ?, registration_date = ?,
          assigned_staff_name = ?, abc_id = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(
        normalized.location,
        normalized.employeeCode,
        normalized.studentName,
        normalized.motherName,
        normalized.fatherName,
        normalized.dateOfBirth,
        normalized.email,
        normalized.mobileNumber,
        normalized.gender,
        normalized.aadhaarNumber,
        normalized.permanentAddress,
        normalized.panNumber,
        normalized.status,
        normalized.remarks,
        normalized.registrationDate,
        normalized.assignedStaffName,
        normalized.abcId,
        now,
        id
      );

    this.logActivity(
      actorName,
      'admin',
      `Updated student record "${normalized.studentName}" (${normalized.employeeCode})`,
      normalized.status
    );
    return this.getEnrolledStudentById(id)!;
  },

  toggleEnrolledStudentStatus(id: string, actorName = 'Admin'): EnrolledStudent {
    const existing = this.getEnrolledStudentById(id);
    if (!existing) throw new Error('Student record not found.');
    const nextStatus: EnrolledStudentStatus = existing.status === 'Active' ? 'Inactive' : 'Active';
    return this.updateEnrolledStudent(id, { status: nextStatus }, actorName);
  },

  deleteEnrolledStudent(id: string, actorName = 'Admin'): void {
    const existing = this.getEnrolledStudentById(id);
    if (!existing) throw new Error('Student record not found.');
    sqlite.prepare('DELETE FROM enrolled_students WHERE id = ?').run(id);
    this.logActivity(
      actorName,
      'admin',
      `Deleted student "${existing.studentName}" (${existing.employeeCode})`,
      existing.location || id
    );
  },

  bulkImportEnrolledStudents(
    rows: EnrolledStudentInput[],
    actorName = 'Admin'
  ): {
    importedCount: number;
    skippedDuplicates: Array<{ rowNumber: number; employeeCode: string; studentName: string; reason: string }>;
    invalidRows: Array<{ rowNumber: number; employeeCode: string; studentName: string; reason: string }>;
    inserted: EnrolledStudent[];
  } {
    const existingCodesRows = sqlite
      .prepare('SELECT LOWER(TRIM(employee_code)) as code FROM enrolled_students')
      .all() as Array<{ code: string }>;
    const seenCodes = new Set(existingCodesRows.map((r) => r.code));

    const skippedDuplicates: Array<{ rowNumber: number; employeeCode: string; studentName: string; reason: string }> = [];
    const invalidRows: Array<{ rowNumber: number; employeeCode: string; studentName: string; reason: string }> = [];
    const validToInsert: Array<Omit<EnrolledStudent, 'id' | 'createdAt' | 'updatedAt'>> = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const rowNumber = idx + 1;
      const rawCode = String(row?.employeeCode ?? '').trim();
      const rawName = String(row?.studentName ?? '').trim();
      const normalizedCodeKey = rawCode.toLowerCase();

      if (rawCode && seenCodes.has(normalizedCodeKey)) {
        skippedDuplicates.push({
          rowNumber,
          employeeCode: rawCode,
          studentName: rawName,
          reason: 'Duplicate Employee Code (already exists in database or earlier in import file)',
        });
        continue;
      }

      try {
        const normalized = normalizeEnrolledStudentInput(row);
        seenCodes.add(normalized.employeeCode.toLowerCase());
        validToInsert.push(normalized);
      } catch (err) {
        invalidRows.push({
          rowNumber,
          employeeCode: rawCode,
          studentName: rawName,
          reason: err instanceof Error ? err.message : 'Invalid row data',
        });
      }
    }

    const inserted: EnrolledStudent[] = [];
    const now = new Date().toISOString();

    if (validToInsert.length > 0) {
      const insertStmt = sqlite.prepare(`
        INSERT INTO enrolled_students (
          id, location, employee_code, student_name, mother_name, father_name, date_of_birth,
          email, mobile_number, gender, aadhaar_number, permanent_address, pan_number, status,
          remarks, registration_date, assigned_staff_name, abc_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sqlite.exec('BEGIN');
      try {
        for (let i = 0; i < validToInsert.length; i++) {
          const item = validToInsert[i];
          const id = `est-${Date.now()}-${i}-${crypto.randomBytes(2).toString('hex')}`;
          insertStmt.run(
            id,
            item.location,
            item.employeeCode,
            item.studentName,
            item.motherName,
            item.fatherName,
            item.dateOfBirth,
            item.email,
            item.mobileNumber,
            item.gender,
            item.aadhaarNumber,
            item.permanentAddress,
            item.panNumber,
            item.status,
            item.remarks,
            item.registrationDate,
            item.assignedStaffName,
            item.abcId,
            now,
            now
          );
          inserted.push({ id, ...item, createdAt: now, updatedAt: now });
        }
        sqlite.exec('COMMIT');
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }

      this.logActivity(
        actorName,
        'admin',
        `Bulk imported ${inserted.length} student record(s) from Excel/CSV`,
        `Skipped ${skippedDuplicates.length} duplicate(s), ${invalidRows.length} invalid`
      );
    }

    return {
      importedCount: inserted.length,
      skippedDuplicates,
      invalidRows,
      inserted,
    };
  },
};
