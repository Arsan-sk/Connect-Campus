import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number | null;
}

export default function FileUploadModal({ isOpen, onClose, roomId }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/rooms", roomId, "subjects"],
    enabled: !!roomId && isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/files/upload", formData);
    },
    onSuccess: () => {
      toast({
        title: "File uploaded successfully",
        description: "Your file has been uploaded and organized.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId, "files"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSelectedFile(null);
    setFileName("");
    setSelectedSubject("");
    setSelectedSubcategory("");
    onClose();
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = () => {
    if (!selectedFile || !roomId || !selectedSubject) {
      toast({
        title: "Missing information",
        description: "Please select a file, subject, and category.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("fileName", fileName);
    formData.append("roomId", roomId.toString());
    formData.append("subjectId", selectedSubject);
    if (selectedSubcategory) {
      formData.append("subcategoryId", selectedSubcategory);
    }

    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-blue-50"
                : "border-gray-300 hover:border-primary"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            {selectedFile ? (
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Drag & drop files here or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Maximum file size: 50MB
                </p>
              </div>
            )}
            <input
              id="file-input"
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {/* File Metadata */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Assignments</SelectItem>
                  <SelectItem value="2">Notes</SelectItem>
                  <SelectItem value="3">Previous Year Questions</SelectItem>
                  <SelectItem value="4">Practicals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter descriptive file name..."
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedSubject || uploadMutation.isPending}
              className="flex-1"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
