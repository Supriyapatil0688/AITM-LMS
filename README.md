# Abhinav Institute of Technology & Management (AITM) Portal

Official Training Institute Website, Admissions System, and Protected Student Management Portal for **Abhinav Institute of Technology & Management (AITM)**.

---

## 1. Verified Official Institute Information

- **Institute Name:** Abhinav Institute of Technology & Management (AITM)
- **Official Website:** [https://abhinavinst.com/](https://abhinavinst.com/)
- **Accreditation:** ISO 9001:2015 Certified Vocational Institute
- **National Affiliation:** Recognized Training Partner with NSDC (National Skill Development Corporation) and Sector Skill Councils
- **Regional Hubs:** Maharashtra, Gujarat, and Delhi NCR
- **Head Office Address:** Premises 1, Manjula Arcade, 3rd Floor, Gopal Krishna Gokhale Marg, near Cosmos Bank, Naupada, Thane West, Maharashtra 400602
- **Phone:** 022 49690327
- **Admissions Email:** aitm.connect@abhinavinst.com
- **Working Hours:** Monday – Saturday: 9:30 AM – 6:30 PM

---

## 2. Core Frameworks & Programs

1. **NAPS (National Apprenticeship Promotion Scheme):** Practical on-the-job industrial machine training with monthly government and employer stipends.
2. **NATS (National Apprenticeship Training Scheme):** 1-year graduate & diploma engineering apprenticeships across IT, automation, and electrical domains.
3. **Learn & Earn (YCMOU Collaboration):** Work-integrated university diploma and degree pathway allowing trainees to earn monthly stipends while completing academic coursework.
4. **Technical Certifications:** Industrial Automation (Haas/Fanuc CNC), Enterprise Linux & Cloud Infrastructure, Quality Engineering & Lean Six Sigma.

---

## 3. Critical Course Access Rules & Security

- **Strict Access Isolation:** When an administrator creates a course, it is NOT automatically visible to every student.
- **Explicit Assignment:** A course, its study materials (PDFs), recorded video lectures, live meetings, and circulars are accessible **ONLY** to students explicitly assigned that course by the administration.
- **Protection Against URL Bypass:** Direct URL access (`/student/courses/:courseId`) validates enrollment status; unauthorized access triggers an immediate 403 Forbidden security wall.
- **Zero Exposure of Secrets:** Supabase service-role keys remain strictly server-side.

---

## 4. Test Accounts & Instant Role Switcher

A discreet toolbar at the bottom right allows instantaneous role switching for evaluation:

| Role | Name | Email | Accessible Programs |
|---|---|---|---|
| **Admin** | Director S. K. Kulkarni | `admin@abhinavinst.com` | Full Administrative & System Control |
| **Student 1** | Rahul Shinde | `rahul.shinde@student.aitm` | **Course A Only** (*Industrial Automation & CNC*) |
| **Student 2** | Sneha Patil | `sneha.patil@student.aitm` | **Course B Only** (*IT / ITES Software & Cloud*) |
| **Student 3** | Amit Verma | `amit.verma@student.aitm` | **Course C Only** (*Learn & Earn Mechatronics*) |
| **Visitor** | Public Prospect | *Signed Out* | Public Website & Apply Now Form |

---

## 5. Technology Stack & Database Architecture

- **Frontend:** React 19 with TypeScript and Vite
- **Styling:** Tailwind CSS with Plus Jakarta Sans & Outfit typography
- **Data Visualizations:** Recharts (Course Enrollment Breakdown)
- **Icons:** Lucide React
- **Database Schema:** PostgreSQL schema provided in `/supabase/schema.sql` with tables:
  - `profiles`
  - `courses`
  - `course_modules`
  - `course_enrollments`
  - `learning_resources`
  - `assignments`
  - `student_submissions`
  - `applications`
  - `meetings`
  - `announcements`
  - `notifications`
  - `activity_logs`
  - `institute_settings`
- **RLS Policies:** Row-Level Security policies restricting `learning_resources` and `meetings` to enrolled students.
- **Storage:** Private buckets for PDFs (`aitm-resources`) and public bucket for thumbnails (`aitm-public`).

---

## 6. Supabase Deployment & Setup

To connect to your own Supabase project:
1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. Go to **SQL Editor** in the Supabase Dashboard and execute `/supabase/schema.sql`.
3. In Project Settings -> API, copy the Project URL and Anon Key.
4. Set in your `.env`:
   ```bash
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```
5. When `.env` is omitted or unconfigured, the portal automatically operates with its built-in persistent local database bridge.
