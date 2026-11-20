'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle, FileText, Image as ImageIcon } from 'lucide-react';

interface DropzoneProps {
  label: string;
  sublabel: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  documentRole: 'pan' | 'gst' | 'cheque';
}

export const Dropzone: React.FC<DropzoneProps> = ({
  label,
  sublabel,
  required = false,
  accept = 'image/*',
  file,
  onFileSelect,
  documentRole,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
          <span>{label}</span>
          {required ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Required
            </span>
          ) : (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Optional
            </span>
          )}
        </label>
        {file && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Ready
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            <span className="text-blue-400 underline underline-offset-2">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-slate-400">{sublabel}</p>
        </div>
      ) : (
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-lg flex items-center gap-4">
          {previewUrl ? (
            <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={label}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-20 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {(file.size / 1024).toFixed(1)} KB • {file.type || 'image/png'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Replace file
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
