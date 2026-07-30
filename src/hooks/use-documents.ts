import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
  type DocumentRecord,
} from "@/lib/document-service";

const documentsKey = (projectId: string) => ["documents", projectId] as const;

export function useDocuments(projectId: string) {
  return useQuery({ queryKey: documentsKey(projectId), queryFn: () => listDocuments(projectId) });
}

export function useUploadDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadDocument(projectId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKey(projectId) }),
  });
}

export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: documentsKey(projectId) });
      const previous = queryClient.getQueryData<DocumentRecord[]>(documentsKey(projectId));
      queryClient.setQueryData<DocumentRecord[]>(documentsKey(projectId), (old) =>
        old?.filter((d) => d.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(documentsKey(projectId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentsKey(projectId) });
    },
  });
}
