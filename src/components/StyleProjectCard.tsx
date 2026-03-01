import React from 'react';
import Link from 'next/link';
import { StyleProject } from '@/lib/storage';
import { Palette, Clock, ArrowRight, Trash2 } from 'lucide-react';

interface StyleProjectCardProps {
    project: StyleProject;
    imageCount: number;
    onDelete: (e: React.MouseEvent, projectId: string) => void;
}

export default function StyleProjectCard({ project, imageCount, onDelete }: StyleProjectCardProps) {
    const dateStr = new Date(project.createdAt).toLocaleDateString();

    return (
        <Link href={`/project/${project.id}`}>
            <div className="relative group bg-white/5 backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.07] rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] cursor-pointer h-full flex flex-col justify-between overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/30 transition-colors"></div>

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Palette className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center text-xs text-neutral-500 font-medium bg-neutral-800/50 px-3 py-1 rounded-full">
                                <Clock className="w-3 h-3 mr-1.5" />
                                {dateStr}
                            </div>
                            <button
                                onClick={(e) => onDelete(e, project.id)}
                                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Project"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>

                    {project.description && (
                        <p className="text-neutral-400 text-sm line-clamp-2 mb-4">
                            {project.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10 relative z-10">
                    <div className="text-sm text-neutral-400 font-medium">
                        <strong className="text-indigo-400 font-semibold">{imageCount}</strong> references
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    );
}
