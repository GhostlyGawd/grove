import { Button } from "@swarm/ui/react";
import { Link2 } from "lucide-react";

/**
 * The parked "Connect a host" control. Pairing (QR / single-use code → IndexedDB
 * bearer, ADR-0014) lands in a later wave, so the button is disabled and the hint
 * tells the operator where linking actually happens today — an honest, non-broken
 * affordance rather than a dead promise.
 */
export function ConnectAffordance() {
  return (
    <Button
      variant="primary"
      disabled
      icon={<Link2 className="size-4" />}
      aria-describedby="connect-hint"
    >
      Connect a host
    </Button>
  );
}

export function ConnectHint() {
  return <span id="connect-hint">Linking is set up from the Grove desktop app.</span>;
}
