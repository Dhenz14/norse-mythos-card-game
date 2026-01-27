import React, { useState, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';

interface CardImageUploaderProps {
  cardId: string | number;
  onUploadSuccess?: (imageUrl: string) => void;
  className?: string;
}

const CardImageUploader: React.FC<CardImageUploaderProps> = ({ 
  cardId, 
  onUploadSuccess,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError('Please select an image file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Image upload service has been removed
      // For now, just use the local preview
      console.log('Image upload service removed - using local preview only');
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Keep the preview URL as the local file
      // Call the success callback if provided with the preview URL
      if (onUploadSuccess && previewUrl) {
        onUploadSuccess(previewUrl);
      }
      
      // Clear the upload progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  return (
    <div className={`card-image-uploader ${className}`}>
      <h3 className="text-lg font-semibold mb-2">Upload Card Image</h3>
      
      <div className="mb-4">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="mb-2 w-full"
          disabled={isUploading}
        />
        
        <div className="flex items-center space-x-2 mb-3 mt-2">
          {/* We've moved away from face detection to automatic intelligent cropping */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-3">
            <h4 className="text-sm font-semibold text-blue-700 mb-1">Automatic Smart Cropping</h4>
            <p className="text-xs text-blue-600">
              Images are automatically centered on the most important part of the image, whether it's a 
              character, animal, or object. The system will intelligently identify and frame the subject.
            </p>
          </div>
        </div>
        
        {previewUrl && (
          <div className="mb-2">
            <h4 className="text-sm font-medium mb-1">Preview:</h4>
            <div className="relative w-40 h-24 overflow-hidden rounded border border-gray-300">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="object-cover w-full h-full"
                style={{ 
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Images should be rectangular (500x250)</p>
          </div>
        )}
        
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          variant={isUploading ? "secondary" : "default"}
          className="w-full"
        >
          {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Image'}
        </Button>
        
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-sm font-semibold text-red-700 mb-1">Upload Failed</h4>
            <p className="text-xs text-red-600 whitespace-pre-wrap break-words">{error}</p>
            {error.toLowerCase().includes('detection') && (
              <p className="text-xs text-gray-700 mt-2 italic">
                The system encountered an issue with the image analysis. Try another image.
              </p>
            )}
            {error.toLowerCase().includes('dimensions') && (
              <p className="text-xs text-gray-700 mt-2 italic">
                Try an image with a 2:1 aspect ratio (wider than tall) for best results.
              </p>
            )}
            {error.toLowerCase().includes('size') && (
              <p className="text-xs text-gray-700 mt-2 italic">
                Image file size should be under 10MB. Try compressing the image or using a smaller one.
              </p>
            )}
            {error.toLowerCase().includes('format') && (
              <p className="text-xs text-gray-700 mt-2 italic">
                Only JPG, PNG, and WebP formats are supported.
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        <p>This will upload your image for card ID: {cardId}</p>
        <p>Recommended dimensions: 500x250 pixels (2:1 ratio, wider than tall)</p>
        <p>Image will fill the entire upper portion of the card like Pokémon cards</p>
        <p>Supported formats: JPG, PNG, WebP</p>
      </div>
    </div>
  );
};

export default CardImageUploader;