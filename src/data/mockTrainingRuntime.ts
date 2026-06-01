import { mockTrainingJobs } from './mockTraining';
import type { TrainingJob } from '../types';

let trainingJobsRuntime: TrainingJob[] | null = null;

function cloneTrainingJobs(jobs: TrainingJob[]): TrainingJob[] {
  return jobs.map(job => ({
    ...job,
    metrics: job.metrics.map(metric => ({ ...metric })),
    hyperparams: { ...job.hyperparams },
    versions: [...job.versions],
  }));
}

export function getRuntimeTrainingJobs(): TrainingJob[] {
  if (!trainingJobsRuntime) {
    trainingJobsRuntime = cloneTrainingJobs(mockTrainingJobs);
  }
  return cloneTrainingJobs(trainingJobsRuntime);
}

export function saveRuntimeTrainingJobs(jobs: TrainingJob[]) {
  trainingJobsRuntime = cloneTrainingJobs(jobs);
}

export function appendRuntimeTrainingJob(job: TrainingJob): TrainingJob {
  const list = getRuntimeTrainingJobs();
  const next = [job, ...list];
  saveRuntimeTrainingJobs(next);
  return job;
}
