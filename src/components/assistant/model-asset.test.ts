import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("RobotExpressive asset", () => {
  it("is a complete GLB whose declared length matches the binary", () => {
    const model = readFileSync(resolve(process.cwd(), "public/models/RobotExpressive.glb"));

    expect(model.subarray(0, 4).toString("ascii")).toBe("glTF");
    expect(model.readUInt32LE(4)).toBe(2);
    expect(model.readUInt32LE(8)).toBe(model.byteLength);
    expect(createHash("sha256").update(model).digest("hex")).toBe("047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319");
  });
});
