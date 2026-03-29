/**
 * Simple in-memory job store
 * In production, replace with Redis or a database
 */
const jobs = new Map();

const JOB_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  EXTRACTING_AUDIO: 'extracting_audio',
  TRANSCRIBING: 'transcribing',
  TRANSLATING: 'translating',
  RENDERING: 'rendering',
  COMPLETE: 'complete',
  FAILED: 'failed'
};

function createJob(id, data = {}) {
  const job = {
    id,
    status: JOB_STATUS.PENDING,
    progress: 0,
    message: 'Job created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {},
    ...data
  };
  jobs.set(id, job);
  return job;
}

function updateJob(id, updates) {
  const job = jobs.get(id);
  if (!job) return null;
  const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  return updated;
}

function getJob(id) {
  return jobs.get(id) || null;
}

function deleteJob(id) {
  return jobs.delete(id);
}

// Clean up old jobs (> 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [id, job] of jobs.entries()) {
    if (new Date(job.createdAt).getTime() < oneHourAgo) {
      jobs.delete(id);
    }
  }
}, 600000); // every 10 minutes

module.exports = { createJob, updateJob, getJob, deleteJob, JOB_STATUS };
