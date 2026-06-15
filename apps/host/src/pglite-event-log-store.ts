import type { DomainEvent } from "@swarm/core-engine";
import type { Store } from "@swarm/db/store";
import type { HostId, SessionId, WorkspaceId } from "@swarm/shared";
import type { EventLogStore, StoredEvent } from "@swarm/sync";

/**
 * Bridges the sync {@link EventLogStore} seam onto the PGlite-backed `@swarm/db`
 * `Store` (ADR-0003). `@swarm/sync` deliberately never imports `@swarm/db`; the
 * host is the composition root that owns both, so the adapter lives here.
 *
 * Each {@link DomainEvent} is stored whole in the `events.payload` jsonb column,
 * with its workspace/session ids lifted into their own columns for indexing, and
 * the durable `seq` PGlite assigns becomes the sync cursor every client resumes
 * from (spec §4, P10).
 */
function workspaceIdOf(event: DomainEvent): WorkspaceId | null {
  return "workspaceId" in event ? event.workspaceId : null;
}

function sessionIdOf(event: DomainEvent): SessionId | null {
  return "sessionId" in event ? event.sessionId : null;
}

export class PgliteEventLogStore implements EventLogStore {
  private readonly store: Store;
  private readonly hostId: HostId;
  private readonly actor: string;

  constructor(store: Store, hostId: HostId, actor = "host") {
    this.store = store;
    this.hostId = hostId;
    this.actor = actor;
  }

  async append(event: DomainEvent): Promise<number> {
    const row = await this.store.appendEvent({
      hostId: this.hostId,
      type: event.type,
      payload: event,
      actor: this.actor,
      workspaceId: workspaceIdOf(event),
      sessionId: sessionIdOf(event),
    });
    return row.seq;
  }

  async readFrom(afterSeq: number): Promise<readonly StoredEvent[]> {
    const rows = await this.store.readEventsFromSeq(afterSeq, { hostId: this.hostId });
    return rows.map((row) => ({ seq: row.seq, event: row.payload as DomainEvent }));
  }

  head(): Promise<number> {
    return this.store.maxSeq();
  }
}
