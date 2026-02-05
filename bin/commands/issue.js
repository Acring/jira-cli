const { Command } = require('commander');
const {
  createIssuesTable,
  displayIssueDetails,
  formatIssueAsMarkdown,
  buildJQL,
  createCommentsTable
} = require('../../lib/utils');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

function createIssueCommand(factory) {
  const command = new Command('issue')
    .description('Manage JIRA issues')
    .alias('i');

  // Add subcommands
  command
    .command('list')
    .description('list issues with advanced filtering\n\n' +
      'Examples:\n' +
      '  $ jira issue list                              # List recent issues\n' +
      '  $ jira issue list --assignee=currentUser      # Your assigned issues\n' +
      '  $ jira issue list --status=Open --limit=50    # Open issues (max 50)\n' +
      '  $ jira issue list --project=TEST --type=Bug   # Bugs in TEST project')
    .alias('ls')
    .option('--project <project>', 'filter by project key')
    .option('--assignee <assignee>', 'filter by assignee (use "currentUser" for yourself)')
    .option('--status <status>', 'filter by status (e.g., Open, In Progress)')
    .option('--type <type>', 'filter by issue type (e.g., Bug, Story)')
    .option('--reporter <reporter>', 'filter by reporter')
    .option('--priority <priority>', 'filter by priority (e.g., High, Medium)')
    .option('--created <date>', 'created date filter (e.g., -7d, 2023-01-01)')
    .option('--updated <date>', 'updated date filter')
    .option('--limit <limit>', 'limit number of results (default: 20)', '20')
    .option('--jql <query>', 'custom JQL query for advanced filtering')
    .action(async (options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();

      try {
        await listIssues(client, io, options);
      } catch (err) {
        io.error(`Failed to list issues: ${err.message}`);
        process.exit(1);
      }
    });

  command
    .command('view <key>')
    .description('view issue details\n\n' +
      'Examples:\n' +
      '  $ jira issue view PROJ-123                           # View in terminal\n' +
      '  $ jira issue view PROJ-123 --format markdown         # View as markdown\n' +
      '  $ jira issue view PROJ-123 --output ./issue.md       # Save to file\n' +
      '  $ jira issue view PROJ-123 --format markdown --output ./issue.md')
    .alias('show')
    .option('--format <format>', 'output format (terminal, markdown)', 'terminal')
    .option('--output <path>', 'save to file instead of displaying')
    .action(async (key, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();

      try {
        await getIssue(client, io, key, options);
      } catch (err) {
        io.error(`Failed to get issue: ${err.message}`);
        process.exit(1);
      }
    });

  command
    .command('create')
    .description('create a new issue\n\n' +
      'Examples:\n' +
      '  $ jira issue create --project=TEST --type=Bug --summary="Login fails"\n' +
      '  $ jira issue create --project=TEST --type=Bug \\\n' +
      '                      --summary="Login fails on Safari"\n' +
      '  $ jira issue create --project=PROJ --type=Story \\\n' +
      '                      --summary="Add user profile page" \\\n' +
      '                      --description="Users need a profile page to manage settings" \\\n' +
      '                      --assignee=john.doe --priority=High\n' +
      '  $ jira issue create --project=PROJ --type=Story \\\n' +
      '                      --summary="Add feature" \\\n' +
      '                      --description-file=./feature-spec.md')
    .alias('new')
    .option('--project <project>', 'project key (e.g., TEST, PROJ)')
    .option('--type <type>', 'issue type (e.g., Bug, Story, Task)')
    .option('--summary <summary>', 'issue summary (required)')
    .option('--description <description>', 'issue description (optional)')
    .option('--description-file <path>', 'read description from file (optional)')
    .option('--assignee <assignee>', 'assignee username')
    .option('--priority <priority>', 'priority (e.g., High, Medium, Low)')
    .action(async (options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();
      
      try {
        await createIssue(client, io, factory, options);
      } catch (err) {
        io.error(`Failed to create issue: ${err.message}`);
        process.exit(1);
      }
    });

  command
    .command('edit <key>')
    .description('edit issue')
    .alias('update')
    .option('--summary <summary>', 'new summary')
    .option('--description <description>', 'new description')
    .option('--description-file <path>', 'read description from file')
    .option('--assignee <assignee>', 'new assignee')
    .option('--priority <priority>', 'new priority')
    .action(async (key, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();
      
      try {
        await updateIssue(client, io, key, options);
      } catch (err) {
        io.error(`Failed to update issue: ${err.message}`);
        process.exit(1);
      }
    });

  command
    .command('delete <key>')
    .description('delete issue')
    .alias('rm')
    .option('-f, --force', 'force delete without confirmation')
    .action(async (key, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();

      try {
        await deleteIssue(client, io, key, options);
      } catch (err) {
        io.error(`Failed to delete issue: ${err.message}`);
        process.exit(1);
      }
    });

  command
    .command('field <key> <fieldId>')
    .description('view a specific field value of an issue\n\n' +
      'Examples:\n' +
      '  $ jira issue field PROJ-123 customfield_11103    # View custom field\n' +
      '  $ jira issue field PROJ-123 description         # View description')
    .action(async (key, fieldId) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();

      try {
        await viewIssueField(client, io, key, fieldId);
      } catch (err) {
        io.error(`Failed to get field: ${err.message}`);
        process.exit(1);
      }
    });

  // Comment subcommand
  const commentCommand = command
    .command('comment')
    .description('Manage issue comments')
    .alias('c');

  commentCommand
    .command('add <key> [text]')
    .description('add a comment to an issue\n\n' +
      'Examples:\n' +
      '  $ jira issue comment add PROJ-123 "Review completed"\n' +
      '  $ jira issue comment add PROJ-123 --file ./notes.md\n' +
      '  $ jira issue comment add PROJ-123 "Internal note" --internal')
    .option('--file <path>', 'read comment body from file')
    .option('--internal', 'mark comment as internal/private')
    .action(async (key, text, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();
      
      try {
        await addComment(client, io, key, text, options);
      } catch (err) {
        io.error(`Failed to add comment: ${err.message}`);
        process.exit(1);
      }
    });

  commentCommand
    .command('list <key>')
    .description('list comments on an issue\n\n' +
      'Examples:\n' +
      '  $ jira issue comment list PROJ-123\n' +
      '  $ jira issue comment list PROJ-123 --format json')
    .option('--format <format>', 'output format (table, json)', 'table')
    .action(async (key, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();
      
      try {
        await listComments(client, io, key, options);
      } catch (err) {
        io.error(`Failed to list comments: ${err.message}`);
        process.exit(1);
      }
    });

  commentCommand
    .command('edit <commentId> [text]')
    .description('edit an existing comment\n\n' +
      'Examples:\n' +
      '  $ jira issue comment edit 12345 "Updated comment"\n' +
      '  $ jira issue comment edit 12345 --file ./updated-notes.md')
    .option('--file <path>', 'read comment body from file')
    .action(async (commentId, text, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();
      
      try {
        await editComment(client, io, commentId, text, options);
      } catch (err) {
        io.error(`Failed to edit comment: ${err.message}`);
        process.exit(1);
      }
    });

  commentCommand
    .command('delete <commentId>')
    .description('delete a comment\n\n' +
      'Examples:\n' +
      '  $ jira issue comment delete 12345 --force')
    .option('-f, --force', 'force delete without confirmation')
    .action(async (commentId, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();
      
      try {
        await deleteComment(client, io, commentId, options);
      } catch (err) {
        io.error(`Failed to delete comment: ${err.message}`);
        process.exit(1);
      }
    });

  // Attachment subcommand
  const attachmentCommand = command
    .command('attachment')
    .description('Manage issue attachments')
    .alias('attach')
    .alias('a');

  attachmentCommand
    .command('list <key>')
    .description('list attachments on an issue\n\n' +
      'Examples:\n' +
      '  $ jira issue attachment list PROJ-123\n' +
      '  $ jira issue attachment list PROJ-123 --format json')
    .option('--format <format>', 'output format (table, json)', 'table')
    .action(async (key, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();

      try {
        await listAttachments(client, io, key, options);
      } catch (err) {
        io.error(`Failed to list attachments: ${err.message}`);
        process.exit(1);
      }
    });

  attachmentCommand
    .command('download <key> [attachmentId]')
    .description('download attachments from an issue\n\n' +
      'Examples:\n' +
      '  $ jira issue attachment download PROJ-123\n' +
      '  $ jira issue attachment download PROJ-123 12345\n' +
      '  $ jira issue attachment download PROJ-123 --output ./downloads\n' +
      '  $ jira issue attachment download PROJ-123 --name "*.png"')
    .option('--output <path>', 'output directory', '.')
    .option('--name <pattern>', 'filter by filename pattern (glob)')
    .option('--overwrite', 'overwrite existing files')
    .action(async (key, attachmentId, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();

      try {
        await downloadAttachments(client, io, key, attachmentId, options);
      } catch (err) {
        io.error(`Failed to download attachments: ${err.message}`);
        process.exit(1);
      }
    });

  attachmentCommand
    .command('upload <key> <files...>')
    .description('upload attachments to an issue\n\n' +
      'Examples:\n' +
      '  $ jira issue attachment upload PROJ-123 ./screenshot.png\n' +
      '  $ jira issue attachment upload PROJ-123 ./doc1.pdf ./doc2.pdf')
    .action(async (key, files) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();

      try {
        await uploadAttachments(client, io, key, files);
      } catch (err) {
        io.error(`Failed to upload attachments: ${err.message}`);
        process.exit(1);
      }
    });

  attachmentCommand
    .command('delete <attachmentId>')
    .description('delete an attachment\n\n' +
      'Examples:\n' +
      '  $ jira issue attachment delete 12345 --force')
    .option('-f, --force', 'force delete without confirmation')
    .action(async (attachmentId, options) => {
      const io = factory.getIOStreams();
      const client = await factory.getJiraClient();

      try {
        await deleteAttachment(client, io, attachmentId, options);
      } catch (err) {
        io.error(`Failed to delete attachment: ${err.message}`);
        process.exit(1);
      }
    });

  return command;
}

