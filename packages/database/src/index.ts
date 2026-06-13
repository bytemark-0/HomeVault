import type {
  Asset,
  DocumentRecord,
  EntityId,
  MaintenanceTask,
  Property,
  RepairEvent,
  RoomArea,
  TaskCompletion,
} from '@homevault/domain';

export type HomeVaultSnapshot = {
  properties: Property[];
  rooms: RoomArea[];
  assets: Asset[];
  documents: DocumentRecord[];
  tasks: MaintenanceTask[];
  taskCompletions: TaskCompletion[];
  repairEvents: RepairEvent[];
};

export type HomeVaultRepository = {
  getProperties(): Promise<Property[]>;
  getRooms(propertyId: EntityId): Promise<RoomArea[]>;
  getAssets(propertyId: EntityId): Promise<Asset[]>;
  getDocuments(propertyId: EntityId): Promise<DocumentRecord[]>;
  getTasks(propertyId: EntityId): Promise<MaintenanceTask[]>;
  getTaskCompletions(propertyId: EntityId): Promise<TaskCompletion[]>;
  getRepairEvents(propertyId: EntityId): Promise<RepairEvent[]>;
  getDashboard(propertyId: EntityId): Promise<HomeVaultDashboard>;
  updateProperty(input: UpdatePropertyInput): Promise<Property>;
  createRoom(input: CreateRoomInput): Promise<RoomArea>;
  updateRoom(input: UpdateRoomInput): Promise<RoomArea>;
  createAsset(input: CreateAssetInput): Promise<Asset>;
  updateAsset(input: UpdateAssetInput): Promise<Asset>;
  createDocument(input: CreateDocumentInput): Promise<DocumentRecord>;
  updateDocument(input: UpdateDocumentInput): Promise<DocumentRecord>;
  deleteDocument(documentId: EntityId): Promise<void>;
  createTask(input: CreateTaskInput): Promise<MaintenanceTask>;
  updateTask(input: UpdateTaskInput): Promise<MaintenanceTask>;
  deleteTask(taskId: EntityId): Promise<void>;
  createRepairEvent(input: CreateRepairEventInput): Promise<RepairEvent>;
  deleteRepairEvent(repairEventId: EntityId): Promise<void>;
  completeTask(input: CompleteTaskInput): Promise<TaskCompletion>;
  resetDemoData?(): Promise<void>;
};

export type UpdatePropertyInput = Property;

export type CreateRoomInput = Omit<RoomArea, 'id'> & {
  id?: EntityId;
};

export type UpdateRoomInput = RoomArea;

export type CreateAssetInput = Omit<Asset, 'id'> & {
  id?: EntityId;
};

export type UpdateAssetInput = Asset;

export type CreateDocumentInput = Omit<DocumentRecord, 'id'> & {
  id?: EntityId;
};

export type UpdateDocumentInput = DocumentRecord;

export type CreateTaskInput = Omit<MaintenanceTask, 'id'> & {
  id?: EntityId;
};

export type UpdateTaskInput = MaintenanceTask;

export type CreateRepairEventInput = Omit<RepairEvent, 'id'> & {
  id?: EntityId;
};

export type CompleteTaskInput = {
  taskId: EntityId;
  completedAt?: string;
  costCents?: number;
  notes?: string;
  photoUri?: string;
};

export type HomeVaultDashboard = {
  property: Property;
  assetCount: number;
  roomCount: number;
  documentCount: number;
  activeTaskCount: number;
  dueTasks: MaintenanceTask[];
  recentAssets: Asset[];
};

