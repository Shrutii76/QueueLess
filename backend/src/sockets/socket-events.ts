export const SOCKET_EVENTS = {
  // Client -> server
  JOIN_QUEUE: "queue:join",
  JOIN_BUSINESS: "business:join",
  LEAVE_QUEUE: "queue:leave",
  LEAVE_BUSINESS: "business:leave",

  // Server -> client
  ENTRY_JOINED: "queue:entry_joined",
  TOKEN_CALLED: "queue:token_called",
  CUSTOMER_SERVING: "queue:customer_serving",
  SERVICE_COMPLETED: "queue:service_completed",
  CUSTOMER_NO_SHOW: "queue:customer_no_show",
  ENTRY_CANCELLED: "queue:entry_cancelled",
  POSITION_UPDATED: "queue:position_updated",
  STATUS_UPDATED: "queue:status_updated",
  SNAPSHOT_UPDATED: "queue:snapshot_updated",
} as const;
