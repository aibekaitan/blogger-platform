import { validateSync } from 'class-validator';

/**
 * Утилита для валидации объектов конфигурации с использованием class-validator.
 * Используется в конструкторах Config-классов.
 */
export const configValidationUtility = {
  validateConfig: (config: any) => {
    // validateSync проверяет декораторы (@IsNumber, @IsNotEmpty и т.д.) прямо в объекте
    const errors = validateSync(config);
    if (errors.length > 0) {
      const sortedMessages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new Error('Config Validation failed: ' + sortedMessages);
    }
  },

  /**
   * Помогает превратить строку из .env (например "true", "1", "enabled") в реальный boolean.
   */
  convertToBoolean(value: string | undefined) {
    const trimmedValue = value?.trim();
    if (trimmedValue === 'true') return true;
    if (trimmedValue === '1') return true;
    if (trimmedValue === 'enabled') return true;
    if (trimmedValue === 'false') return false;
    if (trimmedValue === '0') return false;
    if (trimmedValue === 'disabled') return false;

    return null;
  },

  /**
   * Вспомогательный метод для получения значений Enum (для вывода в ошибки).
   */
  getEnumValues<T extends Record<string, string>>(enumObj: T): string[] {
    return Object.values(enumObj);
  },
};
