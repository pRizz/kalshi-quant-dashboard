import {
  assignTagToAnnotation,
  createAnnotation,
  createTag,
  deleteAnnotation,
  listAnnotations,
  updateAnnotation,
} from "~/server/annotations/annotation-service";
import { jsonResponse } from "~/server/http/json-response";

export const GET = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const maybeTagId = url.searchParams.get("tagId") ?? undefined;
  const rows = listAnnotations({
    maybeSearch: url.searchParams.get("search") ?? undefined,
    maybeTargetType:
      (url.searchParams.get("targetType") as
        | "market"
        | "event"
        | "order"
        | "fill"
        | "journal_entry"
        | "analytics_run"
        | null) ?? undefined,
    maybeTagIds: maybeTagId ? [maybeTagId] : undefined,
  });

  return jsonResponse({
    annotations: rows,
  });
};

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as
    | {
        kind: "create_annotation";
        targetType: "market" | "event" | "order" | "fill" | "journal_entry" | "analytics_run";
        targetId: string;
        title: string;
        contentMarkdown: string;
      }
    | {
        kind: "create_tag";
        label: string;
        maybeColor?: string;
      }
    | {
        kind: "assign_tag_to_annotation";
        annotationId: string;
        tagId: string;
      };

  if (payload.kind === "create_annotation") {
    const annotationId = createAnnotation(payload);
    return jsonResponse({ ok: true, annotationId });
  }

  if (payload.kind === "create_tag") {
    const tagId = createTag(payload.label, payload.maybeColor);
    return jsonResponse({ ok: true, tagId });
  }

  assignTagToAnnotation(payload.annotationId, payload.tagId);
  return jsonResponse({ ok: true });
};

export const PATCH = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    id: string;
    title?: string;
    contentMarkdown?: string;
  };
  updateAnnotation(payload.id, payload);
  return jsonResponse({
    ok: true,
  });
};

export const DELETE = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const annotationId = url.searchParams.get("id");
  if (!annotationId) {
    return jsonResponse(
      {
        ok: false,
        message: "Missing annotation id.",
      },
      { status: 400 },
    );
  }

  deleteAnnotation(annotationId);
  return jsonResponse({ ok: true });
};
