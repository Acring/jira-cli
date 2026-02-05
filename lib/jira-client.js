const { normalizeApiVersionMode, createApiClient, createAgileClient, baseMixin } = require('./jira-client/base');
const { issuesMixin } = require('./jira-client/issues');
const { projectsMixin } = require('./jira-client/projects');
const { commentsMixin } = require('./jira-client/comments');
const { sprintsMixin } = require('./jira-client/sprints');
const { metadataMixin } = require('./jira-client/metadata');
const { attachmentsMixin } = require('./jira-client/attachments');

class JiraClient {
  constructor(config) {
    this.config = config;
    this.baseURL = config.server;
    this.apiVersionMode = normalizeApiVersionMode(config.apiVersion || process.env.JIRA_API_VERSION);
    this.apiVersion = this.apiVersionMode === 'auto' ? 3 : this.apiVersionMode;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    let auth = null;

    if (!config.username || config.username === '') {
      headers['Authorization'] = `Bearer ${config.token}`;
    } else {
      auth = {
        username: config.username,
        password: config.token
      };
    }

    this.clientV2 = createApiClient(this.baseURL, 2, { auth, headers });
    this.clientV3 = createApiClient(this.baseURL, 3, { auth, headers });
    this.agileClient = createAgileClient(this.baseURL, { auth, headers });
  }
}

// Apply mixins
Object.assign(
  JiraClient.prototype,
  baseMixin,
  issuesMixin,
  projectsMixin,
  commentsMixin,
  sprintsMixin,
  metadataMixin,
  attachmentsMixin
);

module.exports = JiraClient;
