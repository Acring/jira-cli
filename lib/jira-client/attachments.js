const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const attachmentsMixin = {
  async getAttachment(attachmentId) {
    const response = await this.requestApi('get', `/attachment/${attachmentId}`);
    return response.data;
  },

  async downloadAttachment(attachment, outputDir, options = {}) {
    const outputPath = path.join(outputDir, attachment.filename);

    if (!options.overwrite && fs.existsSync(outputPath)) {
      throw new Error(`File already exists: ${outputPath}. Use --overwrite to replace.`);
    }

    const response = await this.clientV2.get(attachment.content, {
      responseType: 'arraybuffer',
      baseURL: ''
    });

    fs.writeFileSync(outputPath, response.data);
    return outputPath;
  },

  async uploadAttachment(issueKey, filePath) {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(absolutePath));

    const response = await this.clientV2.post(
      `/issue/${issueKey}/attachments`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'X-Atlassian-Token': 'no-check'
        }
      }
    );

    return response.data;
  },

  async deleteAttachment(attachmentId) {
    await this.requestApi('delete', `/attachment/${attachmentId}`);
    return true;
  }
};

module.exports = { attachmentsMixin };
