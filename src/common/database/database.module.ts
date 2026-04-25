import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { typeOrmConfig } from './typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => typeOrmConfig(),
    }),
  ],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
      const { database, host, port } = this.dataSource.options as any;
      this.logger.log(`Database connected: ${host}:${port}/${database}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Database connection failed: ${message}`);
      throw err;
    }
  }
}

