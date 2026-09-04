const API = "http://localhost:8000/api/dashboard";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...authHeaders(),
    ...(options.headers || {}),
  };

  if (!isFormData && options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Something went wrong. Please try again.");
  }

  return data;
}

export const getDashboard = () => request("/me");

export const connectGithub = (username) =>
  request("/github/connect", {
    method: "POST",
    body: JSON.stringify({ username }),
  });

export const refreshGithub = () =>
  request("/github/refresh", { method: "POST" });

export const disconnectGithub = () =>
  request("/github", { method: "DELETE" });

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return request("/resume", {
    method: "POST",
    body: formData,
  });
};

export const generateRoast = () =>
  request("/roast", { method: "POST" });

export const clearNotifications = () =>
  request("/notifications/clear", { method: "POST" });
