export const clarityEvent = (eventName: string) => {
  if (typeof window === "undefined") return;
  import("@microsoft/clarity").then((mod) => mod.default.event(eventName));
};

export const clarityIdentify = (
  customerId: string,
  sessionId?: string,
  pageId?: string,
  friendlyName?: string
) => {
  if (typeof window === "undefined") return;
  import("@microsoft/clarity").then((mod) =>
    mod.default.identify(customerId, sessionId, pageId, friendlyName)
  );
};

export const clarityTag = (key: string, value: string | string[]) => {
  if (typeof window === "undefined") return;
  import("@microsoft/clarity").then((mod) => mod.default.setTag(key, value));
};
