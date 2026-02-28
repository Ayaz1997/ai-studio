
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, FolderPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProjects, createProject, getStyleImages, saveStyleImages, deleteProject, StyleProject } from '@/lib/storage';
import StyleProjectCard from '@/components/StyleProjectCard';
import ImageUpload from '@/components/ImageUpload';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<(StyleProject & { imageCount: number })[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [trainingInstruction, setTrainingInstruction] = useState('');
  const [styleImages, setStyleImages] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      const allProjects = await getProjects();
      const withCounts = await Promise.all(
        allProjects.map(async (p) => {
          const images = await getStyleImages(p.id);
          return { ...p, imageCount: images.length };
        })
      );
      setProjects(withCounts);
    }
    load();
  }, []);

  const handleCreateProject = async () => {
    if (!projectName.trim() || styleImages.length < 3) {
      alert("Please provide a name and at least 3 style images.");
      return;
    }

    setIsTraining(true);
    setErrorMsg('');

    try {
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

      // 2. Save the project and descriptor locally
      const newProject = await createProject({
        name: projectName,
        description: projectDescription,
        trainingInstruction: trainingInstruction,
        styleDescriptor: result.descriptor
      });

      // 3. Save the images
      await saveStyleImages(newProject.id, styleImages);

      setIsModalOpen(false);
      router.push(`/project/${newProject.id}`);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "An unexpected error occurred during training.");
      setIsTraining(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              AI Style Studio
            </h1>
            <p className="text-neutral-400">Teach styles once, apply them endlessly.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            New Style Project
          </button>
        </header>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 bg-neutral-900/50 rounded-3xl border border-neutral-800 border-dashed text-center">
            <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
              <FolderPlus className="w-10 h-10 text-neutral-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">No projects yet</h2>
            <p className="text-neutral-400 max-w-md mx-auto mb-8">
              Create a new style project by uploading multiple generated or reference images to teach the AI a specific visual style.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-2"
            >
              Get started <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <StyleProjectCard
                key={project.id}
                project={project}
                imageCount={project.imageCount}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <h2 className="text-2xl font-semibold">Create Style Memory</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors bg-neutral-800/50 hover:bg-neutral-800 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. Cyberpunk Neon, Watercolor Portrait"
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Description (Optional)</label>
                  <textarea
                    value={projectDescription}
                    onChange={e => setProjectDescription(e.target.value)}
                    placeholder="Short description of the visual style..."
                    rows={2}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-400 mb-2">Custom Style Rules (Optional)</label>
                  <textarea
                    value={trainingInstruction}
                    onChange={e => setTrainingInstruction(e.target.value)}
                    placeholder="e.g. Always use high contrast neon colors. Keep the strokes rough and painterly..."
                    rows={3}
                    className="w-full bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none placeholder:text-indigo-900"
                  />
                  <p className="text-xs text-neutral-500 mt-2">These rules will be baked into the style memory and applied to every generation.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-neutral-300">Style Reference Images</label>
                    <span className="text-xs text-neutral-500">Minimum 3 required for good results</span>
                  </div>
                  <ImageUpload
                    multiple={true}
                    maxFiles={12}
                    onImagesSelected={setStyleImages}
                  />
                </div>

                {errorMsg && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                    {errorMsg}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || styleImages.length < 3 || isTraining}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full font-medium transition-all min-w-[160px]"
              >
                {isTraining ? 'Analyzing Style...' : 'Create & Train AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
