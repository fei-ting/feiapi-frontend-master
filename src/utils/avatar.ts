/** 本地默认头像地址。 */
export const DEFAULT_AVATAR_URL = '/logo.svg';

/**
 * 头像地址解析选项。
 */
export interface AvatarUrlResolveOptions {
  /** 当前应用 Origin，默认读取浏览器地址。 */
  currentOrigin?: string;
  /** 允许的外部头像 Origin，多个值使用英文逗号分隔。 */
  allowedOrigins?: string;
}

/** 允许作为图片来源的网络协议。 */
const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * 判断可信来源配置是否为不含额外信息的纯 Origin。
 *
 * @param url 待校验的 URL
 * @returns 是否为合法 Origin
 */
const isOriginOnlyUrl = (url: URL): boolean => (
  HTTP_PROTOCOLS.has(url.protocol)
  && !url.username
  && !url.password
  && url.pathname === '/'
  && !url.search
  && !url.hash
);

/**
 * 解析允许的外部头像 Origin。
 *
 * @param value 逗号分隔的 Origin 配置
 * @returns 合法 Origin 集合
 */
const parseAllowedOrigins = (value?: string): ReadonlySet<string> => new Set(
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .flatMap((item) => {
      try {
        const url = new URL(item);
        return isOriginOnlyUrl(url) ? [url.origin] : [];
      } catch {
        return [];
      }
    }),
);

/**
 * 获取当前应用 Origin。
 *
 * @param configuredOrigin 调用方指定的 Origin
 * @returns 标准化后的 Origin
 */
const getCurrentOrigin = (configuredOrigin?: string): string => {
  const origin = configuredOrigin || window.location.origin;
  return new URL(origin).origin;
};

/**
 * 将用户头像地址解析为允许展示的安全地址。
 *
 * @param avatarUrl 后端返回的用户头像地址
 * @param options 地址解析选项
 * @returns 合法头像地址或本地默认头像
 */
export const resolveAvatarUrl = (
  avatarUrl?: string,
  options: AvatarUrlResolveOptions = {},
): string => {
  const normalizedAvatarUrl = avatarUrl?.trim();
  if (!normalizedAvatarUrl) {
    return DEFAULT_AVATAR_URL;
  }

  try {
    const currentOrigin = getCurrentOrigin(options.currentOrigin);
    const candidate = new URL(normalizedAvatarUrl, `${currentOrigin}/`);
    if (
      !HTTP_PROTOCOLS.has(candidate.protocol)
      || candidate.username
      || candidate.password
    ) {
      return DEFAULT_AVATAR_URL;
    }

    if (candidate.origin === currentOrigin) {
      return candidate.href;
    }

    const allowedOrigins = parseAllowedOrigins(
      options.allowedOrigins ?? import.meta.env.VITE_AVATAR_ALLOWED_ORIGINS,
    );
    return candidate.protocol === 'https:' && allowedOrigins.has(candidate.origin)
      ? candidate.href
      : DEFAULT_AVATAR_URL;
  } catch {
    return DEFAULT_AVATAR_URL;
  }
};
