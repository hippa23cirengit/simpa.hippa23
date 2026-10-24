import { AuthRepository } from "../repositories/auth.repository";

export class GetRecentLoginsUseCase {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async execute(limit: number = 5) {
    return this.repository.getRecentLogins(limit);
  }
}
