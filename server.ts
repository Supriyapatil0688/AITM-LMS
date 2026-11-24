import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { WebSocketServer, WebSocket } from 'ws';
import { serverDb } from './server/database.ts';
import type { UserProfile } from './src/types/index.ts';

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Ephemeral in-memory fallback secret if SESSION_SECRET env var is not configured
const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
const SESSION_COOKIE_NAME = 'aitm_session';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Token Signing & Verification
// ---------------------------------------------------------------------------
interface SessionPayload {
  uid: string;
  role: 'admin' | 'student';
  exp: number;
}

function signToken(user: UserProfile): string {
  const payload: SessionPayload = {
    uid: user.id,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.uid || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

function setSessionCookie(req: express.Request, res: express.Response, token: string): void {
  const isHttps = req.secure || req.get('x-forwarded-proto') === 'https';
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) {
    parts.push('Secure', 'Partitioned');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(req: express.Request, res: express.Response): void {
  const isHttps = req.secure || req.get('x-forwarded-proto') === 'https';
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) {
    parts.push('Secure', 'Partitioned');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

// ---------------------------------------------------------------------------
// Express App & Real-Time WebSocket Server
// ---------------------------------------------------------------------------
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const reqUrl = request.url || '';
  const pathname = reqUrl.split('?')[0];
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (IS_PROD) {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
});

function broadcastSync(entity: string, action: string, id?: string): void {
  const payload = JSON.stringify({
    type: 'sync',
    entity,
    action,
    id: id ?? null,
    timestamp: new Date().toISOString(),
  });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// ---------------------------------------------------------------------------
// Auth Middlewares
// ---------------------------------------------------------------------------
interface AuthedRequest extends express.Request {
  authUser?: UserProfile;
  authViaCookie?: boolean;
}

function extractAuth(req: AuthedRequest): { user?: UserProfile; viaCookie: boolean } {
  const authHeader = req.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = verifyToken(token);
    if (payload) {
      const user = serverDb.getUserById(payload.uid);
      if (user && user.status === 'active') {
        return { user, viaCookie: false };
      }
    }
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) {
    const payload = verifyToken(cookieToken);
    if (payload) {
      const user = serverDb.getUserById(payload.uid);
      if (user && user.status === 'active') {
        return { user, viaCookie: true };
      }
    }
  }
  return { viaCookie: false };
}

function verifyMutationCsrf(req: AuthedRequest): boolean {
  if (!req.authViaCookie) return true;
  if (req.get('x-requested-with') === 'XMLHttpRequest') return true;
  const origin = req.get('origin');
  const host = req.get('x-forwarded-host') || req.get('host');
  if (origin && host) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  return false;
}

function requireAuth(req: AuthedRequest, res: express.Response, next: express.NextFunction): void {
  const { user, viaCookie } = extractAuth(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  req.authUser = user;
  req.authViaCookie = viaCookie;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !verifyMutationCsrf(req)) {
    res.status(403).json({ error: 'CSRF verification failed.' });
    return;
  }
  next();
}

function requireAdmin(req: AuthedRequest, res: express.Response, next: express.NextFunction): void {
  if (!req.authUser || req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required.' });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// File Uploads (/uploads) & Static Assets Security
// ---------------------------------------------------------------------------
const ALLOWED_UPLOAD_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.doc', '.docx']);

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_UPLOAD_EXTS.has(ext) ? ext : '';
    const base = path
      .basename(file.originalname || 'file', ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${base}${safeExt}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
      cb(new Error('Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX.'));
      return;
    }
    cb(null, true);
  },
});

app.use('/uploads', (req, res, next) => {
  const cleanRel = decodeURIComponent(req.path).replace(/^\/+/, '');
  const resolved = path.resolve(UPLOADS_DIR, cleanRel);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep) && resolved !== UPLOADS_DIR) {
    res.status(403).json({ error: 'Forbidden path' });
    return;
  }
  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(resolved);
  void next;
});

