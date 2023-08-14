import githubAppJwt from 'universal-github-app-jwt';

import { gatherResponse } from './util';

const shouldFakeUserAgent = false;

const defaultHeaders = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

class GitHub {
  constructor(appId, installationToken, organizationSlug, repositorySlug) {
    // Constructor
    this.installationToken = installationToken;
    this.organizationSlug = organizationSlug;
    this.repositorySlug = repositorySlug;
    this.headers = {
      ...defaultHeaders,
      'User-Agent': shouldFakeUserAgent
        ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.200'
        : `comment-worker-${appId}`,
      'Authorization': `Bearer ${this.installationToken}`
    };
  }

  static async initialize(appId, privateKey, organizationSlug, repositorySlug) {
    const { token } = await githubAppJwt({
      id: appId,
      privateKey
    });

    const { token: installationToken } = await this.getInstallationTokenByOrgName(
      appId,
      token,
      organizationSlug
    );

    return new GitHub(appId, installationToken, organizationSlug, repositorySlug);
  }

  static async getInstallationTokenByOrgName(appId, appBearerToken, organizationSlug) {
    const headers = {
      ...defaultHeaders,
      'User-Agent': shouldFakeUserAgent
        ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.200'
        : `comment-worker-${appId}`,
      Authorization: `Bearer ${appBearerToken}`
    };

    const appInstallationsResponse = await fetch('https://api.github.com/app/installations', {
      headers
    });

    const appInstallations = await gatherResponse(appInstallationsResponse);

    const installation = appInstallations.find(item => item.account.login === organizationSlug);

    const installationTokenResponse = await fetch(installation.access_tokens_url, {
      method: 'POST',
      headers
    });

    const installationToken = await gatherResponse(installationTokenResponse);

    return installationToken;
  }

  async createFileOnRepository(commentPath, message, content, branch) {
    const createCommentResponse = await fetch(
      `https://api.github.com/repos/${this.organizationSlug}/${this.repositorySlug}/contents/${commentPath}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message,
          content,
          branch
        }),
        headers: this.headers
      }
    );

    const commentResponse = await gatherResponse(createCommentResponse);

    return commentResponse;
  }

  async createBranchOnRepository(branchName, branchFrom = 'master') {
    const branchResponse = await fetch(
      `https://api.github.com/repos/${this.organizationSlug}/${this.repositorySlug}/git/matching-refs/heads/${branchFrom}`,
      {
        headers: this.headers
      }
    );

    const branch = (await gatherResponse(branchResponse))[0];

    const createBranchResponse = await fetch(
      `https://api.github.com/repos/${this.organizationSlug}/${this.repositorySlug}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: branch.object.sha
        }),
        headers: this.headers
      }
    );

    const branchCreation = await gatherResponse(createBranchResponse);

    return branchCreation;
  }

  async createPullRequestOnRepository(title, body, branchSource, branchTarget = 'master') {
    const createPullRequestResponse = await fetch(
      `https://api.github.com/repos/${this.organizationSlug}/${this.repositorySlug}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          body,
          head: branchSource,
          base: branchTarget
        }),
        headers: this.headers
      }
    );

    const pullRequest = await gatherResponse(createPullRequestResponse);

    return pullRequest;
  }

  async getRepository() {
    const repositoryResponse = await fetch(
      `https://api.github.com/repos/${this.organizationSlug}/${this.repositorySlug}`,
      {
        headers: this.headers
      }
    );

    const repository = await gatherResponse(repositoryResponse);

    return repository;
  }

  async getFileFromRepository(filePath, branchFrom = 'master') {
    const fileResponse = await fetch(
      `https://api.github.com/repos/${this.organizationSlug}/${this.repositorySlug}/contents/${filePath}?ref=${branchFrom}`,
      {
        method: 'GET',
        headers: this.headers
      }
    );

    const file = await gatherResponse(fileResponse);

    return file;
  }
}

export default GitHub;
