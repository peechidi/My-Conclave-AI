import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProcessedDocument, processDocument } from "@/lib/document-processing-service";

export const documentContentKey = (documentId: string) =>
  ["document-contents", documentId] as const;

export function useProcessedDocument(documentId: string) {
  return useQuery({
    queryKey: documentContentKey(documentId),
    queryFn: () => getProcessedDocument(documentId),
  });
}

export function useProcessDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => processDocument(documentId),
    onSettled: (_data, _error, documentId) => {
      queryClient.invalidateQueries({ queryKey: documentContentKey(documentId) });
    },
  });
}