app.post('/api/upload', requireAuth, (req: AuthedRequest, res: express.Response) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'File upload failed';
      res.status(400).json({ error: msg });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file provided.' });
      return;
    }
    // Non-admin users may only upload small image avatars
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    if (req.authUser?.role !== 'admin' && !['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      fs.unlink(req.file.path, () => {});
      res.status(403).json({ error: 'Only administrators can upload documents.' });
      return;
    }
    res.json({
      url: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      sizeBytes: req.file.size,
      mimeType: req.file.mimetype,
    });
  });
});

// ---------------------------------------------------------------------------
// Authentication Routes
// ---------------------------------------------------------------------------
app.get('/api/auth/bootstrap-status', (_req, res) => {
  res.json(serverDb.getBootstrapStatus());
});

app.post('/api/auth/claim-admin', (req, res) => {
  try {
    const password = String(req.body?.password || '');
    const adminUser = serverDb.claimAdminPassword(password);
    const token = signToken(adminUser);
    setSessionCookie(req, res, token);
    res.json({ user: adminUser, token });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to claim admin password.' });
  }
});

app.post('/api/auth/activate-student', (req, res) => {
  try {
    const email = String(req.body?.email || '');
    const password = String(req.body?.password || '');
    const student = serverDb.activateStudentPassword(email, password);
    const token = signToken(student);
    setSessionCookie(req, res, token);
    res.json({ user: student, token });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to activate student account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const result = serverDb.authenticateUser(email, password);
  if (!result.user) {
    res.status(401).json({
      error: result.error || 'Invalid credentials.',
      needsSetup: result.needsSetup,
    });
    return;
  }
  const token = signToken(result.user);
  setSessionCookie(req, res, token);
  res.json({ user: result.user, token });
});

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req: AuthedRequest, res) => {
  const { user } = extractAuth(req);
  if (!user) {
    res.json({ user: null });
    return;
  }
  res.json({ user });
});

app.post('/api/auth/impersonate', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  const targetUserId = String(req.body?.userId || '');
  const target = serverDb.getUserById(targetUserId);
  if (!target) {
    res.status(404).json({ error: 'Target user not found.' });
    return;
  }
  const token = signToken(target);
  setSessionCookie(req, res, token);
  res.json({ user: target, token });
});

app.post('/api/auth/request-reset', (req, res) => {
  const email = String(req.body?.email || '').trim();
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }
  const user = serverDb.getUserByEmail(email);
  if (user) {
    serverDb.logActivity(user.fullName, user.role, 'Requested portal password reset', user.email);
    broadcastSync('activity_logs', 'created');
  }
  res.json({
    success: true,
    message:
      'If an account exists with this email, a password reset request has been logged with AITM administration.',
  });
});

// ---------------------------------------------------------------------------
// Public Website Routes
// ---------------------------------------------------------------------------
app.get('/api/public/bootstrap', (_req, res) => {
  res.json({
    settings: serverDb.getSettings(),
    courses: serverDb.getPublishedCourses(),
    meetings: serverDb.getMeetings(),
    announcements: serverDb.getAnnouncements().filter((a) => a.isPublished && a.targetRole === 'all'),
  });
});

app.post('/api/applications', (req, res) => {
  try {
    const { fullName, email, phone, educationQualification, interestedCourseId, programType, city, state, notes } =
      req.body || {};
    if (!fullName || !email || !phone || !educationQualification || !city || !state) {
      res.status(400).json({ error: 'Please complete all required application fields.' });
      return;
    }
    const appRecord = serverDb.submitApplication({
      fullName: String(fullName),
      email: String(email),
      phone: String(phone),
      educationQualification: String(educationQualification),
      interestedCourseId: String(interestedCourseId || ''),
      programType: programType || 'naps',
      city: String(city),
      state: String(state),
      notes: notes ? String(notes) : undefined,
    });
    broadcastSync('applications', 'created', appRecord.id);
    broadcastSync('activity_logs', 'created');
    res.status(201).json(appRecord);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to submit application.' });
  }
});

