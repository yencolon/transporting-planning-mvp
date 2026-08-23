import { Unit } from './unit';

export abstract class UnitRepository {
  abstract findById(id: string): Promise<Unit | null>;
  abstract list(): Promise<Unit[]>;
}
