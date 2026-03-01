export const jsonResponse = (payload: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json",
    },
    ...init,
  });
