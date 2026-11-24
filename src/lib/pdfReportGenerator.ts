import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from './api';
import type {
  CourseEnrollmentReportItem,
  EnrollmentDashboardStats,
  InstituteSettings,
  StudentEnrollmentRecord,
} from '../types';

export interface EnrollmentPDFPayload {
  settings: InstituteSettings;
  stats: EnrollmentDashboardStats;
  enrollments: StudentEnrollmentRecord[];
}

export async function generateEnrollmentPDFReport(payload?: EnrollmentPDFPayload): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const data = payload || (await api.getEnrollmentReport());
  const { settings, stats, enrollments } = data;
  const reportItems: CourseEnrollmentReportItem[] = stats.courseReports;

  // Try to load the configured institute logo
  const logoSrc = settings.logoUrl || '/assets/aistudio/image_e53c2b5b.png';
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoSrc;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    if (img.complete && img.naturalWidth > 0) {
      doc.addImage(img, 'PNG', 14, 10, 28, 19);
    }
  } catch (err) {
    console.warn('Could not load logo for PDF, drawing text mark instead', err);
  }

  // Header Typography
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 74, 156);
  doc.text((settings.instituteName || 'ABHINAV INSTITUTE OF TECHNOLOGY & MANAGEMENT').toUpperCase(), 46, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${settings.nsdcAffiliation} · ${settings.isoCertification}`, 46, 21);
  doc.text(`Tel: ${settings.phone} | ${settings.email}`, 46, 26);

  // Decorative blue separator line
  doc.setDrawColor(11, 74, 156);
  doc.setLineWidth(0.8);
  doc.line(14, 32, 196, 32);

  // Report Title Badge & Meta
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 36, 182, 16, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL COURSE-WISE STUDENT ENROLLMENT REPORT', 18, 43);

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${currentDate} at ${currentTime} | Academic Session 2026-27`, 18, 48);
  doc.text('Status: Verified Live Database', 142, 48);

  // Summary Metrics Strip
  const startYSummary = 56;
  const cardWidth = 43;
  const cardHeight = 16;
  const cards = [
    { title: 'Total Registered', value: `${stats.totalRegisteredStudents}`, color: [30, 58, 138] },
    { title: 'Total Enrolled', value: `${stats.totalEnrolledStudents}`, color: [16, 185, 129] },
    { title: 'Total Available Courses', value: `${stats.totalAvailableCourses}`, color: [2, 132, 199] },
    { title: 'Total Active Batches', value: `${stats.totalActiveBatches}`, color: [217, 119, 6] },
  ];

  cards.forEach((card, index) => {
    const x = 14 + index * (cardWidth + 3.3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startYSummary, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(card.title, x + 3, startYSummary + 5.5);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + 3, startYSummary + 12);
  });

  // Table 1: Course-Wise Student Enrollment Report
  const tableData = reportItems.map((item) => [
    item.srNo.toString(),
    item.courseName,
    item.totalEnrolledStudents.toString(),
    item.pendingStudents.toString(),
    item.availableSeats.toString(),
    item.fees,
  ]);

  autoTable(doc, {
    startY: 77,
    head: [['Sr. No.', 'Course Name', 'Total Enrolled Students', 'Pending Students', 'Available Seats', 'Course Fees / Stipend']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 74, 156],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 },
      1: { cellWidth: 62 },
      2: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
      5: { cellWidth: 28, fontSize: 7.5 },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    foot: [
      [
        'Total',
        `All ${reportItems.length} Programs`,
        stats.totalEnrolledStudents.toString(),
        stats.pendingStudents.toString(),
        reportItems.reduce((acc, c) => acc + c.availableSeats, 0).toString(),
        'Compliant',
      ],
    ],
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
  });

  // Table 2: Batch-Wise Enrollment Breakdown
  const docWithTable = doc as unknown as { lastAutoTable?: { finalY: number } };
  const finalY = docWithTable.lastAutoTable ? docWithTable.lastAutoTable.finalY + 8 : 150;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('BATCH-WISE ENROLLMENT DISTRIBUTION', 14, finalY);

  const batchCounts: Record<string, { total: number; enrolled: number; pending: number }> = {};
  enrollments.forEach((e) => {
    const b = e.batch || 'General Batch';
    if (!batchCounts[b]) batchCounts[b] = { total: 0, enrolled: 0, pending: 0 };
    batchCounts[b].total += 1;
    if (e.status === 'Enrolled') batchCounts[b].enrolled += 1;
    if (e.status === 'Pending') batchCounts[b].pending += 1;
  });

  const batchData = Object.entries(batchCounts).map(([batchName, bstats], i) => [
    (i + 1).toString(),
    batchName,
    bstats.enrolled.toString(),
    bstats.pending.toString(),
    bstats.total.toString(),
  ]);

  autoTable(doc, {
    startY: finalY + 3,
    head: [['Sr. No.', 'Batch Name', 'Active Enrolled', 'Pending Verification', 'Total Trainees']],
    body: batchData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 },
      1: { cellWidth: 75 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 31, fontStyle: 'bold' },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
    },
  });

  // Signature Block & Official Sign-off
  const endY = docWithTable.lastAutoTable ? docWithTable.lastAutoTable.finalY + 14 : 240;

  if (endY < 260) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('This is a computer-generated institutional record from the AITM database.', 14, endY);
    doc.text(`For queries or audits, contact: ${settings.email}`, 14, endY + 4);

    doc.setDrawColor(148, 163, 184);
    doc.line(140, endY + 10, 192, endY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Prof. / Director of Training', 140, endY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('AITM Center, Thane West', 140, endY + 18);
  }

  // Footer: Page Number
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${settings.instituteName}, Thane — Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    );
  }

  const filename = `AITM_Course_Enrollment_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