export function createMemoryHomeVaultRepository(
  initialSnapshot: HomeVaultSnapshot,
): HomeVaultRepository {
  const snapshot = cloneSnapshot(initialSnapshot);

  return {
    async getProperties() {
      return [...snapshot.properties];
    },
    async getRooms(propertyId) {
      return snapshot.rooms.filter((room) => room.propertyId === propertyId);
    },
    async getAssets(propertyId) {
      return snapshot.assets.filter((asset) => asset.propertyId === propertyId);
    },
    async getDocuments(propertyId) {
      return snapshot.documents.filter((document) => document.propertyId === propertyId);
    },
    async getTasks(propertyId) {
      return snapshot.tasks.filter((task) => task.propertyId === propertyId);
    },
    async getTaskCompletions(propertyId) {
      const taskIds = new Set(
        snapshot.tasks.filter((task) => task.propertyId === propertyId).map((task) => task.id),
      );

      return snapshot.taskCompletions.filter((completion) => taskIds.has(completion.taskId));
    },
    async getRepairEvents(propertyId) {
      return snapshot.repairEvents.filter((repairEvent) => repairEvent.propertyId === propertyId);
    },
    async getDashboard(propertyId) {
      const property = snapshot.properties.find((candidate) => candidate.id === propertyId);

      if (!property) {
        throw new Error(`Property ${propertyId} was not found in the local store.`);
      }

      const rooms = snapshot.rooms.filter((room) => room.propertyId === propertyId);
      const assets = snapshot.assets.filter((asset) => asset.propertyId === propertyId);
      const documents = snapshot.documents.filter((document) => document.propertyId === propertyId);
      const tasks = snapshot.tasks.filter((task) => task.propertyId === propertyId);
      const dueTasks = tasks.filter((task) => task.state === 'overdue' || task.state === 'due_today');

      return {
        property,
        assetCount: assets.length,
        roomCount: rooms.length,
        documentCount: documents.length,
        activeTaskCount: dueTasks.length,
        dueTasks,
        recentAssets: assets.slice(0, 2),
      };
    },
    async updateProperty(input) {
      const propertyIndex = snapshot.properties.findIndex((property) => property.id === input.id);

      if (propertyIndex === -1) {
        throw new Error(`Property ${input.id} was not found in the local store.`);
      }

      snapshot.properties[propertyIndex] = { ...input };

      return { ...input };
    },
    async createRoom(input) {
      const room: RoomArea = {
        ...input,
        id: input.id ?? createEntityId('room'),
      };

      snapshot.rooms.push(room);

      return { ...room };
    },
    async updateRoom(input) {
      const roomIndex = snapshot.rooms.findIndex((room) => room.id === input.id);

      if (roomIndex === -1) {
        throw new Error(`Room ${input.id} was not found in the local store.`);
      }

      snapshot.rooms[roomIndex] = { ...input };

      return { ...input };
    },
    async createAsset(input) {
      const asset = {
        ...input,
        id: input.id ?? createEntityId('asset'),
      };

      snapshot.assets.push(asset);

      return { ...asset };
    },
    async updateAsset(input) {
      const assetIndex = snapshot.assets.findIndex((asset) => asset.id === input.id);

      if (assetIndex === -1) {
        throw new Error(`Asset ${input.id} was not found in the local store.`);
      }

      snapshot.assets[assetIndex] = { ...input };

      return { ...input };
    },
    async createDocument(input) {
      const document: DocumentRecord = {
        ...input,
        id: input.id ?? createEntityId('document'),
        linkedRecordIds: [...input.linkedRecordIds],
      };

      snapshot.documents.push(document);

      return { ...document, linkedRecordIds: [...document.linkedRecordIds] };
    },
    async updateDocument(input) {
      const documentIndex = snapshot.documents.findIndex((document) => document.id === input.id);

      if (documentIndex === -1) {
        throw new Error(`Document ${input.id} was not found in the local store.`);
      }

      snapshot.documents[documentIndex] = {
        ...input,
        linkedRecordIds: [...input.linkedRecordIds],
      };

      return { ...input, linkedRecordIds: [...input.linkedRecordIds] };
    },
    async deleteDocument(documentId) {
      const documentIndex = snapshot.documents.findIndex((document) => document.id === documentId);

      if (documentIndex === -1) {
        throw new Error(`Document ${documentId} was not found in the local store.`);
      }

      snapshot.documents.splice(documentIndex, 1);
    },
    async createTask(input) {
      const task: MaintenanceTask = {
        ...input,
        id: input.id ?? createEntityId('task'),
      };

      snapshot.tasks.push(task);

      return { ...task };
    },
    async updateTask(input) {
      const taskIndex = snapshot.tasks.findIndex((task) => task.id === input.id);

      if (taskIndex === -1) {
        throw new Error(`Task ${input.id} was not found in the local store.`);
      }

      snapshot.tasks[taskIndex] = { ...input };

      return { ...input };
    },
    async deleteTask(taskId) {
      const taskIndex = snapshot.tasks.findIndex((task) => task.id === taskId);

      if (taskIndex === -1) {
        throw new Error(`Task ${taskId} was not found in the local store.`);
      }

      snapshot.tasks.splice(taskIndex, 1);
      snapshot.taskCompletions = snapshot.taskCompletions.filter(
        (completion) => completion.taskId !== taskId,
      );
    },
    async createRepairEvent(input) {
      const repairEvent: RepairEvent = {
        ...input,
        id: input.id ?? createEntityId('repair'),
        documentIds: [...input.documentIds],
      };

      snapshot.repairEvents.push(repairEvent);

      return { ...repairEvent, documentIds: [...repairEvent.documentIds] };
    },
    async deleteRepairEvent(repairEventId) {
      const repairEventIndex = snapshot.repairEvents.findIndex(
        (repairEvent) => repairEvent.id === repairEventId,
      );

      if (repairEventIndex === -1) {
        throw new Error(`Repair event ${repairEventId} was not found in the local store.`);
      }

      snapshot.repairEvents.splice(repairEventIndex, 1);
    },
    async completeTask(input) {
      const task = snapshot.tasks.find((candidate) => candidate.id === input.taskId);

      if (!task) {
        throw new Error(`Task ${input.taskId} was not found in the local store.`);
      }

      const completion: TaskCompletion = {
        id: createEntityId('completion'),
        taskId: input.taskId,
        completedAt: input.completedAt ?? new Date().toISOString(),
        costCents: input.costCents,
        notes: input.notes,
        photoUri: input.photoUri,
      };

      snapshot.taskCompletions.push(completion);
      task.state = 'completed';

      return { ...completion };
    },
    async resetDemoData() {
      const freshSnapshot = cloneSnapshot(initialSnapshot);

      snapshot.properties = freshSnapshot.properties;
      snapshot.rooms = freshSnapshot.rooms;
      snapshot.assets = freshSnapshot.assets;
      snapshot.documents = freshSnapshot.documents;
      snapshot.tasks = freshSnapshot.tasks;
      snapshot.taskCompletions = freshSnapshot.taskCompletions;
      snapshot.repairEvents = freshSnapshot.repairEvents;
    },
  };
}

function createEntityId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneSnapshot(snapshot: HomeVaultSnapshot): HomeVaultSnapshot {
  return {
    properties: snapshot.properties.map((property) => ({ ...property })),
    rooms: snapshot.rooms.map((room) => ({ ...room })),
    assets: snapshot.assets.map((asset) => ({ ...asset })),
    documents: snapshot.documents.map((document) => ({
      ...document,
      linkedRecordIds: [...document.linkedRecordIds],
    })),
    tasks: snapshot.tasks.map((task) => ({ ...task })),
    taskCompletions: snapshot.taskCompletions.map((completion) => ({ ...completion })),
    repairEvents: snapshot.repairEvents.map((repairEvent) => ({
      ...repairEvent,
      documentIds: [...repairEvent.documentIds],
    })),
  };
}
