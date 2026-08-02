import Dexie, { type EntityTable } from "dexie";

import type { StoredMessage } from "../../types/chat";
import type { Conversation } from "../../types/conversation";
import type { PersistedSettings, SettingRecord } from "../../types/preferences";

export class OrbitDatabase extends Dexie {
  conversations!: EntityTable<Conversation, "id">;
  messages!: EntityTable<StoredMessage, "id">;
  settings!: EntityTable<SettingRecord, "key">;

  constructor(name = "orbit") {
    super(name);
    this.version(1).stores({
      conversations: "id, createdAt, updatedAt, title",
      messages: "id, conversationId, createdAt, [conversationId+createdAt]",
      settings: "key",
    });
  }
}

export const orbitDatabase = new OrbitDatabase();

export type SettingKey = keyof PersistedSettings;
