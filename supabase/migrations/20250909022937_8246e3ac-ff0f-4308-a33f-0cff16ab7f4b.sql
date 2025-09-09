-- Fix security issue: Update function with proper search_path
CREATE OR REPLACE FUNCTION public.delete_document_storage()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Delete the file from storage bucket
  DELETE FROM storage.objects 
  WHERE bucket_id = 'documents' 
  AND name = OLD.storage_path;
  
  RETURN OLD;
END;
$$;