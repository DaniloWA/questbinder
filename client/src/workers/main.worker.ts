import { WorkerHost } from './core/WorkerHost';
import { SystemModule } from './modules/SystemModule';
import { ImageProcessingModule } from './modules/ImageProcessingModule';
import { PathfindingModule } from './modules/PathfindingModule';
import { VisibilityModule } from './modules/VisibilityModule';
import { ZonesModule } from './modules/ZonesModule';

// Initialize the Worker Host
const host = new WorkerHost();

// Register Modules
host.register(SystemModule);
host.register(ImageProcessingModule);
host.register(PathfindingModule);
host.register(VisibilityModule);
host.register(ZonesModule);
