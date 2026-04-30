import { Types } from 'mongoose';
import Person, { IPerson, IPhoneNumber } from '../models/Person';
import Client from '../models/Client';
import { AppError } from '../utils/AppError';
import { validateEntryExists } from './lookupService';

/**
 * Validates that every phone number's typeId exists in the phone-number-type Lookup List.
 * Throws 400 AppError if any typeId is invalid.
 */
async function validatePhoneNumberTypes(
  phones: Array<{ number: string; typeId: string }>,
): Promise<void> {
  for (const phone of phones) {
    const entry = await validateEntryExists(phone.typeId, 'phone-number-type');
    if (!entry) {
      throw new AppError(
        `Phone number type '${phone.typeId}' does not exist in the phone-number-type lookup list`,
        400,
      );
    }
  }
}

/**
 * Returns all persons, sorted by last name then first name.
 */
export async function listPersons(): Promise<IPerson[]> {
  return Person.find().sort({ lastName: 1, firstName: 1 });
}

/**
 * Returns a person by ID. Throws 404 if not found.
 */
export async function getPerson(id: string): Promise<IPerson> {
  const person = await Person.findById(id);
  if (!person) {
    throw new AppError('Person not found', 404);
  }
  return person;
}

/**
 * Creates a new person.
 * Validates phone number typeIds against the phone-number-type Lookup List.
 */
export async function createPerson(data: {
  firstName: string;
  lastName: string;
  preferredName?: string;
  email?: string;
  notes?: string;
  phoneNumbers?: Array<{ number: string; typeId: string }>;
}): Promise<IPerson> {
  // Validate phone number types if provided
  if (data.phoneNumbers && data.phoneNumbers.length > 0) {
    await validatePhoneNumberTypes(data.phoneNumbers);
  }

  return Person.create(data);
}

/**
 * Updates a person by ID. Throws 404 if not found.
 */
export async function updatePerson(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    preferredName?: string;
    email?: string;
    notes?: string;
  },
): Promise<IPerson> {
  const person = await Person.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!person) {
    throw new AppError('Person not found', 404);
  }
  return person;
}

/**
 * Deletes a person by ID.
 * Checks all Client documents for ClientPersonAssociation entries referencing this person.
 * If any association has isPrimary: true, throws 409 and aborts.
 * Otherwise, deletes the person and removes all associations referencing this person
 * from all Client documents atomically.
 */
export async function deletePerson(id: string): Promise<void> {
  const person = await Person.findById(id);
  if (!person) {
    throw new AppError('Person not found', 404);
  }

  const personObjectId = person._id as Types.ObjectId;

  // Check if this person is marked as primary on any client
  const primaryCount = await Client.countDocuments({
    'persons.personId': personObjectId,
    'persons.isPrimary': true,
    persons: {
      $elemMatch: {
        personId: personObjectId,
        isPrimary: true,
      },
    },
  });

  if (primaryCount > 0) {
    throw new AppError(
      'Cannot delete person: they are marked as primary contact on one or more clients',
      409,
    );
  }

  // Remove the person from all client persons arrays atomically
  await Client.updateMany(
    { 'persons.personId': personObjectId },
    { $pull: { persons: { personId: personObjectId } } },
  );

  // Delete the person record
  await Person.findByIdAndDelete(id);
}

/**
 * Replaces the phone numbers array on a person.
 * Validates each phone number's typeId against the phone-number-type Lookup List.
 */
export async function updatePhoneNumbers(
  id: string,
  phones: Array<{ number: string; typeId: string }>,
): Promise<IPerson> {
  const person = await Person.findById(id);
  if (!person) {
    throw new AppError('Person not found', 404);
  }

  // Validate all phone number types
  await validatePhoneNumberTypes(phones);

  // Replace the phone numbers array
  person.phoneNumbers = phones.map((p) => ({
    number: p.number,
    typeId: new Types.ObjectId(p.typeId),
  })) as unknown as IPerson['phoneNumbers'];

  await person.save();
  return person;
}
