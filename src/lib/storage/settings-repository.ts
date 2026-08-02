import type { PersistedSettings, SettingRecord } from "../../types/preferences";
import { OrbitDatabase, orbitDatabase } from "./database";

export class SettingsRepository {
  constructor(private readonly database: OrbitDatabase = orbitDatabase) {}

  async get<Key extends keyof PersistedSettings>(key: Key): Promise<PersistedSettings[Key] | undefined> {
    const record = await this.database.settings.get(key);
    return record?.value as PersistedSettings[Key] | undefined;
  }

  async set<Key extends keyof PersistedSettings>(key: Key, value: PersistedSettings[Key]): Promise<void> {
    const record = { key, value } as SettingRecord;
    await this.database.settings.put(record);
  }

  async remove(key: keyof PersistedSettings): Promise<void> {
    await this.database.settings.delete(key);
  }
}

export const settingsRepository = new SettingsRepository();
