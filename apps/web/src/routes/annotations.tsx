import { For, createResource, createSignal, onMount } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { deleteJson, postJson } from "~/lib/http-client";

export default function AllAnnotationsPage() {
  const [search, setSearch] = createSignal("");
  const [targetType, setTargetType] = createSignal<
    "market" | "event" | "order" | "fill" | "journal_entry" | "analytics_run"
  >("market");
  const [targetId, setTargetId] = createSignal("");
  const [title, setTitle] = createSignal("");
  const [content, setContent] = createSignal("");
  const [tagLabel, setTagLabel] = createSignal("");
  const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
  const [bulkTagId, setBulkTagId] = createSignal("");
  const [isClientReady, setIsClientReady] = createSignal(false);
  onMount(() => {
    setIsClientReady(true);
  });

  const [annotations, { refetch }] = createResource(
    () => ({
      ready: isClientReady(),
      query: search(),
    }),
    async (source) => {
      if (!source.ready) {
        return undefined;
      }

      const response = await fetch(`/api/annotations?search=${encodeURIComponent(source.query)}`);
      return (await response.json()) as {
        annotations: Array<{
          id: string;
          targetType: string;
          targetId: string;
          title: string;
          contentMarkdown: string;
          updatedAt: string;
        }>;
      };
    },
  );

  const create = async () => {
    await postJson("/api/annotations", {
      kind: "create_annotation",
      targetType: targetType(),
      targetId: targetId(),
      title: title(),
      contentMarkdown: content(),
    });
    setTitle("");
    setContent("");
    await refetch();
  };

  const createTag = async () => {
    await postJson("/api/annotations", {
      kind: "create_tag",
      label: tagLabel(),
    });
    setTagLabel("");
  };

  const remove = async (annotationId: string) => {
    await deleteJson(`/api/annotations?id=${annotationId}`);
    await refetch();
  };

  const applyBulkTag = async () => {
    if (bulkTagId().trim().length === 0) {
      return;
    }

    for (const annotationId of selectedIds()) {
      await postJson("/api/annotations", {
        kind: "assign_tag_to_annotation",
        annotationId,
        tagId: bulkTagId(),
      });
    }
  };

  return (
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>All Annotations</CardTitle>
          <CardDescription>
            Centralized local notes/tags/links/custom fields workspace with fast filtering and bulk
            tag operations.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <Input
            value={search()}
            placeholder="Search annotations..."
            onInput={(event) => {
              setSearch(event.currentTarget.value);
            }}
          />
          <div class="grid gap-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <Input
              value={bulkTagId()}
              placeholder="Bulk Tag ID"
              onInput={(event) => {
                setBulkTagId(event.currentTarget.value);
              }}
            />
            <Input
              value={tagLabel()}
              placeholder="Create tag label"
              onInput={(event) => {
                setTagLabel(event.currentTarget.value);
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                void createTag();
              }}
            >
              Create tag
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void applyBulkTag();
              }}
            >
              Bulk tag selected
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New annotation</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="grid gap-2 lg:grid-cols-2">
            <label class="text-xs text-zinc-300">
              Target type
              <select
                class="mt-1 h-9 w-full rounded border border-zinc-800 bg-zinc-900 px-2"
                value={targetType()}
                onChange={(event) => {
                  setTargetType(
                    event.currentTarget.value as
                      | "market"
                      | "event"
                      | "order"
                      | "fill"
                      | "journal_entry"
                      | "analytics_run",
                  );
                }}
              >
                <option value="market">Market</option>
                <option value="event">Event</option>
                <option value="order">Order</option>
                <option value="fill">Fill</option>
                <option value="journal_entry">Journal Entry</option>
                <option value="analytics_run">Analytics Run</option>
              </select>
            </label>
            <div class="text-xs text-zinc-300">
              <p class="mb-1">Target id</p>
              <Input
                value={targetId()}
                onInput={(event) => {
                  setTargetId(event.currentTarget.value);
                }}
              />
            </div>
          </div>
          <Input
            value={title()}
            placeholder="Annotation title"
            onInput={(event) => {
              setTitle(event.currentTarget.value);
            }}
          />
          <Textarea
            value={content()}
            placeholder="Annotation body markdown..."
            onInput={(event) => {
              setContent(event.currentTarget.value);
            }}
          />
          <Button
            variant="primary"
            onClick={() => {
              void create();
            }}
          >
            Add annotation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Annotation list</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <For each={annotations()?.annotations ?? []}>
            {(annotation) => (
              <div class="rounded border border-zinc-800 bg-zinc-900 p-3">
                <div class="flex items-start justify-between gap-2">
                  <label class="flex items-center gap-2 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={selectedIds().includes(annotation.id)}
                      onChange={(event) => {
                        if (event.currentTarget.checked) {
                          setSelectedIds([...selectedIds(), annotation.id]);
                          return;
                        }

                        setSelectedIds(selectedIds().filter((id) => id !== annotation.id));
                      }}
                    />
                    Select
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void remove(annotation.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
                <p class="text-xs text-zinc-500">
                  {annotation.targetType} / {annotation.targetId}
                </p>
                <p class="text-sm font-medium text-zinc-100">{annotation.title}</p>
                <p class="mt-1 whitespace-pre-wrap text-sm text-zinc-300">
                  {annotation.contentMarkdown}
                </p>
              </div>
            )}
          </For>
        </CardContent>
      </Card>
    </div>
  );
}
