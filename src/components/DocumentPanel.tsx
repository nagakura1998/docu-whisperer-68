import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Upload, FileText, X, Clock, CheckCircle, AlertCircle } from "lucide-react";
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
}

export const DocumentPanel = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
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

    const newDocuments: Document[] = Array.from(files).map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      project_id: currentProject.id,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      upload_date: new Date().toISOString(),
    }));

    // Add temporary documents for UI feedback
    setDocuments(prev => [...newDocuments, ...prev]);
    setIsUploadOpen(false);

    // Upload documents to database
    for (const doc of newDocuments) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .insert({
            project_id: currentProject.id,
            user_id: user.id,
            name: doc.name,
            size: doc.size,
            type: doc.type,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        // Replace temp document with real one
        setDocuments(prev => 
          prev.map(d => d.id === doc.id ? { ...data, status: 'processing' as const } : d)
        );

        // Simulate processing
        setTimeout(async () => {
          await supabase
            .from('documents')
            .update({ status: 'ready' })
            .eq('id', data.id);
          
          setDocuments(prev => 
            prev.map(d => d.id === data.id ? { ...d, status: 'ready' as const } : d)
          );
        }, 2000);
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error(`Failed to upload ${doc.name}`);
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
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

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            <span>Documents</span>
          </CardTitle>
          <Button onClick={handleFileSelect} size="sm" className="h-8" disabled={!currentProject}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 min-h-0">
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
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2 pr-2">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};