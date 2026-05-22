const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'split-smart-backend-production.up.railway.app/api';

/**
 * Custom fetch wrapper that automatically appends auth tokens and edge-case simulation headers.
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set up standard headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject Bearer Token if available in localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // --- EDGE CASE SIMULATIONS ---
    // Read simulation states from localStorage and inject custom headers
    const simDelay = localStorage.getItem('sim_delay');
    const simFailure = localStorage.getItem('sim_failure');
    const simEmpty = localStorage.getItem('sim_empty');

    if (simDelay && Number(simDelay) > 0) {
      headers['x-simulate-delay'] = simDelay;
    }
    if (simFailure === 'true') {
      headers['x-simulate-failure'] = 'true';
    }
    if (simEmpty === 'true') {
      headers['x-simulate-empty'] = 'true';
    }
    // -----------------------------
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || 'Something went wrong';
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API Client Error] ${endpoint}: ${error.message}`);
    throw error;
  }
};

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
