import { ConfigService } from '@nestjs/config';

/**
 * A specialized wrapper for NestJS ConfigService that ensures 
 * environment variables are correctly parsed (e.g., stripping quotes).
 */
export class ConfigUtil {
  constructor(private configService: ConfigService) {}

  /**
   * Gets an environment variable and strips any surrounding quotes.
   * @param key The key of the environment variable
   * @param defaultValue Optional default value if key is not found
   * @returns The processed string value
   */
  get(key: string, defaultValue: string = ''): string {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null) {
      return defaultValue;
    }
    
    // Remove leading/trailing quotes (single or double)
    return value.toString().replace(/^["']|["']$/g, '');
  }

  /**
   * Gets an environment variable and parses it as a number.
   * @param key The key of the environment variable
   * @param defaultValue Optional default value if key is not found or invalid
   * @returns The processed number value
   */
  getNumber(key: string, defaultValue: number = 0): number {
    const value = this.get(key);
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Gets an environment variable and parses it as a boolean.
   * @param key The key of the environment variable
   * @param defaultValue Optional default value
   * @returns The processed boolean value
   */
  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.get(key).toLowerCase();
    if (value === 'true' || value === '1' || value === 'yes') return true;
    if (value === 'false' || value === '0' || value === 'no') return false;
    return defaultValue;
  }
}
