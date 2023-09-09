import { createId as createCuid } from '@paralleldrive/cuid2';
import { Hono } from 'hono';
// eslint-disable-next-line
import { cors } from 'hono/cors';
import { isUndefined } from 'lodash';
import yaml from 'yaml';
import { z } from 'zod';
import { Base64 } from 'js-base64';

import GitHub from './github';
import { convertFormDataToObject, handlePlaceholders, objectToMarkdownTable } from './util';
import { buildSchemaObject } from './validation';
import Validator from './validator';

// Setting up our application:
const app = new Hono();

app.use('/api/*', async (c, next) => {
  const { env } = c;
  const allowedOriginsString = env.CW_ALLOWED_ORIGINS;
  const allowedOrigins = allowedOriginsString.split(',');

  const corsMiddleware = cors({
    origin: allowedOrigins,
    allowHeaders: ['Origin', 'Content-Type', 'Content-Length', 'Accept', 'User-Agent'],
    allowMethods: ['POST']
  });

  return corsMiddleware(c, next);
});

// The api signature follows hono
// POST to create the comment
app.post('/api/handle/form', async c => {
  const { req, env } = c;
  const currentUrl = req.url;
  const baseUrl = currentUrl.match(/^(https?:\/\/[^/]+)/)[1];

  const appId = env.GITHUB_APP_ID;
  // We need to format the private key to handle the line breaks accordingly
  const formattedPrivateKey = env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  const organizationSlug = env.GITHUB_ORGANIZATION_SLUG;
  const repositorySlug = env.GITHUB_REPOSITORY_SLUG;
  const repositoryBranch = env.GITHUB_REPOSITORY_BRANCH;
  const shouldDebug = env.CW_DEBUG === 'true';

  const gh = await GitHub.initialize(appId, formattedPrivateKey, organizationSlug, repositorySlug);

  const staticmanFile = await gh.getFileFromRepository('staticman.yml', repositoryBranch);
  if (!staticmanFile?.content) {
    return c.text('Missing staticman.yml', 500);
  }

  const staticmanConfigJson = yaml.parse(Base64.decode(staticmanFile.content));
  const staticmanCommentsConfig = staticmanConfigJson.comments;

  let body;
  const contentTypeHeader = req.header('Content-Type');

  if (contentTypeHeader === 'application/x-www-form-urlencoded') {
    body = convertFormDataToObject(await req.parseBody());
  } else if (contentTypeHeader === 'application/json') {
    body = await req.json();
  } else {
    return c.text('Unsupported Content-Type', 400);
  }

  // Handle the fields and options
  const fieldValues = body.fields || {};
  const optionValues = body.options || {};

  if (shouldDebug) console.log(fieldValues);

  // Handle the default config from the yml file
  const allowedFields = staticmanCommentsConfig?.allowedFields || [];
  const requiredFields = staticmanCommentsConfig?.requiredFields || [];
  const allowedOptions = staticmanCommentsConfig?.allowedOptions || [];
  const requiredOptions = staticmanCommentsConfig?.requiredOptions || [];
  const moderation = staticmanCommentsConfig?.moderation === 'true' || true;
  const fieldTransforms = staticmanCommentsConfig?.transforms || staticmanCommentsConfig?.fieldTransforms || {};
  const optionTransforms = staticmanCommentsConfig?.optionTransforms || {};

  // Build input fields schema
  const fieldInputSchema = z.object(buildSchemaObject(allowedFields, requiredFields, fieldTransforms)).strict();

  // Validate the input fields and escape
  const {
    validatedSchema: validatedFields,
    formattedError,
    rawError
  } = await Validator.check(fieldInputSchema, fieldValues);

  if (!isUndefined(rawError) || !isUndefined(formattedError)) {
    return c.text('Error', 400);
  }

  // Build input options schema
  const optionInputSchema = z.object(buildSchemaObject(allowedOptions, requiredOptions, optionTransforms)).strict();

  // Validate the input options and escape
  const { validatedSchema: validatedOptions } = await Validator.check(optionInputSchema, optionValues);

  // Generate unique placeholder properties
  const commentId = createCuid();
  const date = new Date().toISOString();

  const fields = {
    id: commentId,
    ...validatedFields,
    date
  };

  // Handle the data to create the comment entry
  const commitMessage = Object.prototype.hasOwnProperty.call(
    staticmanCommentsConfig,
    'commitMessage'
  )
    ? handlePlaceholders(staticmanCommentsConfig.commitMessage, fields, validatedOptions)
    : 'Add comment-worker data';
  const filename = Object.prototype.hasOwnProperty.call(staticmanCommentsConfig, 'filename')
    ? handlePlaceholders(staticmanCommentsConfig.filename, fields, validatedOptions)
    : '';
  const directoryPath = Object.prototype.hasOwnProperty.call(staticmanCommentsConfig, 'path')
    ? handlePlaceholders(staticmanCommentsConfig.path, fields, validatedOptions)
    : `_data/results/${new Date(fields.date).valueOf()}`;

  const yamlData = yaml.stringify(fields);
  const base64YamlData = Base64.encode(yamlData);

  const defaultBranch = staticmanCommentsConfig?.branch || 'master';
  const branch = `commentworker_${commentId}`;

  if (moderation) {
    const createBranchResponse = await gh.createBranchOnRepository(branch, defaultBranch);
  }

  const filePath = `${directoryPath}/${filename}.yml`;
  const createCommentFileResponse = await gh.createFileOnRepository(
    filePath,
    commitMessage,
    base64YamlData,
    moderation ? branch : defaultBranch
  );

  if (!createCommentFileResponse?.content) {
    return c.text('Failed to create comment file. Please check if your file path is valid.', 422);
  }

  if (moderation) {
    const pullRequestBody = Object.prototype.hasOwnProperty.call(
      staticmanCommentsConfig,
      'pullRequestBody'
    )
      ? handlePlaceholders(staticmanCommentsConfig.pullRequestBody, fields, validatedOptions)
      : `Dear human,\r\n\r\nHere\'s a new entry for your approval. :tada:\r\n\r\nMerge the pull request to accept it, or close it to send it away.\r\n\r\n:heart: Your friend [comment-worker](https://github.com/zanechua/comment-worker) :muscle:\r\n\r\n---\r\n\r\n${objectToMarkdownTable(
          fields
        )}`;
    const pullRequest = await gh.createPullRequestOnRepository(
      commitMessage,
      pullRequestBody,
      branch,
      defaultBranch
    );
  }

  return c.text('Created', 201);
});

// 404 for everything else
app.all('*', () => new Response('These are not the droids you are looking for', { status: 404 }));

export default app;
