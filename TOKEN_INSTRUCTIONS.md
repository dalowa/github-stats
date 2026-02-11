# How to Fix the GitHub Scope Error

The error `The 'avatarUrl' field requires one of the following scopes: ['read:org']` means your token needs permission to read organization data.

## Steps to Fix

1.  **Go to GitHub Tokens**:
    *   Click here: [https://github.com/settings/tokens](https://github.com/settings/tokens)

2.  **Edit Your Token**:
    *   Click on the **name** of the token you are using for this project (e.g., `Github Stats App`).

3.  **Add the Scope**:
    *   Scroll down to the **admin:org** section.
    *   Check the box for **`read:org`** (Read-only access to organization membership).

4.  **Save Changes**:
    *   Scroll to the very bottom of the page.
    *   Click **Update token**.

Your existing `GITHUB_TOKEN` in `.env.local` will work immediately after this update. You do **not** need to generate a new token.
