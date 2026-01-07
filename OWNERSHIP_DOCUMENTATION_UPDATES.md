# Ownership Documentation Updates

## Purpose

Guidance for updating all existing audit documentation with ownership markers.  
Ensures every document clearly states who owns it and who to consult.

---

## Documentation Ownership Updates

### Backend-Owned Documentation (Primary: Backend, Secondary: Security)

#### 1. AUDIT_IMPLEMENTATION_GUIDE.md

**Current Status**: Exists (800 lines)

**Add to Top (After title)**:
```markdown
## Ownership
🔒 **Owned by**: Backend/SRE  
👀 **Consult**: Security (on retention policies)  
📋 **Updated**: 2026-01-07

### Document Intent
This guide walks Backend engineers and DBAs through step-by-step implementation of the audit system. 
Implementation decisions are made by Backend; Security reviews compliance requirements.

### Before You Change This Document
- **Adding new table/column**: ✅ Backend decides
- **Modifying constraints**: ✅ Backend decides (with code review)
- **Changing retention defaults**: 🔒 Security decides (notify via OWNERSHIP_INTAKE.md)
- **Adding compliance section**: 👀 Get Security review
- **Changing deployment steps**: ✅ Backend/SRE coordinate
```

**Add to Sections**:
```markdown
### 3.1 Create audit_trail Table
🔒 Backend owns this schema. Do not modify without code review.

### 3.2 Create Constraints
🔒 Backend owns constraint logic. Security reviews for compliance gaps.

### 5.1 Create Archive Function
🔒 Backend owns archive operations. SRE monitors job execution.

### 5.2 Schedule Daily Archive (pg_cron)
🔒 SRE owns scheduling. Backend defines the function being scheduled.
```

---

#### 2. AUDIT_QUICK_REFERENCE.md

**Current Status**: Exists (300 lines)

**Add to Top**:
```markdown
## Ownership
🔒 **Owned by**: Backend  
👀 **Consult**: Security (on deletion queries)  
📋 **Updated**: 2026-01-07

### Quick Reference Intent
This is a lookup guide for common audit queries. 
Use these examples in your code or one-off analysis.

### Warning: Deletion Queries
⚠️ Deletion queries below require Security approval. Do not run in production without explicit authorization.
```

**Add sections**:
```markdown
### Security: Deletion Queries ⚠️

🔒 **Owned by**: Security/Compliance  
⚠️ These queries should only be run with explicit approval

#### Query: Find audit records for a user
[... existing query ...]
**Approval Required**: Security team must approve per OWNERSHIP_INTAKE.md

#### Query: Get deletion audit trail
[... existing query ...]
**Who Can Run**: Security only (via RLS policy)
```

---

#### 3. WORKSPACE_AUDIT_TRIGGERS.md

**Current Status**: Exists (500 lines)

**Add to Top**:
```markdown
## Ownership
🔒 **Owned by**: Backend  
👀 **Consult**: Security (on PII in changes column)  
📋 **Updated**: 2026-01-07

### Trigger Intent
This guide explains the 6 triggers that automatically log workspace events.
These triggers are owned by Backend. Security reviews the data being captured to ensure no PII is unintentionally stored.
```

**Add to each trigger section**:
```markdown
### Trigger 1: audit_insert_trigger (On INSERT to audit_trail)
🔒 **Owner**: Backend  
✅ **Status**: Production-ready

This trigger fires on every insert to audit_trail and...

### Trigger 2: audit_workspace_created_trigger (On INSERT to workspaces)
🔒 **Owner**: Backend  
👀 **Security Review**: Verify no PII in 'name' or 'metadata'
✅ **Status**: Production-ready

This trigger logs when a workspace is created...
```

---

#### 4. AUDIT_QUICK_START.md

**Current Status**: Exists (200 lines, but user undid)

**Recommendation**: Recreate with ownership callouts

