import { mockDatasets } from './mockDatasets';
import type { Dataset } from '../types';

let datasetsRuntime: Dataset[] | null = null;

function cloneDatasets(datasets: Dataset[]): Dataset[] {
  return datasets.map(dataset => ({
    ...dataset,
    task: [...dataset.task],
    tags: [...dataset.tags],
    labels: [...dataset.labels],
    versions: dataset.versions.map(version => ({ ...version })),
  }));
}

export function getRuntimeDatasets(): Dataset[] {
  if (!datasetsRuntime) {
    datasetsRuntime = cloneDatasets(mockDatasets);
  }
  return cloneDatasets(datasetsRuntime);
}

export function saveRuntimeDatasets(datasets: Dataset[]) {
  datasetsRuntime = cloneDatasets(datasets);
}

export function appendRuntimeDataset(dataset: Dataset): Dataset {
  const list = getRuntimeDatasets();
  const next = [dataset, ...list];
  saveRuntimeDatasets(next);
  return dataset;
}
