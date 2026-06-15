import { describe, expect, it } from "bun:test";
import { pickConnection, syncUrl } from "./host-client.ts";

const CONN = { endpoint: "http://127.0.0.1:8787", token: "tkn" } as const;

describe("pickConnection", () => {
  it("prefers the Electron bridge over every other source", () => {
    expect(
      pickConnection({
        bridge: CONN,
        injected: { endpoint: "http://x", token: "y" },
        envUrl: "http://z",
        envToken: "w",
      }),
    ).toEqual(CONN);
  });

  it("falls back to the injected global when no bridge is present", () => {
    expect(pickConnection({ bridge: null, injected: CONN })).toEqual(CONN);
  });

  it("falls back to the dev env pair last", () => {
    expect(pickConnection({ envUrl: CONN.endpoint, envToken: CONN.token })).toEqual(CONN);
  });

  it("returns null when nothing is fully specified", () => {
    expect(pickConnection({})).toBeNull();
    expect(pickConnection({ bridge: { endpoint: "http://x", token: "" } })).toBeNull();
    expect(pickConnection({ envUrl: "http://x" })).toBeNull();
  });
});

describe("syncUrl", () => {
  it("maps the http endpoint to a ws sync URL carrying the token", () => {
    expect(syncUrl(CONN)).toBe("ws://127.0.0.1:8787/sync?token=tkn");
  });

  it("normalizes a trailing slash and encodes the token", () => {
    expect(syncUrl({ endpoint: "http://127.0.0.1:9/", token: "a b/c" })).toBe(
      "ws://127.0.0.1:9/sync?token=a%20b%2Fc",
    );
  });
});
