# Contributing

Thanks for wanting to help. System Map is maintained by one person, so the rules below are about
not wasting your time or theirs.

## Claim an issue before you start

1. Find an open issue that has **no assignee** and no open pull request linked to it.
2. Comment on it to say you'd like to take it, and how you plan to fix it in a sentence or two.
3. Wait until the issue is **assigned to you**. Then start.

A pull request for an issue that isn't assigned to you is closed without review, however good it
is. This keeps two people from doing the same work: before this rule, one issue drew three pull
requests in an hour.

- Hold one claimed issue at a time.
- If you haven't opened a pull request, even a draft, within 7 days of being assigned, the issue
  goes back to being open for anyone.
- If you can't finish, say so on the issue. That's fine.

For something with no issue yet, open the issue first and say what you found. Typo fixes in docs
are the one exception: send those straight away.

## Before you open the pull request

- Keep it to the one issue. No unrelated clean-ups or reformatting.
- Add a test that fails before your change and passes after it.
- Run the checks in [docs/development.md](docs/development.md#checks), and say which ones you ran.
  If you skipped one, say that too.
- Add a line to [CHANGELOG.md](CHANGELOG.md) under `[Unreleased]`.
- Put `Closes #<issue>` in the description.

The description uses these sections: **Change**, **User impact**, **Risk**, **Rollback** and
**Evidence**. Look at a merged pull request for the length and tone.

## AI tools

You may use them. If you do:

- Say so in the description, and name the tool.
- You are still the author. Read every line, run the checks yourself, and be ready to answer
  review questions without pasting them back into the tool.

Pull requests that look generated in bulk, ignore this file, or don't match the code they claim to
fix are closed.

## License

By contributing, you agree that your work is licensed under the [Apache License 2.0](LICENSE),
the same as the rest of the project.
