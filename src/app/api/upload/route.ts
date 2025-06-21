import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { canModelProcessFileType, getMaxFileSizeForModel } from '@/lib/model-capabilities';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Check for guest user with API key
    const guestApiKey = request.headers.get('X-Guest-API-Key');
    const isGuest = !!guestApiKey;

    // For authenticated users, keep existing validation
    if (!isGuest && (userError || !user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const modelId = formData.get('model') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type against general allowed types
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.' 
      }, { status: 400 });
    }

    // If model is specified, validate against model capabilities
    if (modelId && !canModelProcessFileType(modelId, file.type)) {
      return NextResponse.json({ 
        error: `File type ${file.type} is not supported by model ${modelId}` 
      }, { status: 400 });
    }

    // Determine max file size (use model-specific if available, otherwise default)
    const maxFileSize = modelId ? getMaxFileSizeForModel(modelId) * 1024 * 1024 : MAX_FILE_SIZE;
    
    // For guest users, apply a stricter limit due to localStorage constraints
    const effectiveMaxSize = user ? maxFileSize : Math.min(maxFileSize, 5 * 1024 * 1024); // 5MB max for guests
    
    // Validate file size
    if (file.size > effectiveMaxSize) {
      const maxSizeMB = Math.floor(effectiveMaxSize / (1024 * 1024));
      const userType = user ? 'authenticated users' : 'guest users';
      return NextResponse.json({ 
        error: `File too large. Maximum size for ${userType} is ${maxSizeMB}MB.` 
      }, { status: 400 });
    }

    // Handle authenticated users - upload to Supabase Storage
    if (user) {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${user.id}/${timestamp}_${randomString}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

      return NextResponse.json({
        id: uploadData.id || randomString,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: publicUrl,
        storage_path: fileName
      });
    }

    // Handle guest users - convert to base64 data URL
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      const randomId = Math.random().toString(36).substring(2, 15);

      return NextResponse.json({
        id: randomId,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: dataUrl,
        storage_path: null // No server storage for guests
      });
    } catch (error) {
      console.error('Error processing file for guest:', error);
      return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 