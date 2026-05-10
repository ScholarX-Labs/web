"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarUploadProps {
  currentImage: string | null;
  name: string;
  initials: string;
  onUploadComplete: (url: string) => void;
  size?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 1 * 1024 * 1024;

export function AvatarUpload({
  currentImage,
  name,
  initials,
  onUploadComplete,
  size = 64,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Accepted formats: JPEG, PNG, WebP");
        return;
      }

      if (file.size > MAX_SIZE) {
        toast.error("File exceeds 1MB limit");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/avatar", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 429) {
            toast.error("Upload limit exceeded. Try again later.");
          } else {
            toast.error(data.error ?? "Upload failed");
          }
          setPreview(null);
          return;
        }

        onUploadComplete(data.data.url);
        toast.success("Avatar updated");
      } catch {
        toast.error("Upload failed. Please try again.");
        setPreview(null);
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onUploadComplete]
  );

  const displayUrl = preview ?? currentImage;

  return (
    <div className="relative inline-block">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="group relative rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
        aria-label="Upload avatar"
      >
        <Avatar
          className="border-2 border-border"
          style={{ width: size, height: size }}
        >
          <AvatarImage src={displayUrl ?? undefined} alt={name} />
          <AvatarFallback className="bg-muted text-lg font-medium">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              initials
            )}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </button>
    </div>
  );
}
