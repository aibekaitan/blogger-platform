import { Module } from '@nestjs/common';
import { UserAccountsConfig } from './user-accounts.config';

@Module({
  providers: [UserAccountsConfig],
  exports: [UserAccountsConfig],
})
export class UserAccountsConfigModule {}
