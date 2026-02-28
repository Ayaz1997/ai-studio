/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject, getStyleImages, getRenderJobs, saveRenderJob, deleteRenderJob, StyleProject, StyleImage, RenderJob } from '@/lib/storage';
import ImageUpload from '@/components/ImageUpload';
import { ArrowLeft, Wand2, Download, Image as ImageIcon, Sparkles, Loader2, Info, X, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function RenderStudio() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<StyleProject | null>(null);
    const [styleImages, setStyleImages] = useState<StyleImage[]>([]);
    const [history, setHistory] = useState<RenderJob[]>([]);

    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [instruction, setInstruction] = useState('');
    const [model, setModel] = useState('gemini-3.1-flash-image-preview'); // default model

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
        if (referenceImages.length === 0) {
            setErrorMsg("Please upload a reference image.");
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
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    styleDescriptor: project.styleDescriptor,
                    referenceImage: referenceImages[0],
                    instruction,
                    modelName: model
                })
            });

            const result = await response.json();

            if (result.success && result.image) {
                const newJob = await saveRenderJob({
                    projectId,
                    referenceImage: referenceImages[0],
                    userInstruction: instruction,
                    outputImage: result.image
                });
                setHistory([newJob, ...history]);
                setReferenceImages([]); // Reset inputs
                setInstruction('');
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

    if (!project) return null; // or loading state

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30 flex flex-col md:flex-row">

            {/* LEFT PANEL: Workspace */}
            <div className="w-full md:w-[450px] lg:w-[500px] border-r border-neutral-800 bg-neutral-900/40 flex flex-col h-screen h-[100dvh]">
                <div className="p-6 border-b border-neutral-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors text-neutral-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h2 className="font-semibold text-lg">{project.name}</h2>
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

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-200 mb-2">1. Reference Image</label>
                            <ImageUpload multiple={false} onImagesSelected={setReferenceImages} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-200 mb-2">2. Instruction Prompt (Optional)</label>
                            <textarea
                                value={instruction}
                                onChange={e => setInstruction(e.target.value)}
                                placeholder="e.g. Turn the subjects into neon outlines..."
                                rows={3}
                                className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-200 mb-2">3. Selection Model</label>
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

                <div className="p-6 border-t border-neutral-800 shrink-0 bg-neutral-900/80 backdrop-blur-md">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || referenceImages.length === 0}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Gathering context & Rendering...</>
                        ) : (
                            <><Wand2 className="w-5 h-5" /> Generate Styled Output</>
                        )}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: Output Map */}
            <div className="flex-1 bg-black p-8 overflow-y-auto relative h-screen h-[100dvh]">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold tracking-tight mb-8">Render History</h3>

                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center text-neutral-500 border border-neutral-800 border-dashed rounded-3xl h-[60vh]">
                            <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                            <p className="text-lg">No renders yet for this project.</p>
                            <p className="text-sm mt-2 max-w-sm mx-auto">Use the workspace on the left to upload a reference image and apply your learned style.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {history.map(job => (
                                <div key={job.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all group">
                                    <div className="p-4 flex gap-4 border-b border-neutral-800 bg-black/40">
                                        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-neutral-700">
                                            <img src={job.referenceImage} className="w-full h-full object-cover" alt="Reference" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="text-xs text-neutral-500 font-medium mb-1">PROMPT INSTRUCTION</div>
                                            <p className="text-sm text-neutral-300 line-clamp-2 italic">
                                                "{job.userInstruction || 'Apply style closely'}"
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative aspect-square sm:aspect-video xl:aspect-square bg-neutral-950 flex items-center justify-center overflow-hidden">
                                        <img src={job.outputImage} className="w-full h-full object-contain" alt="Styled Result" />

                                        {/* Hover Actions */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <button
                                                onClick={(e) => handleDownload(e, job.outputImage)}
                                                className="bg-white text-black hover:bg-neutral-200 px-6 py-3 rounded-full font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all delay-75 shadow-lg"
                                                title="Download PNG"
                                            >
                                                <Download className="w-4 h-4" /> Download Result
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteJob(e, job.id)}
                                                className="bg-red-500/80 hover:bg-red-500 text-white p-3 rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all delay-100 shadow-lg"
                                                title="Delete Render"
                                            >
                                                <Trash2 className="w-5 h-5" />
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
