<template>
  <div
    v-if="open"
    ref="dialogRef"
    class="fei-modal-mask"
    role="dialog"
    aria-modal="true"
    aria-labelledby="response-field-delete-title"
    tabindex="-1"
    @click.self="cancel"
    @keyup.esc="cancel"
    @keydown="handleKeydown"
  >
    <section class="fei-response-delete-dialog">
      <header class="fei-response-delete-dialog__header">
        <div>
          <p>响应字段树</p>
          <h2 id="response-field-delete-title">删除非叶子字段</h2>
        </div>
        <button class="fei-icon-btn" type="button" aria-label="关闭" title="关闭" @click="cancel">
          <CloseOutlined />
        </button>
      </header>

      <p class="fei-response-delete-dialog__target">{{ targetPath }}</p>
      <p class="fei-response-delete-dialog__count">受影响子字段（{{ descendantPaths.length }}）</p>
      <ul class="fei-response-delete-dialog__descendants" aria-label="受影响的子字段">
        <li v-for="(path, index) in descendantPaths" :key="`${index}-${path}`">{{ path }}</li>
      </ul>
      <p v-if="errorMessage" class="fei-form-error" role="alert">{{ errorMessage }}</p>

      <footer class="fei-response-delete-dialog__footer">
        <button class="fei-btn fei-response-delete-dialog__danger" type="button" @click="deleteSubtree">
          删除整个子树
        </button>
        <button class="fei-btn fei-btn--secondary" type="button" @click="promoteChildren">
          提升直接子字段
        </button>
        <button class="fei-btn fei-btn--secondary" type="button" @click="cancel">取消</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { CloseOutlined } from '@ant-design/icons-vue';
import { useDialogFocusTrap } from '@/composables/useDialogFocusTrap';

/** 响应字段删除对话框属性。 */
interface ResponseFieldDeleteDialogProps {
  /** 是否显示对话框。 */
  open: boolean;
  /** 待删除字段完整路径。 */
  targetPath: string;
  /** 全部受影响后代字段路径。 */
  descendantPaths: string[];
  /** 当前操作错误。 */
  errorMessage?: string;
}

/** 响应字段删除对话框事件。 */
interface ResponseFieldDeleteDialogEmits {
  /** 删除当前字段及全部后代。 */
  (event: 'delete-subtree'): void;
  /** 删除当前字段并提升直接子字段。 */
  (event: 'promote-children'): void;
  /** 取消删除。 */
  (event: 'cancel'): void;
}

const props = withDefaults(defineProps<ResponseFieldDeleteDialogProps>(), { errorMessage: '' });
const emit = defineEmits<ResponseFieldDeleteDialogEmits>();
/** 对话框容器。 */
const dialogRef = ref<HTMLElement | null>(null);
const { handleKeydown, focusFirst } = useDialogFocusTrap(dialogRef);

/** 请求删除整个子树。 */
const deleteSubtree = (): void => { emit('delete-subtree'); };

/** 请求提升直接子字段。 */
const promoteChildren = (): void => { emit('promote-children'); };

/** 取消删除操作。 */
const cancel = (): void => { emit('cancel'); };

watch(() => props.open, (open) => {
  if (open) focusFirst();
}, { immediate: true });
</script>

<style scoped>
.fei-response-delete-dialog {
  width: min(620px, 100%);
  max-height: min(720px, 90vh);
  overflow: auto;
  padding: 24px;
  background: #fff;
  border: 1px solid var(--fei-border);
  border-radius: 8px;
  box-shadow: var(--fei-shadow);
}

.fei-response-delete-dialog__header,
.fei-response-delete-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.fei-response-delete-dialog__header p {
  margin: 0 0 4px;
  color: var(--fei-primary);
  font-size: 12px;
  font-weight: 800;
}

.fei-response-delete-dialog__header h2 {
  margin: 0;
  color: var(--fei-text);
  font-size: 20px;
}

.fei-response-delete-dialog__target {
  margin: 20px 0 10px;
  color: var(--fei-text);
  font-weight: 800;
  overflow-wrap: anywhere;
}

.fei-response-delete-dialog__count {
  margin: 0 0 8px;
  color: var(--fei-text-muted);
  font-size: 13px;
}

.fei-response-delete-dialog__descendants {
  display: grid;
  gap: 8px;
  max-height: 280px;
  margin: 0;
  padding: 14px 14px 14px 34px;
  overflow: auto;
  border: 1px solid var(--fei-border);
  background: #f8fafc;
  color: var(--fei-text-secondary);
}

.fei-response-delete-dialog__descendants li {
  overflow-wrap: anywhere;
}

.fei-response-delete-dialog__footer {
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 22px;
}

.fei-response-delete-dialog__danger {
  border-color: var(--fei-error);
  background: var(--fei-error);
  color: #fff;
}

@media (max-width: 640px) {
  .fei-response-delete-dialog {
    padding: 18px;
  }

  .fei-response-delete-dialog__footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
