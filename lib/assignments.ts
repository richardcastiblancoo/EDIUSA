import { supabase } from "./supabase";
import type { Course, User } from "./supabase";

export interface CourseAssignment {
  id: string;
  course_id: string;
  teacher_id: string;
  assigned_by: string;
  assigned_at: string;
  status: "active" | "completed" | "cancelled";
  notes: string | null;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  enrolled_by: string | null;
  status: "active" | "completed" | "dropped";
  progress_percentage: number;
}

// Course Assignments (Teacher to Course)
export async function assignCourseToTeacher(
  courseId: string,
  teacherId: string,
  assignedBy: string,
  notes: string | null = null
): Promise<CourseAssignment | null> {
  try {
    const { data, error } = await supabase
      .from("course_assignments")
      .insert([
        {
          course_id: courseId,
          teacher_id: teacherId,
          assigned_by: assignedBy,
          notes: notes,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error assigning course to teacher:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error assigning course to teacher:", error);
    return null;
  }
}

export async function getCourseAssignmentsByTeacher(teacherId: string): Promise<CourseAssignment[]> {
  try {
    const { data, error } = await supabase
      .from("course_assignments")
      .select("*, course:courses(*)")
      .eq("teacher_id", teacherId);

    if (error) {
      console.error("Error fetching course assignments for teacher:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching course assignments for teacher:", error);
    return [];
  }
}

export async function updateCourseAssignment(
  assignmentId: string,
  updates: Partial<Omit<CourseAssignment, "id" | "assigned_at">>
): Promise<CourseAssignment | null> {
  try {
    const { data, error } = await supabase
      .from("course_assignments")
      .update(updates)
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating course assignment:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error updating course assignment:", error);
    return null;
  }
}

export async function deleteCourseAssignment(assignmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("course_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      console.error("Error deleting course assignment:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error deleting course assignment:", error);
    return false;
  }
}

// Student Enrollments (Student to Course)
export async function enrollStudentInCourse(
  studentId: string,
  courseId: string,
  enrolledBy: string | null = null
): Promise<Enrollment | null> {
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .insert([
        {
          student_id: studentId,
          course_id: courseId,
          enrolled_by: enrolledBy,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error enrolling student in course:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error enrolling student in course:", error);
    return null;
  }
}

export async function getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select("*, course:courses(*)")
      .eq("student_id", studentId);

    if (error) {
      console.error("Error fetching enrollments for student:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching enrollments for student:", error);
    return [];
  }
}

export async function getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select("*, student:users(*)")
      .eq("course_id", courseId);

    if (error) {
      console.error("Error fetching enrollments for course:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching enrollments for course:", error);
    return [];
  }
}

export async function updateEnrollment(
  enrollmentId: string,
  updates: Partial<Omit<Enrollment, "id" | "enrolled_at">>
): Promise<Enrollment | null> {
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .update(updates)
      .eq("id", enrollmentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating enrollment:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error updating enrollment:", error);
    return null;
  }
}

export async function deleteEnrollment(enrollmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", enrollmentId);

    if (error) {
      console.error("Error deleting enrollment:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return false;
  }
}