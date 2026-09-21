import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import instanceRoutes from './routes/instance';
import adminRoutes from './routes/admin';
import deploymentRoutes from './routes/deployments';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/instance', instanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/deployments', deploymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// Start server
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`Management API server running on port ${PORT}`);
});

export default app;
