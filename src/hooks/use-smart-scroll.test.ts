import { describe, expect, it } from "vitest";

import { isHistoryPrepend } from "./use-smart-scroll";

describe("isHistoryPrepend", () => {
  it("distinguishes older messages from a conversation replacement", () => {
    expect(isHistoryPrepend("message-2", ["message-1", "message-2", "message-3"])).toBe(true);
    expect(isHistoryPrepend("message-2", ["other-1", "other-2"])).toBe(false);
  });
});