```markdown
# Audit Quick Start (30 min)

## Ownership
🟡 **Owned by**: SRE/Backend  
👀 **Consult**: Security (on compliance requirements)  
📋 **Updated**: 2026-01-07

### Intent
Fast deployment path for audit system. 
SRE uses this for quick setup in new environments. 
Backend provides the SQL; SRE executes and monitors.

### Phase 1: Review Checklist (SRE)
🟡 SRE: Check prerequisites

### Phase 2: Deploy Schema (Backend + SRE)
🔒 Backend provides SQL, SRE executes in target DB

### Phase 3: Verify Tables (Backend)
🔒 Backend verifies schema integrity

### Phase 4: Setup Monitoring (SRE)
🟡 SRE sets up Datadog dashboards

### Phase 5: Go Live (SRE + Product)
🟡 SRE coordinates, Product approves cutover
```

---

#### 5. AUDIT_DEPLOYMENT_CHECKLIST.md

**Current Status**: Exists (600 lines)

**Add to Top**:
```markdown
## Ownership
🟡 **Owned by**: SRE (primary), Backend (secondary)  
👀 **Consult**: Security (on compliance gates), Product (on cutover timing)  
📋 **Updated**: 2026-01-07

### Checklist Intent
This is the master deployment checklist. 
SRE leads deployment. Backend provides technical support. 
Security approves compliance gates.
```

**Add to phase headers**:
```markdown
## Phase 3: Test Audit Schema (Backend-led)
✅ **Responsible**: Backend engineers  
👀 **Review**: SRE (on test environment health)

## Phase 5: Staging Deployment (SRE-led)
🟡 **Responsible**: SRE/DevOps  
👀 **Review**: Backend (on schema integrity)

## Phase 6: Production Rollout (SRE-led with Backend support)
🟡 **Responsible**: SRE/DevOps  
🔒 **Gate**: Security approval on retention policies  
👀 **Review**: Backend (on query performance)

## Phase 9: Cutover (Product + SRE-led)
🟡 **Responsible**: SRE (execution), Product (approval)  
📋 **Notify**: Backend (post-deployment verification)
```

---

### Security-Owned Documentation

#### Create: COMPLIANCE_MAPPING.md

**New File** (Should create - 300 lines)

