import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { BcryptService } from '../../adapters/bcrypt.service';
import { UsersQueryRepository } from '../../infrastructure/query/users.query-repository';
import { UserInputDto } from '../../api/input-dto/users.input.dto';
import { IUserView } from '../../types/user.view.interface';
import { UsersRepository } from '../../infrastructure/users.repository';

export class CreateUserCommand extends Command<IUserView> {
  constructor(public readonly dto: UserInputDto) {
    super();
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<
  CreateUserCommand,
  IUserView
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(command: CreateUserCommand): Promise<IUserView> {
    const { dto } = command;

    const passwordHash = await this.bcryptService.generateHash(dto.password);

    const newUser = {
      id: uuidv4(),
      login: dto.login,
      email: dto.email,
      passwordHash,
      createdAt: new Date(),
    };

    const createdUserId = await this.usersRepository.create(newUser);

    const userView =
      await this.usersQueryRepository.getByIdOrNotFoundFail(createdUserId);

    return {
      id: userView.id,
      login: userView.login,
      email: userView.email,
      createdAt: new Date(userView.createdAt).toISOString(),
    };
  }
}
