# OC-08C — Experimental egress security gate

Status: hardening in progress, **not production approved**.

This change requires explicit per-host approved IP addresses, and every DNS answer must be both public according to the current conservative filter and on that host's approved list. It also introduces stream pause/resume backpressure. No implicit IP discovery approval is permitted.

Remaining security review before any automated polling:
- Replace the provisional public-address filter with comprehensive, tested IP classification including mapped IPv6, special-use and future registry updates.
- Validate hostname normalization, IDNA, wildcard and trailing-dot handling.
- Exercise real HTTPS connections under timeout, abort, slow-body, malformed chunk, TLS failure, response disconnect and resource exhaustion.
- Ensure DNS results and approved IP inventory are maintained securely, and apply network-level egress restrictions in deployment.
- Confirm redirect denial, TLS hostname verification, bounded memory, logging, and request concurrency limits.
- Independent security review and explicit approval are required before production activation.

OC-08D polling remains blocked on this gate.