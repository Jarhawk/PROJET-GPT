import { describe, it, expect, vi } from "vitest";
import { useTwoFactorAuth } from "../src/hooks/useTwoFactorAuth";
import { renderHook, act } from "@testing-library/react";

var rpcMock;
vi.mock("@/lib/supabase", () => {
  rpcMock = vi.fn().mockResolvedValue({ error: null });
  const data = { user: { id: "u1" } };
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { two_fa_enabled: false, two_fa_secret: null } }),
      })),
      rpc: rpcMock,
    },
  };
});

describe("useTwoFactorAuth", () => {
  it("finalizes setup after verification", async () => {
    const { result } = renderHook(() => useTwoFactorAuth());
    act(() => {
      result.current.startSetup();
    });
    const secret = result.current.secret;
    await act(async () => {
      await result.current.finalizeSetup();
    });
    expect(rpcMock).toHaveBeenCalledWith("enable_two_fa", { p_secret: secret });
    expect(result.current.enabled).toBe(true);
  });
});
