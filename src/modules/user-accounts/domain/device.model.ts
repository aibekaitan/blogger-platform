import { User } from './user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('devices')
@Index('idx_user_last_active_desc', ['userId', 'lastActiveDate']) // composite index
@Index('idx_device_expiration', ['expirationDate'])
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.devices, {
    onDelete: 'CASCADE', // Удаление сессий при удалении пользователя
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ unique: true })
  @Index()
  deviceId: string;

  @Column()
  ip: string;

  @Column()
  title: string;

  @Column({ type: 'timestamptz' })
  lastActiveDate: Date;

  @Column({ type: 'timestamptz' })
  expirationDate: Date;

  @Column({ type: 'text' })
  refreshToken: string;
}
