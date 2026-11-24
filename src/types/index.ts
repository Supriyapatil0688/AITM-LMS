export type UserRole = 'admin' | 'student';

export type AccountStatus = 'active' | 'inactive' | 'pending';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  mobileNumber?: string;
  avatarUrl?: string;
  status: AccountStatus;
  batch?: string;
  joiningDate?: string;
  mustChangePassword?: boolean;
  createdAt: string;
}

export type CourseType = 'Apprenticeship (NAPS)' | 'Apprenticeship (NATS)' | 'Learn & Earn' | 'Work-Integrated Degree' | 'Certification';

export type CourseStatus = 'published' | 'draft' | 'archived';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  duration: string;
  courseType: CourseType;
  batch: string;
  startDate: string;
  endDate?: string;
  instructorName: string;
  instructorRole?: string;
  fees?: string;
  feeInfo?: string;
  totalSeats?: number;
  availableSeats?: number;
  status: CourseStatus;
  syllabus: string[];
  enrolledCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type StudentEnrollmentStatus = 'Enrolled' | 'Pending' | 'Completed';

export interface StudentEnrollmentRecord {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  courseId: string;
  courseName: string;
  batch: string;
  enrollmentDate: string;
  status: StudentEnrollmentStatus;
  studentId?: string;
  createdAt: string;
}

export interface CourseEnrollmentReportItem {
  srNo: number;
  courseId: string;
  courseName: string;
  totalEnrolledStudents: number;
  pendingStudents: number;
  availableSeats: number;
  totalSeats: number;
  fees: string;
  duration: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  durationHours: number;
}

export interface CourseEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: 'active' | 'completed' | 'suspended';
  enrolledAt: string;
}

export type ResourceType = 'pdf' | 'youtube_video' | 'youtube_playlist' | 'lecture_recording' | 'document' | 'external_link';

export interface LearningResource {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  resourceType: ResourceType;
  urlOrPath: string;
  fileName?: string;
  fileSizeBytes?: number;
  durationMinutes?: number;
  isPrivate: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  attachmentUrl?: string;
  createdAt: string;
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submittedAt: string;
  submissionText?: string;
  attachmentUrl?: string;
  marksObtained?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
}

export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  educationQualification: string;
  interestedCourseId: string;
  interestedCourseTitle?: string;
  programType: 'naps' | 'nats' | 'learn_earn' | 'vocational_diploma' | 'degree';
  city: string;
  state: string;
  notes?: string;
  status: ApplicationStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  courseId?: string | null; // null means all students
  courseTitle?: string;
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string;
  platform: 'Google Meet' | 'Zoom' | 'MS Teams' | 'AITM Classroom';
  targetBatch?: string;
  hostName: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  courseId?: string | null; // null means institute-wide
  courseTitle?: string;
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  isPublished: boolean;
  targetRole: 'all' | 'students' | 'course_enrolled';
  targetBatch?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  linkUrl?: string;
  type: 'course_assigned' | 'resource_added' | 'meeting_scheduled' | 'announcement' | 'application_status';
  isRead: boolean;
  createdAt: string;
}

export interface InstituteSettings {
  instituteName: string;
  shortName: string;
  tagline: string;
  headOfficeAddress: string;
  phone: string;
  email: string;
  hours: string;
  isoCertification: string;
  nsdcAffiliation: string;
  portalNotice?: string;
  logoUrl?: string;
  heroBadge?: string;
  heroHeadline?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  heroWorkshopImageUrl?: string;
  heroWorkshopLabel?: string;
  heroWorkshopTitle?: string;
  heroWorkshopDesc?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  aboutSubDescription?: string;
  aboutImage1Url?: string;
  aboutImage2Url?: string;
  placementTitle?: string;
  placementDescription?: string;
  placementImageUrl?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'new' | 'contacted' | 'resolved';
  adminNotes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface EnrollmentDashboardStats {
  totalRegisteredStudents: number;
  totalEnrolledStudents: number;
  totalAvailableCourses: number;
  totalActiveBatches: number;
  pendingStudents: number;
  completedStudents: number;
  courseReports: CourseEnrollmentReportItem[];
}

export type EnrolledStudentStatus = 'Active' | 'Inactive';
export type StudentGender = 'Male' | 'Female' | 'Other' | '';

export interface EnrolledStudent {
  id: string;
  location: string;
  employeeCode: string;
  studentName: string;
  motherName: string;
  fatherName: string;
  dateOfBirth: string;
  email: string;
  mobileNumber: string;
  gender: StudentGender;
  aadhaarNumber: string;
  permanentAddress: string;
  panNumber: string;
  status: EnrolledStudentStatus;
  remarks: string;
  registrationDate: string;
  assignedStaffName: string;
  abcId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrolledStudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newlyEnrolledStudents: number;
  locationCounts: Array<{ location: string; count: number }>;
  staffList: string[];
}
