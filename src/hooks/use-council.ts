import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCouncil, startCouncil } from "@/lib/council-service";

const councilKey = (documentId: string) => ["council", documentId] as const;

export function useCouncil(documentId: string | null) {
  return useQuery({
    queryKey: councilKey(documentId ?? ""),
    queryFn: () => getCouncil(documentId as string),
    enabled: documentId !== null,
  });
}

export function useStartCouncil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      startCouncil(documentId, () => {
        // Invalidate after every agent completes, not just at the end, so the
        // timeline updates one agent at a time instead of all-at-once.
        queryClient.invalidateQueries({ queryKey: councilKey(documentId) });
      }),
    onSettled: (_data, _error, documentId) => {
      queryClient.invalidateQueries({ queryKey: councilKey(documentId) });
    },
  });
}
