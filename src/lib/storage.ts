import { get, set, del } from 'idb-keyval';

export interface StyleProject {
  id: string;
  name: string;
  description?: string;
  styleDescriptor?: string;
  trainingInstruction?: string;
  createdAt: number;
}

export interface StyleImage {
  id: string;
  projectId: string;
  imageData: string; // Base64 data URI
  createdAt: number;
}

export interface RenderJob {
  id: string;
  projectId: string;
  referenceImage?: string; // Base64 data URI (optional for T2I)
  userInstruction?: string;
  outputImage: string; // Base64 data URI
  createdAt: number;
}

export const getProjects = async (): Promise<StyleProject[]> => {
  if (typeof window === 'undefined') return [];
  const data = await get('ai_studio_projects');
  return data || [];
};

export const createProject = async (project: Omit<StyleProject, 'id' | 'createdAt'>): Promise<StyleProject> => {
  const newProject: StyleProject = {
    ...project,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const projects = await getProjects();
  await set('ai_studio_projects', [newProject, ...projects]);
  return newProject;
};

export const getProject = async (id: string): Promise<StyleProject | undefined> => {
  const projects = await getProjects();
  return projects.find(p => p.id === id);
};

export const getStyleImages = async (projectId: string): Promise<StyleImage[]> => {
  if (typeof window === 'undefined') return [];
  const data = await get(`ai_studio_images_${projectId}`);
  return data || [];
};

export const saveStyleImages = async (projectId: string, images: string[]): Promise<StyleImage[]> => {
  const existing = await getStyleImages(projectId);
  const newImages = images.map(imageData => ({
    id: crypto.randomUUID(),
    projectId,
    imageData,
    createdAt: Date.now(),
  }));
  const updated = [...existing, ...newImages];
  await set(`ai_studio_images_${projectId}`, updated);
  return updated;
};

export const getRenderJobs = async (projectId: string): Promise<RenderJob[]> => {
  if (typeof window === 'undefined') return [];
  const data = await get(`ai_studio_renders_${projectId}`);
  return data || [];
};

export const saveRenderJob = async (job: Omit<RenderJob, 'id' | 'createdAt'>): Promise<RenderJob> => {
  const newJob: RenderJob = {
    ...job,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const jobs = await getRenderJobs(job.projectId);
  await set(`ai_studio_renders_${job.projectId}`, [newJob, ...jobs]);
  return newJob;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const projects = await getProjects();
  const updated = projects.filter(p => p.id !== projectId);
  await set('ai_studio_projects', updated);
  await del(`ai_studio_images_${projectId}`);
  await del(`ai_studio_renders_${projectId}`);
};

export const deleteRenderJob = async (projectId: string, jobId: string): Promise<void> => {
  const jobs = await getRenderJobs(projectId);
  const updated = jobs.filter(j => j.id !== jobId);
  await set(`ai_studio_renders_${projectId}`, updated);
};
