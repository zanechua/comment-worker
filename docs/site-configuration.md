# Site Configuration

The configuration should be place below a top level field of `comments`.

## `allowedFields`
An array with the names of the allowed fields. If any of the fields sent is not part of this list, the entry will be discarded and an error will be thrown.

**Example:**

```yaml
allowedFields: ["name", "email", "message"]
```

**Default:**

```yaml
[]
```

## `allowedOptions`
An array with the names of the allowed options. If any of the options sent is not part of this list, the entry will be discarded and an error will be thrown.

**Example:**

```yaml
allowedOptions: ["slug", "url"]
```

**Default:**

```yaml
[]
```

## `branch`
Name of the branch being used within the GitHub repository.

**Default:**

```yaml
"master"
```

## `commitMessage`
Text to be used as the commit message when pushing entries to the GitHub repository.

**Default:**

```yaml
"Add Staticman data"
```

## `filename`
Name for the data files being uploaded to the repository. You can use placeholders (denoted by curly braces), which will be dynamically replaced with the content of a field (e.g. `{fields.name}`), the content of an option (e.g. `{options.slug}`) or other dynamic placeholders such as the entry’s unique id (`{@id}`).

**Default:**

```yaml
""
```

## `moderation`
When set to true, a pull request with the data files will be created to allow site administrators to approve or reject an entry. Otherwise, entries will be pushed to branch immediately.

**Default:**

```yaml
true
```

## `path`
Path to the directory where entry files are stored. You can use placeholders (denoted by curly braces), which will be dynamically replaced with the content of a field (e.g. `{fields.name}`), the content of an option (e.g. `{options.slug}`) or other dynamic placeholders such as the entry’s unique id (`{@id}`).

**Default:**

```yaml
"_data/results/{@timestamp}"
```

## `pullRequestBody`
Text to be used as the pull request body when pushing moderated entries.

**Default:**

```yaml
"Dear human,

Here's a new entry for your approval. :tada:

Merge the pull request to accept it, or close it to send it away.

:heart: Your friend [comment-worker](https://github.com/zanechua/comment-worker) :muscle:

---
"
```

## `requiredFields`
An array with the names of the fields that must be supplied as part of an entry. If any of these is not present, the entry will be discarded and an error will be thrown.

**Default:**

```yaml
[]
```

## `requiredOptions`
An array with the names of the options that must be supplied as part of an entry. If any of these is not present, the entry will be discarded and an error will be thrown.

**Default:**

```yaml
[]
```

## `fieldTransforms`
List of transformations to be applied to any of the fields supplied. It consists of an object where keys correspond to the names of the fields being transformed. The value determines the type of transformation being applied.

Possible values:
- md5
- sha1
- sha256
- sha384
- sha512
- escape

**Example:**

```yaml
transforms:
  email: "sha512" # The email field will be SHA512-hashed
```


## `optionTransforms`
List of transformations to be applied to any of the options supplied. It consists of an object where keys correspond to the names of the fields being transformed. The value determines the type of transformation being applied.

Possible values:
- md5
- sha1
- sha256
- sha384
- sha512
- escape

**Example:**

```yaml
transforms:
  slug: "escape" # The slug options will be escaped
```
