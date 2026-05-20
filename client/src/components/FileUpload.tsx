import { useRef, useState } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export default function FileUpload({ onFileSelect, accept = ".pdf,.docx", maxSize = 10 }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        data-testid="input-file-upload"
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary"
          }`}
          data-testid="dropzone-file-upload"
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Drop your file here or click to browse</p>
          <p className="text-sm text-muted-foreground">
            Supports PDF and DOCX (max {maxSize}MB)
          </p>
        </div>
      ) : (
        <div className="border-2 border-primary/30 bg-primary/5 rounded-xl p-6 flex items-center justify-between" data-testid="container-file-selected">
          <div className="flex items-center gap-3">
            <File className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium" data-testid="text-file-name">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemove} data-testid="button-remove-file">
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
