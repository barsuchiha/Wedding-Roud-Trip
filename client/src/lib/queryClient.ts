import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  field?: string;

  constructor(status: number, message: string, options?: { code?: string; field?: string }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = options?.code;
    this.field = options?.field;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text || res.statusText;
    let code: string | undefined;
    let field: string | undefined;

    try {
      const payload = JSON.parse(text) as {
        message?: string;
        code?: string;
        field?: string;
      };
      message = payload.message || message;
      code = payload.code;
      field = payload.field;
    } catch {
      // Keep the raw response text when the server didn't return JSON.
    }

    throw new ApiRequestError(res.status, message, { code, field });
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
