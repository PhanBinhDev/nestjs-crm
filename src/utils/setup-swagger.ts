import { type AllConfigType } from '@/config/config.type';
import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService<AllConfigType>);
  const appName = configService.getOrThrow('app.name', { infer: true });

  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription('API for CRM')
    .setVersion('1.0')
    .setContact('Bingo', 'https://binh-dev.io.vn', 'binhdev.dev@gmail.com')
    .addBearerAuth()
    .addServer(
      configService.getOrThrow('app.url', { infer: true }),
      configService.getOrThrow('app.nodeEnv', { infer: true }),
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: appName,
    jsonDocumentUrl: 'api-docs-json',
  });
}

export default setupSwagger;
