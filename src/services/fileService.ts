import { Types } from 'mongoose';
import File, { IFile } from '../models/File';
import { AppError } from '../utils/AppError';
import { validateEntryExists } from './lookupService';

/**
 * Returns all files for a given song, sorted by name.
 */
export async function listFiles(songId: string): Promise<IFile[]> {
  return File.find({ songId: new Types.ObjectId(songId) }).sort({ name: 1 });
}

/**
 * Returns a file by ID. Throws 404 if not found.
 */
export async function getFile(id: string): Promise<IFile> {
  const file = await File.findById(id);
  if (!file) {
    throw new AppError('File not found', 404);
  }
  return file;
}

/**
 * Creates a new file metadata record.
 * - Validates `formatId` against the `file-format` Lookup List — 400 if not found.
 * - Validates `typeId` against the `file-type` Lookup List — 400 if not found.
 * - Stores `s3Url` as the canonical reference to the physical file location.
 */
export async function createFile(data: {
  songId: string;
  name: string;
  formatId: string;
  typeId: string;
  s3Url: string;
}): Promise<IFile> {
  // Validate formatId against file-format Lookup List
  const formatEntry = await validateEntryExists(data.formatId, 'file-format');
  if (!formatEntry) {
    throw new AppError(
      'File format does not exist in the file-format lookup list',
      400,
    );
  }

  // Validate typeId against file-type Lookup List
  const typeEntry = await validateEntryExists(data.typeId, 'file-type');
  if (!typeEntry) {
    throw new AppError(
      'File type does not exist in the file-type lookup list',
      400,
    );
  }

  return File.create({
    songId: new Types.ObjectId(data.songId),
    name: data.name,
    formatId: new Types.ObjectId(data.formatId),
    typeId: new Types.ObjectId(data.typeId),
    s3Url: data.s3Url,
  });
}

/**
 * Updates a file by ID. Throws 404 if not found.
 */
export async function updateFile(
  id: string,
  data: {
    name?: string;
    formatId?: string;
    typeId?: string;
    s3Url?: string;
  },
): Promise<IFile> {
  const file = await File.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!file) {
    throw new AppError('File not found', 404);
  }
  return file;
}

/**
 * Deletes a file by ID. Throws 404 if not found.
 */
export async function deleteFile(id: string): Promise<void> {
  const file = await File.findById(id);
  if (!file) {
    throw new AppError('File not found', 404);
  }
  await File.findByIdAndDelete(id);
}
