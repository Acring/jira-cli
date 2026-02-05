const commentsMixin = {
  async getComments(issueKey) {
    const response = await this.requestApi('get', `/issue/${issueKey}/comment`);
    return response.data;
  },

  async addComment(issueKey, body, options = {}) {
    const commentData = { body };

    if (options.internal) {
      commentData.visibility = {
        type: 'role',
        value: 'Administrators'
      };
    }

    const response = await this.requestApi('post', `/issue/${issueKey}/comment`, commentData);
    return response.data;
  },

  async updateComment(commentId, body) {
    const commentData = { body };
    const response = await this.requestApi('put', `/comment/${commentId}`, commentData);
    return response.data;
  },

  async deleteComment(commentId) {
    await this.requestApi('delete', `/comment/${commentId}`);
    return true;
  }
};

module.exports = { commentsMixin };
