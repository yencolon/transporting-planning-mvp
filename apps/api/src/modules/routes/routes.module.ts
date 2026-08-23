import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence.module';
import { CreateRoute } from './application/create-route';
import { DeleteRoute } from './application/delete-route';
import { GetRouteDetail } from './application/get-route-detail';
import { ListRoutes } from './application/list-routes';
import { UpdateRoute } from './application/update-route';
import { RoutesController } from './routes.controller';

const useCases = [
  CreateRoute,
  UpdateRoute,
  ListRoutes,
  GetRouteDetail,
  DeleteRoute,
];

@Module({
  imports: [PersistenceModule],
  controllers: [RoutesController],
  providers: useCases,
  exports: useCases,
})
export class RoutesModule {}
