# Worker Configuration

## `GITHUB_APP_ID`
App Id of GitHub App which will be committing to your repository.

**Example:**
```text
123456
```

## `GITHUB_APP_PRIVATE_KEY`
Private Key of GitHub App which will be committing to your repository.

**Example:**
```text
-----BEGIN PRIVATE KEY-----...
```

## `GITHUB_ORGANIZATION_SLUG`
Organization name or username that the repository belongs to.

**Example:**
```text
org
```

## `GITHUB_REPOSITORY_SLUG`
Repository name.

**Example:**
```text
repo-name
```

## `GITHUB_REPOSITORY_BRANCH`
Branch where the site configuration lies.

**Example:**
```text
main
```

## `CW_ALLOWED_ORIGINS`
Allowed origins that can send a request to the comment-worker.

**Example:**
```text
https://example.com,https://www.example.com
```

## `CW_DEBUG`
Turning debug mode on or off.

**Example:**
```text
false
```
