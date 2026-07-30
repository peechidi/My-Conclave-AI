import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  renameProject,
} from "@/lib/project-service";

const projectsKey = ["projects"] as const;
const projectKey = (id: string) => ["projects", id] as const;

export function useProjects() {
  return useQuery({ queryKey: projectsKey, queryFn: listProjects });
}

export function useProject(id: string) {
  return useQuery({ queryKey: projectKey(id), queryFn: () => getProject(id) });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createProject(title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsKey }),
  });
}

export function useRenameProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameProject(id, title),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectsKey });
      queryClient.invalidateQueries({ queryKey: projectKey(project.id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsKey }),
  });
}
