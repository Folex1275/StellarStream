export interface WaterfallHop {
  id: string;
  from: string;
  to: string;
  amount: number;
  fill: string;
  label: string;
}

export interface SimulationWaterfallSummary {
  networkFee: number;
  protocolFee: number;
  totalRecipientAmount: number;
  hops: WaterfallHop[];
}

interface RecipientAllocation {
  address: string;
  label?: string;
  amount: number;
}

interface BuildWaterfallOptions {
  senderLabel?: string;
  protocolLabel?: string;
  networkLabel?: string;
  totalAmount: number;
  networkFee?: number;
  protocolFee?: number;
  recipients: RecipientAllocation[];
}

type RpcDistributionShape = {
  recipients?: Array<{
    address?: string;
    to?: string;
    label?: string;
    name?: string;
    amount?: number | string;
  }>;
  protocolFee?: number | string;
  protocol_fee?: number | string;
  networkFee?: number | string;
  network_fee?: number | string;
};

function toAmount(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeRecipients(input: RecipientAllocation[]): RecipientAllocation[] {
  return input
    .map((recipient) => ({
      ...recipient,
      amount: Math.max(0, recipient.amount),
      label: recipient.label?.trim() || undefined,
      address: recipient.address.trim(),
    }))
    .filter((recipient) => recipient.address.length > 0 && recipient.amount > 0);
}

export function extractSimulationShape(
  simulationResults: unknown
): Partial<RpcDistributionShape> | null {
  if (!simulationResults || typeof simulationResults !== "object") {
    return null;
  }

  const candidate = simulationResults as Record<string, unknown>;
  const nested =
    (candidate.simulationResults as Record<string, unknown> | undefined) ??
    (candidate.result as Record<string, unknown> | undefined) ??
    candidate;

  if (!nested || typeof nested !== "object") {
    return null;
  }

  return nested as Partial<RpcDistributionShape>;
}

export function buildSimulationWaterfall(
  options: BuildWaterfallOptions
): SimulationWaterfallSummary {
  const senderLabel = options.senderLabel ?? "Sender";
  const protocolLabel = options.protocolLabel ?? "Protocol";
  const networkLabel = options.networkLabel ?? "Network Fees";
  const networkFee = Math.max(0, options.networkFee ?? 0);
  const protocolFee = Math.max(0, options.protocolFee ?? 0);
  const recipients = normalizeRecipients(options.recipients);
  const totalRecipientAmount = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);
  const fundedAmount = Math.max(options.totalAmount, networkFee + protocolFee + totalRecipientAmount);

  const hops: WaterfallHop[] = [
    {
      id: "funding",
      from: senderLabel,
      to: protocolLabel,
      amount: fundedAmount,
      fill: "#22d3ee",
      label: "Funding Transaction",
    },
  ];

  if (networkFee > 0) {
    hops.push({
      id: "network-fee",
      from: protocolLabel,
      to: networkLabel,
      amount: networkFee,
      fill: "#fb7185",
      label: "Network Fee",
    });
  }

  if (protocolFee > 0) {
    hops.push({
      id: "protocol-fee",
      from: protocolLabel,
      to: "Protocol Treasury",
      amount: protocolFee,
      fill: "#f59e0b",
      label: "Protocol Fee",
    });
  }

  recipients.forEach((recipient, index) => {
    hops.push({
      id: `recipient-${index}`,
      from: protocolLabel,
      to: recipient.label ?? recipient.address,
      amount: recipient.amount,
      fill: index % 2 === 0 ? "#34d399" : "#a78bfa",
      label: "Recipient Allocation",
    });
  });

  return {
    networkFee,
    protocolFee,
    totalRecipientAmount,
    hops,
  };
}

export function buildSimulationWaterfallFromRpc(params: {
  simulationResults?: unknown;
  totalAmount: number;
  fallbackRecipients: RecipientAllocation[];
  senderLabel?: string;
  protocolLabel?: string;
}): SimulationWaterfallSummary {
  const parsed = extractSimulationShape(params.simulationResults);
  const recipients =
    parsed?.recipients?.map((recipient) => ({
      address: recipient.address ?? recipient.to ?? "Recipient",
      label: recipient.label ?? recipient.name,
      amount: toAmount(recipient.amount),
    })) ?? params.fallbackRecipients;

  return buildSimulationWaterfall({
    senderLabel: params.senderLabel,
    protocolLabel: params.protocolLabel,
    totalAmount: params.totalAmount,
    networkFee: toAmount(parsed?.networkFee ?? parsed?.network_fee),
    protocolFee: toAmount(parsed?.protocolFee ?? parsed?.protocol_fee),
    recipients,
  });
}