```markdown
# Compliance Mapping for Audit System

## Ownership
🔒 **Owned by**: Security/Compliance  
👀 **Consult**: Backend (on implementation), SRE (on verification)  
📋 **Updated**: 2026-01-07

### Purpose
Maps audit system capabilities to compliance requirements.
Security team owns this document.

## GDPR Compliance

### Data Subject Access Right (GDPR Art. 15)
**Requirement**: User can request export of all data we hold  
**Implementation**: `audit_get_user_data_for_request(user_id, workspace_id)`  
**Owner**: Security  
**Process**:
1. Customer requests data
2. Support creates ticket
3. Security runs query
4. Security reviews for sensitive data (email addresses, etc.)
5. Security exports to JSON
6. Support provides to customer

**SLA**: 30 days from request  
**Verification**: Quarterly audit of exports

### Right to Erasure (GDPR Art. 17)
**Requirement**: User can request deletion of their data  
**Implementation**: `audit_erase_user_data(user_id, workspace_id, reason)`  
**Owner**: Security  
**Process**:
1. Customer requests erasure
2. Support creates ticket
3. Security verifies retention period has not passed
4. Security approves erasure
5. Security runs deletion function
6. Deletion logged to compliance_deletion_log

**Exception**: If retention period not met, deny request  
**SLA**: 30 days from request  
**Verification**: Deletion audit trail in compliance_deletion_log

## SOC2 Compliance

### Immutable Audit Log (CC6.1)
**Requirement**: Audit log cannot be modified after creation  
**Implementation**: 
- No UPDATE/DELETE on audit_trail
- Constraints prevent data modification
- Triggers prevent unauthorized changes

**Owner**: Backend (implementation), Security (verification)  
**Verification**: Quarterly testing of immutability

### Change Tracking (CC6.2)
**Requirement**: All changes tracked with before/after values  
**Implementation**: `changes` JSONB column captures delta  
**Owner**: Backend (implementation), Security (verification)  
**Verification**: Sample audit records reviewed quarterly

### Actor Identification (CC6.3)
**Requirement**: Know who made changes  
**Implementation**: `actor_id` column tracks user  
**Owner**: Backend (via auth context), Security (verification)  
**Verification**: Spot-check actor_id matches logs

### Timestamp Accuracy (CC6.4)
**Requirement**: Timestamps are accurate and ordered  
**Implementation**: DB-generated created_at (NOT application)  
**Owner**: Backend (DB config), Security (verification)  
**Verification**: Monthly NTP check on DB server

## CCPA Compliance

### Consumer Right to Know (Cal. Civ. Code § 1798.100)
**Requirement**: Consumers can request data we hold  
**Implementation**: `audit_get_user_data_for_request()`  
**Owner**: Security  
**SLA**: 45 days from verifiable request

### Consumer Right to Delete (Cal. Civ. Code § 1798.105)
**Requirement**: Consumers can request deletion  
**Implementation**: `audit_erase_user_data()`  
**Owner**: Security  
**Exception**: Retain if legally required  
**SLA**: 45 days from verifiable request

## Deletion Approval Matrix

| Deletion Type | Requester | Approver | Evidence | Logged |
|---|---|---|---|---|
| User data (GDPR) | Customer | Security | Email ticket | ✅ compliance_deletion_log |
| Workspace data (Churn) | Product | Security | Ticket | ✅ compliance_deletion_log |
| Audit retention (365d+) | SRE | Security | Cron job | ✅ compliance_deletion_log |
| Breach response | Security | Security + Exec | Incident ticket | ✅ compliance_deletion_log |

## Annual Compliance Review

**Owner**: Security  
**Frequency**: Yearly  
**Checklist**:
- [ ] All Data Subject Requests processed on time
- [ ] All Deletions properly approved
- [ ] Immutability tested on audit_trail
- [ ] RLS policies reviewed
- [ ] Deletion audit trail complete
- [ ] Documentation current

**Sign-off**: Security Lead

---

## References
- OWNERSHIP_INTAKE.md (ownership structure)
- AUDIT_IMPLEMENTATION_GUIDE.md (implementation)
- AUDIT_SYSTEM_OWNERSHIP_VALIDATION.md (validation)
```

---

#### Create: MONITORING_ALERTS.md

**New File** (Should create - 250 lines)

