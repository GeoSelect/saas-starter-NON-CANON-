# Repository Strategy — Upstream Mirror vs. Productized Starter

## Two-Repo Model (Canonical)

To avoid confusion and enable parallel development, GeoSelect uses two separate repositories with distinct purposes:

### 1. GeoSelect/saas-starter (Upstream Mirror)

**Purpose**: Read-only mirror of `nextjs/saas-starter`

**Characteristics**:
- Synced periodically from upstream `nextjs/saas-starter:main`
- **No development happens here**
- Used only for PRs to upstream (e.g., CCP-03 feature branch)
- Serves as a stable, upstream-compatible baseline

**Usage**:
- Create feature branches for upstream PRs (`feature/ccp03-contracts`, etc.)
- Merge upstream changes regularly via `git pull upstream main`
- All merged work is "proven" against upstream expectations

**Mark Clearly**:
- Add notice to repo README: "⚠️ This is an upstream mirror. See GeoSelect_GH-saas-starter for active development."

---

### 2. GeoSelect_GH-saas-starter (Productized Starter) — **CANONICAL**

**Purpose**: The authoritative development repo for all CCP work, product features, and internal releases

**Characteristics**:
- **All CCP work happens here** (CCP-00, CCP-02, CCP-04+)
- Product branches for Supabase, auth, workspace, etc.
- Internal releases and deployments
- This is the "real" repo for GeoSelect.it development

**Usage**:
- Main branch: product baseline (Supabase + auth + core features)
- Feature branches: individual CCPs (e.g., `feature/ccp02-parcel-resolve`)
- Periodically syncs non-conflicting changes from upstream mirror
- PRs to upstream come from feature branches created here, then optionally merged back

**Dependency Flow**:
```
nextjs/saas-starter (upstream official)
  ↓ (sync)
GeoSelect/saas-starter (upstream mirror, read-only)
  ↓ (feature PRs to upstream)
Feature branches (feature/ccp03, feature/ccp02, etc.)
  ↓ (approved PRs merge to upstream)
nextjs/saas-starter (upstream updated with GeoSelect contributions)
  ↓ (periodic pull back)
GeoSelect_GH-saas-starter (productized starter, canonical for development)
  ↓
Product branches & releases
```

---

## Workflow Rules (Institutionalized)

1. **All development happens in `GeoSelect_GH-saas-starter`**
   - This is the canonical repo for CCP work.
   - No one should develop in the mirror repo.

2. **Upstream PRs originate from feature branches**
   - Create `feature/ccp03-contracts` in **mirror** repo (or push from productized repo if feasible)
   - Or: cherry-pick commits from productized → mirror → PR to upstream

3. **Periodic upstream sync**
   - Pull `upstream/main` into GeoSelect/saas-starter regularly
   - Merge changes into `GeoSelect_GH-saas-starter:main` if compatible
   - Resolve conflicts thoughtfully (prefer Supabase work + CCP scaffolding)

4. **Product releases come from productized starter**
   - Releases are cut from `GeoSelect_GH-saas-starter:main`
   - Include all CCP work + Supabase integrations + branding
   - Not from the mirror repo

5. **Clear ownership & communication**
   - Mirror: "Upstream-compatible, staging ground for PRs"
   - Productized: "Canonical development, product source of truth"

---

## Repository Setup

### GeoSelect/saas-starter (Mirror)
```bash
# Clone upstream
git clone https://github.com/nextjs/saas-starter.git

# Rename and push to mirror
git remote add origin https://github.com/GeoSelect/saas-starter.git
git branch -M main
git push -u origin main
```

**README addition**:
```markdown
⚠️ **Upstream Mirror**

This repository is a read-only mirror of [nextjs/saas-starter](https://github.com/nextjs/saas-starter).

For active development and CCP work, see [GeoSelect_GH-saas-starter](https://github.com/GeoSelect/GeoSelect_GH-saas-starter).

**This repo is used only for:**
- Creating feature branches for PRs to upstream
- Syncing upstream changes
- Baseline testing against nextjs/saas-starter

**Do not develop here.** All product work happens in GeoSelect_GH-saas-starter.
```

### GeoSelect_GH-saas-starter (Productized — Canonical)
```bash
# Primary development repo
# Main branch: product baseline (Supabase + auth + CCP scaffolding)
# Feature branches: individual CCPs
# Releases: cut from main

git clone https://github.com/GeoSelect/GeoSelect_GH-saas-starter.git
cd GeoSelect_GH-saas-starter

# Add upstream reference (optional, for periodic syncing)
git remote add upstream https://github.com/nextjs/saas-starter.git
```

**README addition**:
```markdown
✅ **Canonical Development Repository**

This is the authoritative development repo for GeoSelect.it.

**All CCP work happens here:**
- CCP-00 through CCP-16 implementations
- Product branches (Supabase, auth, workspace, etc.)
- Internal releases and deployments

**Branches:**
- `main`: Product baseline (Supabase + auth + core features)
- `feature/ccp*`: Individual capability implementations
- `product/*`: Product-specific branches (e.g., `product/white-label`)

**Contribution:**
See [CONTRIBUTING.md](./CONTRIBUTING.md) for CCP workflow and PR conventions.
```

---

## Migration Checklist (If Needed)

- [ ] Create GeoSelect/saas-starter as upstream mirror (if not already)
- [ ] Create GeoSelect_GH-saas-starter (if not already)
- [ ] Add README notices to both repos
- [ ] Update CONTRIBUTING.md to clarify two-repo model
- [ ] Update docs/strategy.md to reference this repo strategy doc
- [ ] Communicate to team: "All development happens in GeoSelect_GH-saas-starter"

---

## FAQ

**Q: Why two repos?**  
A: Separation of concerns. Mirror stays clean for upstream PRs. Productized repo can have Supabase, branding, and internal features without confusing upstream.

**Q: Can I make a PR from productized directly to upstream?**  
A: Yes, but it's cleaner to use the mirror. Push feature branch to mirror, then PR from there.

**Q: How do I sync upstream changes?**  
A: `git fetch upstream; git pull upstream main` in either repo, then merge into main thoughtfully.

**Q: Where do I work?**  
A: **GeoSelect_GH-saas-starter (productized).** This is canonical.

---

*Last updated: Jan 3, 2026*
