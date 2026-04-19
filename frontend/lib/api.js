const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('atlas_token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('atlas_token');
        localStorage.removeItem('atlas_role');
        window.location.href = '/login';
    }
  }
  
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
    headers: { ...getAuthHeaders() },
    body: formData,
  });
  return handleResponse(response);
}

export async function getDocuments() {
  const response = await fetch(`${BASE_URL}/documents`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(response);
}

export async function deleteDocument(id) {
  const response = await fetch(`${BASE_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(response);
}

export async function getConversations() {
  const response = await fetch(`${BASE_URL}/conversations`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(response);
}

export async function getConversationMessages(conversationId) {
  const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(response);
}

export async function sendMessageStream(message, subject = "all", conversationId = null, onChunk, onConversationCreated) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    },
    body: JSON.stringify({ message, subject, conversation_id: conversationId }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Chat failed');
  }

  // Check for new conversation ID in headers
  const newConvId = response.headers.get('X-Conversation-ID');
  if (newConvId && newConvId !== conversationId && onConversationCreated) {
    onConversationCreated(newConvId);
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
