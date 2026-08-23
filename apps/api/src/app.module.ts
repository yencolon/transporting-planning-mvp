import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { DutiesModule } from './modules/duties/duties.module';
import { RoutesModule } from './modules/routes/routes.module';
import { UnitsModule } from './modules/units/units.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RoutesModule,
    DutiesModule,
    UnitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
