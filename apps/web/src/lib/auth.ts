export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("convertix-auth-token");
}

export function applyAuthHeader(xhr: XMLHttpRequest) {
  const token = getAuthToken();
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }
}
