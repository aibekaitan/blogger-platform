
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

import { Query } from '@nestjs/cqrs';
import { DeviceViewModel } from '../../../domain/dto/view-dto';
import { SecurityDevicesQueryRepository } from '../../../infrastructure/security-devices/security-devices.query.repository';

export class GetAllDevicesQuery extends Query<DeviceViewModel[]> {
  constructor(public readonly userId: string) {
    super();
  }
}
@QueryHandler(GetAllDevicesQuery)
export class GetAllDevicesHandler implements IQueryHandler<
  GetAllDevicesQuery,
  DeviceViewModel[]
> {
  constructor(
    private readonly securityDevicesQueryRepository: SecurityDevicesQueryRepository,
  ) {}

  async execute(query: GetAllDevicesQuery): Promise<DeviceViewModel[]> {
    const { userId } = query;
    return this.securityDevicesQueryRepository.findAllByUserId(userId);
  }
}
