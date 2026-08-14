import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes via clsx", () => {
    const isHidden = false;
    expect(cn("base", isHidden ? "hidden" : undefined, "visible")).toBe("base visible");
  });

  it("merges tailwind classes via twMerge (later wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("handles array inputs", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("handles object inputs", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });
});
