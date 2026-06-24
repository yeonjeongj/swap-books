import Clarity from "@microsoft/clarity";

export const clarityEvent = (eventName: string) => Clarity.event(eventName);
export const clarityIdentify = (
  customerId: string,
  sessionId?: string,
  pageId?: string,
  friendlyName?: string
) => Clarity.identify(customerId, sessionId, pageId, friendlyName);
export const clarityTag = (key: string, value: string | string[]) => Clarity.setTag(key, value);
