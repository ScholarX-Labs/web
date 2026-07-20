"use client";

import React, { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg, { PixelCrop } from "@/lib/crop-image";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  aspectRatio: number;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  title?: string;
}

export function ImageCropper({
  open,
  imageSrc,
  aspectRatio,
  onClose,
  onCropComplete,
  title = "Crop Image",
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((_: Area, croppedAreaPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (!croppedFile) {
        throw new Error("Failed to crop image.");
      }
      onCropComplete(croppedFile);
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while cropping the image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-slate-900 border-slate-800 text-slate-100">
        <div className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-slate-400 mt-1">
            Drag to pan and use the slider to zoom.
          </DialogDescription>
        </div>

        <div className="relative w-full h-[400px] bg-black/50">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            maxZoom={3}
            classes={{
              containerClassName: "w-full h-full",
              cropAreaClassName: "border-2 border-blue-500 shadow-[0_0_0_9999em_rgba(0,0,0,0.7)]",
            }}
          />
        </div>

        <div className="p-6 pt-4 space-y-6 bg-slate-900/50 border-t border-slate-800">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(val) => setZoom(val[0])}
              className="py-2"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Crop"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
