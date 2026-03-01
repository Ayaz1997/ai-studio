/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploadProps {
    onImagesSelected: (base64Images: string[]) => void;
    value?: string[];
    multiple?: boolean;
    maxFiles?: number;
}

export default function ImageUpload({ onImagesSelected, value, multiple = false, maxFiles = 10 }: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>(value || []);
    const [isHovering, setIsHovering] = useState(false);

    const handleFiles = useCallback((files: FileList | File[]) => {
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
    }, [maxFiles, multiple, onImagesSelected, previews]);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // Prevent pasting if the user is currently typing in an input or textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.clipboardData && e.clipboardData.files.length > 0) {
                const files = Array.from(e.clipboardData.files).filter(file => file.type.startsWith('image/'));
                if (files.length > 0) {
                    e.preventDefault();
                    handleFiles(files);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleFiles]);

    // Sync external value changes (e.g., from Remix flow)
    useEffect(() => {
        if (value) {
            setPreviews(value);
        }
    }, [value]);

    const removeImage = (index: number) => {
        const updated = previews.filter((_, i) => i !== index);
        setPreviews(updated);
        onImagesSelected(updated);
    };

    return (
        <div className="w-full">
            {(!multiple && previews.length > 0) ? (
                <div className="relative w-full aspect-square md:aspect-video rounded-xl overflow-hidden bg-neutral-800 border-2 border-indigo-500/50 group">
                    <img src={previews[0]} alt="Selected" className="w-full h-full object-contain bg-neutral-900" />
                    <button
                        onClick={(e) => { e.stopPropagation(); removeImage(0); }}
                        className="absolute top-4 right-4 bg-black/60 hover:bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        Reference Image
                    </div>
                </div>
            ) : (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${isHovering ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-700 hover:border-neutral-500 bg-neutral-800/50'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                    onDragLeave={() => setIsHovering(false)}
                    onDrop={(e) => { e.preventDefault(); setIsHovering(false); handleFiles(e.dataTransfer.files); }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                >
                    <UploadCloud className="w-10 h-10 text-neutral-400 mb-4" />
                    <p className="text-neutral-300 font-medium text-center">Drag & drop image{multiple ? 's' : ''} here</p>
                    <p className="text-neutral-500 text-sm text-center mt-1">or click to select file{multiple ? 's' : ''}</p>
                    <input
                        id="file-upload"
                        type="file"
                        multiple={multiple}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    />
                </div>
            )}

            {(multiple && previews.length > 0) && (
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
