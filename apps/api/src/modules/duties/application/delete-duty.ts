import { Injectable } from '@nestjs/common';
import { DutyRepository } from '../domain/duty.repository';
import { DutyNotFoundError } from '../domain/errors';

@Injectable()
export class DeleteDuty {
  constructor(private readonly duties: DutyRepository) {}

  async execute(id: string): Promise<void> {
    if (!(await this.duties.findById(id))) {
      throw new DutyNotFoundError(id);
    }

    await this.duties.delete(id);
  }
}
