import type {
  UserProfile,
  Course,
  CourseEnrollment,
  LearningResource,
  Application,
  ApplicationStatus,
  Meeting,
  Announcement,
  NotificationItem,
  InstituteSettings,
  StudentEnrollmentRecord,
  StudentEnrollmentStatus,
  EnrollmentDashboardStats,
  Inquiry,
  ActivityLog,
  AccountStatus,
  EnrolledStudent,
  EnrolledStudentStats,
} from '../types';

let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export interface BootstrapAuthStatus {
  adminPasswordClaimed: boolean;
  adminEmail: string;
  unclaimedStudents: Array<{ email: string; fullName: string; studentId?: string }>;
}

export interface AdminStatsSummary {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalCourses: number;
  publishedCourses: number;
  totalApplications: number;
  pendingApplications: number;
  upcomingMeetingsCount: number;
  courseEnrollmentCounts: Array<{
    name: string;
    fullTitle: string;
    students: number;
    category: string;
  }>;
}

export interface AdminBootstrapData {
  settings: InstituteSettings;
  courses: Course[];
  students: UserProfile[];
  enrollments: CourseEnrollment[];
  studentEnrollmentRecords: StudentEnrollmentRecord[];
  enrolledStudents: EnrolledStudent[];
  enrolledStudentStats: EnrolledStudentStats;
  resources: LearningResource[];
  meetings: Meeting[];
  announcements: Announcement[];
  applications: Application[];
  inquiries: Inquiry[];
  activityLogs: ActivityLog[];
  adminStats: AdminStatsSummary;
  enrollmentDashboardStats: EnrollmentDashboardStats;
}

export interface StudentDashboardData {
  courses: Course[];
  resources: LearningResource[];
  meetings: Meeting[];
  announcements: Announcement[];
  notifications: NotificationItem[];
}

