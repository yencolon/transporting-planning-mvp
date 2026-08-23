import { Unit } from './unit';

export abstract class UnitRepository {
  abstract create(name: string): Promise<Unit>;
  abstract findById(id: string): Promise<Unit | null>;
  abstract findByName(name: string): Promise<Unit | null>;
  abstract list(): Promise<Unit[]>;
  abstract delete(id: string): Promise<void>;
}
