import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We handle auth with our own system
  },
});

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

export const uploadFile = async (
  file: File,
  folder: string = 'uploads'
): Promise<FileUploadResult> => {
  try {
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit'
      };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type ${file.type} is not allowed. Only JPEG, PNG, and PDF files are supported.`
      };
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${folder}/${uniqueFileName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('carelink-documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('carelink-documents')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: uniqueFileName,
      fileSize: file.size
    };

  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};