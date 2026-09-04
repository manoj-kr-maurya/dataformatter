import type { ErrorWorkspaceInput } from "./analyze";

const errorText = `java.lang.NullPointerException: Cannot invoke "Object.toString()" because the return value of "rewardAdapters()" is null
	at com.example.checkout.RewardController.fetch(RewardController.java:142)
	at com.example.checkout.RewardService.load(RewardService.java:87)
	at org.springframework.web.method.support.InvocableHandlerMethod.invoke(InvocableHandlerMethod.java:234)`;

const logsText = `2026-09-02T10:04:11.512Z INFO  [checkout-service] traceId=8f3a1c2e9b4d77a1 HTTP GET /api/rewards/active started
2026-09-02T10:04:11.520Z ERROR [checkout-service] traceId=8f3a1c2e9b4d77a1 Reward inventory lookup failed: downstream 503
2026-09-02T10:04:11.521Z INFO  [checkout-service] traceId=8f3a1c2e9b4d77a1 GET /api/rewards/active completed with 500 in 9ms
2026-09-02T10:04:11.523Z ERROR [checkout-service] traceId=8f3a1c2e9b4d77a1 NullPointerException in RewardController.fetch
2026-09-02T10:04:12.001Z ERROR [checkout-service] traceId=8f3a1c2e9b4d77a1 Reward inventory lookup failed: downstream 503
2026-09-02T10:04:12.003Z WARN  [checkout-service] traceId=8f3a1c2e9b4d77a1 Rewards adapter returned no fallback, continuing with empty list`;

const requestHeaders = `Host: checkout.example.com
Accept: application/json
x-request-id: req-77a1`;

const responseStatus = "500";
const responseHeaders = `Content-Type: application/json`;
const responseBody = `{"error":"internal_server_error","message":"Unexpected server error","requestId":"req-77a1"}`;

const metadataText = `environment=staging
deploy=2026-09-02T09:00Z
cluster=us-east-1`;
const requestMethod = "GET";
const requestUrl = "https://checkout.example.com/api/rewards/active";
const requestBody = "";

export const ERROR_WORKSPACE_SAMPLE: ErrorWorkspaceInput = {
  errorText,
  logsText,
  requestUrl,
  requestMethod,
  requestHeadersText: requestHeaders,
  requestBody,
  responseStatus,
  responseHeadersText: responseHeaders,
  responseBody,
  metadataText,
};