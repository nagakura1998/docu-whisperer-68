import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  createProject: (name: string, description?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProjects(data || []);
      
      // Set first project as current if none selected
      if (data && data.length > 0 && !currentProject) {
        setCurrentProject(data[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, description?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev]);
      setCurrentProject(data);
      toast.success('Project created successfully');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      
      if (currentProject?.id === id) {
        const remainingProjects = projects.filter(p => p.id !== id);
        setCurrentProject(remainingProjects.length > 0 ? remainingProjects[0] : null);
      }
      
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        createProject,
        deleteProject,
        loading
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};