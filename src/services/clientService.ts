import { Types } from 'mongoose';
import Client, { IClient } from '../models/Client';
import Project from '../models/Project';
import Person from '../models/Person';
import { AppError } from '../utils/AppError';
import { validateEntryExists } from './lookupService';

/**
 * Returns all clients.
 */
export async function listClients(): Promise<IClient[]> {
  return Client.find().sort({ name: 1 });
}

/**
 * Returns a client by ID. Throws 404 if not found.
 */
export async function getClient(id: string): Promise<IClient> {
  const client = await Client.findById(id);
  if (!client) {
    throw new AppError('Client not found', 404);
  }
  return client;
}

/**
 * Creates a new client.
 * The unique index on Client.name handles duplicate enforcement (11000 → 409 via error handler).
 */
export async function createClient(data: {
  name: string;
  description?: string;
}): Promise<IClient> {
  return Client.create(data);
}

/**
 * Updates a client by ID. Throws 404 if not found.
 */
export async function updateClient(
  id: string,
  data: { name?: string; description?: string },
): Promise<IClient> {
  const client = await Client.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!client) {
    throw new AppError('Client not found', 404);
  }
  return client;
}

/**
 * Deletes a client by ID.
 * Checks for associated Projects first — returns 409 if any exist.
 */
export async function deleteClient(id: string): Promise<void> {
  const client = await Client.findById(id);
  if (!client) {
    throw new AppError('Client not found', 404);
  }

  const projectCount = await Project.countDocuments({ clientId: client._id });
  if (projectCount > 0) {
    throw new AppError(
      'Cannot delete client: it has associated projects',
      409,
    );
  }

  await Client.findByIdAndDelete(id);
}

/**
 * Returns the persons array for a client, populated with Person data.
 */
export async function listClientPersons(id: string): Promise<IClient> {
  const client = await Client.findById(id)
    .populate('persons.personId')
    .populate('persons.roleId');
  if (!client) {
    throw new AppError('Client not found', 404);
  }
  return client;
}

/**
 * Adds a person to a client's persons list with a role.
 * Validates that the roleId exists in the client-scoped Role Lookup List.
 * Validates that the personId references an existing Person.
 */
export async function addPersonToClient(
  clientId: string,
  data: { personId: string; roleId: string },
): Promise<IClient> {
  const client = await Client.findById(clientId);
  if (!client) {
    throw new AppError('Client not found', 404);
  }

  // Validate personId exists
  const person = await Person.findById(data.personId);
  if (!person) {
    throw new AppError('Person not found', 400);
  }

  // Validate roleId exists in global role lookup
  const roleEntry = await validateEntryExists(data.roleId, 'role');
  if (!roleEntry) {
    throw new AppError(
      'Role does not exist in the role list',
      400,
    );
  }

  client.persons.push({
    personId: new Types.ObjectId(data.personId),
    roleId: new Types.ObjectId(data.roleId),
    isPrimary: false,
  });

  await client.save();
  return client;
}

/**
 * Updates a person's role or isPrimary flag for a client.
 * When isPrimary: true is submitted:
 *   1. Verify the personId exists in the client's persons list — return 400 if not
 *   2. Verify no other association already has isPrimary: true — return 400 if one does
 */
export async function updateClientPerson(
  clientId: string,
  personId: string,
  data: { roleId?: string; isPrimary?: boolean },
): Promise<IClient> {
  const client = await Client.findById(clientId);
  if (!client) {
    throw new AppError('Client not found', 404);
  }

  const assocIndex = client.persons.findIndex(
    (p) => p.personId.toString() === personId,
  );

  if (assocIndex === -1) {
    throw new AppError('Person not found in client\'s persons list', 400);
  }

  // If setting isPrimary to true, check no other association already has isPrimary: true
  if (data.isPrimary === true) {
    const existingPrimary = client.persons.find(
      (p) => p.isPrimary && p.personId.toString() !== personId,
    );
    if (existingPrimary) {
      throw new AppError(
        'Another person is already marked as primary for this client',
        400,
      );
    }
  }

  // Validate roleId if provided
  if (data.roleId) {
    const roleEntry = await validateEntryExists(data.roleId, 'role');
    if (!roleEntry) {
      throw new AppError(
        'Role does not exist in the role list',
        400,
      );
    }
    client.persons[assocIndex].roleId = new Types.ObjectId(data.roleId);
  }

  if (data.isPrimary !== undefined) {
    client.persons[assocIndex].isPrimary = data.isPrimary;
  }

  await client.save();
  return client;
}

/**
 * Removes a person from a client's persons list.
 */
export async function removePersonFromClient(
  clientId: string,
  personId: string,
): Promise<IClient> {
  const client = await Client.findById(clientId);
  if (!client) {
    throw new AppError('Client not found', 404);
  }

  const assocIndex = client.persons.findIndex(
    (p) => p.personId.toString() === personId,
  );

  if (assocIndex === -1) {
    throw new AppError('Person not found in client\'s persons list', 400);
  }

  client.persons.splice(assocIndex, 1);
  await client.save();
  return client;
}
