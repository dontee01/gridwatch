export function unwrapData<T>(response: any): T {
  return response?.data ?? response;
}
