/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject, getStyleImages, getRenderJobs, saveRenderJob, deleteRenderJob, StyleProject, StyleImage, RenderJob } from '@/lib/storage';
import ImageUpload from '@/components/ImageUpload';
import { ArrowLeft, Wand2, Download, Image as ImageIcon, Sparkles, Loader2, Info, X, Trash2, LayoutGrid, Square, Grid3X3, Type, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function RenderStudio() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<StyleProject | null>(null);
    const [styleImages, setStyleImages] = useState<StyleImage[]>([]);
    const [history, setHistory] = useState<RenderJob[]>([]);

    const [generationMode, setGenerationMode] = useState<'I2I' | 'T2I'>('I2I');
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [instruction, setInstruction] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [model, setModel] = useState('gemini-3.1-flash-image-preview'); // default model
    const [gridCols, setGridCols] = useState<1 | 2 | 3>(2);

    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    useEffect(() => {
        if (projectId) {
            async function load() {
                const p = await getProject(projectId);
                if (!p) {
                    router.push('/');
                    return;
                }
                setProject(p);
                const imgs = await getStyleImages(projectId);
                setStyleImages(imgs);
                const hist = await getRenderJobs(projectId);
                setHistory(hist);
            }
            load();
        }
    }, [projectId, router]);

    const handleGenerate = async () => {
        if (generationMode === 'I2I' && referenceImages.length === 0) {
            setErrorMsg("Please upload a reference image for Image-to-Image generation.");
            return;
        }

        if (generationMode === 'T2I' && !instruction.trim()) {
            setErrorMsg("Please provide a text prompt to generate an image.");
            return;
        }

        setIsGenerating(true);
        setErrorMsg('');

        if (!project?.styleDescriptor) {
            setErrorMsg("This project doesn't have a trained Style Descriptor yet. Try creating a new project.");
            setIsGenerating(false);
            return;
        }

        try {
            const payload = {
                styleDescriptor: project.styleDescriptor,
                instruction,
                modelName: model,
                aspectRatio,
                ...(generationMode === 'I2I' ? { referenceImage: referenceImages[0] } : {})
            };

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success && result.image) {
                const newJob = await saveRenderJob({
                    projectId,
                    userInstruction: instruction,
                    outputImage: result.image,
                    ...(generationMode === 'I2I' ? { referenceImage: referenceImages[0] } : {})
                });
                setHistory([newJob, ...history]);
                // Keep the prompt/image around for iterative generation, don't clear immediately.
            } else {
                setErrorMsg(result.error || "Failed to generate image. The model might have returned text instead.");
                // If it was a fallback text result, log or handle.
                if (result.fallbackImage) {
                    setErrorMsg(`Model returned text: ${result.text}`);
                }
            }
        } catch (e: unknown) {
            setErrorMsg(e instanceof Error ? e.message : "An unexpected error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (e: React.MouseEvent, base64Data: string) => {
        e.stopPropagation();
        const a = document.createElement('a');
        a.href = base64Data;
        a.download = `styled_export_${Date.now()}.png`;
        a.click();
    };

    const handleDeleteJob = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this render?')) {
            await deleteRenderJob(projectId, jobId);
            setHistory(history.filter(j => j.id !== jobId));
        }
    };

    const handleEditJob = (e: React.MouseEvent, job: RenderJob) => {
        e.stopPropagation();

        // Load the instruction
        setInstruction(job.userInstruction || '');

        // Determine mode and load image if present
        if (job.referenceImage) {
            setGenerationMode('I2I');
            setReferenceImages([job.referenceImage]);
        } else {
            setGenerationMode('T2I');
            setReferenceImages([]);
        }

        // Smooth scroll to top/workspace for mobile users
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!project) return null; // or loading state

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30 flex flex-col md:flex-row relative overflow-hidden">

            {/* Background Glows */}
            <div className="absolute top-[-5%] right-[20%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>

            {/* LEFT PANEL: Workspace */}
            <div className="w-full md:w-[450px] lg:w-[500px] border-r border-neutral-800/50 bg-black/60 backdrop-blur-xl flex flex-col h-screen h-[100dvh] relative z-20 shadow-2xl">
                <div className="p-6 border-b border-neutral-800/50 flex items-center justify-between shrink-0 bg-gradient-to-b from-neutral-900/50 to-transparent">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 bg-neutral-800/50 hover:bg-neutral-700/80 rounded-full transition-colors text-neutral-400 hover:text-white backdrop-blur-md border border-neutral-700/50">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h2 className="font-semibold text-lg bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">{project.name}</h2>
                            <div className="text-xs text-indigo-400 font-medium tracking-wide uppercase flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Render Studio
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsInfoOpen(true)}
                        className="p-2 bg-neutral-800/50 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-full transition-all"
                        title="View Trained Style Info"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">

                    <div className="space-y-6">

                        {/* Generation Mode Tabs */}
                        <div className="flex bg-neutral-900/80 p-1.5 rounded-xl border border-neutral-800 shadow-inner">
                            <button
                                onClick={() => setGenerationMode('I2I')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${generationMode === 'I2I' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
                            >
                                <ImageIcon className="w-4 h-4" /> Image to Image
                            </button>
                            <button
                                onClick={() => setGenerationMode('T2I')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${generationMode === 'T2I' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
                            >
                                <Type className="w-4 h-4" /> Text to Image
                            </button>
                        </div>

                        {generationMode === 'I2I' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-200 mb-2">1. Reference Image</label>
                                    <ImageUpload multiple={false} onImagesSelected={setReferenceImages} value={referenceImages} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-semibold text-neutral-200">2. Instruction Prompt (Optional)</label>
                                    </div>
                                    <textarea
                                        value={instruction}
                                        onChange={e => setInstruction(e.target.value)}
                                        placeholder="Leave blank for strictly structurally perfect style mapping, or add specific details like 'neon outlines'..."
                                        rows={3}
                                        className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none shadow-inner text-sm placeholder:text-neutral-600"
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-neutral-200 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-400" /> What do you want to generate? <span className="text-red-400">*</span>
                                    </label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                    <textarea
                                        value={instruction}
                                        onChange={e => setInstruction(e.target.value)}
                                        placeholder="e.g. A futuristic cyberpunk city street with flying cars at night..."
                                        rows={5}
                                        className="relative w-full bg-black border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-sm placeholder:text-neutral-600 leading-relaxed"
                                    />
                                </div>
                                <p className="text-xs text-neutral-500 mt-2 ml-1">The AI will build this scene from scratch using your trained style.</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-neutral-200 mb-2 flex items-center gap-2">
                                {generationMode === 'I2I' ? '3.' : '2.'} Aspect Ratio
                            </label>
                            <div className="flex gap-2 bg-black p-1 rounded-xl border border-neutral-800">
                                {['1:1', '4:3', '16:9', '9:16'].map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${aspectRatio === ratio ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-200 mb-2 flex items-center gap-2">
                                {generationMode === 'I2I' ? '4.' : '3.'} Selection Model
                            </label>
                            <div className="flex flex-col gap-3">
                                <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${model === 'gemini-3.1-flash-image-preview' ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 bg-black hover:border-neutral-600'}`}>
                                    <input
                                        type="radio"
                                        name="model"
                                        value="gemini-3.1-flash-image-preview"
                                        checked={model === 'gemini-3.1-flash-image-preview'}
                                        onChange={() => setModel('gemini-3.1-flash-image-preview')}
                                        className="mr-3 accent-indigo-500 w-4 h-4"
                                    />
                                    <div>
                                        <div className="font-medium text-sm">Gemini 3.1 Flash</div>
                                        <div className="text-xs text-neutral-500">Fast rendering and exploration</div>
                                    </div>
                                </label>

                                <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${model === 'gemini-3-pro-image-preview' ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 bg-black hover:border-neutral-600'}`}>
                                    <input
                                        type="radio"
                                        name="model"
                                        value="gemini-3-pro-image-preview"
                                        checked={model === 'gemini-3-pro-image-preview'}
                                        onChange={() => setModel('gemini-3-pro-image-preview')}
                                        className="mr-3 accent-indigo-500 w-4 h-4"
                                    />
                                    <div>
                                        <div className="font-medium text-sm">Gemini 3 Pro</div>
                                        <div className="text-xs text-neutral-500">Highest quality detail and adherence</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                                {errorMsg}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-neutral-800/50 shrink-0 bg-black/40 backdrop-blur-xl">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || (generationMode === 'I2I' ? referenceImages.length === 0 : !instruction.trim())}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] disabled:shadow-none translate-y-0 hover:-translate-y-0.5 active:translate-y-0 duration-200"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Gathering context & Generating...</>
                        ) : (
                            <><Wand2 className="w-5 h-5" /> Generate Styled Output</>
                        )}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: Output Map */}
            <div className="flex-1 bg-transparent p-6 md:p-8 overflow-y-auto relative z-10 h-screen h-[100dvh] custom-scrollbar">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h3 className="text-2xl font-bold tracking-tight">Render History</h3>

                        {/* Grid View Toggles */}
                        <div className="flex items-center gap-1 bg-neutral-900/80 p-1 border border-neutral-800/50 rounded-xl backdrop-blur-md shadow-inner">
                            <button onClick={() => setGridCols(1)} className={`p-2 rounded-lg transition-all ${gridCols === 1 ? 'bg-indigo-500/20 text-indigo-400' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`} title="1x1 Large View">
                                <Square className="w-4 h-4" />
                            </button>
                            <button onClick={() => setGridCols(2)} className={`p-2 rounded-lg transition-all ${gridCols === 2 ? 'bg-indigo-500/20 text-indigo-400' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`} title="2x2 Medium Grid">
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button onClick={() => setGridCols(3)} className={`p-2 rounded-lg transition-all ${gridCols === 3 ? 'bg-indigo-500/20 text-indigo-400' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`} title="3x3 Compact Grid">
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {history.length === 0 && !isGenerating ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center text-neutral-500 border border-neutral-800 border-dashed rounded-3xl h-[60vh]">
                            <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                            <p className="text-lg">No renders yet for this project.</p>
                            <p className="text-sm mt-2 max-w-sm mx-auto">Use the workspace on the left to upload a reference image and apply your learned style.</p>
                        </div>
                    ) : (
                        <div className={`grid gap-6 ${gridCols === 1 ? 'grid-cols-1' :
                            gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                            }`}>

                            {/* Loading Skeleton */}
                            {isGenerating && (
                                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md animate-pulse">
                                    <div className="p-4 flex gap-4 border-b border-white/5 bg-black/40">
                                        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-800/50"></div>
                                        <div className="flex-1 flex flex-col justify-center space-y-3">
                                            <div className="h-3 bg-neutral-800/80 rounded w-1/3"></div>
                                            <div className="h-4 bg-indigo-500/20 rounded w-3/4"></div>
                                        </div>
                                    </div>
                                    <div className={`relative bg-neutral-900/50 flex items-center justify-center overflow-hidden
                                        ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-square'}
                                    `}>
                                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500/50" />
                                    </div>
                                </div>
                            )}

                            {history.map(job => (
                                <div key={job.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] backdrop-blur-md flex flex-col">
                                    <div className="p-4 flex gap-4 border-b border-white/5 bg-black/40 shrink-0">
                                        {job.referenceImage ? (
                                            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-neutral-700 shadow-inner">
                                                <img src={job.referenceImage} className="w-full h-full object-cover" alt="Reference" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 shrink-0 rounded-lg border border-neutral-700 bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
                                                <Type className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                            <div className="text-[10px] text-neutral-500 font-bold tracking-wider mb-1 uppercase">
                                                {job.referenceImage ? 'I2I Instruction' : 'T2I Prompt'}
                                            </div>
                                            <p className="text-sm text-neutral-300 line-clamp-2 italic leading-relaxed">
                                                "{job.userInstruction || 'Strict structural adherence mapping'}"
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative flex-1 bg-black/60 flex items-center justify-center overflow-hidden min-h-[250px]">
                                        <img src={job.outputImage} className="w-full h-full object-contain" alt="Styled Result" />

                                        {/* Hover Actions */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button
                                                onClick={(e) => handleEditJob(e, job)}
                                                className="bg-white/10 hover:bg-white text-white hover:text-indigo-600 p-4 rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all delay-[50ms] shadow-xl backdrop-blur-md"
                                                title="Remix & Edit"
                                            >
                                                <Pencil className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDownload(e, job.outputImage)}
                                                className="bg-white/10 hover:bg-white text-white hover:text-black p-4 rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all delay-[100ms] shadow-xl backdrop-blur-md"
                                                title="Download PNG"
                                            >
                                                <Download className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteJob(e, job.id)}
                                                className="bg-red-500/80 hover:bg-red-500 text-white p-4 rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all delay-[150ms] shadow-xl backdrop-blur-md"
                                                title="Delete Render"
                                            >
                                                <Trash2 className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-over Info Panel */}
            {isInfoOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                                <Info className="w-5 h-5" /> Trained Style Info
                            </div>
                            <button
                                onClick={() => setIsInfoOpen(false)}
                                className="text-neutral-400 hover:text-white p-2 rounded-full hover:bg-neutral-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                            {project.trainingInstruction && (
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">User Training Rules</h4>
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 p-4 rounded-xl text-sm italic">
                                        "{project.trainingInstruction}"
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">AI Extracted Style Descriptor</h4>
                                <div className="bg-black border border-neutral-800 text-neutral-300 p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed">
                                    {project.styleDescriptor || "No descriptor found. This project might have been created before the Style Extraction update."}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Original Source Images</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {styleImages.map(img => (
                                        <img key={img.id} src={img.imageData} alt="Style Ref" className="w-full aspect-square rounded-lg object-cover border border-neutral-800 opacity-80 hover:opacity-100 transition-opacity" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
