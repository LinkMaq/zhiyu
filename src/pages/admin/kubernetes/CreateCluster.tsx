import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Network, Server } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { useClusters } from '../../../contexts/ClusterContext';

export default function CreateCluster() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createCluster } = useClusters();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    region: '四川·绵阳数据中心',
    version: '1.29.3',
    controlPlaneNodes: '1',
    gpuWorkerNodes: '2',
    cpuWorkerNodes: '1',
    gpuType: 'NVIDIA H100 80GB',
    gpuPerNode: '8',
    controlPlaneCores: '32',
    controlPlaneMemoryGi: '128',
    gpuNodeCores: '96',
    gpuNodeMemoryGi: '384',
    cpuNodeCores: '64',
    cpuNodeMemoryGi: '256',
    podCidr: '10.244.0.0/16',
    serviceCidr: '10.96.0.0/12',
    networkPlugin: 'Calico',
    highPerfNetwork: 'none',
    highPerfNicSpeed: '200Gbps',
    highPerfMtu: '4092',
    rdmaSharedDevicePlugin: true,
    ibSubnetManager: 'OpenSM',
    roceVersion: 'v2',
    rocePfcEnabled: true,
    roceEcnEnabled: true,
    serviceType: 'LoadBalancer',
    storageBackend: 'Ceph',
    storageClass: 'ceph-fs',
    monitoringEnabled: true,
    loggingEnabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    await new Promise(r => setTimeout(r, 600));

    const cluster = createCluster({
      name: form.name || undefined,
      region: form.region,
      version: form.version,
      controlPlaneNodes: Number(form.controlPlaneNodes),
      gpuWorkerNodes: Number(form.gpuWorkerNodes),
      cpuWorkerNodes: Number(form.cpuWorkerNodes),
      gpuType: form.gpuType,
      gpuPerNode: Number(form.gpuPerNode),
      controlPlaneCores: Number(form.controlPlaneCores),
      controlPlaneMemoryGi: Number(form.controlPlaneMemoryGi),
      gpuNodeCores: Number(form.gpuNodeCores),
      gpuNodeMemoryGi: Number(form.gpuNodeMemoryGi),
      cpuNodeCores: Number(form.cpuNodeCores),
      cpuNodeMemoryGi: Number(form.cpuNodeMemoryGi),
      podCidr: form.podCidr,
      serviceCidr: form.serviceCidr,
      networkPlugin: form.networkPlugin,
      highPerfNetwork: form.highPerfNetwork as 'none' | 'infiniband' | 'roce',
      highPerfNicSpeed: form.highPerfNicSpeed,
      highPerfMtu: Number(form.highPerfMtu),
      rdmaSharedDevicePlugin: form.rdmaSharedDevicePlugin,
      ibSubnetManager: form.ibSubnetManager,
      roceVersion: form.roceVersion as 'v1' | 'v2',
      rocePfcEnabled: form.rocePfcEnabled,
      roceEcnEnabled: form.roceEcnEnabled,
      serviceType: form.serviceType,
      storageBackend: form.storageBackend,
      storageClass: form.storageClass,
      monitoringEnabled: form.monitoringEnabled,
      loggingEnabled: form.loggingEnabled,
    });

    setCreating(false);
    toast.success('集群创建成功', `已创建集群 ${cluster.name}`);
    navigate('/admin/kubernetes');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/admin/kubernetes" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 集群管理
        </Link>
        <span>/</span>
        <span className="text-text-secondary">创建集群</span>
      </div>

      <PageHeader
        title="创建 Kubernetes 集群"
        subtitle="填写 K8s、网络、存储与节点规格配置后创建集群"
        icon={<Network size={20} />}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">基础信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="集群名称" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="如：telecom-prod-k8s" required />
            <Select
              label="区域"
              value={form.region}
              onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
              options={[
                { value: '四川·绵阳数据中心', label: '四川·绵阳数据中心' },
                { value: '四川·成都数据中心', label: '四川·成都数据中心' },
                { value: '重庆·联合研发中心', label: '重庆·联合研发中心' },
              ]}
            />
            <Select
              label="K8s 版本"
              value={form.version}
              onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
              options={[
                { value: '1.29.3', label: 'v1.29.3' },
                { value: '1.28.8', label: 'v1.28.8' },
                { value: '1.27.12', label: 'v1.27.12' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">节点池配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Input label="控制面节点数" type="number" min="1" value={form.controlPlaneNodes} onChange={e => setForm(f => ({ ...f, controlPlaneNodes: e.target.value }))} />
            <Input label="GPU 节点数" type="number" min="1" value={form.gpuWorkerNodes} onChange={e => setForm(f => ({ ...f, gpuWorkerNodes: e.target.value }))} />
            <Input label="CPU 节点数" type="number" min="0" value={form.cpuWorkerNodes} onChange={e => setForm(f => ({ ...f, cpuWorkerNodes: e.target.value }))} />
            <Input label="每 GPU 节点卡数" type="number" min="1" value={form.gpuPerNode} onChange={e => setForm(f => ({ ...f, gpuPerNode: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="GPU 型号"
              value={form.gpuType}
              onChange={e => setForm(f => ({ ...f, gpuType: e.target.value }))}
              options={[
                { value: 'NVIDIA H100 80GB', label: 'NVIDIA H100 80GB' },
                { value: 'NVIDIA A100 80GB', label: 'NVIDIA A100 80GB' },
                { value: 'NVIDIA A800 80GB', label: 'NVIDIA A800 80GB' },
                { value: 'AMD Instinct MI300X 192GB', label: 'AMD Instinct MI300X 192GB' },
              ]}
            />
            <Input label="控制面 CPU(核)" type="number" min="8" value={form.controlPlaneCores} onChange={e => setForm(f => ({ ...f, controlPlaneCores: e.target.value }))} />
            <Input label="控制面内存(Gi)" type="number" min="32" value={form.controlPlaneMemoryGi} onChange={e => setForm(f => ({ ...f, controlPlaneMemoryGi: e.target.value }))} />
            <Input label="GPU 节点 CPU(核)" type="number" min="16" value={form.gpuNodeCores} onChange={e => setForm(f => ({ ...f, gpuNodeCores: e.target.value }))} />
            <Input label="GPU 节点内存(Gi)" type="number" min="64" value={form.gpuNodeMemoryGi} onChange={e => setForm(f => ({ ...f, gpuNodeMemoryGi: e.target.value }))} />
            <Input label="CPU 节点 CPU(核)" type="number" min="8" value={form.cpuNodeCores} onChange={e => setForm(f => ({ ...f, cpuNodeCores: e.target.value }))} />
            <Input label="CPU 节点内存(Gi)" type="number" min="32" value={form.cpuNodeMemoryGi} onChange={e => setForm(f => ({ ...f, cpuNodeMemoryGi: e.target.value }))} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">网络与服务配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Pod CIDR" value={form.podCidr} onChange={e => setForm(f => ({ ...f, podCidr: e.target.value }))} />
            <Input label="Service CIDR" value={form.serviceCidr} onChange={e => setForm(f => ({ ...f, serviceCidr: e.target.value }))} />
            <Select
              label="网络插件"
              value={form.networkPlugin}
              onChange={e => setForm(f => ({ ...f, networkPlugin: e.target.value }))}
              options={[
                { value: 'Calico', label: 'Calico' },
                { value: 'Cilium', label: 'Cilium' },
                { value: 'Flannel', label: 'Flannel' },
              ]}
            />
            <Select
              label="高性能网络"
              value={form.highPerfNetwork}
              onChange={e => setForm(f => ({ ...f, highPerfNetwork: e.target.value }))}
              options={[
                { value: 'none', label: '不启用' },
                { value: 'infiniband', label: 'InfiniBand' },
                { value: 'roce', label: 'RoCE' },
              ]}
            />
            <Select
              label="服务暴露方式"
              value={form.serviceType}
              onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
              options={[
                { value: 'LoadBalancer', label: 'LoadBalancer' },
                { value: 'NodePort', label: 'NodePort' },
                { value: 'Ingress', label: 'Ingress' },
              ]}
            />
            {form.highPerfNetwork !== 'none' && (
              <>
                <Select
                  label="RDMA 网卡速率"
                  value={form.highPerfNicSpeed}
                  onChange={e => setForm(f => ({ ...f, highPerfNicSpeed: e.target.value }))}
                  options={[
                    { value: '100Gbps', label: '100Gbps' },
                    { value: '200Gbps', label: '200Gbps' },
                    { value: '400Gbps', label: '400Gbps' },
                  ]}
                />
                <Input
                  label="RDMA MTU"
                  type="number"
                  min={form.highPerfNetwork === 'roce' ? '1500' : '2048'}
                  max="9216"
                  value={form.highPerfMtu}
                  onChange={e => setForm(f => ({ ...f, highPerfMtu: e.target.value }))}
                />
              </>
            )}
            {form.highPerfNetwork === 'infiniband' && (
              <Input
                label="InfiniBand Subnet Manager"
                value={form.ibSubnetManager}
                onChange={e => setForm(f => ({ ...f, ibSubnetManager: e.target.value }))}
                placeholder="OpenSM"
              />
            )}
            {form.highPerfNetwork === 'roce' && (
              <Select
                label="RoCE 版本"
                value={form.roceVersion}
                onChange={e => setForm(f => ({ ...f, roceVersion: e.target.value }))}
                options={[
                  { value: 'v2', label: 'RoCE v2 (UDP/IP)' },
                  { value: 'v1', label: 'RoCE v1 (L2)' },
                ]}
              />
            )}
          </div>
          {form.highPerfNetwork !== 'none' && (
            <div className="flex flex-wrap items-center gap-6 mt-4">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={form.rdmaSharedDevicePlugin}
                  onChange={e => setForm(f => ({ ...f, rdmaSharedDevicePlugin: e.target.checked }))}
                  className="accent-primary"
                />
                启用 RDMA Shared Device Plugin
              </label>
              {form.highPerfNetwork === 'roce' && (
                <>
                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={form.rocePfcEnabled}
                      onChange={e => setForm(f => ({ ...f, rocePfcEnabled: e.target.checked }))}
                      className="accent-primary"
                    />
                    启用 PFC (Priority Flow Control)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={form.roceEcnEnabled}
                      onChange={e => setForm(f => ({ ...f, roceEcnEnabled: e.target.checked }))}
                      className="accent-primary"
                    />
                    启用 ECN (Explicit Congestion Notification)
                  </label>
                </>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">存储与可观测性</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="存储后端"
              value={form.storageBackend}
              onChange={e => setForm(f => ({ ...f, storageBackend: e.target.value }))}
              options={[
                { value: 'Ceph', label: 'Ceph' },
                { value: 'NFS', label: 'NFS' },
                { value: 'LocalPV', label: 'LocalPV' },
              ]}
            />
            <Input label="默认 StorageClass" value={form.storageClass} onChange={e => setForm(f => ({ ...f, storageClass: e.target.value }))} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.monitoringEnabled}
                onChange={e => setForm(f => ({ ...f, monitoringEnabled: e.target.checked }))}
                className="accent-primary"
              />
              启用监控组件（Prometheus）
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.loggingEnabled}
                onChange={e => setForm(f => ({ ...f, loggingEnabled: e.target.checked }))}
                className="accent-primary"
              />
              启用日志组件（Loki）
            </label>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Server size={14} />
              集群创建后将自动同步到 GPU 管理、存储管理、资源池和监控页面。
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/kubernetes')}>取消</Button>
              <Button type="submit" loading={creating}>{creating ? '创建中...' : '确认创建集群'}</Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
