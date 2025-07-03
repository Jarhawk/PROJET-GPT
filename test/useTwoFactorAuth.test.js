// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { describe, it, expect, vi } from "vitest";
import { useTwoFactorAuth } from "../src/hooks/useTwoFactorAuth";
import { renderHook, act } from "@testing-library/react";

var upsertMock;
vi.mock("@/lib/supabase", () => {
  upsertMock = vi.fn().mockResolvedValue({ error: null });
  const data = { user: { id: "u1" } };
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { enabled: false, secret: null } }),
        upsert: upsertMock,
        update: vi.fn().mockReturnThis(),
      })),
    },
  };
});

describe("useTwoFactorAuth", () => {
  it("finalizes setup after verification", async () => {
    const { result } = renderHook(() => useTwoFactorAuth());
    act(() => {
      result.current.startSetup();
    });
    await act(async () => {
      await result.current.finalizeSetup();
    });
    expect(upsertMock).toHaveBeenCalled();
    expect(result.current.enabled).toBe(true);
  });
});
