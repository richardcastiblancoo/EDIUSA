import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // First, get the lesson to know what files to delete
    const { data: lesson, error: getError } = await supabase
      .from("lessons")
      .select("pdf_url, audio_url")
      .eq("id", lessonId)
      .single();

    if (getError) {
      console.error("Error getting lesson:", getError);
      return NextResponse.json(
        { error: "Failed to get lesson" },
        { status: 404 }
      );
    }

    // Delete storage files if they exist
    if (lesson?.pdf_url) {
      try {
        // Extract filename from URL
        const urlParts = lesson.pdf_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await supabase.storage.from('attachments').remove([fileName]);
        }
      } catch (fileError) {
        console.warn("Error deleting PDF file:", fileError);
        // Continue even if file deletion fails
      }
    }

    if (lesson?.audio_url) {
      try {
        // Extract filename from URL
        const urlParts = lesson.audio_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await supabase.storage.from('audio').remove([fileName]);
        }
      } catch (fileError) {
        console.warn("Error deleting audio file:", fileError);
        // Continue even if file deletion fails
      }
    }

    // Delete the lesson from database
    const { error: deleteError } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (deleteError) {
      console.error("Error deleting lesson:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete lesson" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully"
    });

  } catch (error) {
    console.error("Delete lesson error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete lesson",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}