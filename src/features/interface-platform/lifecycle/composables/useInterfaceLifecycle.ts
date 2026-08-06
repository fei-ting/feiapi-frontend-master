import { interfaceService } from '@/services/interfaceInfo';
import type { InterfaceInfoVO } from '@/types/interface';

/** Toast 通知类型。 */
type ToastType = 'success' | 'error' | 'info';

/** 生命周期组合式函数参数。 */
interface UseInterfaceLifecycleOptions {
  /** 重新加载接口列表。 */
  loadInterfaces: () => Promise<void>;
  /** 显示页面通知。 */
  showToast: (message: string, type?: ToastType) => void;
}

/** 接口生命周期页面操作。 */
export const useInterfaceLifecycle = ({ loadInterfaces, showToast }: UseInterfaceLifecycleOptions) => {
  /**
   * 接口下线。
   *
   * @param id 接口 ID
   */
  const offlineInterface = async (id: number) => {
    try {
      await interfaceService.offline({ id });
      showToast('接口已下线', 'success');
      await loadInterfaces();
    } catch (error) {
      console.error('[InterfaceManagementView] 接口下线失败:', error);
      showToast('下线失败', 'error');
    }
  };

  /**
   * 删除下线接口。
   *
   * @param item 接口信息
   */
  const openDeleteModal = async (item: InterfaceInfoVO) => {
    if (item.status !== 0) {
      showToast('请先下线接口后再删除', 'info');
      return;
    }
    const method = item.method || '-';
    const path = item.path || '-';
    if (!window.confirm(`确定删除接口“${item.name}”吗？\n请求方法：${method}\n网关路径：${path}\n删除后不可恢复。`)) return;
    try {
      await interfaceService.delete({ id: item.id });
      showToast('接口已删除', 'success');
    } catch (error) {
      console.error('[InterfaceManagementView] 删除接口失败:', error);
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
    } finally {
      await loadInterfaces();
    }
  };

  return {
    offlineInterface,
    openDeleteModal,
  };
};
