# ADORA AI — SECURITY SPECIFICATION (FIRESTORE ABAC)

## 1. Core Data Invariants

1. **User Scoping & Isolation**: Every resource path begins with `/users/{userId}/`. A user with authenticated UID `A` can NEVER read, create, update, or delete any document under `/users/{userId}/` where `userId != 'A'`.
2. **Author Identity Integrity**: When creating or updating a document, the inner `userId` field MUST match `request.auth.uid`.
3. **Immutability of Identity & Creation Timestamps**:
   - `id`, `userId`, and `createdAt` can NEVER be modified after creation (`incoming().userId == existing().userId`, `incoming().createdAt == existing().createdAt`).
4. **Path Parameter Hardening**: Document IDs in paths MUST conform to `isValidId(id)` (size <= 128 chars, regex `^[a-zA-Z0-9_\-]+$`).
5. **No Blanket Queries**: Querying subcollections (`allow list`) strictly requires `request.auth.uid == userId`.
6. **Immutable Execution Receipts**: Once written, documents in `execution_history` (Receipts) CANNOT be altered or deleted by any user or client (`allow update, delete: if false;`).
7. **Action-Based Update Protection**: State modifications must be explicitly partitioned into named actions with `diff(existing()).affectedKeys().hasOnly(...)`.
8. **Anti-Poisoning Limits**: String sizes are bounded (e.g. reflections <= 10,000 chars, titles <= 200 chars, tags arrays <= 15 items).

---

## 2. The "Dirty Dozen" Threat Payloads

| ID | Attack Vector | Target Path | Malicious Payload / Condition | Expected Result |
|----|---------------|-------------|-------------------------------|-----------------|
| D1 | Cross-tenant reflection read | `/users/user_B/reflections/ref_1` | User A reads User B's raw reflection | `PERMISSION_DENIED` |
| D2 | Cross-tenant memory write | `/users/user_B/memories/mem_1` | User A writes memory to User B's vault | `PERMISSION_DENIED` |
| D3 | Identity spoofing on create | `/users/user_A/reflections/ref_1` | `{ userId: "user_B", rawText: "..." }` | `PERMISSION_DENIED` |
| D4 | Tampering with receipt ledger | `/users/user_A/execution_history/rcpt_1` | Update `verificationStatus` to `'VERIFIED'` | `PERMISSION_DENIED` |
| D5 | Receipt deletion | `/users/user_A/execution_history/rcpt_1` | Delete audit proof | `PERMISSION_DENIED` |
| D6 | Memory tier escalation | `/users/user_A/memories/mem_1` | Update with invalid type: `type: "superuser_rule"` | `PERMISSION_DENIED` |
| D7 | Buffer overflow / Denial-of-wallet | `/users/user_A/reflections/ref_1` | `rawText` exceeding 10,000 chars (1MB string) | `PERMISSION_DENIED` |
| D8 | Path traversal / ID injection | `/users/user_A/memories/../../../etc` | Unsanitized path characters in document ID | `PERMISSION_DENIED` |
| D9 | Ghost field injection (Shadow update) | `/users/user_A/tasks/task_1` | Update `status` + inject `{ isAdmin: true }` | `PERMISSION_DENIED` |
| D10 | Modification of immutable `createdAt` | `/users/user_A/reflections/ref_1` | Mutating `createdAt` to arbitrary timestamp | `PERMISSION_DENIED` |
| D11 | Unauthenticated read | `/users/user_A/insights/ins_1` | Anonymous / unauthenticated request | `PERMISSION_DENIED` |
| D12 | Unconstrained collection scraping | `collectionGroup('memories')` | Global list query without userId filter | `PERMISSION_DENIED` |
