import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Upload, FileText, X, Clock, CheckCircle, AlertCircle, Send } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Document {
  id: string;
  project_id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  upload_date: string;
  storage_path: string;
}

export const DocumentPanel = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessingEmbeddings, setIsProcessingEmbeddings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentProject } = useProject();
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!currentProject || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []).map(item => ({
        ...item,
        status: item.status as 'uploading' | 'processing' | 'ready' | 'error'
      })));
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !currentProject || !user) return;

    const filesToUpload = Array.from(files);
    setIsUploadOpen(false);

    // Process each file individually
    for (const file of filesToUpload) {
      const tempId = `temp-${Date.now()}-${file.name}`;
      const tempDoc: Document = {
        id: tempId,
        project_id: currentProject.id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        upload_date: new Date().toISOString(),
        storage_path: '', // Initially empty
      };

      // Optimistically add to UI
      setDocuments(prev => [tempDoc, ...prev]);

      try {
        // 1. Upload file to storage
        const filePath = `${user.id}/${currentProject.id}/${Date.now()}-${file.name}`;
        const { data: storageData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Storage Error: ${uploadError.message}`);
        }

        // 2. Insert document record into database
        const { data: dbDoc, error: dbError } = await supabase
          .from('documents')
          .insert({
            project_id: currentProject.id,
            user_id: user.id,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'processing',
            storage_path: storageData.path,
          })
          .select()
          .single();

        if (dbError) {
          // If DB insert fails, try to delete the uploaded file
          await supabase.storage.from('documents').remove([filePath]);
          throw new Error(`Database Error: ${dbError.message}`);
        }

        // Update UI from temp doc to real doc with 'processing' status
        setDocuments(prev =>
          prev.map(d => (d.id === tempId ? { ...dbDoc, status: 'processing' } : d))
        );

        // 3. Simulate processing and set to 'ready'
        setTimeout(async () => {
          await supabase
            .from('documents')
            .update({ status: 'ready' })
            .eq('id', dbDoc.id);
          
          setDocuments(prev =>
            prev.map(d => (d.id === dbDoc.id ? { ...d, status: 'ready' } : d))
          );
        }, 2000);

      } catch (error: any) {
        console.error('Error uploading document:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        // Remove the temporary document from UI on failure
        setDocuments(prev => prev.filter(d => d.id !== tempId));
      }
    }
  };

  const removeDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document removed');
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Failed to remove document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'uploading': return 'text-warning';
      case 'processing': return 'text-warning';
      case 'ready': return 'text-success';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const sendDocumentsForEmbedding = async () => {
    if (!currentProject || !user) return;
    
    const readyDocuments = documents.filter(doc => doc.status === 'ready');
    
    if (readyDocuments.length === 0) {
      toast.error('No ready documents to process');
      return;
    }

    setIsProcessingEmbeddings(true);
    
    try {
      // Replace with your actual backend endpoint
      const response = await fetch('/api/embeddings/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: currentProject.id,
          user_id: user.id,
          documents: readyDocuments.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            size: doc.size
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process documents');
      }

      toast.success(`Sent ${readyDocuments.length} documents for embedding processing`);
    } catch (error) {
      console.error('Error sending documents for embedding:', error);
      toast.error('Failed to send documents for processing');
    } finally {
      setIsProcessingEmbeddings(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const readyDocumentsCount = documents.filter(doc => doc.status === 'ready').length;

  useEffect(() => {
    fetchDocuments();
  }, [currentProject, user]);

  if (!currentProject) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No project selected</p>
            <p className="text-xs">Select a project to manage documents</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              <span>Documents</span>
              {readyDocumentsCount > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {readyDocumentsCount} ready
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={sendDocumentsForEmbedding} 
              size="sm" 
              className="h-8 flex-1"
              disabled={!currentProject || readyDocumentsCount === 0 || isProcessingEmbeddings}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-1" />
              {isProcessingEmbeddings ? 'Processing...' : 'Process'}
            </Button>
            <Button onClick={handleFileSelect} size="sm" className="h-8 flex-1" disabled={!currentProject}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 overflow-hidden">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        
        {/* Upload Zone */}
        {isUploadOpen && (
          <div className="p-4 border-b border-border">
            <div
              className="upload-zone rounded-lg p-6 text-center cursor-pointer"
              onClick={handleFileSelect}
            >
              <Upload className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">Drop files or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, MD</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm">Loading documents...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDocuments.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-1">No documents uploaded</p>
              <p className="text-xs">Add documents to start chatting</p>
            </div>
          </div>
        )}

        {/* Document List */}
        {!loading && filteredDocuments.length > 0 && (
          <ScrollArea className="flex-1">
            <div className="space-y-2 p-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/20 transition-colors cursor-pointer"
                >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`${getStatusColor(doc.status)}`}>
                        {doc.status === 'ready' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : doc.status === 'error' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : doc.status === 'processing' ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{doc.name}</p>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(doc.size)} • {new Date(doc.upload_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {doc.status}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDocument(doc.id);
                      }}
                      className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};