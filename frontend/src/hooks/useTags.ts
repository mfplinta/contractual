import { useCallback } from "react";
import type { TagRead } from "@/services/generatedApi";
import {
  useTagsListQuery,
  useTagsCreateMutation,
} from "@/services/api";

export const useTags = () => {
  const { data: allTags = [] } = useTagsListQuery();

  const [addTagMutation] = useTagsCreateMutation();

  const addTag = useCallback(
    async (name: string) => {
      const existing = allTags.find(
        (t: TagRead) => t.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) return existing;
      return addTagMutation({ tag: { name } }).unwrap();
    },
    [allTags, addTagMutation],
  );

  return { allTags, addTag };
};
