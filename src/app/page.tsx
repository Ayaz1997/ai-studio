
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, FolderPlus, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProjects, deleteProject, getStyleImages, StyleProject } from '@/lib/storage';
import StyleProjectCard from '@/components/StyleProjectCard';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<(StyleProject & { imageCount: number })[]>([]);

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



  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 md:p-12 font-sans selection:bg-indigo-500/30 relative overflow-hidden">

      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center justify-center p-1.5 mb-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-indigo-400 mr-2 ml-1" />
              <span className="text-xs font-semibold tracking-wide text-neutral-300 uppercase pr-2">Workspace</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
              AI Style Studio
            </h1>
            <p className="text-neutral-400 text-lg">Teach styles once, apply them endlessly to anything.</p>
          </div>
          <button
            onClick={() => router.push('/create')}
            className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-8 py-4 rounded-2xl font-semibold transition-all shadow-[0_0_30px_rgba(79,70,229,0.2)] hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] transform hover:-translate-y-1"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            New Style Project
          </button>
        </header>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 bg-white/[0.02] backdrop-blur-md rounded-[2.5rem] border border-white/5 border-dashed text-center shadow-2xl">
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
              <FolderPlus className="w-10 h-10 text-neutral-500" />
            </div>
            <h2 className="text-3xl font-semibold mb-4 text-white">No projects yet</h2>
            <p className="text-neutral-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
              Create a new memory by uploading multiple generated or reference images to teach the AI a specific visual style.
            </p>
            <button
              onClick={() => router.push('/create')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Get started <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  );
}


