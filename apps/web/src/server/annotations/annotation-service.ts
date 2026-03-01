import { and, eq, inArray, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { writeActivity } from "../audit/activity-log-service";
import { db, nowIso } from "../db/client";
import { annotationTags, annotations, entityTags, tags } from "../db/schema";

export type AnnotationTargetType =
  | "market"
  | "event"
  | "order"
  | "fill"
  | "journal_entry"
  | "analytics_run";

export const listAnnotations = (query: {
  maybeSearch?: string;
  maybeTargetType?: AnnotationTargetType;
  maybeTagIds?: string[];
}) => {
  const whereConditions = [];
  if (query.maybeSearch) {
    whereConditions.push(
      or(
        like(annotations.title, `%${query.maybeSearch}%`),
        like(annotations.contentMarkdown, `%${query.maybeSearch}%`),
      ),
    );
  }
  if (query.maybeTargetType) {
    whereConditions.push(eq(annotations.targetType, query.maybeTargetType));
  }

  let baseRows = db
    .select({
      id: annotations.id,
      targetType: annotations.targetType,
      targetId: annotations.targetId,
      title: annotations.title,
      contentMarkdown: annotations.contentMarkdown,
      createdAt: annotations.createdAt,
      updatedAt: annotations.updatedAt,
    })
    .from(annotations)
    .where(whereConditions.length === 0 ? undefined : and(...whereConditions))
    .all();

  if (!query.maybeTagIds || query.maybeTagIds.length === 0) {
    return baseRows;
  }

  const taggedAnnotationRows = db
    .select({
      annotationId: annotationTags.annotationId,
    })
    .from(annotationTags)
    .where(inArray(annotationTags.tagId, query.maybeTagIds))
    .all();
  const taggedAnnotationIds = new Set(taggedAnnotationRows.map((row) => row.annotationId));

  baseRows = baseRows.filter((row) => taggedAnnotationIds.has(row.id));
  return baseRows;
};

export const createAnnotation = (input: {
  targetType: AnnotationTargetType;
  targetId: string;
  title: string;
  contentMarkdown: string;
}) => {
  const id = nanoid();
  db.insert(annotations)
    .values({
      id,
      targetType: input.targetType,
      targetId: input.targetId,
      title: input.title,
      contentMarkdown: input.contentMarkdown,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .run();
  writeActivity({
    actionType: "annotation.create",
    summary: `Created annotation ${input.title}`,
    maybeMetadata: {
      id,
      targetType: input.targetType,
      targetId: input.targetId,
    },
  });

  return id;
};

export const updateAnnotation = (
  id: string,
  patch: {
    title?: string;
    contentMarkdown?: string;
  },
) => {
  db.update(annotations)
    .set({
      title: patch.title,
      contentMarkdown: patch.contentMarkdown,
      updatedAt: nowIso(),
    })
    .where(eq(annotations.id, id))
    .run();
  writeActivity({
    actionType: "annotation.update",
    summary: `Updated annotation ${id}`,
  });
};

export const deleteAnnotation = (id: string) => {
  db.delete(annotationTags).where(eq(annotationTags.annotationId, id)).run();
  db.delete(annotations).where(eq(annotations.id, id)).run();
  writeActivity({
    actionType: "annotation.delete",
    summary: `Deleted annotation ${id}`,
  });
};

export const createTag = (label: string, maybeColor?: string) => {
  const tagId = nanoid();
  db.insert(tags)
    .values({
      id: tagId,
      label,
      color: maybeColor ?? "#3b82f6",
      createdAt: nowIso(),
    })
    .run();
  writeActivity({
    actionType: "tag.create",
    summary: `Created tag ${label}`,
  });
  return tagId;
};

export const assignTagToAnnotation = (annotationId: string, tagId: string): void => {
  db.insert(annotationTags)
    .values({
      id: nanoid(),
      annotationId,
      tagId,
      createdAt: nowIso(),
    })
    .run();
  writeActivity({
    actionType: "annotation.tag.assign",
    summary: `Assigned tag ${tagId} to annotation ${annotationId}`,
  });
};

export const bulkAssignTagToEntities = (input: {
  entityType: AnnotationTargetType;
  entityIds: string[];
  tagId: string;
}) => {
  if (input.entityIds.length === 0) {
    return;
  }

  db.transaction((transaction) => {
    for (const entityId of input.entityIds) {
      transaction
        .insert(entityTags)
        .values({
          id: nanoid(),
          entityType: input.entityType,
          entityId,
          tagId: input.tagId,
          createdAt: nowIso(),
        })
        .run();
    }
  });
  writeActivity({
    actionType: "entity.tag.bulk_assign",
    summary: `Bulk assigned tag ${input.tagId} to ${input.entityIds.length} ${input.entityType} entities`,
  });
};
