import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { InterfaceInfoVO } from '@/types/interface';

/** Toast 通知类型。 */
type ToastType = 'success' | 'error' | 'info';

/** 接口定义组合式函数参数。 */
interface UseInterfaceDefinitionOptions {
  /** 重新加载接口列表。 */
  loadInterfaces: () => Promise<void>;
  /** 显示页面通知。 */
  showToast: (message: string, type?: ToastType) => void;
}

/** 接口定义配置页面状态与操作。 */
export const useInterfaceDefinition = ({ loadInterfaces, showToast }: UseInterfaceDefinitionOptions) => {
  const router = useRouter();

  /** 是否显示接口配置弹窗。 */
  const configModalOpen = ref(false);

  /** 当前编辑的接口；为空时表示新增。 */
  const editingInterface = ref<InterfaceInfoVO | null>(null);

  /** 打开新增接口弹窗。 */
  const openAddModal = () => {
    editingInterface.value = null;
    configModalOpen.value = true;
  };

  /**
   * 打开编辑接口弹窗。
   *
   * @param item 接口信息
   */
  const openEditModal = (item: InterfaceInfoVO) => {
    if (item.status !== 0) {
      showToast('请先下线接口后再修改配置', 'info');
      return;
    }
    editingInterface.value = item;
    configModalOpen.value = true;
  };

  /** 关闭接口配置弹窗。 */
  const closeConfigModal = () => {
    configModalOpen.value = false;
    editingInterface.value = null;
  };

  /**
   * 处理接口配置保存结果。
   *
   * @param id 接口 ID
   * @param created 是否为新增接口
   */
  const handleConfigSaved = async (id: number, created: boolean) => {
    closeConfigModal();
    if (created) {
      showToast('接口已创建，请继续维护文档', 'success');
      await router.push({ name: 'admin-interface-doc', params: { id } });
      return;
    }
    showToast('接口配置已保存', 'success');
    await loadInterfaces();
  };

  /**
   * 进入独立文档维护页。
   *
   * @param id 接口 ID
   */
  const openDocumentPage = (id: number) => {
    void router.push({ name: 'admin-interface-doc', params: { id } });
  };

  return {
    configModalOpen,
    editingInterface,
    openAddModal,
    openEditModal,
    closeConfigModal,
    handleConfigSaved,
    openDocumentPage,
  };
};