```markdown
# Audit System Monitoring & Alerts

## Ownership
🟡 **Owned by**: SRE  
👀 **Consult**: Backend (on metric interpretation), Security (on compliance alerts)  
📋 **Updated**: 2026-01-07

### Purpose
Defines monitoring dashboards and alerting rules for audit system.
SRE team owns this document.

## Dashboards

### Dashboard 1: Archive Health (SRE Monitor)
**Location**: Datadog (Audit > Archive Health)  
**Refresh**: 5 minutes  
**Purpose**: Monitor daily archive job

**Metrics**:
- Archive job completion time (target: <5 min)
- Archive job failure rate (target: 0%)
- Rows archived yesterday (vs. average)
- Warm storage size (growing as expected?)
- Cold storage size (stable after cutover?)

**Alert**: If archive job doesn't complete by 3 AM, page SRE

### Dashboard 2: Partition Health (SRE Monitor)
**Location**: Datadog (Audit > Partition Health)  
**Refresh**: 1 hour  
**Purpose**: Monitor monthly partition creation

**Metrics**:
- Partitions created this month (expected: 1 on the 1st)
- Partition creation latency (target: <1 min)
- Query plans using partitions (target: >95%)
- Partition pruning effectiveness (target: >80%)

**Alert**: If partition not created by 2nd of month, page SRE

### Dashboard 3: Growth & Scale (Engineering)
**Location**: Datadog (Audit > Scale)  
**Refresh**: 1 hour  
**Purpose**: Monitor audit table growth

**Metrics**:
- Total audit_trail rows
- Daily row growth
- Rows by action type (CREATE, UPDATE, DELETE, etc.)
- Growth rate trend (last 30 days)
- Projected table size (1 year forecast)

**Alert**: If daily growth >10x average, investigate

### Dashboard 4: Compliance (Security)
**Location**: Datadog (Audit > Compliance)  
**Refresh**: 1 day  
**Purpose**: Monitor deletion compliance

**Metrics**:
- Deletions this month
- Deletions by reason (GDPR, workspace churn, etc.)
- Deletion approval latency (target: <24 hours)
- Compliance deletion log size
- Cold storage purges completed

**Alert**: If deletions >1000 in 24 hours, notify Security

## Alerting Rules

### Alert 1: Archive Job Failure 🔴
**Metric**: Cron job `archive_daily()` not completed  
**Condition**: No successful job completion by 3 AM  
**Severity**: Critical  
**Owner**: SRE  
**Action**: Page SRE on-call, check cron logs  
**Runbook**: (link to runbook)

### Alert 2: Partition Creation Failure 🔴
**Metric**: Cron job `partition_create_monthly()` not completed  
**Condition**: No new partition by 2nd of month  
**Severity**: Critical  
**Owner**: SRE  
**Action**: Page SRE on-call, run partition creation manually  

### Alert 3: Audit Table Growth Spike 🟡
**Metric**: audit_trail row growth rate  
**Condition**: >50% growth in 1 hour  
**Severity**: Warning  
**Owner**: Backend/SRE  
**Action**: Investigate cause, check for runaway triggers  

### Alert 4: Deletion Log Growth Spike 🔴
**Metric**: compliance_deletion_log growth  
**Condition**: >1000 rows in 24 hours  
**Severity**: Critical  
**Owner**: Security  
**Action**: Review deletion requests, investigate if unauthorized  

### Alert 5: Cold Storage Full 🔴
**Metric**: Disk usage of cold storage  
**Condition**: >90% of allocated storage  
**Severity**: Critical  
**Owner**: SRE  
**Action**: Run purge job, increase storage allocation  

## SLOs (Service Level Objectives)

| SLO | Target | Owner | Review |
|---|---|---|---|
| Archive job completion | 99.9% | SRE | Monthly |
| Partition creation | 99.9% | SRE | Monthly |
| Audit trail availability | 99.99% | SRE | Quarterly |
| GDPR request completion | 100% on-time | Security | Quarterly |
| Deletion log accuracy | 100% | Security | Quarterly |

## On-Call Runbooks

### Runbook 1: Archive Job Failed

1. Check if job is currently running: `SELECT * FROM pg_stat_activity WHERE query LIKE '%archive%'`
2. If running, wait 5 minutes and check again
3. If not running, check cron logs: `SELECT * FROM audit_log WHERE job_name = 'archive_daily' ORDER BY run_time DESC LIMIT 5`
4. Check disk space: `SELECT pg_database_size(current_database())`
5. If disk full, alert SRE Lead
6. If other error, restart cron job: `SELECT cron.schedule('archive_daily', '0 2 * * *', 'SELECT archive_daily()')`

### Runbook 2: Partition Not Created

1. Check if monthly partition exists: `SELECT * FROM information_schema.tables WHERE table_name LIKE 'audit_trail_202601'`
2. If not, run manually: `SELECT partition_create_monthly()`
3. Verify new partition: `SELECT COUNT(*) FROM audit_trail_202601`
4. If still fails, check logs for errors: `SELECT * FROM pg_stat_statements WHERE query LIKE '%partition_create%'`
5. Escalate to Backend if DDL error

### Runbook 3: Deletion Spike

1. Check who deleted: `SELECT approved_by, reason, COUNT(*) FROM compliance_deletion_log WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY approved_by, reason`
2. If unauthorized approver, investigate: `SELECT * FROM compliance_deletion_log WHERE approved_by = 'unknown_user'`
3. If breach suspected, escalate to Security Lead
4. Review deleted records: `SELECT entity_type, entity_id, COUNT(*) FROM compliance_deletion_log GROUP BY entity_type, entity_id ORDER BY COUNT(*) DESC`

## Metrics to Export

**To Security Team** (Monthly):
- Total data subject requests (GDPR)
- Data subject requests completed on-time
- Total deletions approved
- Largest deletion event (entities deleted)

**To Backend Team** (Monthly):
- Total audit trail rows
- Daily row growth
- Query latency (p50, p95, p99)
- Table size (MB)

**To Executives** (Quarterly):
- SLO compliance (archive, partitions, availability)
- Deletion audit summary
- Compliance status (GDPR, SOC2, CCPA)

---

## References
- OWNERSHIP_INTAKE.md (ownership structure)
- AUDIT_SYSTEM_OWNERSHIP_VALIDATION.md (validation)
```

