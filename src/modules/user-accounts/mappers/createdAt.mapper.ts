// Пример маппера (рекомендую вынести в отдельный файл)
import { UserDocument } from '../domain/user.entity';

export class UserViewModel {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  static fromDomain(user: UserDocument): UserViewModel {
    return {
      id: user.id, // или user._id.toString() если используешь _id
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
