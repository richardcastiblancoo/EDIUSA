import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    const body = await request.json();
    
    const { title, description, pdf_url, audio_url, is_published, order_index } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (pdf_url !== undefined) updates.pdf_url = pdf_url;
    if (audio_url !== undefined) updates.audio_url = audio_url;
    if (is_published !== undefined) updates.is_published = is_published;
    if (order_index !== undefined) updates.order_index = order_index;

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("lessons")
      .update(updates)
      .eq("id", lessonId)
      .select()
      .single();

    if (error) {
      console.error("Error updating lesson:", error);
      return NextResponse.json(
        { error: "Failed to update lesson" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lesson: data,
      message: "Lesson updated successfully"
    });

  } catch (error) {
    console.error("Update lesson error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update lesson",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}