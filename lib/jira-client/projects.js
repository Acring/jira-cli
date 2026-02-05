const projectsMixin = {
  async getProjects() {
    const response = await this.requestApi('get', '/project');
    return response.data;
  },

  async getProject(projectKey) {
    const response = await this.requestApi('get', `/project/${projectKey}`);
    return response.data;
  }
};

module.exports = { projectsMixin };