---

### SRE-Owned Documentation

#### Create: BACKUP_RESTORE_RUNBOOK.md

**New File** (Should create - 300 lines)

```markdown
# Audit System Backup & Restore Runbook

## Ownership
🟡 **Owned by**: SRE  
👀 **Consult**: Backend (on schema), Security (on compliance implications)  
📋 **Updated**: 2026-01-07

### Purpose
Backup and disaster recovery procedures for audit system.
SRE team owns this document.

## Backup Strategy

### Backup Frequency
- **Hot storage (0-30 days)**: Daily at 1 AM (full backup + WAL)
- **Warm storage (30-90 days)**: Daily (archive tables)
- **Cold storage (90-365 days)**: Weekly (archived tables)
- **Compliance log**: Daily (separate backup location)

### Backup Location
- Production: `s3://geoselect-backups/postgres/prod-audit/`
- Staging: `s3://geoselect-backups/postgres/staging-audit/`
- Retention: 2 years (compliance requirement)

### Backup Verification
- Daily: Restore to staging, run 5 test queries
- Weekly: Full recovery test to fresh RDS instance
- Monthly: Backup integrity report to Security

## Restore Procedures

### Restore Hot Storage (Recent Data)
**Scenario**: Accidental delete in last 30 days  
**Owner**: SRE  
**Approver**: Backend + Security

1. Stop applications (prevent writes)
2. Create new RDS instance from backup
3. Verify schema integrity
4. Run test queries (see verification below)
5. DNS cutover to new instance
6. Monitor for 1 hour
7. Delete old instance after verification

**RTO**: 2 hours  
**RPO**: 1 hour  
**Verification Queries**:
```sql
SELECT COUNT(*) FROM audit_trail;
SELECT action, COUNT(*) FROM audit_trail GROUP BY action;
SELECT entity_type, COUNT(*) FROM audit_trail GROUP BY entity_type;
```

### Restore Warm Storage (30-90 day old data)
**Scenario**: Data corruption in archived tables  
**Owner**: SRE  
**Approver**: Security + Backend

1. Restore to separate instance
2. Copy audit_trail_archive_* tables
3. Verify counts match expected
4. Copy to production instance
5. Test queries
6. Cleanup separate instance

**RTO**: 4 hours  
**RPO**: 1 day

### Restore Cold Storage (90-365 day old data)
**Scenario**: Compliance data needed for audit  
**Owner**: SRE + Security  
**Approver**: Security + Legal

1. Retrieve from cold backup
2. Restore audit_trail_cold_* table
3. Grant Security read-only access
4. Security exports data
5. Cleanup after export

**RTO**: 8 hours  
**RPO**: 1 week

## Disaster Recovery

### RTO/RPO Targets
- **Hot storage**: RTO 2 hours, RPO 1 hour
- **Warm storage**: RTO 4 hours, RPO 1 day
- **Cold storage**: RTO 8 hours, RPO 1 week

