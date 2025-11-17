// Test script to verify lesson management functionality
import { deleteLesson, updateLesson } from "@/lib/lessons";

async function testLessonManagement() {
  console.log("Testing lesson management functions...");
  
  // Test update function
  console.log("Testing updateLesson...");
  const testUpdate = await updateLesson("test-lesson-id", {
    title: "Test Updated Title",
    description: "Test updated description"
  });
  console.log("Update test result:", testUpdate);
  
  // Test delete function
  console.log("Testing deleteLesson...");
  const testDelete = await deleteLesson("test-lesson-id");
  console.log("Delete test result:", testDelete);
}

// Run test if this file is executed directly
if (typeof window === "undefined") {
  testLessonManagement().catch(console.error);
}