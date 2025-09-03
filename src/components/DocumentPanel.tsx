import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, X, Check, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadDate: Date;
}

export const DocumentPanel = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    setIsUploadOpen(false);
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const newDocuments: Document[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      uploadDate: new Date()
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Simulate processing
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
            description: `${doc.name} is ready for chat.`,
          });
        }, 1500);
      }, 800);
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

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Documents ({documents.length})</CardTitle>
          <Button 
            size="sm" 
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="bg-primary hover:bg-primary-hover"
          >
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

      <CardContent className="flex-1 p-0">
        {/* Upload Zone */}
        {isUploadOpen && (
          <div className="p-4 border-b border-border">
            <div
              className="upload-zone rounded-lg p-6 text-center cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">Drop files or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, MD</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Document List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No documents yet</p>
                <p className="text-sm">Upload your first document to get started</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/20 transition-smooth cursor-pointer"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`${getStatusColor(doc.status)}`}>
                      {doc.status === 'ready' ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)} • {doc.status}
                      </p>
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
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};