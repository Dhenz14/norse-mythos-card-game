/**
 * ID Allocation System
 * 
 * Provides automatic ID allocation from reserved ranges,
 * preventing collisions and ensuring consistent ID assignment.
 */
import * as fs from 'fs';
import * as path from 'path';

interface IdRange {
  start: number;
  end: number;
  nextAvailable: number;
  description: string;
  locked?: boolean;
}

interface IdRegistry {
  _description: string;
  _version: string;
  ranges: Record<string, IdRange>;
  usedIds: Record<string, number[]>;
}

const REGISTRY_PATH = path.join(__dirname, 'idRegistry.json');

export function loadRegistry(): IdRegistry {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  return JSON.parse(content);
}

export function saveRegistry(registry: IdRegistry): void {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export function allocateId(rangeKey: string): number {
  const registry = loadRegistry();
  const range = registry.ranges[rangeKey];
  
  if (!range) {
    throw new Error(`Unknown range key: ${rangeKey}. Available: ${Object.keys(registry.ranges).join(', ')}`);
  }
  
  if (range.locked) {
    throw new Error(`Range '${rangeKey}' is locked: ${range.description}`);
  }
  
  if (range.nextAvailable > range.end) {
    throw new Error(`Range '${rangeKey}' is exhausted (${range.start}-${range.end})`);
  }
  
  const allocatedId = range.nextAvailable;
  range.nextAvailable++;
  
  if (!registry.usedIds[rangeKey]) {
    registry.usedIds[rangeKey] = [];
  }
  registry.usedIds[rangeKey].push(allocatedId);
  
  saveRegistry(registry);
  
  return allocatedId;
}

export function allocateMultipleIds(rangeKey: string, count: number): number[] {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(allocateId(rangeKey));
  }
  return ids;
}

export function isIdAvailable(id: number): boolean {
  const registry = loadRegistry();
  
  for (const range of Object.values(registry.ranges)) {
    if (id >= range.start && id <= range.end) {
      return id >= range.nextAvailable;
    }
  }
  
  return true;
}

export function getRangeForId(id: number): string | null {
  const registry = loadRegistry();
  
  for (const [key, range] of Object.entries(registry.ranges)) {
    if (id >= range.start && id <= range.end) {
      return key;
    }
  }
  
  return null;
}

export function getRangeInfo(rangeKey: string): IdRange | null {
  const registry = loadRegistry();
  return registry.ranges[rangeKey] || null;
}

export function listRanges(): Record<string, { available: number; total: number; description: string }> {
  const registry = loadRegistry();
  const result: Record<string, { available: number; total: number; description: string }> = {};
  
  for (const [key, range] of Object.entries(registry.ranges)) {
    const total = range.end - range.start + 1;
    const used = range.nextAvailable - range.start;
    result[key] = {
      available: total - used,
      total,
      description: range.description,
    };
  }
  
  return result;
}

export function checkCollisions(ids: number[]): { hasCollisions: boolean; collisions: number[] } {
  const seen = new Set<number>();
  const collisions: number[] = [];
  
  for (const id of ids) {
    if (seen.has(id)) {
      collisions.push(id);
    } else {
      seen.add(id);
    }
  }
  
  return {
    hasCollisions: collisions.length > 0,
    collisions,
  };
}
