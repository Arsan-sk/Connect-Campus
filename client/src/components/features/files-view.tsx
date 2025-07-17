import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Download,
  Trash2,
  Search,
  Folder,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileItem {
  id: number;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploaderId: number;
  roomId?: number;
  subjectId?: number;
  subcategoryId?: number;
  createdAt: string;
  uploader: {
    id: number;
    username: string;
    firstName?: string;
  };
  subject?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  };
}

interface Subject {
  id: number;
  name: string;
  subcategories: Array<{
    id: number;
    name: string;
  }>;
}

export default function FilesView() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  // Fetch user's files
  const { data: myFiles = [], isLoading: myFilesLoading } = useQuery<FileItem[]>({
    queryKey: ["/api/files/my"],
  });

  // Fetch shared files
  const { data: sharedFiles = [], isLoading: sharedFilesLoading } = useQuery<FileItem[]>({
    queryKey: ["/api/files/shared"],
  });

  // Fetch subjects with subcategories
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (data: { file: File; subjectId?: number; subcategoryId?: number; roomId?: number }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      if (data.subjectId) formData.append("subjectId", data.subjectId.toString());
      if (data.subcategoryId) formData.append("subcategoryId", data.subcategoryId.toString());
      if (data.roomId) formData.append("roomId", data.roomId.toString());

      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File uploaded successfully!",
        description: "Your file is now available for sharing.",
      });
      setShowUploadDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/files/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files/shared"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "The file has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files/my"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const subjectId = selectedSubject ? parseInt(selectedSubject) : undefined;
    const subcategoryId = selectedSubcategory ? parseInt(selectedSubcategory) : undefined;
    
    uploadFileMutation.mutate({ file, subjectId, subcategoryId });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.startsWith("audio/")) return Music;
    if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
    if (mimeType.includes("zip") || mimeType.includes("archive")) return Archive;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const filteredMyFiles = myFiles.filter(file =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.subject?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.subcategory?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSharedFiles = sharedFiles.filter(file =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.subject?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.subcategory?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FileCard = ({ file, canDelete = false }: { file: FileItem; canDelete?: boolean }) => {
    const FileIcon = getFileIcon(file.mimeType);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <FileIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{file.originalName}</h3>
              <div className="text-sm text-gray-500 space-y-1">
                <p>{formatFileSize(file.size)}</p>
                {file.subject && (
                  <p className="flex items-center space-x-1">
                    <Folder className="h-3 w-3" />
                    <span>{file.subject.name}</span>
                    {file.subcategory && <span>/ {file.subcategory.name}</span>}
                  </p>
                )}
                <p>by {file.uploader.firstName || file.uploader.username}</p>
                <p>{new Date(file.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Button size="sm" variant="outline">
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              {canDelete && (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteFileMutation.mutate(file.id)}
                  disabled={deleteFileMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const selectedSubjectData = subjects.find(s => s.id.toString() === selectedSubject);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">File Management</h1>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 50MB. Supported: Documents, Images, Videos, Audio files
                </p>
              </div>
              
              <div>
                <Label>Subject (Optional)</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSubjectData && (
                <div>
                  <Label>Subcategory (Optional)</Label>
                  <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSubjectData.subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadFileMutation.isPending}
                >
                  {uploadFileMutation.isPending ? "Uploading..." : "Choose File"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search files by name, subject, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="my-files" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-files">
            <File className="h-4 w-4 mr-2" />
            My Files ({myFiles.length})
          </TabsTrigger>
          <TabsTrigger value="shared">
            <FileText className="h-4 w-4 mr-2" />
            Shared Files ({sharedFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-files" className="space-y-4">
          {myFilesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading your files...</div>
          ) : filteredMyFiles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">
                  {searchQuery ? `No files found for "${searchQuery}"` : "No files uploaded yet"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? "Try a different search term" : "Upload your first file to get started"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First File
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyFiles.map((file) => (
                <FileCard key={file.id} file={file} canDelete />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          {sharedFilesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading shared files...</div>
          ) : filteredSharedFiles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">
                  {searchQuery ? `No shared files found for "${searchQuery}"` : "No shared files available"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? "Try a different search term" : "Files shared by your friends and study groups will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSharedFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}