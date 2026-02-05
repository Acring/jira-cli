const issuesMixin = {
  async getIssue(issueKey) {
    const response = await this.requestApi('get', `/issue/${issueKey}`);
    return response.data;
  },

  async searchIssues(jql, options = {}) {
    const params = {
      jql,
      startAt: options.startAt || 0,
      maxResults: options.maxResults || 50,
      fields: options.fields || ['summary', 'status', 'assignee', 'created', 'updated']
    };

    const { response } = await this.requestSearch({ params });
    return response.data;
  },

  async createIssue(issueData) {
    const response = await this.requestApi('post', '/issue', issueData);
    return response.data;
  },

  async updateIssue(issueKey, updateData) {
    const response = await this.requestApi('put', `/issue/${issueKey}`, updateData);
    return response.data;
  },

  async deleteIssue(issueKey) {
    await this.requestApi('delete', `/issue/${issueKey}`);
    return true;
  }
};

module.exports = { issuesMixin };