app.post('/api/inquiries', (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required.' });
      return;
    }
    const inquiry = serverDb.createInquiry({
      name: String(name),
      email: String(email),
      phone: phone ? String(phone) : undefined,
      message: String(message),
    });
    broadcastSync('inquiries', 'created', inquiry.id);
    broadcastSync('activity_logs', 'created');
    res.status(201).json(inquiry);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to submit inquiry.' });
  }
});

// ---------------------------------------------------------------------------
// Authenticated Student Routes (Strict Server-Side Access Isolation)
// ---------------------------------------------------------------------------
app.get('/api/student/dashboard', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const courses = user.role === 'admin' ? serverDb.getCourses() : serverDb.getStudentEnrolledCourses(user.id);
  const resources = user.role === 'admin' ? serverDb.getResources() : serverDb.getResourcesForStudent(user.id);
  const meetings = user.role === 'admin' ? serverDb.getMeetings() : serverDb.getMeetingsForStudent(user.id);
  const announcements =
    user.role === 'admin' ? serverDb.getAnnouncements() : serverDb.getAnnouncementsForStudent(user.id);
  const notifications = serverDb.getNotificationsForUser(user.id);

  res.json({
    courses,
    resources,
    meetings,
    announcements,
    notifications,
  });
});

app.patch('/api/student/profile', requireAuth, (req: AuthedRequest, res) => {
  try {
    const user = req.authUser!;
    const allowedUpdates: Partial<UserProfile> = {};
    if (typeof req.body?.mobileNumber === 'string') {
      allowedUpdates.mobileNumber = req.body.mobileNumber;
    }
    if (typeof req.body?.avatarUrl === 'string') {
      allowedUpdates.avatarUrl = req.body.avatarUrl;
    }
    const updated = serverDb.updateStudent(user.id, allowedUpdates, user.fullName);
    broadcastSync('students', 'updated', user.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update profile.' });
  }
});

app.patch('/api/notifications/:id/read', requireAuth, (req: AuthedRequest, res) => {
  const id = String(req.params.id);
  const ok = serverDb.markNotificationAsRead(id, req.authUser!.id);
  if (!ok) {
    res.status(404).json({ error: 'Notification not found.' });
    return;
  }
  broadcastSync('notifications', 'updated', req.authUser!.id);
  res.json({ ok: true });
});

app.post('/api/notifications/read-all', requireAuth, (req: AuthedRequest, res) => {
  serverDb.markAllNotificationsAsRead(req.authUser!.id);
  broadcastSync('notifications', 'updated', req.authUser!.id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Authenticated Admin Routes
// ---------------------------------------------------------------------------
app.get('/api/admin/bootstrap', requireAuth, requireAdmin, (_req, res) => {
  res.json({
    settings: serverDb.getSettings(),
    courses: serverDb.getCourses(),
    students: serverDb.getStudents(),
    enrollments: serverDb.getEnrollments(),
    studentEnrollmentRecords: serverDb.getStudentEnrollments(),
    enrolledStudents: serverDb.getEnrolledStudents(),
    enrolledStudentStats: serverDb.getEnrolledStudentStats(),
    resources: serverDb.getResources(),
    meetings: serverDb.getMeetings(),
    announcements: serverDb.getAnnouncements(),
    applications: serverDb.getApplications(),
    inquiries: serverDb.getInquiries(),
    activityLogs: serverDb.getActivityLogs(),
    adminStats: serverDb.getAdminStats(),
    enrollmentDashboardStats: serverDb.getEnrollmentDashboardStats(),
  });
});

app.get('/api/admin/reports/enrollment', requireAuth, requireAdmin, (_req, res) => {
  res.json({
    settings: serverDb.getSettings(),
    stats: serverDb.getEnrollmentDashboardStats(),
    enrollments: serverDb.getStudentEnrollments(),
  });
});

app.put('/api/admin/settings', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const updated = serverDb.updateSettings(req.body || {}, req.authUser!.fullName);
    broadcastSync('settings', 'updated');
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update settings.' });
  }
});

// Courses CRUD
app.get('/api/admin/courses', requireAuth, requireAdmin, (_req, res) => {
  res.json(serverDb.getCourses());
});

app.post('/api/admin/courses', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.description || !body.category || !body.duration || !body.batch || !body.instructorName) {
      res.status(400).json({ error: 'Missing required course fields.' });
      return;
    }
    const created = serverDb.createCourse(body, req.authUser!.fullName);
    broadcastSync('courses', 'created', created.id);
    broadcastSync('reports', 'updated');
    broadcastSync('activity_logs', 'created');
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create course.' });
  }
});

