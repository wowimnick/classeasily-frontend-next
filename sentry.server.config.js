import * as Sentry from "@sentry/nextjs";
import { getBaseSentryOptions } from "./sentry.shared.config";

const options = getBaseSentryOptions();
if (options) {
  Sentry.init(options);
}
