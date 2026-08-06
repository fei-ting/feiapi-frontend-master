<template>
  <div v-if="open" class="fei-modal-mask" role="presentation" @click.self="emit('close')" @keyup.esc="emit('close')">
    <section
      class="fei-modal fei-publish-check-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-check-title"
    >
      <div class="fei-modal__header">
        <div>
          <p class="fei-modal__eyebrow">发布门禁</p>
          <h2 id="publish-check-title" class="fei-modal__title">{{ title }}</h2>
        </div>
        <button class="fei-icon-btn" type="button" aria-label="关闭" title="关闭" @click="emit('close')">×</button>
      </div>

      <div class="fei-publish-check-dialog__body">
        <div v-if="result?.passed" class="fei-publish-check-dialog__success" role="status">
          发布条件已通过
        </div>
        <div v-else class="fei-publish-check-dialog__groups">
          <section
            v-for="group in visibleGroups"
            :key="group.category"
            class="fei-publish-check-dialog__group"
          >
            <h3>{{ group.title }}</h3>
            <ul>
              <li v-for="issue in group.issues" :key="`${issue.field || '-'}-${issue.ruleCode}`">
                <span class="fei-publish-check-dialog__field">{{ issue.field || '-' }}</span>
                <span>{{ issue.message }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div class="fei-modal__footer">
        <button class="fei-btn fei-btn--primary" type="button" @click="emit('close')">知道了</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type {
  InterfacePublishCheckVO,
  InterfacePublishIssueCategory,
  InterfacePublishIssueVO,
} from '@/features/interface-platform/publishing/types/interfacePublish';

/** 组件属性。 */
interface Props {
  /** 是否打开对话框。 */
  open: boolean;
  /** 检查结果。 */
  result: InterfacePublishCheckVO | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  /** 关闭对话框。 */
  (event: 'close'): void;
}>();

/** 分类标题。 */
const categoryTitles: Record<InterfacePublishIssueCategory, string> = {
  INTERFACE_CONFIG: '接口配置',
  SDK: 'SDK 契约',
  RUNTIME_TEMPLATE: '运行时模板',
  DOCUMENT: '结构化文档',
  CALL_EXAMPLE: '调用示例',
};

/** 对话框标题。 */
const title = computed(() => (props.result?.passed ? '发布条件已通过' : '发布检查未通过'));

/** 按分类整理后的可见问题组。 */
const visibleGroups = computed(() => {
  const issues = props.result?.issues ?? [];
  return (Object.keys(categoryTitles) as InterfacePublishIssueCategory[])
    .map((category) => ({
      category,
      title: categoryTitles[category],
      issues: issues.filter((issue: InterfacePublishIssueVO) => issue.category === category),
    }))
    .filter((group) => group.issues.length > 0);
});
</script>
