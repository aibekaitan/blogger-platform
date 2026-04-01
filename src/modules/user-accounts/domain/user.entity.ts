import { randomUUID } from 'crypto';
import { Device } from './device.model';
import { Comment } from '../../bloggers-platform/domain/comment.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export class EmailConfirmation {
  @Column({ nullable: false })
  confirmationCode: string;

  @Column({ type: 'timestamp', nullable: false })
  expirationDate: Date;

  @Column({ default: false })
  isConfirmed: boolean;
}

@Entity('users')
@Index(['login'], { unique: true })
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: false })
  login: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  passwordHash: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  refreshToken?: string | null;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: false,
    default: () => 'uuid_generate_v4()',
  })
  passwordRecoveryCode: string;

  @Column({ type: 'jsonb', nullable: false })
  emailConfirmation: EmailConfirmation;

  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  static create(
    dto: {
      login: string;
      email: string;
      passwordHash: string;
      confirmationCode?: string;
      expirationDate?: Date;
    },
    isConfirmed = false,
  ): User {
    const user = new User();

    user.login = dto.login.trim();
    user.email = dto.email.trim().toLowerCase();
    user.passwordHash = dto.passwordHash;
    user.createdAt = new Date();
    user.passwordRecoveryCode = randomUUID();

    user.emailConfirmation = {
      confirmationCode: dto.confirmationCode || randomUUID(),
      expirationDate: dto.expirationDate || new Date(),
      isConfirmed: isConfirmed,
    };

    return user;
  }
}
