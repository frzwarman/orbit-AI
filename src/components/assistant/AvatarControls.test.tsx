import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { useAvatarStore } from "../../stores/avatar-store";
import { AvatarControls } from "./AvatarControls";

describe("AvatarControls", () => {
  beforeEach(() => {
    useAvatarStore.setState({ manualState: null, expression: "Neutral", emoteRequest: null });
  });

  it("offers every RobotExpressive state, emote, and expression", async () => {
    const user = userEvent.setup();
    render(<AvatarControls />);

    const state = screen.getByRole("combobox", { name: "Avatar state" });
    expect(state).toHaveTextContent("Follow chat");
    for (const name of ["Walking", "Running", "Dance", "Death", "Sitting", "Standing"]) {
      expect(screen.getByRole("option", { name })).toBeInTheDocument();
    }
    for (const name of ["Jump", "Yes", "No", "Wave", "Punch", "Thumbs up"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }

    await user.selectOptions(state, "Running");
    await user.selectOptions(screen.getByRole("combobox", { name: "Avatar expression" }), "Sad");
    await user.click(screen.getByRole("button", { name: "Wave" }));

    expect(useAvatarStore.getState()).toMatchObject({
      manualState: "Running",
      expression: "Sad",
      emoteRequest: { name: "Wave", sequence: 1 },
    });
  });

  it("can be minimized without hiding the avatar", async () => {
    const user = userEvent.setup();
    render(<AvatarControls />);
    await user.click(screen.getByRole("button", { name: "Minimize avatar controls" }));
    expect(screen.getByRole("button", { name: "Expand avatar controls" })).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Avatar state" })).not.toBeInTheDocument();
  });

  it("starts minimized when the compact preview requests it", () => {
    render(<AvatarControls initiallyCollapsed />);

    expect(screen.getByRole("button", { name: "Expand avatar controls" })).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Avatar state" })).not.toBeInTheDocument();
  });
});
