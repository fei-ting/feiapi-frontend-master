<template>
  <div class="fei-data-table">
    <div class="fei-data-table__viewport" :style="viewportStyle">
      <table class="fei-table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :style="getColumnStyle(column)"
            >
              <slot :name="`header-${column.key}`" :column="column">
                {{ column.title }}
              </slot>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="getRowKey(row, index)">
            <td
              v-for="column in columns"
              :key="column.key"
              :style="getColumnStyle(column)"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getCellValue(row, column.key)"
                :column="column"
              >
                {{ formatCellValue(getCellValue(row, column.key)) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!rows.length" class="fei-empty fei-data-table__empty">
        {{ emptyText }}
      </div>
    </div>

    <div v-if="rows.length" class="fei-pagination fei-data-table__pagination">
      <button
        class="fei-pagination__btn"
        type="button"
        :disabled="pagination.current <= 1"
        aria-label="上一页"
        @click="changePage(pagination.current - 1)"
      >
        上一页
      </button>
      <span class="fei-pagination__info">
        第 {{ pagination.current }} 页 / 共 {{ totalPages }} 页
      </span>
      <button
        class="fei-pagination__btn"
        type="button"
        :disabled="pagination.current >= totalPages"
        aria-label="下一页"
        @click="changePage(pagination.current + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TRow extends object">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import type { DataTableColumn, DataTablePagination } from '@/types/table';

/** 公共数据表格组件属性。 */
const props = withDefaults(defineProps<{
  /** 列配置。 */
  columns: DataTableColumn[];
  /** 当前页数据。 */
  rows: TRow[];
  /** 行唯一标识字段或计算函数。 */
  rowKey: string | ((row: TRow) => string | number);
  /** 分页配置。 */
  pagination: DataTablePagination;
  /** 空数据提示。 */
  emptyText?: string;
}>(), {
  emptyText: '暂无数据',
});

/** 公共数据表格组件事件。 */
const emit = defineEmits<{
  /** 页码发生变化。 */
  (event: 'page-change', page: number): void;
}>();

/** 每行预留高度，单位为像素。 */
const TABLE_ROW_HEIGHT = 56;

/** 总页数；存在数据时至少为一页。 */
const totalPages = computed(() => Math.max(1, Math.ceil(props.pagination.total / props.pagination.pageSize)));

/** 固定当前页列表视口高度所需的 CSS 变量。 */
const viewportStyle = computed<CSSProperties>(() => ({
  '--fei-table-page-size': String(props.pagination.pageSize),
  '--fei-table-body-height': `${props.pagination.pageSize * TABLE_ROW_HEIGHT}px`,
}));

/**
 * 获取表格行唯一标识。
 * @param row 当前行数据
 * @param index 当前行索引
 * @returns 行唯一标识
 */
const getRowKey = (row: TRow, index: number): string | number => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row);
  }
  const value = Reflect.get(row, props.rowKey);
  return typeof value === 'string' || typeof value === 'number' ? value : index;
};

/**
 * 获取列对应的原始值。
 * @param row 当前行数据
 * @param key 列标识
 * @returns 单元格原始值
 */
const getCellValue = (row: TRow, key: string): unknown => Reflect.get(row, key);

/**
 * 格式化默认单元格内容。
 * @param value 单元格原始值
 * @returns 可展示文本
 */
const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
};

/**
 * 生成列宽和对齐样式。
 * @param column 列配置
 * @returns 列内联样式
 */
const getColumnStyle = (column: DataTableColumn): CSSProperties => ({
  minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
  textAlign: column.align ?? 'center',
});

/**
 * 发出合法页码变更事件。
 * @param page 目标页码
 */
const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === props.pagination.current) {
    return;
  }
  emit('page-change', page);
};
</script>
