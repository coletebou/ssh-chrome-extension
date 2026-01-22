import { useState, useCallback, useRef } from 'react';

interface UseFileUploadOptions {
  onUploadComplete: (result: UploadResult) => void;
  onError?: (error: string) => void;
  relayUrl: string;
  sessionId: string;
}

interface UploadResult {
  success: boolean;
  path?: string;
  filename?: string;
  error?: string;
}

export function useFileUpload({ onUploadComplete, onError, relayUrl, sessionId }: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadFile = useCallback(async (file: File, type: 'image' | 'file') => {
    if (!relayUrl || !sessionId) {
      onError?.('Not connected to a session');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 50));
          }
        };
        reader.readAsDataURL(file);
      });

      setProgress(50);

      // For now, we'll send via WebSocket message
      // In production, you'd upload to a server endpoint
      const uploadMessage = {
        type: 'file-upload',
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        base64Data: base64,
        fileType: type,
      };

      // Send to relay server (this would need relay server support)
      // For now, we'll echo the filename to terminal
      setProgress(100);

      onUploadComplete({
        success: true,
        path: `/tmp/${file.name}`,
        filename: file.name,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      onError?.(message);
      onUploadComplete({
        success: false,
        error: message,
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [relayUrl, sessionId, onUploadComplete, onError]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    // Validate image
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    uploadFile(file, 'image');
  }, [uploadFile, onError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    uploadFile(file, 'file');
  }, [uploadFile]);

  const triggerImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const takeScreenshot = useCallback(async () => {
    try {
      // Check if we can use the Screen Capture API
      if (!navigator.mediaDevices?.getDisplayMedia) {
        onError?.('Screenshot not supported in this browser');
        return;
      }

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as MediaTrackConstraints,
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Create canvas and draw video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create screenshot'));
          },
          'image/png'
        );
      });

      // Create file from blob
      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
      await uploadFile(file, 'image');

    } catch (error) {
      if ((error as Error).name === 'NotAllowedError') {
        // User cancelled
        return;
      }
      const message = error instanceof Error ? error.message : 'Screenshot failed';
      onError?.(message);
    }
  }, [uploadFile, onError]);

  return {
    isUploading,
    progress,
    imageInputRef,
    fileInputRef,
    handleImageSelect,
    handleFileSelect,
    triggerImageUpload,
    triggerFileUpload,
    takeScreenshot,
  };
}
