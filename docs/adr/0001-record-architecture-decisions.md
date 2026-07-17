---
title: "ADR-0001: Record architecture decisions"
---

# ADR-0001: Record architecture decisions

**Status:** Accepted

## Context

MeshBee is built by volunteers, in their spare time, across four repositories. People join,
drift away, and come back months later. Under those conditions the reasoning behind a decision
evaporates much faster than the decision itself.

The result is a codebase full of constraints that look arbitrary. Why is there a version integer
in every MQTT message? Why four repos instead of one? Someone eventually decides a constraint is
pointless, removes it, and rediscovers the original reason the hard way — in a field, with bees.

Git history doesn't fill this gap. It records *what* changed and rarely *why that option won over
the others that were considered*. The alternatives that were rejected, and the reasons they lost,
are exactly what a newcomer needs and exactly what's never written down.

## Decision

We record significant architecture decisions as ADRs in `docs/adr/`, numbered sequentially and
published on this site.

An ADR is short — context, decision, consequences — and written when the decision is made, while
the alternatives are still fresh. It captures the *why*, including what was rejected.

ADRs are immutable once accepted. A decision that changes doesn't get edited: it gets a new ADR
that supersedes the old one. The record of having believed something is itself worth keeping.

"Significant" means: hard to reverse, cross-repo, or constraining what future contributors can
do. Library choices and code layout generally don't qualify. Interface versioning does.

## Consequences

- New contributors can read why things are the way they are, rather than inferring it or asking.
- Writing one is friction at exactly the moment you're keen to just ship the thing. That friction
  is partly the point — a decision hard to justify in three paragraphs may need more thought.
- ADRs will drift from reality if nobody supersedes them. A stale ADR that reads as current is
  worse than no ADR. Reviewers should catch changes that contradict an accepted record.
- The [backfill list](index.md) starts non-empty: several load-bearing decisions predate this one.
