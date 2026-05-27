import CreateModal from '@/pages/Admin/InterfaceInfo/components/CreateModal';
import UpdateModal from '@/pages/Admin/InterfaceInfo/components/UpdateModal';
import {
  addInterfaceInfoUsingPOST,
  deleteInterfaceInfoUsingPOST,
  listInterfaceInfoByPageUsingGET,
  offlineInterfaceInfoUsingPOST,
  onlineInterfaceInfoUsingPOST,
  updateInterfaceInfoUsingPOST,
} from '@/services/feiapi-backend/interfaceInfoController';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import '@umijs/max';
import { Button, Drawer, message } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import React, { useRef, useState } from 'react';

type InterfaceTableItem = API.InterfaceInfo & {
  key?: React.Key;
};

const TableList: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.InterfaceInfo>();
  const [selectedRowsState, setSelectedRows] = useState<API.InterfaceInfo[]>([]);
  const actionRef = useRef<ActionType>();

  /**
   * 创建接口信息。
   */
  const handleAdd = async (fields: API.InterfaceInfo) => {
    const hide = message.loading('正在创建');
    try {
      await addInterfaceInfoUsingPOST({
        ...fields,
      });
      hide();
      message.success('创建成功');
      setCreateModalVisible(false);
      return true;
    } catch (error: any) {
      hide();
      message.error(`创建失败：${error.message}`);
      return false;
    }
  };

  /**
   * 更新接口信息。
   */
  const handleUpdate = async (fields: API.InterfaceInfo) => {
    if (!currentRow?.id) {
      return false;
    }
    const hide = message.loading('正在更新');
    try {
      await updateInterfaceInfoUsingPOST({
        id: currentRow.id,
        ...fields,
      });
      hide();
      message.success('更新成功');
      return true;
    } catch (error: any) {
      hide();
      message.error(`更新失败：${error.message}`);
      return false;
    }
  };

  /**
   * 发布接口。
   */
  const handleOnline = async (record?: API.IdRequest) => {
    if (!record?.id) {
      return false;
    }
    const hide = message.loading('正在发布');
    try {
      await onlineInterfaceInfoUsingPOST({
        id: record.id,
      });
      hide();
      message.success('发布成功');
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      message.error(`发布失败：${error.message}`);
      return false;
    }
  };

  /**
   * 下线接口。
   */
  const handleOffline = async (record?: API.IdRequest) => {
    if (!record?.id) {
      return false;
    }
    const hide = message.loading('正在下线');
    try {
      await offlineInterfaceInfoUsingPOST({
        id: record.id,
      });
      hide();
      message.success('下线成功');
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      message.error(`下线失败：${error.message}`);
      return false;
    }
  };

  /**
   * 删除接口。
   */
  const handleRemove = async (record?: API.InterfaceInfo) => {
    if (!record?.id) {
      return false;
    }
    const hide = message.loading('正在删除');
    try {
      await deleteInterfaceInfoUsingPOST({
        id: record.id,
      });
      hide();
      message.success('删除成功');
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      message.error(`删除失败：${error.message}`);
      return false;
    }
  };

  /**
   * 表格列配置。
   */
  const columns: ProColumns<API.InterfaceInfo>[] = [
    {
      title: '接口名称',
      dataIndex: 'name',
      valueType: 'text',
      formItemProps: {
        rules: [
          {
            required: true,
            message: '请输入接口名称',
          },
        ],
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      valueType: 'textarea',
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      valueType: 'text',
    },
    {
      title: '请求地址',
      dataIndex: 'url',
      valueType: 'text',
    },
    {
      title: '请求参数',
      dataIndex: 'requestParams',
      valueType: 'jsonCode',
    },
    {
      title: '请求头',
      dataIndex: 'requestHeader',
      valueType: 'jsonCode',
    },
    {
      title: '响应头',
      dataIndex: 'responseHeader',
      valueType: 'jsonCode',
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInForm: true,
      valueEnum: {
        0: {
          text: '关闭',
          status: 'Default',
        },
        1: {
          text: '开启',
          status: 'Processing',
        },
      },
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setCurrentRow(record);
            setUpdateModalVisible(true);
          }}
        >
          修改
        </a>,
        record.status === 0 ? (
          <Button
            type="link"
            key="online"
            onClick={() => {
              void handleOnline(record);
            }}
          >
            发布
          </Button>
        ) : (
          <Button
            type="text"
            danger
            key="offline"
            onClick={() => {
              void handleOffline(record);
            }}
          >
            下线
          </Button>
        ),
        <Button
          type="text"
          key="delete"
          danger
          onClick={() => {
            void handleRemove(record);
          }}
        >
          删除
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<InterfaceTableItem, API.listInterfaceInfoByPageUsingGETParams>
        headerTitle="接口列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            onClick={() => {
              setCreateModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={async (
          params,
          sort: Record<string, SortOrder>,
          filter: Record<string, React.ReactText[] | null>,
        ) => {
          void sort;
          void filter;
          const res = await listInterfaceInfoByPageUsingGET({
            ...params,
          });
          if (res?.data) {
            return {
              data: res.data.records || [],
              success: true,
              total: res.data.total || 0,
            };
          }
          return {
            data: [],
            success: false,
            total: 0,
          };
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />

      {selectedRowsState.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择{' '}
              <a
                style={{
                  fontWeight: 600,
                }}
              >
                {selectedRowsState.length}
              </a>{' '}
              项
            </div>
          }
        >
          <Button
            onClick={async () => {
              await Promise.all(selectedRowsState.map((item) => handleRemove(item)));
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            批量删除
          </Button>
          <Button type="primary">批量操作</Button>
        </FooterToolbar>
      )}

      <UpdateModal
        columns={columns}
        onSubmit={async (value) => {
          const success = await handleUpdate(value);
          if (success) {
            setUpdateModalVisible(false);
            setCurrentRow(undefined);
            actionRef.current?.reload();
          }
        }}
        onCancel={() => {
          setUpdateModalVisible(false);
          if (!showDetail) {
            setCurrentRow(undefined);
          }
        }}
        visible={updateModalVisible}
        values={currentRow || {}}
      />

      <Drawer
        width={600}
        visible={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.name && (
          <ProDescriptions<API.InterfaceInfo>
            column={2}
            title={currentRow.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.InterfaceInfo>[]}
          />
        )}
      </Drawer>

      <CreateModal
        columns={columns}
        onCancel={() => {
          setCreateModalVisible(false);
        }}
        onSubmit={async (values) => {
          await handleAdd(values);
        }}
        visible={createModalVisible}
      />
    </PageContainer>
  );
};

export default TableList;
