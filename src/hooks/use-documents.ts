import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
  type DocumentRecord,
} from "@/lib/document-service";
import { processDocument } from "@/lib/document-processing-service";
import { documentContentKey } from "@/hooks/use-document-processing";

const documentsKey = (projectId: string) => ["documents", projectId] as const;

export function useDocuments(projectId: string) {
  return useQuery({ queryKey: documentsKey(projectId), queryFn: () => listDocuments(projectId) });
}

export function useUploadDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadDocument(projectId, file),
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: documentsKey(projectId) });
      // Kick off processing automatically — fire-and-forget, doesn't block the
      // upload from resolving. processDocument() never throws (it stores its
      // own failures), this catch is just an extra safety net.
      processDocument(document.id)
        .catch((err) => console.error("[documents] auto-processing failed:", err))
        .finally(() =>
          queryClient.invalidateQueries({ queryKey: documentContentKey(document.id) }),
        );
    },
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
