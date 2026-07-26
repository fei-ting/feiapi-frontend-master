import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DataTable from '../DataTable.vue';

/** 公共数据表格测试。 */
describe('DataTable', () => {
  /** 验证列配置、默认单元格和自定义单元格均可正常渲染。 */
  it('根据列配置渲染表头和自定义单元格', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [
          { key: 'name', title: '接口名称', minWidth: 160 },
          { key: 'status', title: '状态' },
        ],
        rows: [{ id: 1, name: '天气接口', status: 1 }],
        rowKey: 'id',
        pagination: { current: 1, pageSize: 10, total: 1 },
      },
      slots: {
        'cell-status': '<template #cell-status="{ row }"><span class="custom-status">{{ row.status === 1 ? \'可调用\' : \'不可调用\' }}</span></template>',
      },
    });

    expect(wrapper.findAll('th').map((item) => item.text())).toEqual(['接口名称', '状态']);
    expect(wrapper.get('tbody').text()).toContain('天气接口');
    expect(wrapper.get('.custom-status').text()).toBe('可调用');
  });

  /** 验证不足十条数据时保留固定列表区域且单页分页按钮禁用。 */
  it('保留固定十行列表区域并显示单页分页', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'name', title: '接口名称' }],
        rows: [{ id: 1, name: '天气接口' }],
        rowKey: 'id',
        pagination: { current: 1, pageSize: 10, total: 1 },
      },
    });

    expect(wrapper.get('.fei-data-table__viewport').attributes('style')).toContain('--fei-table-page-size: 10');
    expect(wrapper.get('.fei-pagination__info').text()).toBe('第 1 页 / 共 1 页');
    expect(wrapper.findAll<HTMLButtonElement>('.fei-pagination__btn').every((button) => button.element.disabled)).toBe(true);
  });

  /** 验证分页按钮只向父页面发出合法页码。 */
  it('点击分页按钮时发出页码变更事件', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'name', title: '接口名称' }],
        rows: [{ id: 11, name: '库存接口' }],
        rowKey: 'id',
        pagination: { current: 2, pageSize: 10, total: 25 },
      },
    });

    const buttons = wrapper.findAll('.fei-pagination__btn');
    await buttons[0]?.trigger('click');
    await buttons[1]?.trigger('click');

    expect(wrapper.emitted('page-change')).toEqual([[1], [3]]);
  });

  /** 验证无数据时显示指定空状态且不展示分页。 */
  it('无数据时显示空状态并隐藏分页', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'name', title: '接口名称' }],
        rows: [],
        rowKey: 'id',
        pagination: { current: 1, pageSize: 10, total: 0 },
        emptyText: '暂无接口数据',
      },
    });

    expect(wrapper.get('.fei-empty').text()).toBe('暂无接口数据');
    expect(wrapper.find('.fei-pagination').exists()).toBe(false);
  });
});