export interface PublicBootstrapData {
  settings: InstituteSettings;
  courses: Course[];
  meetings: Meeting[];
  announcements: Announcement[];
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (inMemoryToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    let extra: Record<string, unknown> = {};
    try {
      const json = (await res.json()) as Record<string, unknown>;
      if (typeof json.error === 'string') errMsg = json.error;
      extra = json;
    } catch {
      // ignore non-json error bodies
    }
    const err = new Error(errMsg) as Error & { status?: number; needsSetup?: string };
    err.status = res.status;
    if (typeof extra.needsSetup === 'string') err.needsSetup = extra.needsSetup;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // --- AUTH ---
  getAuthBootstrapStatus(): Promise<BootstrapAuthStatus> {
    return apiFetch('/api/auth/bootstrap-status');
  },
  claimAdminPassword(password: string): Promise<{ user: UserProfile; token: string }> {
    return apiFetch('/api/auth/claim-admin', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },
  activateStudentPassword(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    return apiFetch('/api/auth/activate-student', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  logout(): Promise<{ ok: boolean }> {
    return apiFetch('/api/auth/logout', { method: 'POST' });
  },
  getMe(): Promise<{ user: UserProfile | null }> {
    return apiFetch('/api/auth/me');
  },
  impersonate(userId: string, adminBearerToken?: string): Promise<{ user: UserProfile; token: string }> {
    const headers: Record<string, string> = {};
    if (adminBearerToken) {
      headers.Authorization = `Bearer ${adminBearerToken}`;
    }
    return apiFetch('/api/auth/impersonate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId }),
    });
  },
  requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return apiFetch('/api/auth/request-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // --- FILE UPLOAD ---
  async uploadFile(file: File): Promise<{ url: string; fileName: string; sizeBytes: number; mimeType: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // --- PUBLIC ---
  getPublicBootstrap(): Promise<PublicBootstrapData> {
    return apiFetch('/api/public/bootstrap');
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
  }): Promise<Application> {
    return apiFetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },
  submitInquiry(data: { name: string; email: string; phone?: string; message: string }): Promise<Inquiry> {
    return apiFetch('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- STUDENT ---
  getStudentDashboard(): Promise<StudentDashboardData> {
    return apiFetch('/api/student/dashboard');
  },
  updateMyProfile(updates: { mobileNumber?: string; avatarUrl?: string }): Promise<UserProfile> {
    return apiFetch('/api/student/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  markNotificationRead(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    });
  },
  markAllNotificationsRead(): Promise<{ ok: boolean }> {
    return apiFetch('/api/notifications/read-all', {
      method: 'POST',
    });
  },

  // --- ADMIN ---
  getAdminBootstrap(): Promise<AdminBootstrapData> {
    return apiFetch('/api/admin/bootstrap');
  },
  getEnrollmentReport(): Promise<{
    settings: InstituteSettings;
    stats: EnrollmentDashboardStats;
    enrollments: StudentEnrollmentRecord[];
  }> {
    return apiFetch('/api/admin/reports/enrollment');
  },
  updateSettings(updates: Partial<InstituteSettings>): Promise<InstituteSettings> {
    return apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Courses
  createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrolledCount'>): Promise<Course> {
    return apiFetch('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },
  updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    return apiFetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  deleteCourse(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Student Accounts & Course Assignments
  createStudent(data: {
    fullName: string;
    email: string;
    mobileNumber?: string;
    studentId?: string;
    batch?: string;
    joiningDate?: string;
    status?: AccountStatus;
    assignedCourseIds: string[];
    temporaryPassword?: string;
  }): Promise<{ student: UserProfile; tempPassword: string }> {
    return apiFetch('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateStudent(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiFetch(`/api/admin/students/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  toggleStudentStatus(id: string): Promise<UserProfile> {
    return apiFetch(`/api/admin/students/${encodeURIComponent(id)}/toggle-status`, {
      method: 'PATCH',
    });
  },
  assignStudentCourses(id: string, courseIds: string[]): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/students/${encodeURIComponent(id)}/courses`, {
      method: 'PUT',
      body: JSON.stringify({ courseIds }),
    });
  },
  resetStudentPassword(id: string, password?: string): Promise<{ ok: boolean; temporaryPassword: string }> {
    return apiFetch(`/api/admin/students/${encodeURIComponent(id)}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },
  deleteStudent(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/students/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Student Enrollment Records
  addStudentEnrollment(data: {
    fullName: string;
    mobileNumber: string;
    email: string;
    courseId: string;
    batch: string;
    enrollmentDate: string;
    status: StudentEnrollmentStatus;
    studentId?: string;
  }): Promise<StudentEnrollmentRecord> {
    return apiFetch('/api/admin/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateStudentEnrollment(id: string, updates: Partial<StudentEnrollmentRecord>): Promise<StudentEnrollmentRecord> {
    return apiFetch(`/api/admin/enrollments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  deleteStudentEnrollment(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/enrollments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Master Enrolled Students Directory (17-Field CRUD & Bulk Import)
  getEnrolledStudents(): Promise<{ students: EnrolledStudent[]; stats: EnrolledStudentStats }> {
    return apiFetch('/api/admin/enrolled-students');
  },
  createEnrolledStudent(data: Omit<EnrolledStudent, 'id' | 'createdAt' | 'updatedAt'>): Promise<EnrolledStudent> {
    return apiFetch('/api/admin/enrolled-students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateEnrolledStudent(
    id: string,
    updates: Partial<Omit<EnrolledStudent, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<EnrolledStudent> {
    return apiFetch(`/api/admin/enrolled-students/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  toggleEnrolledStudentStatus(id: string): Promise<EnrolledStudent> {
    return apiFetch(`/api/admin/enrolled-students/${encodeURIComponent(id)}/toggle-status`, {
      method: 'PATCH',
    });
  },
  deleteEnrolledStudent(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/enrolled-students/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
  bulkImportEnrolledStudents(
    rows: Array<Partial<Record<keyof Omit<EnrolledStudent, 'id' | 'createdAt' | 'updatedAt'>, string>>>
  ): Promise<{
    importedCount: number;
    skippedDuplicates: Array<{ rowNumber: number; employeeCode: string; studentName: string; reason: string }>;
    invalidRows: Array<{ rowNumber: number; employeeCode: string; studentName: string; reason: string }>;
    inserted: EnrolledStudent[];
  }> {
    return apiFetch('/api/admin/enrolled-students/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  // Learning Resources
  addResource(data: Omit<LearningResource, 'id' | 'createdAt'>): Promise<LearningResource> {
    return apiFetch('/api/admin/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateResource(id: string, updates: Partial<LearningResource>): Promise<LearningResource> {
    return apiFetch(`/api/admin/resources/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  deleteResource(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/resources/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Meetings
  createMeeting(data: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting> {
    return apiFetch('/api/admin/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
    return apiFetch(`/api/admin/meetings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  deleteMeeting(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/meetings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Announcements
  createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
    return apiFetch('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    return apiFetch(`/api/admin/announcements/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  deleteAnnouncement(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/announcements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Applications
  updateApplicationStatus(id: string, status: ApplicationStatus, adminNotes?: string): Promise<Application> {
    return apiFetch(`/api/admin/applications/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });
  },
  convertApplicationToStudent(id: string, assignedCourseIds: string[]): Promise<{ student: UserProfile; tempPassword: string }> {
    return apiFetch(`/api/admin/applications/${encodeURIComponent(id)}/convert`, {
      method: 'POST',
      body: JSON.stringify({ assignedCourseIds }),
    });
  },
  deleteApplication(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/applications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Inquiries
  updateInquiry(id: string, updates: { status?: Inquiry['status']; adminNotes?: string }): Promise<Inquiry> {
    return apiFetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  deleteInquiry(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
