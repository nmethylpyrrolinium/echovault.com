# Security Policy

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this repository. Do not open a public issue containing credentials, exploit details, personal journal data, or other sensitive information.

Include the affected file or feature, reproduction steps, impact, and any suggested mitigation. Reports will be reviewed as maintainer availability allows; no fixed response-time guarantee is currently offered.

## Scope and data model

EchoVault is local-first, but optional account and sync features may connect to services configured by a deployer. Browser storage, exported journal files, and screenshots can contain sensitive personal content and should be handled accordingly.

## Deployment guidance

- Never place service-role keys, private API keys, or privileged credentials in frontend code.
- Treat all values shipped to a browser as public, including browser-safe publishable keys.
- Keep row-level security enabled and reviewed for any connected Supabase project.
- Store real deployment configuration outside the repository.
- Rotate any credential or access code that was previously committed, even after removing it from the current tree.
