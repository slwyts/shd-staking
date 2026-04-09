/**
 * @file hooks/common/useLocalProfile.ts
 * @description 本地个人资料（头像、昵称）— 仅存于浏览器 localStorage，不上链。
 */
"use client";

import { useCallback, useEffect, useState } from "react";

const KEY_AVATAR = "shd_profile_avatar";
const KEY_NICK = "shd_profile_nickname";

const MAX_AVATAR_BYTES = 400 * 1024;

export function useLocalProfile() {
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const a = localStorage.getItem(KEY_AVATAR);
      const n = localStorage.getItem(KEY_NICK);
      if (a) setAvatarDataUrl(a);
      if (n) setNickname(n);
    } catch {
      /* private mode / quota */
    }
    setHydrated(true);
  }, []);

  const clearAvatar = useCallback(() => {
    setAvatarDataUrl(null);
    try {
      localStorage.removeItem(KEY_AVATAR);
    } catch {
      /* */
    }
  }, []);

  const setAvatarFromFile = useCallback((file: File, onError?: (msg: string) => void) => {
    if (!file.type.startsWith("image/")) {
      onError?.("请选择图片文件");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      onError?.("图片请小于 400KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") {
        setAvatarDataUrl(r);
        try {
          localStorage.setItem(KEY_AVATAR, r);
        } catch {
          onError?.("存储失败，请尝试更小的图片");
        }
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const persistNickname = useCallback((next: string) => {
    const t = next.trim();
    setNickname(t);
    try {
      if (t) localStorage.setItem(KEY_NICK, t);
      else localStorage.removeItem(KEY_NICK);
    } catch {
      /* */
    }
  }, []);

  return {
    avatarDataUrl,
    nickname,
    hydrated,
    clearAvatar,
    setAvatarFromFile,
    persistNickname,
  };
}
