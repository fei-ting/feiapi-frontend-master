import { ref } from 'vue';
import { interfaceService } from '@/services/interfaceInfo';
import type { ApiError } from '@/types/common';
import {
  PUBLISH_CHECK_FAILED_CODE,
  type InterfacePublishCheckVO,
  type InterfacePublishErrorData,
} from '@/features/interface-platform/publishing/types/interfacePublish';

/** Toast 通知类型。 */
type ToastType = 'success' | 'error' | 'info';

/** 发布组合式函数参数。 */
interface UseInterfacePublishingOptions {
  /** 重新加载接口列表。 */
  loadInterfaces: () => Promise<void>;
  /** 显示页面通知。 */
  showToast: (message: string, type?: ToastType) => void;
}

/** 接口发布相关页面状态与操作。 */
export const useInterfacePublishing = ({ loadInterfaces, showToast }: UseInterfacePublishingOptions) => {
  /** 正在执行发布前检查的接口 ID 集合。 */
  const checkingIds = ref<Set<number>>(new Set());

  /** 正在执行正式发布的接口 ID 集合。 */
  const publishingIds = ref<Set<number>>(new Set());

  /** 发布检查结果弹窗是否打开。 */
  const publishCheckDialogOpen = ref(false);

  /** 当前发布检查结果。 */
  const publishCheckResult = ref<InterfacePublishCheckVO | null>(null);

  /** 判断当前接口行是否正在执行发布相关操作。 */
  const isRowBusy = (id: number) => checkingIds.value.has(id) || publishingIds.value.has(id);

  /** 向集合中添加接口 ID。 */
  const addBusyId = (target: typeof checkingIds, id: number) => {
    target.value = new Set([...target.value, id]);
  };

  /** 从集合中移除接口 ID。 */
  const removeBusyId = (target: typeof checkingIds, id: number) => {
    const next = new Set(target.value);
    next.delete(id);
    target.value = next;
  };

  /** 判断错误是否为发布前静态检查失败。 */
  const isPublishCheckError = (error: unknown): error is ApiError<InterfacePublishErrorData> =>
    error instanceof Error && (error as ApiError).code === PUBLISH_CHECK_FAILED_CODE;

  /** 判断响应数据是否为发布检查结果。 */
  const isPublishCheckResult = (data: unknown): data is InterfacePublishCheckVO =>
    typeof data === 'object'
    && data !== null
    && typeof (data as InterfacePublishCheckVO).passed === 'boolean'
    && Array.isArray((data as InterfacePublishCheckVO).issues);

  /** 展示未通过的发布检查结果。 */
  const openFailedPublishCheck = (result: InterfacePublishCheckVO): void => {
    if (result.passed) {
      return;
    }
    publishCheckResult.value = result;
    publishCheckDialogOpen.value = true;
  };

  /**
   * 接口上线。
   *
   * @param id 接口 ID
   */
  const onlineInterface = async (id: number) => {
    addBusyId(publishingIds, id);
    try {
      await interfaceService.online({ id });
      showToast('接口已上线', 'success');
      await loadInterfaces();
    } catch (error) {
      console.error('[InterfaceManagementView] 接口上线失败:', error);
      if (isPublishCheckError(error)) {
        try {
          if (isPublishCheckResult(error.data)) {
            openFailedPublishCheck(error.data);
          } else {
            openFailedPublishCheck(await interfaceService.checkPublish(id));
          }
        } catch {
          // 正式发布失败后的补充检查失败时，保留原始发布错误提示。
        }
      }
      showToast(error instanceof Error ? error.message : '上线失败', 'error');
      await loadInterfaces();
    } finally {
      removeBusyId(publishingIds, id);
    }
  };

  /**
   * 执行发布前检查。
   *
   * @param id 接口 ID
   */
  const checkPublish = async (id: number) => {
    addBusyId(checkingIds, id);
    try {
      publishCheckResult.value = await interfaceService.checkPublish(id);
      publishCheckDialogOpen.value = true;
      if (publishCheckResult.value.passed) {
        showToast('发布条件已通过', 'success');
      }
    } catch (error) {
      console.error('[InterfaceManagementView] 发布前检查失败:', error);
      showToast(error instanceof Error ? error.message : '检查失败', 'error');
    } finally {
      removeBusyId(checkingIds, id);
    }
  };

  return {
    checkingIds,
    publishingIds,
    publishCheckDialogOpen,
    publishCheckResult,
    isRowBusy,
    onlineInterface,
    checkPublish,
  };
};
