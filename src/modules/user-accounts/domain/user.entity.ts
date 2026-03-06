import { randomUUID } from 'crypto';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

// Embeddable объект для email-подтверждения
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
  id: string; // автоматически будет UUID строка

  @Column({ type: 'varchar', length: 30, unique: true, nullable: false })
  login: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  passwordHash: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdat: Date;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  refreshToken?: string;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: false,
    default: () => 'uuid_generate_v4()',
  })
  passwordRecoveryCode: string;

  @Column({ type: 'jsonb', nullable: false, default: () => "'{}'" })
  emailConfirmation: EmailConfirmation = {
    confirmationCode: randomUUID(),
    expirationDate: new Date(Date.now() + 60 * 60 * 1000), // 1 час
    isConfirmed: false,
  };

  // Альтернатива: если хочешь отдельную таблицу — можно сделать @OneToOne, но для начала jsonb проще

  static create(dto: {
    login: string;
    email: string;
    passwordHash: string;
  }): User {
    const user = new User();
    user.login = dto.login.trim();
    user.email = dto.email.trim().toLowerCase();
    user.passwordHash = dto.passwordHash;
    // id сгенерируется автоматически
    // emailConfirmation и passwordRecoveryCode — дефолтные значения уже есть
    return user;
  }
}
