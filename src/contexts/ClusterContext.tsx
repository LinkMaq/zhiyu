import React, { createContext, useContext, useMemo, useState } from 'react';
import { mockClusters } from '../data/mockData';
import type { K8sCluster } from '../types';

export interface ClusterCreatePayload {
  name: string;
  region: string;
  version: string;
  controlPlaneNodes: number;
  gpuWorkerNodes: number;
  cpuWorkerNodes: number;
  gpuType: string;
  gpuPerNode: number;
  controlPlaneCores: number;
  controlPlaneMemoryGi: number;
  gpuNodeCores: number;
  gpuNodeMemoryGi: number;
  cpuNodeCores: number;
  cpuNodeMemoryGi: number;
  podCidr: string;
  serviceCidr: string;
  networkPlugin: string;
  highPerfNetwork: 'none' | 'infiniband' | 'roce';
  highPerfNicSpeed: string;
  highPerfMtu: number;
  rdmaSharedDevicePlugin: boolean;
  ibSubnetManager: string;
  roceVersion: 'v1' | 'v2';
  rocePfcEnabled: boolean;
  roceEcnEnabled: boolean;
  serviceType: string;
  storageBackend: string;
  storageClass: string;
  monitoringEnabled: boolean;
  loggingEnabled: boolean;
}

interface ClusterContextType {
  clusters: K8sCluster[];
  selectedClusterId: string;
  selectedCluster: K8sCluster | null;
  setSelectedClusterId: (id: string) => void;
  createCluster: (payload?: Partial<ClusterCreatePayload>) => K8sCluster;
  toggleClusterMaintenance: (clusterId: string) => K8sCluster | null;
  deleteCluster: (clusterId: string) => void;
}

const ClusterContext = createContext<ClusterContextType | null>(null);

