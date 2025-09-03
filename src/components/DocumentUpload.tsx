import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

export const DocumentUpload = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const newDocuments: Document[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading'
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Simulate upload and processing
    newDocuments.forEach(doc => {
      setTimeout(() => {
        setDocuments(prev => prev.map(d => 
          d.id === doc.id ? { ...d, status: 'processing' } : d
        ));
        
        setTimeout(() => {
          setDocuments(prev => prev.map(d => 
            d.id === doc.id ? { ...d, status: 'ready' } : d
          ));
          
          toast({
            title: "Document Ready",
            description: `${doc.name} has been processed and is ready for chat.`,
          });
        }, 2000);
      }, 1000);
    });
  }, [toast]);

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

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

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'ready': return <Check className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Upload Your Documents
            </h2>
            <p className="text-lg text-muted-foreground">
              Drag and drop or click to upload. Supports PDF, Word, text files, and more.
            </p>
          </div>

          {/* Upload Zone */}
          <Card className={`mb-8 transition-smooth ${isDragOver ? 'ring-2 ring-primary border-primary bg-upload-hover' : 'bg-upload-zone'}`}>
            <CardContent className="p-12">
              <div
                className={`upload-zone rounded-lg p-12 text-center cursor-pointer transition-smooth ${isDragOver ? 'dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Drop files here or click to browse
                </h3>
                <p className="text-muted-foreground mb-4">
                  Supports PDF, DOCX, TXT, MD, and image files
                </p>
                <Button variant="outline" className="mt-2">
                  Choose Files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Document List */}
          {documents.length > 0 && (
            <Card className="shadow-medium">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Uploaded Documents ({documents.length})
                </h3>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`${getStatusColor(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(doc.size)} • {doc.status}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};