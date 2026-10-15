import { useMemo } from "react";
import { subjects as subjectEntity, topics as topicEntity } from "../data/entities";
import { recordId } from "../../lib/blocks/data";

export function useSubjectOptions() {
  const query = subjectEntity.useList();
  return useMemo(
    () => (query.data ?? []).map((subject) => ({ id: recordId(subject), name: subject.name ?? "Subject" })),
    [query.data]
  );
}

export function useTopicOptions() {
  const query = topicEntity.useList();
  return useMemo(
    () => (query.data ?? []).map((topic) => ({ id: recordId(topic), name: topic.name ?? "Topic", subjectId: topic.subjectId })),
    [query.data]
  );
}
