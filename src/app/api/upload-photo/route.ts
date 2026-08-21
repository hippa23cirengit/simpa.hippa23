import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const memberId = formData.get("memberId") as string | null;

    if (!file || !memberId) {
      return NextResponse.json({ error: "File and memberId are required" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image with Sharp
    // 1. Resize to max 800x800 (proportional)
    // 2. Convert to WebP format
    // 3. Set quality to 85%
    const compressedBuffer = await sharp(buffer)
      .resize({
        width: 800,
        height: 800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Setup Supabase Upload
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://buylslyfndjjyqhqvpyk.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KgKMdTFKj6yO9gvwHdHARw_Ot_3N8Dd";
    const bucketName = "profilephoto";
    
    // Generate new filename with .webp extension
    const fileName = `avatar_${memberId}_${Date.now()}.webp`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

    // Upload to Supabase Storage
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "image/webp",
      },
      body: compressedBuffer,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json().catch(() => ({}));
      console.error("Supabase Upload Error:", errorData);
      throw new Error(`Failed to upload to Supabase: ${uploadRes.statusText}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Upload/Compression Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
