"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  onRemove: (value: string) => void;
  imageType?: 'product' | 'service' | 'offer' | 'general';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  imageType = 'general'
}) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", imageType);

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
          });

          if (!response.ok) {
            throw new Error("Erreur lors du téléchargement");
          }

          const data = await response.json();
          return data.url;
        } catch (error) {
          console.error("Erreur:", error);
          return null;
        }
      });

      const urls = (await Promise.all(uploadPromises)).filter(
        (url): url is string => url !== null
      );
      onChange([...value, ...urls]);
    },
    [value, onChange, imageType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"]
    },
    maxFiles: 4
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {value.map((url) => (
          <div key={url} className="relative w-[200px] h-[200px] rounded-lg overflow-hidden">
            <div className="z-10 absolute top-2 right-2">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Image
              fill
              className="object-cover"
              alt="Image"
              src={url}
            />
          </div>
        ))}
      </div>
      <div
        {...getRootProps()}
        className="border-2 border-dashed p-4 rounded-lg hover:border-primary cursor-pointer text-center"
      >
        <input {...getInputProps()} />
        <Upload className="h-6 w-6 mx-auto mb-2" />
        {isDragActive ? (
          <p>Déposez les images ici</p>
        ) : (
          <p>Glissez et déposez des images ici, ou cliquez pour sélectionner</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          PNG, JPG ou WEBP jusqu'à 4 images
        </p>
      </div>
    </div>
  );
}; 