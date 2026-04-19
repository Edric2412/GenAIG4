const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Something went wrong');
  }
  return data;
}

export async function loginUser(email, password) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

export async function uploadFile(file, subject = "General") {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject_name', subject);
  
  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function getDocuments() {
  const response = await fetch(`${BASE_URL}/documents`);
  return handleResponse(response);
}

export async function deleteDocument(id) {
  const response = await fetch(`${BASE_URL}/documents/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function sendMessageStream(message, subject = "all", onChunk) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, subject }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Chat failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onChunk(fullText);
  }
}
