import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR_URL, resolveAvatarUrl } from '@/utils/avatar';

/** 测试使用的当前应用 Origin。 */
const CURRENT_ORIGIN = 'http://localhost:8000';

describe('头像地址解析', () => {
  /** 验证缺少头像时使用本地默认资源。 */
  it('空地址返回本地默认头像', () => {
    expect(resolveAvatarUrl(undefined, { currentOrigin: CURRENT_ORIGIN })).toBe(DEFAULT_AVATAR_URL);
    expect(resolveAvatarUrl('   ', { currentOrigin: CURRENT_ORIGIN })).toBe(DEFAULT_AVATAR_URL);
  });

  /** 验证同源的根路径、相对路径和绝对地址均可展示。 */
  it('允许同源 HTTP 和 HTTPS 地址', () => {
    expect(resolveAvatarUrl('/avatars/user.png', { currentOrigin: CURRENT_ORIGIN }))
      .toBe('http://localhost:8000/avatars/user.png');
    expect(resolveAvatarUrl('avatars/user.png', { currentOrigin: CURRENT_ORIGIN }))
      .toBe('http://localhost:8000/avatars/user.png');
    expect(resolveAvatarUrl('https://feiapi.example.com/avatar.png', {
      currentOrigin: 'https://feiapi.example.com',
    })).toBe('https://feiapi.example.com/avatar.png');
  });

  /** 验证显式配置的外部 HTTPS OSS 来源可以展示。 */
  it('允许白名单中的外部 HTTPS Origin', () => {
    expect(resolveAvatarUrl('https://bucket.oss-cn-hangzhou.aliyuncs.com/users/1.png', {
      currentOrigin: CURRENT_ORIGIN,
      allowedOrigins: 'https://bucket.oss-cn-hangzhou.aliyuncs.com, https://cdn.example.com',
    })).toBe('https://bucket.oss-cn-hangzhou.aliyuncs.com/users/1.png');
  });

  /** 验证未授权来源及相似恶意域名无法绕过 Origin 匹配。 */
  it('拒绝未授权的外部 Origin', () => {
    const options = {
      currentOrigin: CURRENT_ORIGIN,
      allowedOrigins: 'https://bucket.oss-cn-hangzhou.aliyuncs.com',
    };

    expect(resolveAvatarUrl('https://tracking.example.com/user.png', options)).toBe(DEFAULT_AVATAR_URL);
    expect(resolveAvatarUrl('https://bucket.oss-cn-hangzhou.aliyuncs.com.evil.example/user.png', options))
      .toBe(DEFAULT_AVATAR_URL);
  });

  /** 验证危险协议及外部 HTTP 地址均被拒绝。 */
  it('拒绝非 HTTP 协议和外部 HTTP 地址', () => {
    const options = {
      currentOrigin: CURRENT_ORIGIN,
      allowedOrigins: 'http://cdn.example.com,https://cdn.example.com',
    };

    expect(resolveAvatarUrl('data:image/png;base64,AAAA', options)).toBe(DEFAULT_AVATAR_URL);
    expect(resolveAvatarUrl('javascript:alert(1)', options)).toBe(DEFAULT_AVATAR_URL);
    expect(resolveAvatarUrl('blob:http://localhost:8000/avatar', options)).toBe(DEFAULT_AVATAR_URL);
    expect(resolveAvatarUrl('ftp://cdn.example.com/user.png', options)).toBe(DEFAULT_AVATAR_URL);
    expect(resolveAvatarUrl('http://cdn.example.com/user.png', options)).toBe(DEFAULT_AVATAR_URL);
  });

  /** 验证包含用户凭据的地址不会被展示。 */
  it('拒绝包含用户名或密码的 URL', () => {
    expect(resolveAvatarUrl('https://user:password@cdn.example.com/user.png', {
      currentOrigin: CURRENT_ORIGIN,
      allowedOrigins: 'https://cdn.example.com',
    })).toBe(DEFAULT_AVATAR_URL);
  });

  /** 验证非法或非纯 Origin 配置不会扩大可信来源。 */
  it('忽略非法及带额外信息的白名单配置', () => {
    const avatarUrl = 'https://cdn.example.com/user.png';
    const invalidConfigurations = [
      'not-a-url',
      'https://cdn.example.com/path',
      'https://cdn.example.com?token=value',
      'https://cdn.example.com#fragment',
      'https://user:password@cdn.example.com',
    ];

    invalidConfigurations.forEach((allowedOrigins) => {
      expect(resolveAvatarUrl(avatarUrl, { currentOrigin: CURRENT_ORIGIN, allowedOrigins }))
        .toBe(DEFAULT_AVATAR_URL);
    });
  });

  /** 验证无效地址和无效当前 Origin 安全回退。 */
  it('解析异常时返回本地默认头像', () => {
    expect(resolveAvatarUrl('https://cdn.example.com/%', {
      currentOrigin: 'invalid-origin',
      allowedOrigins: 'https://cdn.example.com',
    })).toBe(DEFAULT_AVATAR_URL);
  });
});
