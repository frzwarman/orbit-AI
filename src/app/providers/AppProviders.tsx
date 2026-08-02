import type { PropsWithChildren } from "react";

import { AppErrorBoundary } from "../../components/common/AppErrorBoundary";

export function AppProviders({ children }: PropsWithChildren) {
  return <AppErrorBoundary>{children}</AppErrorBoundary>;
}
