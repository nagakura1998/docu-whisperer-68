-- Create function to delete storage files when documents are deleted
CREATE OR REPLACE FUNCTION public.delete_document_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the file from storage bucket
  -- Note: This requires the storage.objects table to have proper policies
  DELETE FROM storage.objects 
  WHERE bucket_id = 'documents' 
  AND name = OLD.storage_path;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically delete storage files when documents are deleted
CREATE TRIGGER delete_document_storage_trigger
  AFTER DELETE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_document_storage();