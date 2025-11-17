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

    let pdfUrl = null;
    let audioUrl = null;

    // Ensure buckets exist
    await ensureBucketsExist();

    // Upload PDF if provided
    if (pdfFile) {
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
    }

    // Upload audio if provided
    if (audioFile) {
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

async function ensureBucketsExist() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      throw listError;
    }

    const bucketNames = buckets?.map(b => b.name) || [];
    
    // Create attachments bucket if it doesn't exist
    if (!bucketNames.includes('attachments')) {
      const { error: createAttachmentsError } = await supabase.storage.createBucket('attachments', {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: ['application/pdf', 'text/pdf']
      });
      
      if (createAttachmentsError && !createAttachmentsError.message.includes('already exists')) {
        console.error("Error creating attachments bucket:", createAttachmentsError);
        throw createAttachmentsError;
      }
    }
    
    // Create audio bucket if it doesn't exist
    if (!bucketNames.includes('audio')) {
      const { error: createAudioError } = await supabase.storage.createBucket('audio', {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
      });
      
      if (createAudioError && !createAudioError.message.includes('already exists')) {
        console.error("Error creating audio bucket:", createAudioError);
        throw createAudioError;
      }
    }
    
  } catch (error) {
    console.error("Error ensuring buckets exist:", error);
    throw error;
  }
}