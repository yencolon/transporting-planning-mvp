import { InvalidUnitError } from './errors';

export interface Unit {
  id: string;
  name: string;
}

export function toUnitName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new InvalidUnitError('A unit needs a name.');
  }
  return trimmed;
}
