/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Adora AI Comprehensive Test Suite Runner
 * Runs against the active server at http://127.0.0.1:3000/api/v1
 */

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  latencyMs: number;
  details?: string;
}

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function runTests() {
  console.log('====================================================');
  console.log(' ADORA AI — AUTOMATED INTEGRATION & VERIFICATION SUITE');
  console.log('====================================================\n');

  const results: TestResult[] = [];

  // Helper fetcher
  async function testCase(id: string, name: string, fn: () => Promise<void>) {
    const start = Date.now();
    try {
      await fn();
      const latencyMs = Date.now() - start;
      results.push({ id, name, passed: true, latencyMs });
      console.log(`[PASS] ${id}: ${name} (${latencyMs}ms)`);
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      results.push({ id, name, passed: false, latencyMs, details: err.message });
      console.error(`[FAIL] ${id}: ${name} (${latencyMs}ms) -> ${err.message}`);
    }
  }

  // 1. Health & System
  await testCase('TC-SYS-001', 'System Health & Service Registry', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== 'healthy') throw new Error(`Unhealthy status: ${json.status}`);
    if (!json.services?.nebiusNemotron) throw new Error('Missing nebiusNemotron service');
    if (!json.services?.googleGenAI) throw new Error('Missing googleGenAI service');
  });

  // 2. Auth Identity
  await testCase('TC-AUTH-001', 'User Context Resolution', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.data?.user?.id) throw new Error('Missing user id in profile');
  });


  // 3. Reflection Ingestion & Storage
  let createdRefId = '';
  await testCase('TC-REF-001', 'Reflection Capture & Validation', async () => {
    const payload = {
      rawText: 'Today we aligned on prioritizing cognitive safety and cryptographic verification before launching autonomous agents.',
      category: 'strategic',
      tags: ['safety', 'architecture', 'agents'],
      moodRating: 5,
      energyRating: 4,
      sourceType: 'text',
    };
    const res = await fetch(`${BASE_URL}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.data?.reflection?.id) throw new Error('Reflection ID not returned');
    createdRefId = json.data.reflection.id;
  });

  // 4. Nemotron Entity Extraction Pipeline
  await testCase('TC-NEM-002', 'NVIDIA Nemotron Structured Extraction', async () => {
    if (!createdRefId) throw new Error('Prerequisite reflection not created');
    const res = await fetch(`${BASE_URL}/reflections/${createdRefId}/extract`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const entities = json.data?.extractedEntities;
    if (!entities) throw new Error('extractedEntities missing');
    if (!Array.isArray(entities.events) || !Array.isArray(entities.decisions) || !Array.isArray(entities.goals)) {
      throw new Error('Entity arrays missing from extraction output');
    }
  });

  // 5. Memory Vault Promotion
  let createdMemId = '';
  await testCase('TC-MEM-001', 'Atomic Memory Vault Storage', async () => {
    const payload = {
      title: 'Prioritize Cryptographic Verification',
      statement: 'Autonomous agents must produce SHA-256 verifiable execution receipts prior to state commitment.',
      type: 'procedural',
      userApprovalState: 'approved',
      sourceReflectionIds: createdRefId ? [createdRefId] : [],
      tags: ['security', 'verification', 'agents'],
      confidenceScore: 0.95,
    };
    const res = await fetch(`${BASE_URL}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.data?.memory?.id) throw new Error('Memory ID not returned');
    createdMemId = json.data.memory.id;
  });

  // 6. Memory Vault Semantic Query
  await testCase('TC-RAG-002', 'Memory Retrieval & Filtering', async () => {
    const res = await fetch(`${BASE_URL}/memories?type=procedural`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const items = json.data?.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error('No memories found');
  });

  // 7. Pattern Discovery
  await testCase('TC-INS-001', 'Insight Hypothesis Generation', async () => {
    const res = await fetch(`${BASE_URL}/insights/discover`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.data?.candidateInsights) throw new Error('Candidate insights missing');
  });

  // 8. Reflection Grove Knowledge Graph
  await testCase('TC-GRV-001', 'Reflection Grove Graph Construction', async () => {
    const res = await fetch(`${BASE_URL}/grove/graph`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.data?.nodes) || !Array.isArray(json.data?.edges)) {
      throw new Error('Graph nodes or edges missing');
    }
  });

  // 9. Workflows & Goal Planning
  let consequentialTaskId = '';
  await testCase('TC-AGT-001', 'Goal Decomposition into DAG Workflow', async () => {
    const payload = {
      goal: 'Prepare and schedule a product architecture briefing for the executive committee.',
    };
    const res = await fetch(`${BASE_URL}/workflows/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const tasks = json.data?.tasks;
    if (!tasks || tasks.length < 2) throw new Error('Workflow did not produce task DAG');
    const tier2Task = tasks.find((t: any) => t.consequentialityTier === 2);
    if (!tier2Task) throw new Error('Tier 2 consequential task not found in plan');
    consequentialTaskId = tier2Task.id;
  });

  // 10. Tier 2 Consequential Action Gatekeeper (Must reject unapproved execution)
  await testCase('TC-AGT-003', 'Gatekeeper: Reject Unapproved Tier 2 Execution', async () => {
    if (!consequentialTaskId) throw new Error('No consequential task ID');
    const res = await fetch(`${BASE_URL}/tasks/${consequentialTaskId}/execute`, {
      method: 'POST',
    });
    if (res.status !== 403) {
      throw new Error(`Expected HTTP 403 APPROVAL_REQUIRED, got HTTP ${res.status}`);
    }
  });

  // 11. Human Approval Gate
  await testCase('TC-AGT-002', 'Human Approval Sign-off', async () => {
    if (!consequentialTaskId) throw new Error('No consequential task ID');
    const res = await fetch(`${BASE_URL}/tasks/${consequentialTaskId}/approve`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.data?.status !== 'APPROVED') {
      throw new Error(`Expected APPROVED status, got ${json.data?.status}`);
    }
  });

  // 12. Approved Execution & Cryptographic Receipt Issuance
  await testCase('TC-AGT-005', 'Independent Verification & Cryptographic Receipt', async () => {
    if (!consequentialTaskId) throw new Error('No consequential task ID');
    const res = await fetch(`${BASE_URL}/tasks/${consequentialTaskId}/execute`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const receipt = json.data?.receipt;
    if (!receipt) throw new Error('Execution receipt not issued');
    if (receipt.inputPayloadHash.length !== 64 || receipt.outputPayloadHash.length !== 64) {
      throw new Error('Invalid SHA-256 digest length on execution receipt');
    }
    if (receipt.verificationStatus !== 'VERIFIED') {
      throw new Error(`Expected VERIFIED receipt status, got ${receipt.verificationStatus}`);
    }
  });

  // 13. Audit Ledger Query
  await testCase('TC-AGT-006', 'Tamper-Evident Receipt Ledger Retrieval', async () => {
    const res = await fetch(`${BASE_URL}/receipts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.data?.items) || json.data.items.length === 0) {
      throw new Error('Receipts ledger is empty');
    }
  });

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log('\n====================================================');
  console.log(` RESULTS: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
