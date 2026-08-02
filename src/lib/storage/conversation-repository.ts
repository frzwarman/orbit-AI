import type { MessageUpdate, StoredMessage } from "../../types/chat";
import type { Conversation } from "../../types/conversation";
import { OrbitDatabase, orbitDatabase } from "./database";

export class ConversationRepository {
  constructor(private readonly database: OrbitDatabase = orbitDatabase) {}

  async create(title: string): Promise<Conversation> {
    const now = Date.now();
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: title.trim() || "New conversation",
      createdAt: now,
      updatedAt: now,
    };
    await this.database.conversations.add(conversation);
    return conversation;
  }

  async list(): Promise<Conversation[]> {
    return this.database.conversations.orderBy("updatedAt").reverse().toArray();
  }

  async rename(id: string, title: string): Promise<void> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    await this.database.conversations.update(id, { title: normalizedTitle, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await this.database.transaction("rw", this.database.conversations, this.database.messages, async () => {
      await this.database.messages.where("conversationId").equals(id).delete();
      await this.database.conversations.delete(id);
    });
  }

  async search(query: string): Promise<Conversation[]> {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return this.list();
    const matches = await this.database.conversations
      .filter((conversation) => conversation.title.toLocaleLowerCase().includes(normalizedQuery))
      .toArray();
    return matches.sort((first, second) => second.updatedAt - first.updatedAt);
  }

  async getMessages(conversationId: string): Promise<StoredMessage[]> {
    return this.database.messages
      .where("[conversationId+createdAt]")
      .between([conversationId, DexieMinKey], [conversationId, DexieMaxKey])
      .toArray();
  }

  async appendMessage(message: StoredMessage): Promise<void> {
    await this.database.transaction("rw", this.database.messages, this.database.conversations, async () => {
      await this.database.messages.add(message);
      await this.database.conversations.update(message.conversationId, { updatedAt: Date.now() });
    });
  }

  async updateMessage(id: string, changes: MessageUpdate): Promise<void> {
    await this.database.messages.update(id, changes);
  }

  async truncateAfter(conversationId: string, createdAt: number): Promise<void> {
    const laterIds = await this.database.messages
      .where("[conversationId+createdAt]")
      .above([conversationId, createdAt])
      .primaryKeys();
    await this.database.messages.bulkDelete(laterIds);
  }
}

const DexieMinKey = -Infinity;
const DexieMaxKey = Infinity;

export const conversationRepository = new ConversationRepository();