export function ClusterProvider({ children }: { children: React.ReactNode }) {
  const [clusters, setClusters] = useState<K8sCluster[]>(mockClusters);
  const [selectedClusterId, setSelectedClusterId] = useState(mockClusters[0]?.id ?? '');

  const selectedCluster = useMemo(
    () => clusters.find(c => c.id === selectedClusterId) ?? clusters[0] ?? null,
    [clusters, selectedClusterId],
  );

  const createCluster = (payload?: Partial<ClusterCreatePayload>) => {
    const next = clusters.length + 1;
    const now = new Date().toISOString();
    const clusterId = `cls${String(next).padStart(3, '0')}`;
    const region = payload?.region ?? '四川·绵阳数据中心';
    const version = payload?.version ?? '1.29.3';
    const clusterName = payload?.name ?? `telecom-new-${String(next).padStart(2, '0')}`;

    const controlPlaneNodes = Math.max(1, payload?.controlPlaneNodes ?? 1);
    const gpuWorkerNodes = Math.max(1, payload?.gpuWorkerNodes ?? 1);
    const cpuWorkerNodes = Math.max(0, payload?.cpuWorkerNodes ?? 0);

    const controlPlaneCores = payload?.controlPlaneCores ?? 32;
    const controlPlaneMemoryGi = payload?.controlPlaneMemoryGi ?? 128;
    const gpuNodeCores = payload?.gpuNodeCores ?? 96;
    const gpuNodeMemoryGi = payload?.gpuNodeMemoryGi ?? 384;
    const cpuNodeCores = payload?.cpuNodeCores ?? 64;
    const cpuNodeMemoryGi = payload?.cpuNodeMemoryGi ?? 256;
    const gpuType = payload?.gpuType ?? 'NVIDIA H100 80GB';
    const gpuPerNode = payload?.gpuPerNode ?? 8;

    const nodes = [
      ...Array.from({ length: controlPlaneNodes }, (_, i) => ({
        name: `${clusterName}-master-${String(i + 1).padStart(2, '0')}`,
        status: 'ready' as const,
        role: 'master' as const,
        cpu: `${controlPlaneCores}C`,
        memory: `${controlPlaneMemoryGi}Gi`,
        ip: `10.230.${next}.${10 + i}`,
        os: 'Ubuntu 22.04',
        kernelVersion: '5.15.0-109',
        kubeletVersion: version,
        pods: 10 + i,
      })),
      ...Array.from({ length: gpuWorkerNodes }, (_, i) => ({
        name: `${clusterName}-gpu-${String(i + 1).padStart(2, '0')}`,
        status: 'ready' as const,
        role: 'gpu-worker' as const,
        cpu: `${gpuNodeCores}C`,
        memory: `${gpuNodeMemoryGi}Gi`,
        gpuType,
        gpuCount: gpuPerNode,
        ip: `10.230.${next}.${30 + i}`,
        os: 'Ubuntu 22.04',
        kernelVersion: '5.15.0-109',
        kubeletVersion: version,
        pods: 20 + i * 2,
      })),
      ...Array.from({ length: cpuWorkerNodes }, (_, i) => ({
        name: `${clusterName}-worker-${String(i + 1).padStart(2, '0')}`,
        status: 'ready' as const,
        role: 'worker' as const,
        cpu: `${cpuNodeCores}C`,
        memory: `${cpuNodeMemoryGi}Gi`,
        ip: `10.230.${next}.${60 + i}`,
        os: 'Ubuntu 22.04',
        kernelVersion: '5.15.0-109',
        kubeletVersion: version,
        pods: 25 + i * 2,
      })),
    ];

    const cpuTotal = controlPlaneNodes * controlPlaneCores + gpuWorkerNodes * gpuNodeCores + cpuWorkerNodes * cpuNodeCores;
    const memoryTotal = controlPlaneNodes * controlPlaneMemoryGi + gpuWorkerNodes * gpuNodeMemoryGi + cpuWorkerNodes * cpuNodeMemoryGi;
    const gpuTotal = gpuWorkerNodes * gpuPerNode;

    const cluster: K8sCluster = {
      id: clusterId,
      name: clusterName,
      region,
      status: 'healthy',
      version,
      nodes,
      pods: nodes.reduce((sum, node) => sum + node.pods, 0),
      services: 8 + Math.max(4, Math.floor(nodes.length * 1.5)),
      pvs: 12 + nodes.length * 2,
      namespaces: 4 + Math.floor(nodes.length / 2),
      cpuTotal: `${cpuTotal}C`,
      cpuUsed: `${Math.round(cpuTotal * 0.52)}C`,
      memoryTotal: `${memoryTotal}Gi`,
      memoryUsed: `${Math.round(memoryTotal * 0.48)}Gi`,
      gpuTotal,
      gpuUsed: Math.round(gpuTotal * 0.55),
      createdAt: now,
      lastSync: now,
      plugins: [
        {
          name: payload?.networkPlugin ? `${payload.networkPlugin} CNI` : 'calico',
          version: '3.27.2',
          status: 'installed',
          description: `网络插件，Pod CIDR ${payload?.podCidr ?? '10.244.0.0/16'}，Service CIDR ${payload?.serviceCidr ?? '10.96.0.0/12'}，高性能网络 ${payload?.highPerfNetwork ?? 'none'}`,
          official: true,
        },
        ...(payload?.highPerfNetwork === 'none' || !payload?.highPerfNetwork ? [] : [{
          name: payload.highPerfNetwork === 'infiniband' ? 'rdma-infiniband' : 'rdma-roce',
          version: '1.0.0',
          status: 'installed' as const,
          description: payload.highPerfNetwork === 'infiniband'
            ? `InfiniBand ${payload.highPerfNicSpeed ?? '200Gbps'}，MTU ${payload.highPerfMtu ?? 4092}，Subnet Manager ${payload.ibSubnetManager ?? 'OpenSM'}，RDMA共享插件 ${payload.rdmaSharedDevicePlugin ? '启用' : '关闭'}`
            : `RoCE ${payload.roceVersion ?? 'v2'} ${payload.highPerfNicSpeed ?? '100Gbps'}，MTU ${payload.highPerfMtu ?? 9000}，PFC ${payload.rocePfcEnabled ? '启用' : '关闭'}，ECN ${payload.roceEcnEnabled ? '启用' : '关闭'}，RDMA共享插件 ${payload.rdmaSharedDevicePlugin ? '启用' : '关闭'}`,
          official: true,
        }]),
        {
          name: payload?.storageBackend ? `${payload.storageBackend} CSI` : 'ceph-csi',
          version: '3.10.0',
          status: 'installed',
          description: `默认存储类 ${payload?.storageClass ?? 'ceph-fs'}，服务暴露 ${payload?.serviceType ?? 'LoadBalancer'}`,
          official: true,
        },
        ...(payload?.monitoringEnabled === false ? [] : [{ name: 'prometheus-stack', version: '58.2.1', status: 'installed' as const, description: '监控指标采集', official: true }]),
        ...(payload?.loggingEnabled === false ? [] : [{ name: 'loki-stack', version: '2.9.0', status: 'installed' as const, description: '日志收集与检索', official: false }]),
      ],
    };

    setClusters(prev => [cluster, ...prev]);
    setSelectedClusterId(cluster.id);
    return cluster;
  };

  const toggleClusterMaintenance = (clusterId: string) => {
    let updatedCluster: K8sCluster | null = null;
    setClusters(prev => prev.map(cluster => {
      if (cluster.id !== clusterId) return cluster;
      const nextStatus = cluster.status === 'healthy' ? 'warning' : 'healthy';
      updatedCluster = { ...cluster, status: nextStatus, lastSync: new Date().toISOString() };
      return updatedCluster;
    }));
    return updatedCluster;
  };

  const deleteCluster = (clusterId: string) => {
    setClusters(prev => {
      const next = prev.filter(cluster => cluster.id !== clusterId);
      if (selectedClusterId === clusterId) {
        setSelectedClusterId(next[0]?.id ?? '');
      }
      return next;
    });
  };

  return (
    <ClusterContext.Provider
      value={{
        clusters,
        selectedClusterId: selectedCluster?.id ?? '',
        selectedCluster,
        setSelectedClusterId,
        createCluster,
        toggleClusterMaintenance,
        deleteCluster,
      }}
    >
      {children}
    </ClusterContext.Provider>
  );
}

export function useClusters() {
  const ctx = useContext(ClusterContext);
  if (!ctx) throw new Error('useClusters must be inside ClusterProvider');
  return ctx;
}
