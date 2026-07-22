import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UserAvatar from '../UserAvatar.vue';
import { DEFAULT_AVATAR_URL } from '@/utils/avatar';

describe('UserAvatar', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** 验证空地址使用本地默认头像。 */
  it('缺少头像地址时显示本地默认头像', () => {
    const wrapper = mount(UserAvatar, { props: { alt: '测试用户' } });

    expect(wrapper.get('img').attributes('src')).toBe(DEFAULT_AVATAR_URL);
  });

  /** 验证合法地址、替代文本和样式类正常传递。 */
  it('渲染合法头像并透传图片属性', () => {
    const wrapper = mount(UserAvatar, {
      props: { src: '/avatars/user.png', alt: '测试用户' },
      attrs: { class: 'test-avatar', loading: 'lazy' },
    });
    const image = wrapper.get('img');

    expect(image.attributes('src')).toBe(new URL('/avatars/user.png', window.location.origin).href);
    expect(image.attributes('alt')).toBe('测试用户');
    expect(image.classes()).toContain('test-avatar');
    expect(image.attributes('loading')).toBe('lazy');
  });

  /** 验证组件使用环境变量中的外部头像白名单。 */
  it('渲染白名单中的 HTTPS OSS 头像', () => {
    vi.stubEnv('VITE_AVATAR_ALLOWED_ORIGINS', 'https://bucket.oss-cn-hangzhou.aliyuncs.com');
    const avatarUrl = 'https://bucket.oss-cn-hangzhou.aliyuncs.com/users/1.png';
    const wrapper = mount(UserAvatar, { props: { src: avatarUrl, alt: '测试用户' } });

    expect(wrapper.get('img').attributes('src')).toBe(avatarUrl);
  });

  /** 验证远程图片加载失败后回退本地默认头像。 */
  it('图片加载失败时回退本地默认头像', async () => {
    const wrapper = mount(UserAvatar, { props: { src: '/avatars/missing.png', alt: '测试用户' } });
    const image = wrapper.get('img');

    await image.trigger('error');

    expect(image.attributes('src')).toBe(DEFAULT_AVATAR_URL);
  });

  /** 验证本地默认头像失败时不会重复切换地址。 */
  it('默认头像加载失败时保持当前地址', async () => {
    const wrapper = mount(UserAvatar, { props: { alt: '测试用户' } });
    const image = wrapper.get('img');

    await image.trigger('error');
    await image.trigger('error');

    expect(image.attributes('src')).toBe(DEFAULT_AVATAR_URL);
  });

  /** 验证用户头像变化后组件重新解析地址。 */
  it('头像属性变化后更新展示地址', async () => {
    const wrapper = mount(UserAvatar, { props: { alt: '测试用户' } });

    await wrapper.setProps({ src: '/avatars/updated.png' });

    expect(wrapper.get('img').attributes('src'))
      .toBe(new URL('/avatars/updated.png', window.location.origin).href);
  });
});
