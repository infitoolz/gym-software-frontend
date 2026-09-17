import api from "../utils/api";

function unwrap(response) {
  return response?.data?.data ?? null;
}

export async function uploadLeadDocument(leadId, file) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await api.post(`/leads/${leadId}/documents`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return unwrap(response);
}

export async function getLeadDocuments(leadId) {
  const response = await api.get(`/leads/${leadId}/documents`);
  return unwrap(response);
}

export function getDocumentDownloadUrl(documentId) {
  // Return the direct URL to the backend download endpoint
  return `${api.defaults.baseURL}/leads/documents/${documentId}/download`;
}
