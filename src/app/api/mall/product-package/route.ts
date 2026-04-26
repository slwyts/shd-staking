import { NextRequest, NextResponse } from "next/server";

const MALL_CALLBACK_URL = process.env.MALL_CALLBACK_URL;
const MALL_CALLBACK_SECRET = process.env.MALL_CALLBACK_SECRET;

type ProductPackagePayload = {
  txHash?: string;
  walletAddress?: string;
  phone?: string;
  sn?: string;
  packageAmount?: number;
  orderRef?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as ProductPackagePayload | null;

  if (
    !payload ||
    !isNonEmptyString(payload.txHash) ||
    !isNonEmptyString(payload.walletAddress) ||
    !isNonEmptyString(payload.phone) ||
    !isNonEmptyString(payload.sn) ||
    typeof payload.packageAmount !== "number" ||
    payload.packageAmount <= 0
  ) {
    return NextResponse.json({ ok: false, message: "参数不完整" }, { status: 400 });
  }

  if (!MALL_CALLBACK_URL) {
    return NextResponse.json(
      { ok: false, skipped: true, message: "MALL_CALLBACK_URL 未配置，链上扣款已完成" },
      { status: 202 }
    );
  }

  const response = await fetch(MALL_CALLBACK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(MALL_CALLBACK_SECRET ? { "x-callback-secret": MALL_CALLBACK_SECRET } : {}),
    },
    body: JSON.stringify({
      txHash: payload.txHash,
      walletAddress: payload.walletAddress,
      phone: payload.phone.trim(),
      sn: payload.sn.trim(),
      packageAmount: payload.packageAmount,
      orderRef: payload.orderRef,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    return NextResponse.json(
      { ok: false, message: "商城回调失败", status: response.status, response: responseText },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, response: responseText });
}