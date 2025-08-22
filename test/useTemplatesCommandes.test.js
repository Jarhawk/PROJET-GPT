import { vi, beforeEach, test, expect } from "vitest";

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  order: vi.fn(() => query),
};
const fromMock = vi.fn(() => query);
const rpcMock = vi.fn();

vi.mock("@/lib/supabase", () => {
  const supabase = { from: fromMock, rpc: rpcMock };
  return { supabase, default: supabase };
});
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ mama_id: "m1" }) }));

let useTemplatesCommandes;

beforeEach(async () => {
  ({ useTemplatesCommandes } = await import("@/hooks/useTemplatesCommandes"));
  fromMock.mockClear();
  rpcMock.mockClear();
  Object.values(query).forEach((fn) => fn.mockClear && fn.mockClear());
  rpcMock.mockReturnValue({
    single: vi.fn(() => Promise.resolve({ data: { id: "t1" }, error: null })),
  });
});

test("fetchTemplates applies filter", async () => {
  const { fetchTemplates } = useTemplatesCommandes();
  await fetchTemplates({ fournisseur_id: "f1" });
  expect(fromMock).toHaveBeenCalledWith("templates_commandes");
  expect(query.eq).toHaveBeenCalledWith("mama_id", "m1");
  expect(query.eq).toHaveBeenCalledWith("fournisseur_id", "f1");
});

test("getTemplateForFournisseur calls rpc", async () => {
  const { getTemplateForFournisseur } = useTemplatesCommandes();
  await getTemplateForFournisseur("f1");
  expect(rpcMock).toHaveBeenCalledWith("get_template_commande", {
    p_mama: "m1",
    p_fournisseur: "f1",
  });
});

