import { Types } from 'mongoose';
import Song, { ISong } from '../models/Song';
import Project from '../models/Project';
import File from '../models/File';
import { AppError } from '../utils/AppError';

/**
 * Returns all songs for a given project, sorted by title.
 */
export async function listSongs(projectId: string): Promise<ISong[]> {
  return Song.find({ projectId: new Types.ObjectId(projectId) }).sort({ title: 1 });
}

/**
 * Returns a song by ID. Throws 404 if not found.
 */
export async function getSong(id: string): Promise<ISong> {
  const song = await Song.findById(id);
  if (!song) {
    throw new AppError('Song not found', 404);
  }
  return song;
}

/**
 * Creates a new song.
 * - Validates that the referenced projectId exists (404 if not).
 */
export async function createSong(data: {
  title: string;
  projectId: string;
  author: string;
  key?: string;
}): Promise<ISong> {
  // Validate projectId exists
  const project = await Project.findById(data.projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  return Song.create({
    title: data.title,
    projectId: new Types.ObjectId(data.projectId),
    author: data.author,
    key: data.key,
  });
}

/**
 * Updates a song by ID. Throws 404 if not found.
 */
export async function updateSong(
  id: string,
  data: {
    title?: string;
    author?: string;
    key?: string;
  },
): Promise<ISong> {
  const song = await Song.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!song) {
    throw new AppError('Song not found', 404);
  }
  return song;
}

/**
 * Deletes a song by ID.
 * Cascade: deletes all File records with matching songId before deleting the Song.
 */
export async function deleteSong(id: string): Promise<void> {
  const song = await Song.findById(id);
  if (!song) {
    throw new AppError('Song not found', 404);
  }

  // Cascade delete: remove all files associated with this song
  await File.deleteMany({ songId: new Types.ObjectId(id) });

  await Song.findByIdAndDelete(id);
}
