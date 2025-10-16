---
description: Git operations - commit, PR, or sync
---

# Git Operations

Perform common git operations with three available modes.

## Context

This project uses:

- Git for version control
- GitHub for remote repository
- `main` as the main branch
- Conventional commits preferred
- GitHub CLI (`gh`) for PR operations

## Modes

Ask user which operation to perform:

### 1. Commit

Create a git commit with changes.

**Steps:**

1. Run `git status` to see changes
2. Run `git diff` to see staged/unstaged changes
3. Run `git log --oneline -5` to see recent commit message style
4. Analyze changes and draft commit message
5. Add relevant files with `git add`

6. Verify with `git status`

**Important:**

- Use HEREDOC for commit message formatting
- Follow existing commit message style
- Don't commit files with secrets (.env, credentials, etc.)
- If pre-commit hooks modify files, check if safe to amend or create new commit
- Do NOT add Claude Code attribution footer or co-author lines to commits

### 2. PR (Pull Request)

Create a pull request for current branch.

**Steps:**

1. Run `git status` to see untracked files
2. Run `git diff` to see staged/unstaged changes
3. Check if branch tracks remote and is up to date
4. Run `git log` and `git diff [base]...HEAD` to understand full commit history
5. Analyze ALL commits that will be in PR (not just latest!)
6. Draft PR summary with:
   - Title
   - Summary (1-3 bullet points)
   - Test plan (checklist)
7. Push to remote with `-u` flag if needed
8. Create PR with `gh pr create`:

   ```bash
   gh pr create --title "PR title" --body "$(cat <<'EOF'
   ## Summary
   - Bullet point 1
   - Bullet point 2

   ## Test plan
   - [ ] Test item 1
   - [ ] Test item 2

   EOF
   )"
   ```

9. Return PR URL to user

**Important:**

- Analyze ALL commits in branch, not just latest
- Use HEREDOC for body formatting
- Default base branch is `main`
- Do NOT add Claude Code attribution footer or co-author lines to PR descriptions

### 3. Sync

Synchronize current branch with remote.

**Steps:**

1. Run `git status` to check current state
2. Check if there are local uncommitted changes
3. If uncommitted changes exist, ask user:
   - Stash changes and sync
   - Commit changes first
   - Abort sync
4. Run `git fetch origin` to fetch latest changes
5. Run `git pull --rebase origin [branch]` to sync with rebase
6. If conflicts occur:
   - List conflicted files
   - Ask user to resolve manually
   - Wait for user confirmation
7. Run `git status` to verify sync
8. If stashed, ask if user wants to pop stash

**Important:**

- Always fetch before pulling
- Use rebase to keep history clean
- Warn about conflicts and guide resolution
- Don't lose uncommitted work

## Best Practices

- Run multiple independent git commands in parallel when possible
- Use `&&` to chain dependent commands
- Always verify operations with `git status`
- Never skip hooks unless explicitly requested
- Never force push to main/master without warning
- Check authorship before amending commits
- Use proper quoting for paths with spaces

## Example Usage

**Commit:**

```bash
git status
git diff
git add app/ components/
git commit -m "feat: add user authentication"
```

**PR:**

```bash
git push -u origin feature-branch
gh pr create --title "Add user authentication" --body "..."
```

**Sync:**

```bash
git fetch origin
git pull --rebase origin main
```
