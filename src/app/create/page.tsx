'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject, saveStyleImages } from '@/lib/storage';
import ImageUpload from '@/components/ImageUpload';
import { ArrowLeft, Loader2, Wand2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateStyleProject() {
    const router = useRouter();
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [creationMode, setCreationMode] = useState<'images' | 'prompt'>('images');
    const [trainingInstruction, setTrainingInstruction] = useState('');
    const [rawPrompt, setRawPrompt] = useState('');
    const [styleImages, setStyleImages] = useState<string[]>([]);
    const [isTraining, setIsTraining] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleCreateProject = async () => {
        if (creationMode === 'images' && (!projectName.trim() || styleImages.length < 3)) {
            alert("Please provide a name and at least 3 style images.");
            return;
        }
        if (creationMode === 'prompt' && (!projectName.trim() || !rawPrompt.trim())) {
            alert("Please provide a name and your style prompt.");
            return;
        }

        setIsTraining(true);
        setErrorMsg('');

        try {
            let finalDescriptor = '';

            if (creationMode === 'images') {
                // 1. Send images to training API to extract descriptor
                const response = await fetch('/api/train', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        styleImages,
                        trainingInstruction
                    })
                });

                const result = await response.json();

                if (!result.success || !result.descriptor) {
                    setErrorMsg(result.error || "Failed to analyze style.");
                    setIsTraining(false);
                    return;
                }
                finalDescriptor = result.descriptor;
            } else {
                // Bypass API entirely - the user's raw prompt IS the descriptor
                finalDescriptor = rawPrompt;
            }

            // 2. Save the project and descriptor locally
            const newProject = await createProject({
                name: projectName,
                description: projectDescription,
                trainingInstruction: creationMode === 'images' ? trainingInstruction : '',
                styleDescriptor: finalDescriptor
            });

            // 3. Save the images (optional for prompt mode, but supported)
            if (styleImages.length > 0) {
                await saveStyleImages(newProject.id, styleImages);
            }

            router.push(`/project/${newProject.id}`);
        } catch (e: unknown) {
            setErrorMsg(e instanceof Error ? e.message : "An unexpected error occurred during training.");
            setIsTraining(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30 flex flex-col md:flex-row relative overflow-hidden">

            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none translate-x-1/3 translate-y-1/3"></div>

            {/* LEFT PANEL: Form Configuration */}
            <div className="w-full md:w-[450px] lg:w-[500px] xl:w-[600px] border-r border-neutral-800/50 bg-black/60 backdrop-blur-xl flex flex-col h-screen h-[100dvh] relative z-10 shadow-2xl">
                <div className="p-8 border-b border-neutral-800/50 flex items-center gap-4 shrink-0 bg-gradient-to-b from-neutral-900/50 to-transparent">
                    <Link href="/" className="p-2 bg-neutral-800/50 hover:bg-neutral-700/80 rounded-full transition-colors text-neutral-400 hover:text-white backdrop-blur-md border border-neutral-700/50">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="font-bold text-2xl tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Train New Style</h1>
                        <p className="text-sm text-neutral-500 mt-1">Configure your AI style memory</p>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                    <div>
                        <label className="block text-sm font-semibold text-neutral-200 mb-2">Project Name <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={e => setProjectName(e.target.value)}
                            placeholder="e.g. Cyberpunk Neon, Watercolor Portrait"
                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner placeholder:text-neutral-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-neutral-200 mb-2">Description (Optional)</label>
                        <textarea
                            value={projectDescription}
                            onChange={e => setProjectDescription(e.target.value)}
                            placeholder="Short description of the visual style..."
                            rows={2}
                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none shadow-inner placeholder:text-neutral-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-neutral-200 mb-2">Creation Mode</label>
                        <div className="flex bg-neutral-900/80 p-1.5 rounded-xl border border-neutral-800 shadow-inner">
                            <button
                                onClick={() => setCreationMode('images')}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${creationMode === 'images' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
                            >
                                Extract from Images
                            </button>
                            <button
                                onClick={() => setCreationMode('prompt')}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${creationMode === 'prompt' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
                            >
                                Define via Prompt
                            </button>
                        </div>
                    </div>

                    {creationMode === 'images' ? (
                        <div>
                            <label className="block text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                                <Wand2 className="w-4 h-4" /> Custom Style Rules (Optional)
                            </label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                <textarea
                                    value={trainingInstruction}
                                    onChange={e => setTrainingInstruction(e.target.value)}
                                    placeholder="e.g. Always use high contrast. Keep strokes rough and painterly..."
                                    rows={4}
                                    className="relative w-full bg-black border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-indigo-900/50"
                                />
                            </div>
                            <p className="text-xs text-neutral-500 mt-2 ml-1">These rules mandate how the AI extracts and applies the style.</p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                                <Wand2 className="w-4 h-4" /> Raw Style Definition <span className="text-red-400">*</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-30 transition duration-500"></div>
                                <textarea
                                    value={rawPrompt}
                                    onChange={e => setRawPrompt(e.target.value)}
                                    placeholder='Paste your JSON or raw text prompt here...&#10;&#10;e.g. {"style": "Cyberpunk", "colors": ["neon pink", "electric blue"], "technique": "high contrast, grainy"}'
                                    rows={10}
                                    className="relative w-full bg-black border border-indigo-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-indigo-900/50 font-mono text-sm leading-relaxed"
                                />
                            </div>
                            <p className="text-xs text-neutral-500 mt-2 ml-1">The AI will bypass extraction and use this exact text as the Style Descriptor.</p>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-in slide-in-from-bottom-2 duration-300">
                            {errorMsg}
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-neutral-800/50 shrink-0 bg-black/40 backdrop-blur-xl">
                    <button
                        onClick={handleCreateProject}
                        disabled={!projectName.trim() || (creationMode === 'images' ? styleImages.length < 3 : !rawPrompt.trim()) || isTraining}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] disabled:shadow-none translate-y-0 hover:-translate-y-0.5 active:translate-y-0 duration-200"
                    >
                        {isTraining ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> {creationMode === 'images' ? 'Extracting Style Memory...' : 'Saving Definition...'}</>
                        ) : (
                            <>{creationMode === 'images' ? 'Start AI Training Session' : 'Save Style Definition'} <ArrowLeft className="w-4 h-4 rotate-180 inline-block" /></>
                        )}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: Visual Dropzone */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto relative z-10 bg-transparent flex flex-col h-screen h-[100dvh]">
                <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">{creationMode === 'images' ? 'Style References' : 'Style References (Optional)'}</h2>
                            <p className="text-neutral-400">
                                {creationMode === 'images'
                                    ? "Upload 3 to 12 images that share a consistent visual aesthetic. \n The AI will ignore the subjects and extract only the artistic style."
                                    : "Upload example images of this style. These won't be analyzed by AI, but they will be saved to your project for your own visual reference."}
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-neutral-900/80 border border-neutral-800 rounded-full text-sm font-medium">
                            {styleImages.length} / 12 Images
                        </div>
                    </div>

                    <div className="flex-1 bg-black/40 border border-neutral-800/50 rounded-3xl p-6 md:p-10 backdrop-blur-md shadow-2xl custom-scrollbar overflow-y-auto">
                        <ImageUpload
                            multiple={true}
                            maxFiles={12}
                            onImagesSelected={setStyleImages}
                        />

                        {creationMode === 'images' && styleImages.length > 0 && styleImages.length < 3 && (
                            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-center text-sm font-medium animate-in fade-in">
                                Please add {3 - styleImages.length} more image{3 - styleImages.length > 1 ? 's' : ''} to reach the minimum required for high-quality extraction.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