app.put('/api/admin/courses/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.updateCourse(id, req.body || {}, req.authUser!.fullName);
    broadcastSync('courses', 'updated', id);
    broadcastSync('reports', 'updated');
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update course.' });
  }
});

app.delete('/api/admin/courses/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    serverDb.deleteCourse(id, req.authUser!.fullName);
    broadcastSync('courses', 'deleted', id);
    broadcastSync('enrollments', 'updated');
    broadcastSync('resources', 'updated');
    broadcastSync('reports', 'updated');
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete course.' });
  }
});

// Students & LMS Course Access CRUD
app.get('/api/admin/students', requireAuth, requireAdmin, (_req, res) => {
  res.json({
    students: serverDb.getStudents(),
    enrollments: serverDb.getEnrollments(),
  });
});

app.post('/api/admin/students', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const body = req.body || {};
    if (!body.fullName || !body.email) {
      res.status(400).json({ error: 'Student full name and email are required.' });
      return;
    }
    const result = serverDb.createStudent(body, req.authUser!.fullName);
    broadcastSync('students', 'created', result.student.id);
    broadcastSync('enrollments', 'updated');
    broadcastSync('reports', 'updated');
    broadcastSync('notifications', 'created', result.student.id);
    broadcastSync('activity_logs', 'created');
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create student.' });
  }
});

app.put('/api/admin/students/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.updateStudent(id, req.body || {}, req.authUser!.fullName);
    broadcastSync('students', 'updated', id);
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update student.' });
  }
});

app.patch('/api/admin/students/:id/toggle-status', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.toggleStudentStatus(id, req.authUser!.fullName);
    broadcastSync('students', 'updated', id);
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to toggle student status.' });
  }
});

app.put('/api/admin/students/:id/courses', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const courseIds = Array.isArray(req.body?.courseIds) ? req.body.courseIds.map(String) : [];
    serverDb.assignCoursesToStudent(id, courseIds, req.authUser!.fullName);
    broadcastSync('enrollments', 'updated', id);
    broadcastSync('notifications', 'created', id);
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update course assignments.' });
  }
});

app.post('/api/admin/students/:id/reset-password', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const newPassword = String(req.body?.password || '').trim() || `Aitm@${Math.floor(1000 + Math.random() * 9000)}`;
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    serverDb.setUserPassword(id, newPassword, req.authUser!.fullName);
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true, temporaryPassword: newPassword });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to reset student password.' });
  }
});

app.delete('/api/admin/students/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    serverDb.deleteStudent(id, req.authUser!.fullName);
    broadcastSync('students', 'deleted', id);
    broadcastSync('enrollments', 'updated');
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete student.' });
  }
});

// Student Enrollment Records CRUD
app.get('/api/admin/enrollments', requireAuth, requireAdmin, (_req, res) => {
  res.json(serverDb.getStudentEnrollments());
});

app.post('/api/admin/enrollments', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const body = req.body || {};
    if (!body.fullName || !body.mobileNumber || !body.email || !body.courseId || !body.batch || !body.enrollmentDate) {
      res.status(400).json({ error: 'All student enrollment fields are required.' });
      return;
    }
    const created = serverDb.addStudentEnrollment(body, req.authUser!.fullName);
    broadcastSync('student_enrollment_records', 'created', created.id);
    broadcastSync('courses', 'updated', created.courseId);
    broadcastSync('reports', 'updated');
    broadcastSync('activity_logs', 'created');
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to add student enrollment.' });
  }
});

app.put('/api/admin/enrollments/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.updateStudentEnrollment(id, req.body || {}, req.authUser!.fullName);
    broadcastSync('student_enrollment_records', 'updated', id);
    broadcastSync('courses', 'updated');
    broadcastSync('reports', 'updated');
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update student enrollment.' });
  }
});

