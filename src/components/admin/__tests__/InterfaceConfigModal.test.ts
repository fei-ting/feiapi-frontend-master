import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InterfaceConfigModal from '../InterfaceConfigModal.vue';

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/services/interfaceInfo', () => ({
  interfaceService: {
    add: mocks.add,
    update: mocks.update,
  },
}));

describe('InterfaceConfigModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.add.mockResolvedValue(7);
  });

  it('新增接口时省略空展示地址', async () => {
    const wrapper = mount(InterfaceConfigModal, {
      props: { open: true },
    });
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('用户接口');
    await inputs[1].setValue('getUser');
    await inputs[2].setValue('/api/user');
    await inputs[3].setValue('http://user-service:8080');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.add).toHaveBeenCalledOnce();
    const payload = mocks.add.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: '用户接口',
      sdkMethodName: 'getUser',
      path: '/api/user',
      targetHost: 'http://user-service:8080',
    });
    expect(payload).not.toHaveProperty('url');
    expect(wrapper.emitted('saved')).toEqual([[7, true]]);
  });
});
