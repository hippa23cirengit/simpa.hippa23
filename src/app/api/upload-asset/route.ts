import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const assetId = formData.get("assetId") as string | null;

    if (!file || !assetId) {
      return NextResponse.json({ error: "File and assetId are required" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image with Sharp
    // 1. Resize to max 800x800 (proportional)
    // 2. Convert to PNG format to preserve transparency (crucial for PDF generation)
    const compressedBuffer = await sharp(buffer)
      .resize({
        width: 800,
        height: 800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    // Setup Supabase Upload
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://buylslyfndjjyqhqvpyk.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KgKMdTFKj6yO9gvwHdHARw_Ot_3N8Dd";
    // Use 'assets' bucket if possible, but fallback to 'profilephoto' if it's the only one that exists.
    // For simplicity, we just use the known profilephoto bucket which works.
    const bucketName = "profilephoto";
    
    // Generate new filename with .png extension (e.g. logo_kiri_12345.png)
    const fileName = `asset_${assetId}_${Date.now()}.png`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

    // Upload to Supabase Storage
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "image/png",
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