app.delete('/api/admin/enrollments/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    serverDb.deleteStudentEnrollment(id, req.authUser!.fullName);
    broadcastSync('student_enrollment_records', 'deleted', id);
    broadcastSync('courses', 'updated');
    broadcastSync('reports', 'updated');
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete student enrollment.' });
  }
});

// Master Enrolled Students Directory (17-Field CRUD & Bulk Import)
app.get('/api/admin/enrolled-students', requireAuth, requireAdmin, (_req, res) => {
  res.json({
    students: serverDb.getEnrolledStudents(),
    stats: serverDb.getEnrolledStudentStats(),
  });
});

app.post('/api/admin/enrolled-students', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const body = req.body || {};
    if (!body.employeeCode || !body.studentName) {
      res.status(400).json({ error: 'Employee Code and Student Name are required.' });
      return;
    }
    const created = serverDb.createEnrolledStudent(body, req.authUser!.fullName);
    broadcastSync('enrolled_students', 'created', created.id);
    broadcastSync('activity_logs', 'created');
    res.status(201).json(created);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create student record.';
    res.status(msg.includes('Duplicate Employee Code') ? 409 : 400).json({ error: msg });
  }
});

app.post('/api/admin/enrolled-students/bulk-import', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const rows = req.body?.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: 'Please provide at least one student row to import.' });
      return;
    }
    if (rows.length > 5000) {
      res.status(400).json({ error: 'Import batch exceeds maximum 5,000 rows per upload.' });
      return;
    }
    const result = serverDb.bulkImportEnrolledStudents(rows, req.authUser!.fullName);
    if (result.importedCount > 0) {
      broadcastSync('enrolled_students', 'bulk_imported');
      broadcastSync('activity_logs', 'created');
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Bulk import failed.' });
  }
});

app.put('/api/admin/enrolled-students/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.updateEnrolledStudent(id, req.body || {}, req.authUser!.fullName);
    broadcastSync('enrolled_students', 'updated', id);
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update student record.';
    res.status(msg.includes('Duplicate Employee Code') ? 409 : 400).json({ error: msg });
  }
});

app.patch('/api/admin/enrolled-students/:id/toggle-status', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.toggleEnrolledStudentStatus(id, req.authUser!.fullName);
    broadcastSync('enrolled_students', 'updated', id);
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to toggle student status.' });
  }
});

app.delete('/api/admin/enrolled-students/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    serverDb.deleteEnrolledStudent(id, req.authUser!.fullName);
    broadcastSync('enrolled_students', 'deleted', id);
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete student record.' });
  }
});

// Learning Resources CRUD
app.get('/api/admin/resources', requireAuth, requireAdmin, (_req, res) => {
  res.json(serverDb.getResources());
});

app.post('/api/admin/resources', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const body = req.body || {};
    if (!body.courseId || !body.title || !body.urlOrPath || !body.resourceType) {
      res.status(400).json({ error: 'Course, title, resource type, and URL/file are required.' });
      return;
    }
    const created = serverDb.addResource(body, req.authUser!.fullName);
    broadcastSync('resources', 'created', created.id);
    broadcastSync('notifications', 'created');
    broadcastSync('activity_logs', 'created');
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to add learning resource.' });
  }
});

app.put('/api/admin/resources/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.updateResource(id, req.body || {}, req.authUser!.fullName);
    broadcastSync('resources', 'updated', id);
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update resource.' });
  }
});

app.delete('/api/admin/resources/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    serverDb.deleteResource(id, req.authUser!.fullName);
    broadcastSync('resources', 'deleted', id);
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete resource.' });
  }
});

// Meetings CRUD
app.get('/api/admin/meetings', requireAuth, requireAdmin, (_req, res) => {
  res.json(serverDb.getMeetings());
});

app.post('/api/admin/meetings', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.scheduledAt || !body.meetingUrl || !body.hostName) {
      res.status(400).json({ error: 'Title, schedule time, meeting URL, and host are required.' });
      return;
    }
    const created = serverDb.createMeeting(body, req.authUser!.fullName);
    broadcastSync('meetings', 'created', created.id);
    broadcastSync('notifications', 'created');
    broadcastSync('activity_logs', 'created');
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to schedule meeting.' });
  }
});

