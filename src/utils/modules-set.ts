import { ApiModule } from '@/api/api.module';
import { AuthModule } from '@/api/auth/auth.module';
import authConfig from '@/api/auth/config/auth.config';
import { BackgroundModule } from '@/background/background.module';
import backgroundConfig from '@/background/config/background.config';
import appConfig from '@/config/app.config';
import databaseConfig from '@/database/config/database.config';
import { TypeOrmConfigService } from '@/database/typeorm-config.service';
import mailConfig from '@/mail/config/mail.config';
import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { DataSource, DataSourceOptions } from 'typeorm';
import loggerFactory from './logger-factory';

function generateModulesSet() {
  const imports: ModuleMetadata['imports'] = [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        backgroundConfig,
        mailConfig,
      ],
      envFilePath: ['.env'],
    }),
  ];
  let customModules: ModuleMetadata['imports'] = [];

  const dbModule = TypeOrmModule.forRootAsync({
    useClass: TypeOrmConfigService,
    dataSourceFactory: async (options: DataSourceOptions) => {
      if (!options) {
        throw new Error('Invalid options passed');
      }

      return new DataSource(options).initialize();
    },
  });

  const loggerModule = LoggerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: loggerFactory,
  });

  const modulesSet = process.env.MODULES_SET || 'monolith';

  switch (modulesSet) {
    case 'monolith':
      customModules = [
        ApiModule,
        AuthModule,
        BackgroundModule,
        dbModule,
        loggerModule,
      ];
      break;
    case 'api':
      customModules = [ApiModule, AuthModule, dbModule, loggerModule];
      break;
    case 'background':
      customModules = [BackgroundModule, dbModule, loggerModule];
      break;
    default:
      console.error(`Unsupported modules set: ${modulesSet}`);
      break;
  }

  return imports.concat(customModules);
}

export default generateModulesSet;
