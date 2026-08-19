#!/usr/bin/env bash
#
# github.sh — pull (rebase), commit, and push to GitHub using a token.
#
# Order of operations: pull first, then commit, then push.
#
# Repo: https://github.com/saerd009988/card_input_tut
#
# Commits made by this script are always attributed to the identity in the
# IDENTITY block below. Your global git config (user.name / user.email) is
# never read and never modified — the identity is written to THIS repo's
# .git/config only, and is also passed inline on every commit.
#
# SETUP (one time):
#   1. Set GH_TOKEN below (needs "repo" scope, or Contents=Read and write).
#   2. chmod +x github.sh
#   3. echo "github.sh" >> .gitignore    <-- IMPORTANT, or you push your token
#
# USAGE:
#   ./github.sh "your commit message"
#   ./github.sh                          (uses a timestamp as the message)

set -euo pipefail

# ---------------------------------------------------------------- config ----
REPO_URL="https://github.com/saerd009988/robinhood-ngo"
BRANCH="main"

# ------------------------------------------------------------- identity ----
# Who the commits are from. Used for this repo only.
GIT_NAME="saerd009988"
GIT_EMAIL="saerdcuhioklmesa764@gmail.com"

# ---------------------------------------------------------------- token ----
GH_TOKEN="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"
# -----------------------------------------------------------------------------

# Parse owner/repo out of REPO_URL. Accepts with or without a trailing .git,
# and either the https:// or git@github.com: form.
_stripped="${REPO_URL%.git}"
_stripped="${_stripped#https://github.com/}"
_stripped="${_stripped#git@github.com:}"
GH_USER="${_stripped%%/*}"
GH_REPO="${_stripped##*/}"

if [[ -z "$GH_USER" || -z "$GH_REPO" || "$GH_USER" == "$_stripped" ]]; then
  echo "ERROR: couldn't parse owner/repo from REPO_URL: $REPO_URL" >&2
  echo "       Expected something like https://github.com/owner/repo" >&2
  exit 1
fi

if [[ "$GH_TOKEN" == "PASTE_YOUR_NEW_TOKEN_HERE" || -z "$GH_TOKEN" ]]; then
  echo "ERROR: edit this file and set GH_TOKEN first." >&2
  echo "       https://github.com/settings/tokens" >&2
  exit 1
fi

if [[ -z "$GIT_NAME" || -z "$GIT_EMAIL" ]]; then
  echo "ERROR: GIT_NAME and GIT_EMAIL must both be set at the top of this file." >&2
  exit 1
fi

COMMIT_MSG="${1:-update $(date '+%Y-%m-%d %H:%M:%S')}"

# Guard: refuse to run if this script isn't ignored by git.
if [[ -d .git ]] && ! git check-ignore -q "$(basename "$0")" 2>/dev/null; then
  echo "WARNING: $(basename "$0") is not in .gitignore — your token could be committed."
  read -r -p "Add it to .gitignore now? [Y/n] " reply
  if [[ ! "$reply" =~ ^[Nn]$ ]]; then
    echo "$(basename "$0")" >> .gitignore
    echo "Added to .gitignore."
  else
    echo "Aborting." >&2
    exit 1
  fi
fi

# Init repo if needed.
if [[ ! -d .git ]]; then
  echo "==> Initializing repository"
  git init
  git branch -M "$BRANCH"
fi

# --- Pin the commit identity to THIS repo ------------------------------------
# --local writes to .git/config, which overrides ~/.gitconfig. useConfigOnly
# stops git from silently inventing an identity from the hostname if either
# value ever goes missing.
echo "==> Setting repo-local identity: $GIT_NAME <$GIT_EMAIL>"
git config --local user.name  "$GIT_NAME"
git config --local user.email "$GIT_EMAIL"
git config --local user.useConfigOnly true

# Belt and braces: also pass the identity inline on the commit itself, so it
# holds even if .git/config gets clobbered mid-run.
git_commit() {
  git -c user.name="$GIT_NAME" -c user.email="$GIT_EMAIL" \
      commit --author="$GIT_NAME <$GIT_EMAIL>" "$@"
}

# Point origin at the clean URL (no token baked in).
CLEAN_URL="https://github.com/${GH_USER}/${GH_REPO}.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$CLEAN_URL"
else
  git remote add origin "$CLEAN_URL"
fi

# Verify the repo exists and the token can both READ and WRITE, before
# touching anything.
echo "==> Checking access to ${GH_USER}/${GH_REPO}"
API_OUT=$(curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer ${GH_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${GH_USER}/${GH_REPO}")
HTTP_CODE="${API_OUT##*$'\n'}"
API_BODY="${API_OUT%$'\n'*}"

case "$HTTP_CODE" in
  200)
    # "permissions": { ... "push": true ... }
    if grep -q '"push"[[:space:]]*:[[:space:]]*true' <<<"$API_BODY"; then
      echo "    OK (read + write)"
    else
      echo "ERROR: the token can read this repo but NOT push to it." >&2
      echo "       Classic token: enable the 'repo' scope." >&2
      echo "       Fine-grained:  set Repository permissions > Contents = Read and write." >&2
      echo "       https://github.com/settings/tokens" >&2
      exit 1
    fi
    ;;
  401) echo "ERROR: token rejected (401). It's invalid, expired, or revoked." >&2; exit 1 ;;
  403) echo "ERROR: 403 forbidden. Token may be blocked by an org SSO policy." >&2
       echo "       If this repo is in an org, authorize the token for SSO." >&2
       exit 1 ;;
  404) echo "ERROR: 404. Either the repo doesn't exist, or the token can't see it." >&2
       echo "       Create it at: https://github.com/new" >&2
       exit 1 ;;
  *)   echo "ERROR: unexpected response $HTTP_CODE from GitHub API." >&2; exit 1 ;;
