import { Types } from 'mongoose';
import Project, { IProject } from '../models/Project';
import Client from '../models/Client';
import LookupEntry from '../models/LookupEntry';
import { AppError } from '../utils/AppError';
import { validateEntryExists } from './lookupService';

/**
 * Returns all projects, optionally filtered by clientId and/or workflowStageId.
 */
export async function listProjects(filters?: {
  clientId?: string;
  workflowStageId?: string;
}): Promise<IProject[]> {
  const query: Record<string, unknown> = {};

  if (filters?.clientId) {
    query.clientId = new Types.ObjectId(filters.clientId);
  }

  if (filters?.workflowStageId) {
    query.workflowStageId = new Types.ObjectId(filters.workflowStageId);
  }

  return Project.find(query).sort({ name: 1 });
}

/**
 * Returns a project by ID. Throws 404 if not found.
 */
export async function getProject(id: string): Promise<IProject> {
  const project = await Project.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  return project;
}

/**
 * Creates a new project.
 * - Validates that the referenced clientId exists (404 if not).
 * - Validates that workflowStageId exists in the workflow-stage Lookup List (400 if not).
 * - Defaults to the first workflow-stage entry by sequenceOrder if no stage is provided.
 */
export async function createProject(data: {
  name: string;
  clientId: string;
  workflowStageId?: string;
  description?: string;
  targetCompletionDate?: Date;
}): Promise<IProject> {
  // Validate clientId exists
  const client = await Client.findById(data.clientId);
  if (!client) {
    throw new AppError('Client not found', 404);
  }

  let workflowStageId = data.workflowStageId;

  if (workflowStageId) {
    // Validate that the provided workflowStageId exists in the workflow-stage Lookup List
    const stageEntry = await validateEntryExists(workflowStageId, 'workflow-stage');
    if (!stageEntry) {
      throw new AppError(
        'Workflow stage does not exist in the workflow-stage lookup list',
        400,
      );
    }
  } else {
    // Default to the first workflow-stage entry ordered by sequenceOrder
    const defaultStage = await LookupEntry.findOne({
      listType: 'workflow-stage',
      clientId: null,
    }).sort({ sequenceOrder: 1 });

    if (!defaultStage) {
      throw new AppError('No workflow stages configured', 400);
    }

    workflowStageId = (defaultStage._id as Types.ObjectId).toString();
  }

  return Project.create({
    name: data.name,
    clientId: new Types.ObjectId(data.clientId),
    workflowStageId: new Types.ObjectId(workflowStageId),
    description: data.description,
    targetCompletionDate: data.targetCompletionDate,
  });
}

/**
 * Updates a project by ID. Throws 404 if not found.
 */
export async function updateProject(
  id: string,
  data: {
    name?: string;
    description?: string;
    targetCompletionDate?: Date;
  },
): Promise<IProject> {
  const project = await Project.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  return project;
}

/**
 * Deletes a project by ID. Throws 404 if not found.
 */
export async function deleteProject(id: string): Promise<void> {
  const project = await Project.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  await Project.findByIdAndDelete(id);
}

/**
 * Updates the workflow stage of a project.
 * - Validates that the new stage exists in the workflow-stage Lookup List (400 if not).
 * - Allows any valid stage regardless of current stage (non-sequential transitions allowed).
 */
export async function updateWorkflowStage(
  id: string,
  stageId: string,
): Promise<IProject> {
  // Validate that the new stage exists in the workflow-stage Lookup List
  const stageEntry = await validateEntryExists(stageId, 'workflow-stage');
  if (!stageEntry) {
    throw new AppError(
      'Workflow stage does not exist in the workflow-stage lookup list',
      400,
    );
  }

  const project = await Project.findByIdAndUpdate(
    id,
    { workflowStageId: new Types.ObjectId(stageId) },
    { new: true, runValidators: true },
  );

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  return project;
}
