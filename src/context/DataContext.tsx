import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  InstituteSettings,
  Course,
  UserProfile,
  CourseEnrollment,
  StudentEnrollmentRecord,
  LearningResource,
  Meeting,
  Announcement,
  Application,
  Inquiry,
  NotificationItem,
  ActivityLog,
  EnrollmentDashboardStats,
  EnrolledStudent,
  EnrolledStudentStats,
} from '../types';
import { api, AdminStatsSummary } from '../lib/api';
import { useAuth } from './AuthContext';

const DEFAULT_SETTINGS: InstituteSettings = {
  instituteName: 'Abhinav Institute of Technology & Management',
  shortName: 'AITM',
  tagline: 'Bridging Industry Standards with Hands-On Vocational Excellence & Apprenticeship Solutions',
  headOfficeAddress:
    'Premises 1, Manjula Arcade, 3rd Floor, Gopal Krishna Gokhale Marg, near Cosmos Bank, Naupada, Thane West, Maharashtra 400602',
  phone: '022 49690327',
  email: 'aitm.connect@abhinavinst.com',
  hours: 'Monday – Saturday: 9:30 AM – 6:30 PM',
  isoCertification: 'ISO 9001:2015 Certified Quality Management',
  nsdcAffiliation: 'Affiliated with NSDC & National Sector Skill Councils',
  portalNotice: '',
  logoUrl: '/assets/aistudio/image_e53c2b5b.png',
};

interface DataContextType {
  isLoadingPublic: boolean;
  isLoadingPortal: boolean;
  wsConnected: boolean;
  lastSyncedAt: string | null;

  // Public data (available to all visitors)
  settings: InstituteSettings;
  publishedCourses: Course[];
  publicMeetings: Meeting[];

  // Student-authorized data (strictly scoped on server)
  studentCourses: Course[];
  studentResources: LearningResource[];
  studentMeetings: Meeting[];
  studentAnnouncements: Announcement[];
  notifications: NotificationItem[];

  // Admin datasets
  courses: Course[];
  students: UserProfile[];
  enrollments: CourseEnrollment[];
  studentEnrollmentRecords: StudentEnrollmentRecord[];
  enrolledStudents: EnrolledStudent[];
  enrolledStudentStats: EnrolledStudentStats | null;
  resources: LearningResource[];
  meetings: Meeting[];
  announcements: Announcement[];
  applications: Application[];
  inquiries: Inquiry[];
  activityLogs: ActivityLog[];
  adminStats: AdminStatsSummary | null;
  enrollmentDashboardStats: EnrollmentDashboardStats | null;

  // Helpers & Refresh triggers
  refreshAll: () => Promise<void>;
  refreshPublic: () => Promise<void>;
  refreshStudentData: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  getStudentEnrolledCourseIds: (studentId: string) => string[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, refreshSessionUser } = useAuth();

  const [isLoadingPublic, setIsLoadingPublic] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Public state
  const [settings, setSettings] = useState<InstituteSettings>(DEFAULT_SETTINGS);
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [publicMeetings, setPublicMeetings] = useState<Meeting[]>([]);

