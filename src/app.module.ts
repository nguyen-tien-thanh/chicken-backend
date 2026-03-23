import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ttl = config.get<number>('cache.ttl');
        const redisUrl = config.get<string>('redis.url');
        const namespace = config.get<string>('cache.namespace');
        return { ttl, namespace, stores: [new KeyvRedis(redisUrl)] };
      },
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