function readDescriptionFile(filePath) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Description file not found: ${absolutePath}`);
  }

  const stats = fs.statSync(absolutePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  if (!content.trim()) {
    throw new Error(`Description file is empty: ${absolutePath}`);
  }

  return content;
}

async function listIssues(client, io, options) {
  const spinner = io.spinner('Fetching issues...');
  
  try {
    const jql = buildJQL(options);
    const limit = parseInt(options.limit) || 20;
    const result = await client.searchIssues(jql, {
      maxResults: limit
    });

    spinner.stop();

    if (result.issues.length === 0) {
      io.info('No issues found');
      return;
    }

    io.out(chalk.bold(`\nFound ${result.issues.length} issues (showing ${Math.min(result.issues.length, limit)}):\n`));
    
    const table = createIssuesTable(result.issues);
    io.out(table.toString());

    if (result.total > result.issues.length) {
      io.info(`Showing ${result.issues.length} of ${result.total} total issues`);
    }

  } catch (err) {
    spinner.stop();
    throw err;
  }
}

async function getIssue(client, io, issueKey, options = {}) {
  const spinner = io.spinner(`Fetching issue ${issueKey}...`);

  try {
    const issue = await client.getIssue(issueKey);

    // Fetch field metadata to get friendly names
    let fieldNameMap = {};
    try {
      const fields = await client.getFields();
      fields.forEach(field => {
        if (field.id && field.name) {
          fieldNameMap[field.id] = field.name;
        }
      });
    } catch (fieldErr) {
      // Silently ignore if field metadata fetch fails (may require admin permissions)
    }

    spinner.stop();

    if (options.output) {
      const outputPath = path.resolve(options.output);
      const content = formatIssueAsMarkdown(issue);

      fs.writeFileSync(outputPath, content, 'utf8');
      io.success(`Issue ${issueKey} saved to ${outputPath}`);
    } else if (options.format === 'markdown') {
      const markdown = formatIssueAsMarkdown(issue);
      io.out('\n' + markdown);
    } else {
      displayIssueDetails(issue, fieldNameMap);
    }

  } catch (err) {
    spinner.stop();
    throw err;
  }
}

async function createIssue(client, io, factory, options = {}) {
  const config = factory.getConfig();

  // Validate required options
  if (!options.project || !options.type || !options.summary) {
    throw new Error(
      'Missing required options for creating an issue.\n\n' +
      'Usage: jira issue create --project <KEY> --type <TYPE> --summary <TEXT>\n\n' +
      'Required options:\n' +
      '  --project <KEY>         Project key (e.g., TEST, PROJ)\n' +
      '  --type <TYPE>           Issue type (e.g., Bug, Story, Task)\n' +
      '  --summary <TEXT>        Issue summary\n\n' +
      'Optional:\n' +
      '  --description <TEXT>    Issue description\n' +
      '  --description-file <PATH>  Read description from file\n' +
      '  --assignee <USER>       Assignee username\n' +
      '  --priority <PRIORITY>   Priority level\n\n' +
      'Example:\n' +
      '  jira issue create --project TEST --type Bug --summary "Login fails"'
    );
  }

  // Handle description from file or text
  let description = '';
  if (options.description && options.descriptionFile) {
    throw new Error('Cannot use both --description and --description-file. Please use only one.');
  }

  if (options.descriptionFile) {
    description = readDescriptionFile(options.descriptionFile);
  } else if (options.description) {
    description = options.description;
  }

  const issueData = {
    fields: {
      project: { key: options.project },
      issuetype: { name: options.type },
      summary: options.summary,
      description: description
    }
  };

  if (options.assignee) {
    issueData.fields.assignee = { name: options.assignee };
  }

  if (options.priority) {
    issueData.fields.priority = { name: options.priority };
  }

  const spinner = io.spinner('Creating issue...');
  const result = await client.createIssue(issueData);
  spinner.stop();

  io.success(`Issue created: ${result.key}`);
  io.out(`URL: ${config.get('server')}/browse/${result.key}`);
}

async function updateIssue(client, io, issueKey, options = {}) {
  // Validate at least one option provided
  if (!options.summary && !options.description && !options.descriptionFile &&
      !options.assignee && !options.priority) {
    throw new Error(
      'At least one field must be specified for update.\n\n' +
      'Usage: jira issue edit <KEY> [options]\n\n' +
      'Available options:\n' +
      '  --summary <TEXT>          New summary\n' +
      '  --description <TEXT>      New description\n' +
      '  --description-file <PATH> Read description from file\n' +
      '  --assignee <USER>         New assignee\n' +
      '  --priority <PRIORITY>     New priority\n\n' +
      'Example:\n' +
      '  jira issue edit PROJ-123 --summary "Updated summary"\n' +
      '  jira issue edit PROJ-123 --description-file ./updated-spec.md'
    );
  }

  // Get current issue
  const spinner = io.spinner(`Loading issue ${issueKey}...`);
  const issue = await client.getIssue(issueKey);
  spinner.stop();

  io.out(chalk.bold(`\nUpdating issue: ${issue.key}`));
  io.out(`Current summary: ${issue.fields.summary}\n`);

  const updateData = { fields: {} };
  let hasChanges = false;

  if (options.summary && options.summary !== issue.fields.summary) {
    updateData.fields.summary = options.summary;
    hasChanges = true;
  }

  // Handle description from file or text
  if (options.description && options.descriptionFile) {
    throw new Error('Cannot use both --description and --description-file. Please use only one.');
  }

  if (options.descriptionFile) {
    const description = readDescriptionFile(options.descriptionFile);
    if (description !== (issue.fields.description || '')) {
      updateData.fields.description = description;
      hasChanges = true;
    }
  } else if (options.description && options.description !== (issue.fields.description || '')) {
    updateData.fields.description = options.description;
    hasChanges = true;
  }

  if (options.assignee) {
    updateData.fields.assignee = { name: options.assignee };
    hasChanges = true;
  }

  if (options.priority) {
    updateData.fields.priority = { name: options.priority };
    hasChanges = true;
  }

  if (!hasChanges) {
    io.info('No changes made');
    return;
  }

  const updateSpinner = io.spinner('Updating issue...');
  await client.updateIssue(issueKey, updateData);
  updateSpinner.stop();

  io.success(`Issue ${issueKey} updated successfully`);
}

async function deleteIssue(client, io, issueKey, options = {}) {
  // Get issue details first
  const spinner = io.spinner(`Loading issue ${issueKey}...`);
  const issue = await client.getIssue(issueKey);
  spinner.stop();

  io.out(chalk.bold.red('\nWARNING: You are about to delete this issue:'));
  io.out(`  Key: ${chalk.cyan(issue.key)}`);
  io.out(`  Summary: ${issue.fields.summary}`);
  io.out(`  Type: ${issue.fields.issuetype.name}\n`);

  if (!options.force) {
    throw new Error(
      'Deletion requires --force flag to confirm.\n' +
      `Use: jira issue delete ${issueKey} --force`
    );
  }

  const deleteSpinner = io.spinner('Deleting issue...');
  await client.deleteIssue(issueKey);
  deleteSpinner.stop();

  io.success(`Issue ${issueKey} deleted successfully`);
}

async function viewIssueField(client, io, issueKey, fieldId) {
  const spinner = io.spinner(`Fetching issue ${issueKey}...`);

  try {
    const issue = await client.getIssue(issueKey);
    spinner.stop();

    const fieldValue = issue.fields[fieldId];

    if (fieldValue === undefined) {
      throw new Error(`Field "${fieldId}" not found in issue ${issueKey}`);
    }

    io.out(chalk.bold(`\n${issueKey} - ${fieldId}:`));
    io.out(chalk.gray('─'.repeat(60)));

    if (fieldValue === null) {
      io.out(chalk.gray('(empty)'));
    } else if (typeof fieldValue === 'string') {
      io.out(fieldValue);
    } else if (typeof fieldValue === 'number') {
      io.out(String(fieldValue));
    } else if (Array.isArray(fieldValue)) {
      fieldValue.forEach((item, index) => {
        if (typeof item === 'string') {
          io.out(`  ${index + 1}. ${item}`);
        } else if (item && item.displayName) {
          io.out(`  ${index + 1}. ${item.displayName}`);
        } else if (item && item.name) {
          io.out(`  ${index + 1}. ${item.name}`);
        } else if (item && item.value) {
          io.out(`  ${index + 1}. ${item.value}`);
        } else {
          io.out(`  ${index + 1}. ${JSON.stringify(item, null, 2)}`);
        }
      });
    } else if (typeof fieldValue === 'object') {
      if (fieldValue.displayName) {
        io.out(fieldValue.displayName);
      } else if (fieldValue.name) {
        io.out(fieldValue.name);
      } else if (fieldValue.value) {
        io.out(fieldValue.value);
      } else {
        io.out(JSON.stringify(fieldValue, null, 2));
      }
    } else {
      io.out(String(fieldValue));
    }

    io.out('');

  } catch (err) {
    spinner.stop();
    throw err;
  }
}

async function addComment(client, io, issueKey, text, options = {}) {
  // Validate that we have comment text from either argument or file
  if (!text && !options.file) {
    throw new Error(
      'Comment text is required.\n\n' +
      'Usage: jira issue comment add <KEY> [text] [options]\n\n' +
      'Provide comment text either as:\n' +
      '  - Direct argument: jira issue comment add PROJ-123 "Comment text"\n' +
      '  - From file: jira issue comment add PROJ-123 --file ./comment.md\n\n' +
      'Options:\n' +
      '  --file <path>  Read comment body from file\n' +
      '  --internal     Mark comment as internal/private'
    );
  }

  if (text && options.file) {
    throw new Error('Cannot use both text argument and --file option. Please use only one.');
  }

  let commentBody = text;
  if (options.file) {
    commentBody = readDescriptionFile(options.file);
  }

  const spinner = io.spinner(`Adding comment to ${issueKey}...`);
  const comment = await client.addComment(issueKey, commentBody, {
    internal: options.internal
  });
  spinner.stop();

  io.success(`Comment added to ${issueKey}`);
  io.out(`Comment ID: ${comment.id}`);
  
  if (options.internal) {
    io.info('Comment marked as internal');
  }
}

async function listComments(client, io, issueKey, options = {}) {
  const spinner = io.spinner(`Fetching comments for ${issueKey}...`);
  
  try {
    const result = await client.getComments(issueKey);
    spinner.stop();

    if (!result.comments || result.comments.length === 0) {
      io.info(`No comments found for ${issueKey}`);
      return;
    }

    io.out(chalk.bold(`\nComments for ${issueKey} (${result.comments.length} total):\n`));

    if (options.format === 'json') {
      io.out(JSON.stringify(result.comments, null, 2));
    } else {
      const table = createCommentsTable(result.comments);
      io.out(table.toString());
    }

  } catch (err) {
    spinner.stop();
    throw err;
  }
}

async function editComment(client, io, commentId, text, options = {}) {
  // Validate that we have comment text from either argument or file
  if (!text && !options.file) {
    throw new Error(
      'Comment text is required.\n\n' +
      'Usage: jira issue comment edit <COMMENT-ID> [text] [options]\n\n' +
      'Provide comment text either as:\n' +
      '  - Direct argument: jira issue comment edit 12345 "Updated text"\n' +
      '  - From file: jira issue comment edit 12345 --file ./updated.md\n\n' +
      'Options:\n' +
      '  --file <path>  Read comment body from file'
    );
  }

  if (text && options.file) {
    throw new Error('Cannot use both text argument and --file option. Please use only one.');
  }

  let commentBody = text;
  if (options.file) {
    commentBody = readDescriptionFile(options.file);
  }

  const spinner = io.spinner(`Updating comment ${commentId}...`);
  await client.updateComment(commentId, commentBody);
  spinner.stop();

  io.success(`Comment ${commentId} updated successfully`);
}

async function deleteComment(client, io, commentId, options = {}) {
  io.out(chalk.bold.red('\nWARNING: You are about to delete this comment:'));
  io.out(`  Comment ID: ${chalk.cyan(commentId)}\n`);

  if (!options.force) {
    throw new Error(
      'Deletion requires --force flag to confirm.\n' +
      `Use: jira issue comment delete ${commentId} --force`
    );
  }

  const spinner = io.spinner('Deleting comment...');
  await client.deleteComment(commentId);
  spinner.stop();

  io.success(`Comment ${commentId} deleted successfully`);
}

// Attachment functions
function createAttachmentsTable(attachments) {
  const Table = require('cli-table3');
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Filename'),
      chalk.bold('Size'),
      chalk.bold('Created'),
      chalk.bold('Author')
    ],
    colWidths: [12, 40, 12, 20, 20]
  });

  attachments.forEach(att => {
    const size = formatFileSize(att.size);
    const created = att.created ? new Date(att.created).toLocaleString() : 'N/A';
    const author = att.author?.displayName || att.author?.name || 'Unknown';

    table.push([
      chalk.cyan(att.id),
      att.filename,
      size,
      created,
      author
    ]);
  });

  return table;
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function matchesPattern(filename, pattern) {
  if (!pattern) return true;
  const regex = new RegExp(
    '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
    'i'
  );
  return regex.test(filename);
}

async function listAttachments(client, io, issueKey, options = {}) {
  const spinner = io.spinner(`Fetching attachments for ${issueKey}...`);

  try {
    const issue = await client.getIssue(issueKey);
    spinner.stop();

    const attachments = issue.fields.attachment || [];

    if (attachments.length === 0) {
      io.info(`No attachments found for ${issueKey}`);
      return;
    }

    io.out(chalk.bold(`\nAttachments for ${issueKey} (${attachments.length} total):\n`));

    if (options.format === 'json') {
      io.out(JSON.stringify(attachments, null, 2));
    } else {
      const table = createAttachmentsTable(attachments);
      io.out(table.toString());
    }

  } catch (err) {
    spinner.stop();
    throw err;
  }
}

async function downloadAttachments(client, io, issueKey, attachmentId, options = {}) {
  const outputDir = path.resolve(options.output || '.');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const spinner = io.spinner(`Fetching issue ${issueKey}...`);
  const issue = await client.getIssue(issueKey);
  spinner.stop();

  let attachments = issue.fields.attachment || [];

  if (attachments.length === 0) {
    io.info(`No attachments found for ${issueKey}`);
    return;
  }

  if (attachmentId) {
    attachments = attachments.filter(att => att.id === attachmentId);
    if (attachments.length === 0) {
      throw new Error(`Attachment ${attachmentId} not found in ${issueKey}`);
    }
  }

  if (options.name) {
    attachments = attachments.filter(att => matchesPattern(att.filename, options.name));
    if (attachments.length === 0) {
      throw new Error(`No attachments matching pattern "${options.name}"`);
    }
  }

  io.out(chalk.bold(`\nDownloading ${attachments.length} attachment(s) to ${outputDir}:\n`));

  for (const att of attachments) {
    const dlSpinner = io.spinner(`Downloading ${att.filename}...`);
    try {
      const savedPath = await client.downloadAttachment(att, outputDir, {
        overwrite: options.overwrite
      });
      dlSpinner.stop();
      io.success(`Downloaded: ${savedPath}`);
    } catch (err) {
      dlSpinner.stop();
      io.error(`Failed to download ${att.filename}: ${err.message}`);
    }
  }
}

async function uploadAttachments(client, io, issueKey, files) {
  if (!files || files.length === 0) {
    throw new Error(
      'At least one file is required.\n\n' +
      'Usage: jira issue attachment upload <KEY> <file...>\n\n' +
      'Example:\n' +
      '  jira issue attachment upload PROJ-123 ./screenshot.png'
    );
  }

  io.out(chalk.bold(`\nUploading ${files.length} file(s) to ${issueKey}:\n`));

  for (const file of files) {
    const spinner = io.spinner(`Uploading ${path.basename(file)}...`);
    try {
      const result = await client.uploadAttachment(issueKey, file);
      spinner.stop();
      const uploaded = result[0];
      io.success(`Uploaded: ${uploaded.filename} (ID: ${uploaded.id})`);
    } catch (err) {
      spinner.stop();
      io.error(`Failed to upload ${file}: ${err.message}`);
    }
  }
}

async function deleteAttachment(client, io, attachmentId, options = {}) {
  io.out(chalk.bold.red('\nWARNING: You are about to delete this attachment:'));
  io.out(`  Attachment ID: ${chalk.cyan(attachmentId)}\n`);

  if (!options.force) {
    throw new Error(
      'Deletion requires --force flag to confirm.\n' +
      `Use: jira issue attachment delete ${attachmentId} --force`
    );
  }

  const spinner = io.spinner('Deleting attachment...');
  await client.deleteAttachment(attachmentId);
  spinner.stop();

  io.success(`Attachment ${attachmentId} deleted successfully`);
}

module.exports = createIssueCommand;