  // Student state
  const [studentCourses, setStudentCourses] = useState<Course[]>([]);
  const [studentResources, setStudentResources] = useState<LearningResource[]>([]);
  const [studentMeetings, setStudentMeetings] = useState<Meeting[]>([]);
  const [studentAnnouncements, setStudentAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Admin state
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [studentEnrollmentRecords, setStudentEnrollmentRecords] = useState<StudentEnrollmentRecord[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [enrolledStudentStats, setEnrolledStudentStats] = useState<EnrolledStudentStats | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStatsSummary | null>(null);
  const [enrollmentDashboardStats, setEnrollmentDashboardStats] = useState<EnrollmentDashboardStats | null>(null);

  const refreshPublic = useCallback(async () => {
    try {
      const data = await api.getPublicBootstrap();
      setSettings(data.settings);
      setPublishedCourses(data.courses);
      setPublicMeetings(data.meetings);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load public bootstrap:', err);
    } finally {
      setIsLoadingPublic(false);
    }
  }, []);

  const refreshStudentData = useCallback(async () => {
    if (!currentUser) {
      setStudentCourses([]);
      setStudentResources([]);
      setStudentMeetings([]);
      setStudentAnnouncements([]);
      setNotifications([]);
      return;
    }
    try {
      const data = await api.getStudentDashboard();
      setStudentCourses(data.courses);
      setStudentResources(data.resources);
      setStudentMeetings(data.meetings);
      setStudentAnnouncements(data.announcements);
      setNotifications(data.notifications);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    }
  }, [currentUser]);

  const refreshAdminData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      setCourses([]);
      setStudents([]);
      setEnrollments([]);
      setStudentEnrollmentRecords([]);
      setEnrolledStudents([]);
      setEnrolledStudentStats(null);
      setResources([]);
      setMeetings([]);
      setAnnouncements([]);
      setApplications([]);
      setInquiries([]);
      setActivityLogs([]);
      setAdminStats(null);
      setEnrollmentDashboardStats(null);
      return;
    }
    try {
      const data = await api.getAdminBootstrap();
      setSettings(data.settings);
      setCourses(data.courses);
      setStudents(data.students);
      setEnrollments(data.enrollments);
      setStudentEnrollmentRecords(data.studentEnrollmentRecords);
      setEnrolledStudents(data.enrolledStudents);
      setEnrolledStudentStats(data.enrolledStudentStats);
      setResources(data.resources);
      setMeetings(data.meetings);
      setAnnouncements(data.announcements);
      setApplications(data.applications);
      setInquiries(data.inquiries);
      setActivityLogs(data.activityLogs);
      setAdminStats(data.adminStats);
      setEnrollmentDashboardStats(data.enrollmentDashboardStats);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load admin bootstrap data:', err);
    }
  }, [currentUser]);

  const refreshAll = useCallback(async () => {
    setIsLoadingPortal(true);
    try {
      await refreshPublic();
      if (currentUser) {
        await refreshStudentData();
        if (currentUser.role === 'admin') {
          await refreshAdminData();
        }
      }
    } finally {
      setIsLoadingPortal(false);
    }
  }, [currentUser, refreshPublic, refreshStudentData, refreshAdminData]);

  // Initial load & reload on auth change
  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // Keep latest refresh functions in refs for WebSocket listener
  const refreshPublicRef = useRef(refreshPublic);
  const refreshStudentRef = useRef(refreshStudentData);
  const refreshAdminRef = useRef(refreshAdminData);
  const refreshUserRef = useRef(refreshSessionUser);
  const roleRef = useRef(currentUser?.role);

  useEffect(() => {
    refreshPublicRef.current = refreshPublic;
    refreshStudentRef.current = refreshStudentData;
    refreshAdminRef.current = refreshAdminData;
    refreshUserRef.current = refreshSessionUser;
    roleRef.current = currentUser?.role;
  }, [refreshPublic, refreshStudentData, refreshAdminData, refreshSessionUser, currentUser?.role]);

  // Real-time WebSocket synchronization with auto-reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;
    let attempt = 0;

    const connect = () => {
      if (unmounted) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (unmounted) return;
        const wasReconnect = attempt > 0;
        attempt = 0;
        setWsConnected(true);
        if (wasReconnect) {
          void refreshPublicRef.current();
          if (roleRef.current) {
            void refreshStudentRef.current();
            if (roleRef.current === 'admin') {
              void refreshAdminRef.current();
            }
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as { type?: string; entity?: string };
          if (msg.type === 'sync') {
            if (msg.entity === 'settings' || msg.entity === 'courses' || msg.entity === 'meetings' || msg.entity === 'announcements') {
              void refreshPublicRef.current();
            }
            if (msg.entity === 'students') {
              void refreshUserRef.current();
            }
            if (roleRef.current) {
              void refreshStudentRef.current();
              if (roleRef.current === 'admin') {
                void refreshAdminRef.current();
              }
            }
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (unmounted) return;
        setWsConnected(false);
        attempt += 1;
        const delay = Math.min(10000, 1000 * Math.pow(1.5, Math.min(attempt, 6)));
        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const getStudentEnrolledCourseIds = useCallback(
    (studentId: string): string[] => {
      return enrollments.filter((e) => e.studentId === studentId && e.status === 'active').map((e) => e.courseId);
    },
    [enrollments]
  );

  return (
    <DataContext.Provider
      value={{
        isLoadingPublic,
        isLoadingPortal,
        wsConnected,
        lastSyncedAt,
        settings,
        publishedCourses,
        publicMeetings,
        studentCourses,
        studentResources,
        studentMeetings,
        studentAnnouncements,
        notifications,
        courses,
        students,
        enrollments,
        studentEnrollmentRecords,
        enrolledStudents,
        enrolledStudentStats,
        resources,
        meetings,
        announcements,
        applications,
        inquiries,
        activityLogs,
        adminStats,
        enrollmentDashboardStats,
        refreshAll,
        refreshPublic,
        refreshStudentData,
        refreshAdminData,
        getStudentEnrolledCourseIds,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider');
  }
  return ctx;
};
