import { describe, expect, it } from "vitest";

import { getLeadInboxAccess } from "./access";

describe("getLeadInboxAccess", () => {
  it("rejects access when there is no authenticated user", async () => {
    const access = await getLeadInboxAccess({
      getCurrentUserEmail: async () => null,
      isActiveOperator: async () => true
    });

    expect(access).toEqual({ allowed: false, reason: "no_session" });
  });

  it("rejects access when the authenticated user is not an active Anden operator", async () => {
    const access = await getLeadInboxAccess({
      getCurrentUserEmail: async () => "founder@example.com",
      isActiveOperator: async () => false
    });

    expect(access).toEqual({
      allowed: false,
      reason: "not_operator",
      email: "founder@example.com"
    });
  });

  it("allows access for an active Anden operator", async () => {
    const access = await getLeadInboxAccess({
      getCurrentUserEmail: async () => "operator@anden.example",
      isActiveOperator: async () => true
    });

    expect(access).toEqual({
      allowed: true,
      reason: "allowed",
      email: "operator@anden.example"
    });
  });
});
