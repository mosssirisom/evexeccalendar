# This repository has been merged into evexecoperator

The EV Exec calendar app and the EV Exec operator dashboard have been unified
into a single Next.js application, hosted in
[`mosssirisom/evexecoperator`](https://github.com/mosssirisom/evexecoperator).

## What changed

- The calendar app (this repo) is now the **root** of the unified app
  (`/`, `/login`, etc.) inside `evexecoperator`.
- The operator dashboard (previously a separate Vite app in
  `evexecoperator`) has been ported to Next.js routes under
  `/operator/*` (`/operator/dashboard`, `/operator/dispatch`,
  `/operator/drivers`, `/operator/bookings`, `/operator/analytics`,
  `/operator/settings`).
- The full git history of this repository was preserved via a subtree
  merge into `evexecoperator`.

## Where to develop now

All future development should happen in
[`mosssirisom/evexecoperator`](https://github.com/mosssirisom/evexecoperator),
on branch `claude/repo-merge-xe0afb` (merging into `main`).

This repository (`evexeccalendar`) is no longer actively developed and can
be archived once the unified app is verified in `evexecoperator`.
