import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { AppState } from "react-native";
import { syncQueuedIncidents } from "./syncQueuedIncidents";

/** Mount once inside the authenticated app layout. */
export function useIncidentSync() {
  useEffect(() => {
    void syncQueuedIncidents();

    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void syncQueuedIncidents();
      }
    });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") void syncQueuedIncidents();
      },
    );

    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
    };
  }, []);
}
