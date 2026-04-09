import { redirect } from "next/navigation";

/** 钱包能力已合并至个人中心 /dashboard，保留此路由以兼容旧链接 */
export default function WalletRedirectPage() {
  redirect("/dashboard");
}
