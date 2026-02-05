const sprintsMixin = {
  async getSprints(boardId) {
    const response = await this.agileClient.get(`/board/${boardId}/sprint`);
    return response.data;
  },

  async getBoards() {
    const response = await this.agileClient.get('/board');
    return response.data;
  }
};

module.exports = { sprintsMixin };
