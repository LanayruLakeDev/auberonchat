import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { canModelProcessFileType, getMaxFileSizeForModel } from '@/lib/model-capabilities';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
];

// TODO: Implement a storage solution to replace Supabase Storage
// Options include:
// 1. AWS S3
// 2. Google Cloud Storage
// 3. Azure Blob Storage
// 4. Other file storage services

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
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
    
    // Validate file size
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.floor(maxFileSize / (1024 * 1024));
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSizeMB}MB.` 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${session.user.id}/${timestamp}_${randomString}.${fileExtension}`;

    // TODO: Replace with actual file upload implementation
    // For now, return a placeholder response
    return NextResponse.json({ 
      error: 'File upload functionality is currently being migrated. Please check back later.' 
    }, { status: 501 });

    /* 
    // This is where the actual upload implementation would go
    return NextResponse.json({
      id: uploadResultId,
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: uploadedFileUrl,
      storage_path: fileName
    });
    */

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
