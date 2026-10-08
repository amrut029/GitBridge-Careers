const API = "http://localhost:8000/api/dashboard";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}`, "X-Auth-Token": token } : {};
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
    throw new Error(
      data.detail || data.message || "Something went wrong. Please try again."
    );
  }

  return data;
}

export const getDashboard = () => request("/me");

export const updateProfile = (profileData) =>
  request("/profile", {
    method: "POST",
    body: JSON.stringify(profileData),
  });

export const submitHelpQuery = (query, email = "") =>
  request("/help", {
    method: "POST",
    body: JSON.stringify({ query, email }),
  });

export const getOpportunities = () => request("/opportunities");

export const syncLiveOpportunities = () =>
  request("/opportunities/sync-live", {
    method: "POST",
  });

export const applyOpportunity = (oppId, applyType = "external") =>
  request("/applications", {
    method: "POST",
    body: JSON.stringify({
      opportunity_id: oppId,
      application_type: applyType,
    }),
  });

export const getApplications = () => request("/applications");

export const confirmExternalApplication = (applicationId) =>
  request(`/applications/${applicationId}/confirm`, {
    method: "PATCH",
  });

export const toggleOpportunityBookmark = (oppId) =>
  request(`/bookmarks/${oppId}`, {
    method: "POST",
  });

export const getBookmarks = () => request("/bookmarks");

export const connectGithub = (username, token = "") =>
  request("/github/connect", {
    method: "POST",
    body: JSON.stringify({ username, token }),
  });

export const getGithubOAuthUrl = () => request("/github/connect-url");

export const refreshGithub = () =>
  request("/github/refresh", {
    method: "POST",
  });

export const disconnectGithub = () =>
  request("/github", {
    method: "DELETE",
  });

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return request("/resume", {
    method: "POST",
    body: formData,
  });
};

export const deleteResume = () =>
  request("/resume", {
    method: "DELETE",
  });

export const generateRoast = () =>
  request("/roast", {
    method: "POST",
  });

export const clearNotifications = () =>
<<<<<<< HEAD
  request("/notifications/clear", {
    method: "POST",
  });

export const submitPublicInquiry = (payload) =>
  request("/help/inquiry", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getAdminInquiries = () =>
  request("/admin/inquiries");

export const updateInquiryStatus = (ticketId, status) =>
  request(`/admin/inquiries/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
=======
  request("/notifications/clear", { method: "POST" });

export const submitPublicInquiry = (inquiryData) =>
  request("/inquiry", {
    method: "POST",
    body: JSON.stringify(inquiryData),
>>>>>>> 7b799a42fa909d4709a4cb80793c7454fbf9bd47
  });