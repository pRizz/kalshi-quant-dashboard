import { KalshiPrivateClient, loadPrivateKeyPem } from "@kalshi-quant-dashboard/kalshi-client";
import { writeActivity } from "../audit/activity-log-service";
import { getSecretReadPolicy } from "../settings/settings-service";
import { reconcileOrders } from "../sync/reconcile";
import { assertTradingEnabledForPrivateRequest } from "./guards";
import { cancelMockOrder, isMockCredential, placeMockOrder } from "./mock-trading";
import { getTradingGuardState } from "./trading-context";

const createAuthedClient = async () => {
  const state = getTradingGuardState();
  const secretPolicy = getSecretReadPolicy(state.mode.environment);
  assertTradingEnabledForPrivateRequest({
    mode: state.mode,
    secretReadPolicy: secretPolicy,
  });

  const privateKeyPem = await loadPrivateKeyPem(secretPolicy.privateKeyPath);
  return new KalshiPrivateClient({
    environment: state.mode.environment,
    apiKeyId: secretPolicy.apiKeyId,
    privateKeyPem,
  });
};

const resolveCredentialMode = () => {
  const state = getTradingGuardState();
  const secretPolicy = getSecretReadPolicy(state.mode.environment);
  assertTradingEnabledForPrivateRequest({
    mode: state.mode,
    secretReadPolicy: secretPolicy,
  });

  return {
    state,
    secretPolicy,
    isMock: isMockCredential(secretPolicy),
  };
};

export const placeOrder = async (orderInput: {
  ticker: string;
  side: "yes" | "no";
  action: "buy" | "sell";
  count: number;
  maybeYesPrice?: number;
  maybeNoPrice?: number;
  maybeTimeInForce?: "fill_or_kill" | "good_till_canceled" | "immediate_or_cancel";
}) => {
  const credentialMode = resolveCredentialMode();
  const order = credentialMode.isMock
    ? placeMockOrder(orderInput)
    : (
        await (
          await createAuthedClient()
        ).createOrder({
          ticker: orderInput.ticker,
          side: orderInput.side,
          action: orderInput.action,
          count: orderInput.count,
          yes_price: orderInput.maybeYesPrice,
          no_price: orderInput.maybeNoPrice,
          time_in_force: orderInput.maybeTimeInForce,
          type: "limit",
        })
      ).order;

  reconcileOrders([order]);
  writeActivity({
    actionType: "order.place",
    summary: `Placed ${orderInput.action} ${orderInput.side.toUpperCase()} order for ${orderInput.ticker}`,
    maybeMetadata: {
      ticker: orderInput.ticker,
      side: orderInput.side,
      action: orderInput.action,
      count: orderInput.count,
      maybeYesPrice: orderInput.maybeYesPrice,
      maybeNoPrice: orderInput.maybeNoPrice,
    },
  });

  return order;
};

export const cancelOrder = async (orderId: string) => {
  const credentialMode = resolveCredentialMode();
  const response = credentialMode.isMock
    ? cancelMockOrder(orderId)
    : await (await createAuthedClient()).cancelOrder(orderId);
  reconcileOrders([response.order]);
  writeActivity({
    actionType: "order.cancel",
    summary: `Canceled order ${orderId}`,
    maybeMetadata: {
      orderId,
      reducedBy: response.reduced_by,
    },
  });
  return response;
};
