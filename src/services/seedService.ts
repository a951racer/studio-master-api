import LookupEntry from '../models/LookupEntry';

interface SeedEntry {
  listType: 'workflow-stage' | 'file-format' | 'file-type' | 'phone-number-type' | 'role';
  name: string;
  sequenceOrder: number;
}

const defaultSeeds: SeedEntry[] = [
  // Workflow Stages (ordered)
  { listType: 'workflow-stage', name: 'Ideation', sequenceOrder: 1 },
  { listType: 'workflow-stage', name: 'Planning', sequenceOrder: 2 },
  { listType: 'workflow-stage', name: 'Tracking', sequenceOrder: 3 },
  { listType: 'workflow-stage', name: 'Mixing', sequenceOrder: 4 },
  { listType: 'workflow-stage', name: 'Mastering', sequenceOrder: 5 },
  { listType: 'workflow-stage', name: 'Delivering', sequenceOrder: 6 },
  { listType: 'workflow-stage', name: 'Complete', sequenceOrder: 7 },

  // File Formats
  { listType: 'file-format', name: 'Mp3', sequenceOrder: 0 },
  { listType: 'file-format', name: 'Wav', sequenceOrder: 0 },
  { listType: 'file-format', name: 'Midi', sequenceOrder: 0 },
  { listType: 'file-format', name: 'Csv', sequenceOrder: 0 },
  { listType: 'file-format', name: 'Other', sequenceOrder: 0 },

  // File Types
  { listType: 'file-type', name: 'Raw Track', sequenceOrder: 0 },
  { listType: 'file-type', name: 'Mix Down', sequenceOrder: 0 },
  { listType: 'file-type', name: 'Master', sequenceOrder: 0 },
  { listType: 'file-type', name: 'Other', sequenceOrder: 0 },

  // Phone Number Types
  { listType: 'phone-number-type', name: 'Cell', sequenceOrder: 0 },
  { listType: 'phone-number-type', name: 'Home', sequenceOrder: 0 },
  { listType: 'phone-number-type', name: 'Office', sequenceOrder: 0 },
  { listType: 'phone-number-type', name: 'Other', sequenceOrder: 0 },

  // Roles
  { listType: 'role', name: 'Musician', sequenceOrder: 0 },
  { listType: 'role', name: 'Manager', sequenceOrder: 0 },
  { listType: 'role', name: 'Producer', sequenceOrder: 0 },
  { listType: 'role', name: 'Agent', sequenceOrder: 0 },
  { listType: 'role', name: 'Other', sequenceOrder: 0 },
];

export async function seedDatabase(): Promise<void> {
  const upsertPromises = defaultSeeds.map((entry) =>
    LookupEntry.updateOne(
      { listType: entry.listType, clientId: null, name: entry.name },
      { $setOnInsert: { sequenceOrder: entry.sequenceOrder } },
      { upsert: true }
    )
  );

  await Promise.all(upsertPromises);
}
