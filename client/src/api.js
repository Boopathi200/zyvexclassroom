const raw = import.meta.env.VITE_API_URL;
export const API_BASE = raw === undefined || raw === '' ? '' : raw.replace(/\/$/, '');

export function authHeaders() {
  const token = localStorage.getItem('zyvex_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function setToken(token) {
  if (token) localStorage.setItem('zyvex_token', token);
  else localStorage.removeItem('zyvex_token');
}

export function getToken() {
  return localStorage.getItem('zyvex_token');
}

export async function apiForm(path, formData, method = 'POST') {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${path}`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.message || xhr.statusText || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}
