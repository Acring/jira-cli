const { shouldFallbackApiVersion } = require('./base');

const metadataMixin = {
  async getIssueTypes() {
    const response = await this.requestApi('get', '/issuetype');
    return response.data;
  },

  async getStatuses() {
    const response = await this.requestApi('get', '/status');
    return response.data;
  },

  async getFields() {
    const response = await this.requestApi('get', '/field');
    return response.data;
  },

  async searchUsers(query) {
    const preferred = this.apiVersion;
    const paramsByVersion = version => (version === 3 ? { query } : { username: query });

    try {
      const response = await this.getApiClient(preferred).get('/user/search', { params: paramsByVersion(preferred) });
      return response.data;
    } catch (error) {
      if (this.apiVersionMode !== 'auto' || !shouldFallbackApiVersion(error)) throw error;

      const fallbackVersion = preferred === 3 ? 2 : 3;
      const response = await this.getApiClient(fallbackVersion).get('/user/search', { params: paramsByVersion(fallbackVersion) });
      this.apiVersion = fallbackVersion;
      return response.data;
    }
  }
};

module.exports = { metadataMixin };