### Failover Decision Matrix

| Scenario | RTO | RPO | Approver | Procedure |
|---|---|---|---|---|
| DB corruption | 2 hours | 1 hour | VP Eng | Restore from backup |
| Ransomware | 4 hours | 24 hours | VP Eng + Security | Air-gap restore |
| Compliance deletion error | 2 hours | 1 hour | Security | Restore from compliance log |

### Annual DR Test

**Frequency**: Quarterly  
**Owner**: SRE  
**Duration**: 4 hours  
**Process**:
1. Restore from backup to staging
2. Run full verification test suite
3. Validate against compliance requirements
4. Time restoration procedures
5. Document results
6. Update runbook with learnings

**Success Criteria**:
- Restoration completes within RTO target
- All verification queries pass
- Data integrity verified
- Zero data loss from last backup

## Backup Verification Checklist

### Daily Verification (5 min)
- [ ] Backup file created
- [ ] Backup file size reasonable (within 2x yesterday's size)
- [ ] Restore to staging from backup
- [ ] Run 5 test queries
- [ ] Delete staging instance

### Weekly Verification (30 min)
- [ ] Full recovery test to new RDS
- [ ] Schema verification
- [ ] Constraint verification
- [ ] Index verification
- [ ] Query performance baseline
- [ ] Document any anomalies

### Monthly Verification (1 hour)
- [ ] Backup integrity report
- [ ] File format verification
- [ ] Encryption verification
- [ ] Storage location verification
- [ ] Retention policy verification
- [ ] Sign-off by Security

## References
- OWNERSHIP_INTAKE.md (ownership structure)
- AUDIT_SYSTEM_OWNERSHIP_VALIDATION.md (validation)
- AUDIT_DEPLOYMENT_CHECKLIST.md (deployment)
```

---

## Documentation Update Summary

### Files to Update (Add Ownership Headers)

| File | Action | Owner | Estimated Time |
|---|---|---|---|
| AUDIT_IMPLEMENTATION_GUIDE.md | Add ownership header + section callouts | Backend | 15 min |
| AUDIT_QUICK_REFERENCE.md | Add ownership header + security warnings | Backend | 10 min |
| WORKSPACE_AUDIT_TRIGGERS.md | Add ownership header + trigger ownership | Backend | 10 min |
| AUDIT_QUICK_START.md | Recreate with ownership callouts | SRE | 20 min |
| AUDIT_DEPLOYMENT_CHECKLIST.md | Add ownership header + phase owners | SRE | 15 min |
| AUDIT_INDEX.md | Add ownership column to file table | Backend | 10 min |
| AUDIT_SYSTEM_COMPLETE.md | Add ownership section | Backend | 10 min |
| AUDIT_DELIVERY_SUMMARY.md | Add ownership acknowledgments | Backend | 5 min |

### Files to Create (New)

| File | Purpose | Owner | Priority |
|---|---|---|---|
| COMPLIANCE_MAPPING.md | GDPR/SOC2/CCPA compliance | Security | High |
| MONITORING_ALERTS.md | Dashboards & alerting rules | SRE | High |
| BACKUP_RESTORE_RUNBOOK.md | Disaster recovery procedures | SRE | High |
| INCIDENT_RESPONSE_AUDIT.md | Breach response playbook | Security | Medium |

### Total Effort

- **Updates**: 8 files, ~95 minutes
- **New creation**: 4 files, ~1200 lines of documentation
- **Total**: 2-3 hours for complete documentation refresh

---

## Next Steps

1. ✅ Update 5 existing files with ownership headers
2. ✅ Create 4 new documentation files
3. ✅ Add ownership column to AUDIT_INDEX.md
4. ✅ Circulate for review (Backend, Security, SRE)
5. ✅ Implement quarterly review cycle

---

**Status**: Guidance provided  
**Created**: 2026-01-07  
**Owner**: Backend (documentation), Security (compliance docs), SRE (operations docs)
