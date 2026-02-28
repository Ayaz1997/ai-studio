/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploadProps {
    onImagesSelected: (base64Images: string[]) => void;
    multiple?: boolean;
    maxFiles?: number;
}

export default function ImageUpload({ onImagesSelected, multiple = false, maxFiles = 10 }: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>([]);
    const [isHovering, setIsHovering] = useState(false);

    const handleFiles = (files: FileList | File[]) => {
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/')).slice(0, maxFiles);
        if (validFiles.length === 0) return;

        if (!multiple) {
            validFiles.splice(1);
        }

        const readers = validFiles.map(file => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readers).then(results => {
            let newPreviews = results;
            if (multiple) {
                newPreviews = [...previews, ...results].slice(0, maxFiles);
            }
            setPreviews(newPreviews);
            onImagesSelected(newPreviews);
        });
    };

    const removeImage = (index: number) => {
        const updated = previews.filter((_, i) => i !== index);
        setPreviews(updated);
        onImagesSelected(updated);
    };

    return (
        <div className="w-full">
            <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${isHovering ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-700 hover:border-neutral-500 bg-neutral-800/50'}`}
                onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={(e) => { e.preventDefault(); setIsHovering(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <UploadCloud className="w-10 h-10 text-neutral-400 mb-4" />
                <p className="text-neutral-300 font-medium text-center">Drag & drop images here</p>
                <p className="text-neutral-500 text-sm text-center mt-1">or click to select files</p>
                <input
                    id="file-upload"
                    type="file"
                    multiple={multiple}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
            </div>

            {previews.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previews.map((preview, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-neutral-800 hover:ring-2 ring-indigo-500 transition-all">
                            <img src={preview} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                            <button
                                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
