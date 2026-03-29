const express = require('express');
const router = express.Router();
const { getJob } = require('../utils/jobs');

// GET /api/jobs/:id — poll job status
router.get('/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// GET /api/jobs/:id/stream — SSE live updates
router.get('/:id/stream', (req, res) => {
  const jobId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = () => {
    const job = getJob(jobId);
    if (!job) {
      res.write(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
      return clearInterval(interval);
    }
    res.write(`data: ${JSON.stringify(job)}\n\n`);
    if (job.status === 'complete' || job.status === 'failed') {
      clearInterval(interval);
      res.end();
    }
  };

  send();
  const interval = setInterval(send, 1200);
  req.on('close', () => clearInterval(interval));
});

module.exports = router;
