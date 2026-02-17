/**
 * Type-safe API 클라이언트
 *
 * Next.js API 라우트(/api/*)에 대한 요청을 처리합니다.
 * Server Actions가 주 통신 수단이지만, 파일 업로드 등
 * REST가 필요한 경우에 사용합니다.
 *
 * @example
 *   const data = await api.get<Estimate>("/api/estimates/123");
 *   const result = await api.post<Estimate>("/api/estimates", { body: formData });
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  params?: Record<string, string | number | boolean | undefined>;
}

interface RequestWithBodyOptions extends RequestOptions {
  body?: unknown;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  options: RequestWithBodyOptions = {}
): Promise<T> {
  const { body, params, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  let processedBody: BodyInit | undefined;

  if (body instanceof FormData) {
    // FormData: Content-Type은 브라우저가 자동 설정 (boundary 포함)
    processedBody = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    processedBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: processedBody,
    ...rest,
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    throw new ApiError(response.status, response.statusText, data);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("GET", path, options);
  },
  post<T>(path: string, options?: RequestWithBodyOptions): Promise<T> {
    return request<T>("POST", path, options);
  },
  put<T>(path: string, options?: RequestWithBodyOptions): Promise<T> {
    return request<T>("PUT", path, options);
  },
  patch<T>(path: string, options?: RequestWithBodyOptions): Promise<T> {
    return request<T>("PATCH", path, options);
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, options);
  },
};
