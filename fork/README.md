# Installer-based TSK Manager experiment

*Compiled 2026-05-10 from a snapshot of the live artifacts.*

## Background

This repository is a fork of [sshane/openpilot-installer-generator](https://github.com/sshane/openpilot-installer-generator), used as the basis for an experiment in distributing **TSK Manager** — a manager program for the Toyota Security Key (TSK) used by SecOC on select Toyota vehicles running openpilot — as a one-shot installer rather than via the Python install path.

The experiment ran from early 2025 through April 2025. It turned out to be not useful. The canonical and continuing form of TSK Manager is the Python program in [calvinpark/openpilot](https://github.com/calvinpark/openpilot)'s `tskm-*` branches. This file records what was built, where the artifacts live, and the shape of the experiment.

## Repository contents (`main` branch)

The `main` branch holds the deployable PHP installer-generator. Layout:

- `fork/` — the deployable web root. A verbatim copy of these files was deployed to Calvin's Namecheap shared hosting at `tsk.calvinpark.com` during the experiment.
  - `index.php` (7687 bytes) — entry point. Sniffs `User-Agent` for `AGNOSSetup` / `NEOSSetup` / `Wget`; matching agents redirect straight to the build script. Browser visitors get a UI to enter `<gh_username>/<branch>`. Logs every request as JSON to `log.txt`. Hardcoded aliases for popular forks: `dragonpilot`/`dp`, `commaai`/`stock`, `sshane`/`sa`/`smiskol`, `sunnyhaibin`/`sp`.
  - `build_agnos.php` (2060 bytes) — generates the AGNOS installer binary on the fly by patching `installer_openpilot_agnos` with the requested user/branch/loading-message.
  - `build_neos.php` (2449 bytes) — same shape for NEOS.
  - `installer_openpilot_agnos` (217 288 bytes) — base AGNOS installer binary, the input that `build_agnos.php` patches.
  - `installer_openpilot_neos` (526 624 bytes) — base NEOS installer binary.
  - `favicon.ico` (15 406 bytes), `.htaccess` (275 bytes).
- `source/` — C/C++ source for the base installer binaries.
  - `installer_source_agnos.cc` (6051 bytes)
  - `installer_source_neos.c` (4821 bytes)

## Branch layout

- **`main`** — canonical PHP version of the experiment. Strict superset of `phpf7.4` (carries Calvin's additional modifications beyond what was upstreamed).
- **`phpf7.4`** — earlier branch carrying the PHP 7.4 polyfill changes upstreamed as [sshane PR #19](https://github.com/sshane/openpilot-installer-generator/pull/19): "Dynamically determine WEBSITE_URL and add support for older PHP." Single commit on top of `sshane:main`. PR opened but never merged. `fork/index.php` on this branch is 7516 bytes (sshane upstream: 7191; the PR delta accounts for +325 bytes; further `main`-only tweaks add another +171 bytes to reach 7687).
- **`nodejs`** — a Cloudflare Worker port of the same idea, restructured under `cloudflare-worker/` with TypeScript, Wrangler, ESBuild, Vite, and Vitest tooling. Captures a separate experiment in serverless-edge distribution of the installer generator.

## Deployment surfaces

The experiment ran across two live deployments.

### Namecheap shared hosting (PHP, dynamic)

Calvin's Namecheap account at `premium265.web-hosting.com` ran `main/fork/` files at `https://tsk.calvinpark.com/`. URLs took the shape `tsk.calvinpark.com/<gh_username>/<branch>` — either the browser UI rendered, or AGNOS/NEOS/Wget user agents triggered a redirect to `build_*.php` for binary download.

The deployment was a verbatim copy of `main/fork/` — every file matched the GitHub copy byte-for-byte. The only file from `main/fork/` not present on Namecheap was `installer_openpilot_neos` (and its companion `build_neos.php`); the live deployment was AGNOS-only.

The PHP server logged usage to `log.txt`. The retained log captured **86 entries spanning 2025-02-11 through 2025-04-15**:

- 84 entries in February 2025 (testing burst)
- 1 entry in March 2025
- 1 entry in April 2025

Three unique source IPs across the entire run: `97.113.54.86`, `97.111.7.38`, `71.36.41.159` — all Bay Area residential. Only **one** real comma-device install ever ran from this endpoint: a single `AGNOSSetup-11.6` user-agent hit on 2025-02-11. Every other entry was a browser request from `calvinpark/chris-sp`-style URLs while iterating on the experiment.

The Namecheap account is being torn down as part of a broader migration off Namecheap hosting. Nothing in the live `tsk/` directory was unique versus `main/fork/` in this repo, so the teardown carries no preservation cost. The `log.txt` file (22 KB, the only deployment-unique artifact) was not retained.

### S3 bucket `s3://tsk.lvin.ca/` (static, prebuilt binary)

The second deployment surface: an S3 bucket configured as a static website in `us-west-2`, fronted at `tsk.lvin.ca`. Public read on a single object. Bucket contents:

- `installer` (2 MB, 2025-03-16) — the live downloadable installer binary, served as the bucket's `IndexDocument`.
- `0.9.7_optskug_tskm-0.9.8_commaai_devel_commaai_nightly-dev.installer` (2 MB, 2025-03-16) — parametrized name encoding the build inputs: openpilot 0.9.7 base, optskug fork's `tskm-0.9.8` branch, commaai `devel`/`nightly-dev` signing/origin info baked in. Same date and size as `installer` — likely the same content under a documented filename.
- `scons_cache.tar.zst` (269 MB, 2025-03-19) — SCons build cache used while assembling the installer.

This bucket is independent of the Namecheap deployment and survives the Namecheap teardown intact. Storage is ~273 MB at S3 Standard rates (~$0.006/month).

## Relationship to canonical Python TSK Manager

The actual TSK Manager program lives in [calvinpark/openpilot](https://github.com/calvinpark/openpilot) under `tsk/` (different `tsk/` from this repo's `fork/` — same name, separate codebase). It is a Python program with `main.py`, `prefetch.py`, and per-platform `c3/` and `c4/` modules.

Versioned releases are preserved as branches on `calvinpark/openpilot`:

| Branch          | Latest commit date | Subject                             |
| --------------- | ------------------ | ----------------------------------- |
| `tskm` (active) | 2026-04-15         | Better flash                        |
| `tskm-0.11.0`   | 2026-04-10         | TSK Manager v0.11.0                 |
| `tskm-0.10.4`   | 2026-03-14         | TSK Manager v0.10.4                 |
| `tskm-0.10.2`   | 2025-11-21         | TSK Manager v0.10.2                 |
| `tskm-0.10.1`   | 2025-09-07         | Fix the tap / button click handling |
| `tskm-0.10.0`   | 2025-09-08         | TSK Manager v0.10.0                 |
| `tskm-c3`       | 2025-09-07         | Update recommended branches         |
| `tskm-0.9.9`    | 2025-06-16         | TSK Manager v0.9.9                  |
| `tskm-0.9.8`    | 2025-05-19         | TSK Manager Installer               |

The Python form is canonical and continues forward. The installer-generator experiment in this repo was an alternate distribution model that did not become the primary one.

## Outcome

The installer-based distribution did not displace the Python form. The Python TSK Manager continued forward through v0.11.0 and beyond, while the installer-generator experiment plateaued in April 2025. The artifacts remain in this repo (`main`, `phpf7.4`, `nodejs` branches) and in the `tsk.lvin.ca` S3 bucket as a record of the work.
