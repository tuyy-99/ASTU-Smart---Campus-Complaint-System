// Centralized department lists for ASTU Smart Complaint System

// Academic departments for STUDENTS (Schools/Faculties)
export const STUDENT_DEPARTMENTS = [
  'School of Electrical & Computer Engineering',
  'School of Mechanical Engineering',
  'School of Civil Engineering & Architecture',
  'School of Computing & Informatics',
  'School of Applied Sciences',
  'School of Chemical & Food Engineering',
  'School of Humanities & Social Sciences'
] as const;

// Service departments for STAFF (Administrative/Service Units)
export const STAFF_DEPARTMENTS = [
  'Academic Affairs',
  'Infrastructure & Maintenance',
  'Hostel Services',
  'Library Services',
  'Cafeteria Services',
  'Transport Services',
  'Student Affairs',
  'IT Services'
] as const;

// Complaint departments (where complaints are directed)
export const COMPLAINT_DEPARTMENTS = STAFF_DEPARTMENTS;

export type StudentDepartment = typeof STUDENT_DEPARTMENTS[number];
export type StaffDepartment = typeof STAFF_DEPARTMENTS[number];
export type ComplaintDepartment = typeof COMPLAINT_DEPARTMENTS[number];
