import { Types } from 'mongoose';
import LookupEntry, { ILookupEntry } from '../models/LookupEntry';
import Person from '../models/Person';
import Project from '../models/Project';
import FileModel from '../models/File';
import Client from '../models/Client';
import { AppError } from '../utils/AppError';

export { AppError };

/**
 * Returns all entries for a given lookup list type.
 * For workflow-stage entries, results are sorted by sequenceOrder.
 */
export async function getEntries(
  listType: string,
): Promise<ILookupEntry[]> {
  const filter: Record<string, unknown> = { listType, clientId: null };

  const sort: Record<string, 1> =
    listType === 'workflow-stage' ? { sequenceOrder: 1 } : { name: 1 };

  return LookupEntry.find(filter).sort(sort);
}

/**
 * Creates a new lookup list entry.
 * The compound unique index on { listType, clientId, name } handles duplicate enforcement.
 */
export async function createEntry(
  listType: string,
  name: string,
): Promise<ILookupEntry> {
  const data: Record<string, unknown> = { listType, name };

  // For workflow-stage, set sequenceOrder to one past the current max
  if (listType === 'workflow-stage') {
    const maxEntry = await LookupEntry.findOne({ listType: 'workflow-stage', clientId: null })
      .sort({ sequenceOrder: -1 })
      .lean();
    data.sequenceOrder = maxEntry ? maxEntry.sequenceOrder + 1 : 1;
  }

  return LookupEntry.create(data);
}

/**
 * Updates the name of an existing lookup list entry.
 * Returns 404 if the entry is not found.
 */
export async function updateEntry(
  id: string,
  name: string,
): Promise<ILookupEntry> {
  const entry = await LookupEntry.findByIdAndUpdate(
    id,
    { name },
    { new: true, runValidators: true },
  );

  if (!entry) {
    throw new AppError('Lookup entry not found', 404);
  }

  return entry;
}

/**
 * Deletes a lookup list entry after checking all referencing collections.
 * Returns 409 if any references exist.
 */
export async function deleteEntry(id: string): Promise<void> {
  const entry = await LookupEntry.findById(id);
  if (!entry) {
    throw new AppError('Lookup entry not found', 404);
  }

  const entryId = entry._id as Types.ObjectId;

  // Check references based on listType
  let referenceCount = 0;

  switch (entry.listType) {
    case 'phone-number-type':
      referenceCount = await Person.countDocuments({
        'phoneNumbers.typeId': entryId,
      });
      break;

    case 'workflow-stage':
      referenceCount = await Project.countDocuments({
        workflowStageId: entryId,
      });
      break;

    case 'file-format':
      referenceCount = await FileModel.countDocuments({
        formatId: entryId,
      });
      break;

    case 'file-type':
      referenceCount = await FileModel.countDocuments({
        typeId: entryId,
      });
      break;

    case 'role':
      referenceCount = await Client.countDocuments({
        'persons.roleId': entryId,
      });
      break;
  }

  if (referenceCount > 0) {
    throw new AppError(
      'Cannot delete lookup entry: it is currently referenced by existing records',
      409,
    );
  }

  await LookupEntry.findByIdAndDelete(id);
}

/**
 * Reorders workflow stages by accepting an array of IDs.
 * Validates that the submitted list is a complete permutation of all existing workflow-stage entries.
 */
export async function reorderWorkflowStages(
  orderedIds: string[],
): Promise<void> {
  // Fetch all existing workflow-stage entries
  const existingStages = await LookupEntry.find({
    listType: 'workflow-stage',
    clientId: null,
  }).lean();

  const existingIdSet = new Set(
    existingStages.map((s) => (s._id as Types.ObjectId).toString()),
  );
  const submittedIdSet = new Set(orderedIds);

  // Validate: same length
  if (orderedIds.length !== existingStages.length) {
    throw new AppError(
      `Reorder list must contain exactly ${existingStages.length} workflow stage IDs, received ${orderedIds.length}`,
      400,
    );
  }

  // Validate: no duplicates in submitted list
  if (submittedIdSet.size !== orderedIds.length) {
    throw new AppError(
      'Reorder list contains duplicate IDs',
      400,
    );
  }

  // Validate: every existing ID is present and no extra IDs
  for (const id of orderedIds) {
    if (!existingIdSet.has(id)) {
      throw new AppError(
        `Reorder list contains unknown workflow stage ID: ${id}`,
        400,
      );
    }
  }

  for (const id of existingIdSet) {
    if (!submittedIdSet.has(id)) {
      throw new AppError(
        `Reorder list is missing workflow stage ID: ${id}`,
        400,
      );
    }
  }

  // Update each entry's sequenceOrder to match its position (1-based)
  const updatePromises = orderedIds.map((id, index) =>
    LookupEntry.findByIdAndUpdate(id, { sequenceOrder: index + 1 }),
  );

  await Promise.all(updatePromises);
}

/**
 * Checks if a lookup entry exists with the given criteria.
 * Returns the entry or null.
 */
export async function validateEntryExists(
  id: string,
  listType: string,
): Promise<ILookupEntry | null> {
  const filter: Record<string, unknown> = {
    _id: new Types.ObjectId(id),
    listType,
  };

  return LookupEntry.findOne(filter);
}
