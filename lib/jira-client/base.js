const axios = require('axios');
const { AXIOS_CONFIG_KEYS } = require('./constants');

function normalizeApiVersionMode(apiVersion) {
  if (!apiVersion) return 'auto';
  if (apiVersion === 'auto') return 'auto';
  if (apiVersion === 2 || apiVersion === '2') return 2;
  if (apiVersion === 3 || apiVersion === '3') return 3;
  return 'auto';
}

function formatJiraErrorMessage(status, data) {
  if (status === 401) return 'Authentication failed. Please check your credentials.';
  if (status === 403) return 'Access denied. You don\'t have permission to perform this action.';
  if (status === 404) return 'Resource not found.';
  return data?.errorMessages ? data.errorMessages.join(', ') : 'API request failed';
}

function toJiraError(error) {
  if (error.response) {
    const { status, data } = error.response;
    const jiraError = new Error(formatJiraErrorMessage(status, data));
    jiraError.status = status;
    jiraError.data = data;
    jiraError.method = error.config?.method;
    jiraError.url = error.config?.url;
    return jiraError;
  }

  if (error.request) {
    const jiraError = new Error('Network error. Please check your connection and server URL.');
    jiraError.request = error.request;
    return jiraError;
  }

  return error instanceof Error ? error : new Error(String(error));
}

function createApiClient(baseURL, version, { auth, headers }) {
  const client = axios.create({
    baseURL: `${baseURL}/rest/api/${version}`,
    auth,
    headers
  });
  client.interceptors.response.use(
    response => response,
    error => Promise.reject(toJiraError(error))
  );
  return client;
}

function createAgileClient(baseURL, { auth, headers }) {
  const client = axios.create({
    baseURL: `${baseURL}/rest/agile/1.0`,
    auth,
    headers
  });
  client.interceptors.response.use(
    response => response,
    error => Promise.reject(toJiraError(error))
  );
  return client;
}

function shouldFallbackApiVersion(error) {
  if (!error || typeof error !== 'object') return false;
  if (error.status === 404 || error.status === 410) return true;
  if (typeof error.message === 'string' && error.message.includes('requested API has been removed')) return true;
  if (typeof error.message === 'string' && error.message.includes('Please migrate to')) return true;
  if (typeof error.message === 'string' && error.message.includes('/rest/api/')) return true;
  return false;
}

function normalizeAxiosArgs(method, dataOrConfig) {
  const lowerMethod = method.toLowerCase();
  const expectsBody = ['post', 'put', 'patch'].includes(lowerMethod);

  if (!expectsBody) {
    return dataOrConfig && typeof dataOrConfig === 'object' ? dataOrConfig : {};
  }

  const hasConfigShape =
    dataOrConfig &&
    typeof dataOrConfig === 'object' &&
    !Array.isArray(dataOrConfig) &&
    Object.keys(dataOrConfig).some(key => AXIOS_CONFIG_KEYS.has(key));

  if (hasConfigShape) return dataOrConfig;
  return { data: dataOrConfig };
}

const baseMixin = {
  getApiClient(version) {
    return version === 2 ? this.clientV2 : this.clientV3;
  },

  async requestApi(method, url, dataOrConfig) {
    const axiosConfig = normalizeAxiosArgs(method, dataOrConfig);
    const preferred = this.apiVersion;

    try {
      return await this.getApiClient(preferred).request({ method, url, ...axiosConfig });
    } catch (error) {
      if (this.apiVersionMode !== 'auto' || !shouldFallbackApiVersion(error)) throw error;

      const fallbackVersion = preferred === 3 ? 2 : 3;
      const response = await this.getApiClient(fallbackVersion).request({ method, url, ...axiosConfig });
      this.apiVersion = fallbackVersion;
      return response;
    }
  },

  async requestSearch({ params }) {
    const preferred = this.apiVersion;
    const urlByVersion = version => (version === 3 ? '/search/jql' : '/search');

    try {
      const response = await this.getApiClient(preferred).get(urlByVersion(preferred), { params });
      return { apiVersion: preferred, response };
    } catch (error) {
      if (this.apiVersionMode !== 'auto' || !shouldFallbackApiVersion(error)) throw error;

      const fallbackVersion = preferred === 3 ? 2 : 3;
      const response = await this.getApiClient(fallbackVersion).get(urlByVersion(fallbackVersion), { params });
      this.apiVersion = fallbackVersion;
      return { apiVersion: fallbackVersion, response };
    }
  },

  async testConnection() {
    try {
      const response = await this.requestApi('get', '/myself');
      return { success: true, user: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  normalizeApiVersionMode,
  createApiClient,
  createAgileClient,
  shouldFallbackApiVersion,
  baseMixin
};
