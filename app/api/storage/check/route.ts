import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error listing buckets:", error);
      return NextResponse.json(
        { error: "Failed to list buckets" },
        { status: 500 }
      );
    }

    const bucketNames = buckets?.map(b => b.name) || [];
    const missingBuckets = [];
    
    // Check if required buckets exist
    if (!bucketNames.includes('attachments')) {
      missingBuckets.push('attachments');
    }
    if (!bucketNames.includes('audio')) {
      missingBuckets.push('audio');
    }
    
    // Create missing buckets
    for (const bucketName of missingBuckets) {
      try {
        if (bucketName === 'attachments') {
          await supabase.storage.createBucket('attachments', {
            public: true,
            fileSizeLimit: 50 * 1024 * 1024, // 50MB
            allowedMimeTypes: ['application/pdf', 'text/pdf']
          });
        } else if (bucketName === 'audio') {
          await supabase.storage.createBucket('audio', {
            public: true,
            fileSizeLimit: 50 * 1024 * 1024, // 50MB
            allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
          });
        }
      } catch (createError: any) {
        // Ignore if bucket already exists
        if (!createError.message.includes('already exists')) {
          console.error(`Error creating bucket ${bucketName}:`, createError);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      buckets: bucketNames,
      message: missingBuckets.length > 0 
        ? `Created missing buckets: ${missingBuckets.join(', ')}`
        : "All required buckets exist"
    });

  } catch (error) {
    console.error("Storage check error:", error);
    return NextResponse.json(
      { 
        error: "Failed to check storage",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}