"use client";

import { useId, useRef, useState } from "react";
import { useLocalProfile } from "@/hooks/common/useLocalProfile";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PcCard } from "@/components/dashboard/PersonalCenterHub";

interface PersonalCenterProfileProps {
  /** hub：紧凑横排，适配 RobotX 风格个人中心 */
  variant?: "default" | "hub";
}

/**
 * 个人资料卡片：头像上传 / 移除、昵称（本地存储）
 */
export function PersonalCenterProfile({ variant = "default" }: PersonalCenterProfileProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const { avatarDataUrl, nickname, hydrated, clearAvatar, setAvatarFromFile, persistNickname } =
    useLocalProfile();
  const [nickDraft, setNickDraft] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const displayNick = nickDraft !== null ? nickDraft : nickname;
  const displayInitial = displayNick.trim().slice(0, 1).toUpperCase() || "用";

  if (!hydrated) {
    const Box = variant === "hub" ? PcCard : Card;
    return (
      <Box className={variant === "hub" ? "animate-pulse" : "mb-6 animate-pulse"}>
        <div className="flex gap-4">
          <div className={`shrink-0 rounded-xl bg-white/10 ${variant === "hub" ? "h-14 w-14" : "h-24 w-24 cut-corners"}`} />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-10 w-full max-w-sm rounded bg-white/10" />
          </div>
        </div>
      </Box>
    );
  }

  if (variant === "hub") {
    return (
      <PcCard>
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyber-blue/35 bg-black/20"
          >
            {avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL from user upload
              <img src={avatarDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-cyber-blue">{displayInitial}</span>
            )}
          </div>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) setAvatarFromFile(f, (msg) => setHint(msg));
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-muted">我的资料</p>
            <input
              id="profile-nickname"
              type="text"
              maxLength={24}
              placeholder="昵称（本机）"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/40"
              value={displayNick}
              onChange={(e) => setNickDraft(e.target.value)}
              onBlur={() => {
                persistNickname(displayNick);
                setNickDraft(null);
              }}
            />
            {hint && <p className="mt-1 text-[10px] text-error">{hint}</p>}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              头像
            </Button>
            {avatarDataUrl && (
              <Button type="button" size="sm" variant="ghost" onClick={() => { clearAvatar(); setHint(null); }}>
                移除
              </Button>
            )}
          </div>
        </div>
      </PcCard>
    );
  }

  return (
    <Card className="mb-6 border border-cyber-blue/15">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">我的资料</h2>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <div
            className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden cut-corners border-2 border-cyber-blue/40 bg-white/5"
            style={{ aspectRatio: "1" }}
          >
            {avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL from user upload
              <img src={avatarDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-cyber-blue">{displayInitial}</span>
            )}
          </div>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) setAvatarFromFile(f, (msg) => setHint(msg));
            }}
          />
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              上传头像
            </Button>
            {avatarDataUrl && (
              <Button type="button" size="sm" variant="ghost" onClick={() => { clearAvatar(); setHint(null); }}>
                移除头像
              </Button>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label htmlFor="profile-nickname" className="mb-1 block text-xs font-medium text-text-muted">
              昵称（仅保存在本机）
            </label>
            <input
              id="profile-nickname"
              type="text"
              maxLength={24}
              placeholder="例如：链上旅人"
              className="cut-corners w-full max-w-md border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-cyber-blue/50"
              value={displayNick}
              onChange={(e) => setNickDraft(e.target.value)}
              onBlur={() => {
                persistNickname(displayNick);
                setNickDraft(null);
              }}
            />
            <p className="mt-1 text-xs text-text-muted">失焦后自动保存；与钱包地址无关。</p>
          </div>
          {hint && <p className="text-xs text-error">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}
