import { useQuery } from "@tanstack/react-query";
import { fetchPublicSummary } from "../api/publicApi";


export default function usePublicSummary() {
  return useQuery({ queryKey: ["public-summary"], queryFn: fetchPublicSummary });
}
