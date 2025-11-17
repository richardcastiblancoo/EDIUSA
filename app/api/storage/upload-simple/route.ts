import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const courseId = formData.get("courseId") as string;
    const pdfFile = formData.get("pdf") as File | null;
    const audioFile = formData.get("audio") as File | null;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    let pdfUrl = null;
    let audioUrl = null;

    // Upload PDF if provided
    if (pdfFile) {
      try {
        const pdfFileName = `lessons/${courseId}/${Date.now()}_${pdfFile.name}`;
        const { data: pdfData, error: pdfError } = await supabase.storage
          .from('attachments')
          .upload(pdfFileName, pdfFile);
        
        if (pdfError) {
          console.error("PDF upload error:", pdfError);
          throw new Error(`PDF upload failed: ${pdfError.message}`);
        }
        
        if (pdfData) {
          const { data: pdfUrlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(pdfFileName);
          pdfUrl = pdfUrlData.publicUrl;
        }
      } catch (pdfUploadError) {
        console.error("PDF upload failed, continuing without PDF:", pdfUploadError);
        pdfUrl = null;
      }
    }

    // Upload audio if provided
    if (audioFile) {
      try {
        const audioFileName = `lessons/${courseId}/${Date.now()}_${audioFile.name}`;
        const { data: audioData, error: audioError } = await supabase.storage
          .from('audio')
          .upload(audioFileName, audioFile);
        
        if (audioError) {
          console.error("Audio upload error:", audioError);
          throw new Error(`Audio upload failed: ${audioError.message}`);
        }
        
        if (audioData) {
          const { data: audioUrlData } = supabase.storage
            .from('audio')
            .getPublicUrl(audioFileName);
          audioUrl = audioUrlData.publicUrl;
        }
      } catch (audioUploadError) {
        console.error("Audio upload failed, continuing without audio:", audioUploadError);
        audioUrl = null;
      }
    }

    return NextResponse.json({
      success: true,
      pdfUrl,
      audioUrl,
      message: "Files uploaded successfully"
    });

  } catch (error) {
    console.error("Storage upload error:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload files",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}