esac

# Confirm the token actually belongs to the account we expect, so a stray
# token from another login can't quietly push on your behalf.
TOKEN_LOGIN=$(curl -s \
  -H "Authorization: Bearer ${GH_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user" \
  | sed -n 's/.*"login"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

if [[ -n "$TOKEN_LOGIN" ]]; then
  if [[ "$TOKEN_LOGIN" == "$GIT_NAME" ]]; then
    echo "    Token belongs to: $TOKEN_LOGIN"
  else
    echo "ERROR: token belongs to '$TOKEN_LOGIN', not '$GIT_NAME'." >&2
    echo "       Refusing to push under the wrong account." >&2
    echo "       Fix the token, or change GIT_NAME at the top of this file." >&2
    exit 1
  fi
else
  echo "    (couldn't read token owner — fine-grained tokens may not expose /user)"
fi

# Feed the token to git via an askpass helper so it never lands in
# .git/config, the process list, or your shell history.
ASKPASS=$(mktemp)
chmod 700 "$ASKPASS"
cat > "$ASKPASS" <<'EOF'
#!/usr/bin/env bash
case "$1" in
  *Username*) echo "$GIT_USER" ;;
  *Password*) echo "$GIT_PASS" ;;
esac
EOF
trap 'rm -f "$ASKPASS"' EXIT

# Wrapper so every network call gets the credentials and the pinned identity.
#
# '-c credential.helper=' clears the inherited helper list (keychain, store,
# manager). Without this, a stale saved token wins over GIT_ASKPASS and you
# get a misleading "Repository not found".
git_auth() {
  GIT_USER="$GIT_NAME" GIT_PASS="$GH_TOKEN" GIT_ASKPASS="$ASKPASS" \
    GIT_TERMINAL_PROMPT=0 \
    git -c credential.helper= \
        -c user.name="$GIT_NAME" \
        -c user.email="$GIT_EMAIL" "$@"
}

# Bail out early if a rebase or merge is already half-finished.
if [[ -d .git/rebase-merge || -d .git/rebase-apply ]]; then
  echo "ERROR: a rebase is already in progress." >&2
  echo "       Finish it with 'git rebase --continue' or 'git rebase --abort'." >&2
  exit 1
fi

# --- 1. Pull remote changes FIRST -------------------------------------------
# --autostash shelves any uncommitted work, rebases onto the remote, then puts
# the work back — so the pull runs even with a dirty tree.
# ls-remote --exit-code: 0 = branch found, 2 = no such branch, other = error.
set +e
git_auth ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1
LS_RC=$?
set -e

case "$LS_RC" in
  0)
    echo "==> Pulling from origin/$BRANCH"
    if ! git_auth pull --rebase --autostash origin "$BRANCH"; then
      echo >&2
      echo "ERROR: the pull hit a conflict. Nothing has been committed or pushed." >&2
      echo >&2
      echo "  If a rebase is in progress (git status will say so):" >&2
      echo "      fix the conflicted files, then" >&2
      echo "        git add <files>" >&2
      echo "        git rebase --continue" >&2
      echo "      or back out with: git rebase --abort" >&2
      echo >&2
      echo "  If the stashed local changes failed to reapply:" >&2
      echo "      fix the conflicted files, then" >&2
      echo "        git checkout --theirs <file>   # or edit by hand" >&2
      echo "      your work is still safe in: git stash list" >&2
      echo >&2
      echo "  Then re-run: ./$(basename "$0")" >&2
      exit 1
    fi
    ;;
  2)
    echo "==> Remote branch '$BRANCH' doesn't exist yet — skipping pull"
    ;;
  *)
    echo "ERROR: couldn't reach the remote (ls-remote exit $LS_RC)." >&2
    echo "       The API check passed, so this is a git-side auth problem." >&2
    echo "       Diagnose with:" >&2
    echo "         git -c credential.helper= ls-remote origin" >&2
    exit 1
    ;;
esac

# --- 2. Commit local work on top of what we just pulled ----------------------
git add -A
if git diff --cached --quiet; then
  echo "==> Nothing to commit"
else
  git_commit -m "$COMMIT_MSG"
  echo "==> Committed as $GIT_NAME <$GIT_EMAIL>: $COMMIT_MSG"
fi

# --- 3. Push -----------------------------------------------------------------
echo "==> Pushing to $BRANCH as $GIT_NAME"
git_auth push -u origin "$BRANCH"

echo "==> Done: https://github.com/${GH_USER}/${GH_REPO}"
git --no-pager log -1 --format='    last commit: %an <%ae>  %h  %s'