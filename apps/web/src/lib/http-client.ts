export const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`GET ${path} failed.`);
  }

  return (await response.json()) as T;
};

export const postJson = async <TResponse>(path: string, body?: unknown): Promise<TResponse> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return (await response.json()) as TResponse;
};

export const patchJson = async <TResponse>(path: string, body?: unknown): Promise<TResponse> => {
  const response = await fetch(path, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (await response.json()) as TResponse;
};

export const deleteJson = async <TResponse>(path: string): Promise<TResponse> => {
  const response = await fetch(path, {
    method: "DELETE",
  });
  return (await response.json()) as TResponse;
};
