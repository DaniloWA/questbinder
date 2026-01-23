import { WorkerHost } from './core/WorkerHost';
import { SystemModule } from './modules/SystemModule';
import { ImageProcessingModule } from './modules/ImageProcessingModule';
import { PathfindingModule } from './modules/PathfindingModule';

// Initialize the Worker Host
const host = new WorkerHost();

// Register Modules
host.register(SystemModule);
host.register(ImageProcessingModule);
host.register(PathfindingModule);
