import { supabase } from "./supabase";

export type Teacher = {
  id: string;
  name: string;
  photoUrl: string;
};

export async function getTeachers(): Promise<Teacher[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, photo")
      .eq("role", "teacher");
    if (error) {
      throw error;
    }
    return (
      data.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        photoUrl:
          teacher.photo ||
          "https://api.dicebear.com/7.x/notionists/svg?seed=" + teacher.id, // Imagen por defecto si no hay foto
      })) || []
    );
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return [];
  }
}

export async function getStudentsForTeacher(
  teacherId: string
): Promise<{ id: string; name: string; photoUrl: string }[]> {
  try {
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", teacherId);

    if (coursesError) {
      throw coursesError;
    }
    const courseIds = coursesData.map((course) => course.id);
    if (courseIds.length === 0) {
      return [];
    }
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select(
        `
        id,
        name,
        photoUrl
      `
      )
      .in("course_id", courseIds);
    if (studentsError) {
      throw studentsError;
    }
    const uniqueStudents = Array.from(
      new Set(studentsData.map((s) => s.id))
    ).map((id) => studentsData.find((s) => s.id === id)) as {
      id: string;
      name: string;
      photoUrl: string;
    }[];
    return uniqueStudents || [];
  } catch (error) {
    console.error("Error fetching students for teacher:", error);
    return [];
  }
}
