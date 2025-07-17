import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  Plus,
  Download,
  FileText,
  Image,
  Video,
  FileIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileExplorerProps {
  roomId: number;
  onFileUpload: () => void;
}

export default function FileExplorer({ roomId, onFileUpload }: FileExplorerProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<number>>(new Set());

  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/rooms", roomId, "subjects"],
    enabled: !!roomId,
  });

  const { data: files = [] } = useQuery({
    queryKey: ["/api/rooms", roomId, "files"],
    enabled: !!roomId,
  });

  const toggleSubject = (subjectId: number) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const toggleSubcategory = (subcategoryId: number) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4 text-purple-600" />;
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4 text-blue-600" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4 text-red-600" />;
    return <FileIcon className="w-4 h-4 text-gray-600" />;
  };

  const formatFileSize = (size: number) => {
    return (size / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const fileStats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum: number, file: any) => sum + file.fileSize, 0)
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* File Browser Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Files & Media</h3>
          <Button size="icon" variant="ghost" onClick={onFileUpload}>
            <Plus className="w-5 h-5 text-primary" />
          </Button>
        </div>
        
        {/* File Filters */}
        <div className="flex flex-wrap gap-1">
          {[
            { key: "all", label: "All" },
            { key: "pdf", label: "PDFs" },
            { key: "image", label: "Images" },
            { key: "document", label: "Docs" }
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "outline"}
              size="sm"
              className="text-xs px-3 py-1 h-auto"
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* File Tree Explorer */}
      <div className="flex-1 overflow-y-auto p-4">
        {subjects.map((subject: any) => (
          <div key={subject.id} className="mb-4">
            {/* Subject Folder */}
            <div
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
              onClick={() => toggleSubject(subject.id)}
            >
              {expandedSubjects.has(subject.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <Folder className="w-5 h-5 text-blue-600" />
              <span className="font-medium flex-1">{subject.name}</span>
              <Badge variant="secondary" className="text-xs">
                {files.filter((f: any) => f.subjectId === subject.id).length}
              </Badge>
            </div>

            {/* Subcategories */}
            {expandedSubjects.has(subject.id) && (
              <div className="ml-6 mt-2 space-y-2">
                {/* Example subcategories - you'd fetch these from API */}
                {["Assignments", "Notes", "Previous Year Questions"].map((subcategoryName, index) => (
                  <div key={index}>
                    <div
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => toggleSubcategory(index)}
                    >
                      {expandedSubcategories.has(index) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <FolderOpen className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm flex-1">{subcategoryName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor(Math.random() * 5) + 1}
                      </Badge>
                    </div>

                    {/* Files */}
                    {expandedSubcategories.has(index) && (
                      <div className="ml-6 space-y-1">
                        {files
                          .filter((file: any) => file.subjectId === subject.id)
                          .slice(0, 3)
                          .map((file: any) => (
                            <div
                              key={file.id}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer group"
                            >
                              {getFileIcon(file.fileType)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {file.originalName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 w-6 h-6"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-primary">
              {fileStats.totalFiles}
            </p>
            <p className="text-xs text-gray-500">Total Files</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-primary">
              {formatFileSize(fileStats.totalSize)}
            </p>
            <p className="text-xs text-gray-500">Storage Used</p>
          </div>
        </div>
      </div>
    </div>
  );
}