app.put('/api/admin/meetings/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.updateMeeting(id, req.body || {}, req.authUser!.fullName);
    broadcastSync('meetings', 'updated', id);
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update meeting.' });
  }
});

app.delete('/api/admin/meetings/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    serverDb.deleteMeeting(id, req.authUser!.fullName);
    broadcastSync('meetings', 'deleted', id);
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete meeting.' });
  }
});

// Announcements CRUD
app.get('/api/admin/announcements', requireAuth, requireAdmin, (_req, res) => {
  res.json(serverDb.getAnnouncements());
});

app.post('/api/admin/announcements', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.content) {
      res.status(400).json({ error: 'Announcement title and content are required.' });
      return;
    }
    const created = serverDb.createAnnouncement(body, req.authUser!.fullName);
    broadcastSync('announcements', 'created', created.id);
    broadcastSync('notifications', 'created');
    broadcastSync('activity_logs', 'created');
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to publish announcement.' });
  }
});

app.put('/api/admin/announcements/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.updateAnnouncement(id, req.body || {}, req.authUser!.fullName);
    broadcastSync('announcements', 'updated', id);
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update announcement.' });
  }
});

app.delete('/api/admin/announcements/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    serverDb.deleteAnnouncement(id, req.authUser!.fullName);
    broadcastSync('announcements', 'deleted', id);
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete announcement.' });
  }
});

// Applications CRUD
app.get('/api/admin/applications', requireAuth, requireAdmin, (_req, res) => {
  res.json(serverDb.getApplications());
});

app.patch('/api/admin/applications/:id/status', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const status = req.body?.status;
    const adminNotes = req.body?.adminNotes;
    const updated = serverDb.updateApplicationStatus(id, status, adminNotes, req.authUser!.fullName);
    broadcastSync('applications', 'updated', id);
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update application.' });
  }
});

app.post('/api/admin/applications/:id/convert', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const courseIds = Array.isArray(req.body?.assignedCourseIds) ? req.body.assignedCourseIds.map(String) : [];
    const result = serverDb.convertApplicationToStudent(id, courseIds, req.authUser!.fullName);
    broadcastSync('applications', 'updated', id);
    broadcastSync('students', 'created', result.student.id);
    broadcastSync('enrollments', 'updated');
    broadcastSync('reports', 'updated');
    broadcastSync('activity_logs', 'created');
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to convert application to student.' });
  }
});

app.delete('/api/admin/applications/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    serverDb.deleteApplication(id, req.authUser!.fullName);
    broadcastSync('applications', 'deleted', id);
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete application.' });
  }
});

// Inquiries CRUD
app.get('/api/admin/inquiries', requireAuth, requireAdmin, (_req, res) => {
  res.json(serverDb.getInquiries());
});

app.patch('/api/admin/inquiries/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updated = serverDb.updateInquiry(id, req.body || {}, req.authUser!.fullName);
    broadcastSync('inquiries', 'updated', id);
    broadcastSync('activity_logs', 'created');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update inquiry.' });
  }
});

app.delete('/api/admin/inquiries/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id);
    serverDb.deleteInquiry(id, req.authUser!.fullName);
    broadcastSync('inquiries', 'deleted', id);
    broadcastSync('activity_logs', 'created');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete inquiry.' });
  }
});

app.get('/api/admin/activity-logs', requireAuth, requireAdmin, (_req, res) => {
  res.json(serverDb.getActivityLogs());
});

// ---------------------------------------------------------------------------
// Frontend Serving (Vite Dev Middleware or Production Static Dist)
// ---------------------------------------------------------------------------
async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? { server } : false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const srcAssetsDir = path.resolve(process.cwd(), 'src', 'assets');
    if (fs.existsSync(srcAssetsDir)) {
      app.use('/src/assets', express.static(srcAssetsDir));
    }
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`AITM Portal Server running on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start AITM server:', err);
  process.exit(1);
});
