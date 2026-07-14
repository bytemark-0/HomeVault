import type {
  Asset,
  AccessItem,
  ContinuityPlaybook,
  DocumentRecord,
  EmergencyContact,
  EntityId,
  ImportantAccount,
  MaintenanceTask,
  PartSupply,
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
  accessItems: AccessItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  continuityPlaybooks: ContinuityPlaybook[];
  tasks: MaintenanceTask[];
  taskCompletions: TaskCompletion[];
  repairEvents: RepairEvent[];
  parts: PartSupply[];
};

export type HomeVaultRepository = {
  getProperties(): Promise<Property[]>;
  getRooms(propertyId: EntityId): Promise<RoomArea[]>;
  getAssets(propertyId: EntityId): Promise<Asset[]>;
  getDocuments(propertyId: EntityId): Promise<DocumentRecord[]>;
  getAccessItems(propertyId: EntityId): Promise<AccessItem[]>;
  getEmergencyContacts(propertyId: EntityId): Promise<EmergencyContact[]>;
  getImportantAccounts(propertyId: EntityId): Promise<ImportantAccount[]>;
  getContinuityPlaybooks(propertyId: EntityId): Promise<ContinuityPlaybook[]>;
  getTasks(propertyId: EntityId): Promise<MaintenanceTask[]>;
  getTaskCompletions(propertyId: EntityId): Promise<TaskCompletion[]>;
  getRepairEvents(propertyId: EntityId): Promise<RepairEvent[]>;
  getDashboard(propertyId: EntityId): Promise<HomeVaultDashboard>;
  createProperty(input: CreatePropertyInput): Promise<Property>;
  updateProperty(input: UpdatePropertyInput): Promise<Property>;
  createRoom(input: CreateRoomInput): Promise<RoomArea>;
  updateRoom(input: UpdateRoomInput): Promise<RoomArea>;
  deleteRoom(roomId: EntityId): Promise<void>;
  createAsset(input: CreateAssetInput): Promise<Asset>;
  updateAsset(input: UpdateAssetInput): Promise<Asset>;
  deleteAsset(assetId: EntityId): Promise<void>;
  createDocument(input: CreateDocumentInput): Promise<DocumentRecord>;
  updateDocument(input: UpdateDocumentInput): Promise<DocumentRecord>;
  deleteDocument(documentId: EntityId): Promise<void>;
  createAccessItem(input: CreateAccessItemInput): Promise<AccessItem>;
  updateAccessItem(input: UpdateAccessItemInput): Promise<AccessItem>;
  deleteAccessItem(accessItemId: EntityId): Promise<void>;
  createEmergencyContact(input: CreateEmergencyContactInput): Promise<EmergencyContact>;
  updateEmergencyContact(input: UpdateEmergencyContactInput): Promise<EmergencyContact>;
  deleteEmergencyContact(contactId: EntityId): Promise<void>;
  createImportantAccount(input: CreateImportantAccountInput): Promise<ImportantAccount>;
  updateImportantAccount(input: UpdateImportantAccountInput): Promise<ImportantAccount>;
  deleteImportantAccount(accountId: EntityId): Promise<void>;
  createContinuityPlaybook(input: CreateContinuityPlaybookInput): Promise<ContinuityPlaybook>;
  updateContinuityPlaybook(input: UpdateContinuityPlaybookInput): Promise<ContinuityPlaybook>;
  deleteContinuityPlaybook(playbookId: EntityId): Promise<void>;
  createTask(input: CreateTaskInput): Promise<MaintenanceTask>;
  updateTask(input: UpdateTaskInput): Promise<MaintenanceTask>;
  deleteTask(taskId: EntityId): Promise<void>;
  createRepairEvent(input: CreateRepairEventInput): Promise<RepairEvent>;
  updateRepairEvent(input: UpdateRepairEventInput): Promise<RepairEvent>;
  deleteRepairEvent(repairEventId: EntityId): Promise<void>;
  completeTask(input: CompleteTaskInput): Promise<TaskCompletion>;
  updateTaskCompletion(input: UpdateTaskCompletionInput): Promise<TaskCompletion>;
  deleteTaskCompletion(completionId: EntityId): Promise<void>;
  getParts(propertyId: EntityId): Promise<PartSupply[]>;
  createPart(input: CreatePartInput): Promise<PartSupply>;
  updatePart(input: UpdatePartInput): Promise<PartSupply>;
  deletePart(partId: EntityId): Promise<void>;
  resetDemoData?(): Promise<void>;
  clearAllData?(): Promise<void>;
  restoreSnapshot?(snapshot: HomeVaultSnapshot): Promise<void>;
};

export type CreatePropertyInput = Omit<Property, 'id' | 'householdId'> & { id?: EntityId };
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

export type CreateAccessItemInput = Omit<AccessItem, 'id'> & {
  id?: EntityId;
};

export type UpdateAccessItemInput = AccessItem;

export type CreateEmergencyContactInput = Omit<EmergencyContact, 'id'> & {
  id?: EntityId;
};

export type UpdateEmergencyContactInput = EmergencyContact;

export type CreateImportantAccountInput = Omit<ImportantAccount, 'id'> & {
  id?: EntityId;
};

export type UpdateImportantAccountInput = ImportantAccount;

export type CreateContinuityPlaybookInput = Omit<ContinuityPlaybook, 'id'> & {
  id?: EntityId;
};

export type UpdateContinuityPlaybookInput = ContinuityPlaybook;

export type CreateTaskInput = Omit<MaintenanceTask, 'id'> & {
  id?: EntityId;
};

export type UpdateTaskInput = MaintenanceTask;

export type CreateRepairEventInput = Omit<RepairEvent, 'id'> & {
  id?: EntityId;
};

export type UpdateRepairEventInput = RepairEvent;

export type UpdateTaskCompletionInput = TaskCompletion;

export type CreatePartInput = Omit<PartSupply, 'id'> & { id?: EntityId };
export type UpdatePartInput = PartSupply;

export type CompleteTaskInput = {
  taskId: EntityId;
  completedAt?: string;
  costCents?: number;
  notes?: string;
  photoUri?: string;
  kind?: 'completed' | 'skipped';
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
    async getAccessItems(propertyId) {
      return snapshot.accessItems
        .filter((accessItem) => accessItem.propertyId === propertyId)
        .map((accessItem) => cloneAccessItem(accessItem));
    },
    async getEmergencyContacts(propertyId) {
      return snapshot.emergencyContacts
        .filter((contact) => contact.propertyId === propertyId)
        .map((contact) => ({ ...contact }));
    },
    async getImportantAccounts(propertyId) {
      return snapshot.importantAccounts
        .filter((account) => account.propertyId === propertyId)
        .map((account) => cloneImportantAccount(account));
    },
    async getContinuityPlaybooks(propertyId) {
      return snapshot.continuityPlaybooks
        .filter((playbook) => playbook.propertyId === propertyId)
        .map((playbook) => cloneContinuityPlaybook(playbook));
    },
    async getTasks(propertyId) {
      const today = new Date().toISOString().slice(0, 10);

      return snapshot.tasks
        .filter((task) => task.propertyId === propertyId)
        .map((task) => {
          if (task.state !== 'snoozed' || !task.dueDate || task.dueDate > today) {
            return task;
          }

          const state = task.dueDate < today ? 'overdue' : 'due_today';

          return { ...task, state };
        });
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
    async createProperty(input) {
      const property: Property = {
        ...input,
        id: input.id ?? createEntityId('property'),
        householdId: createEntityId('household'),
      };
      snapshot.properties.push(property);
      return { ...property };
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
    async deleteRoom(roomId) {
      const roomIndex = snapshot.rooms.findIndex((room) => room.id === roomId);

      if (roomIndex === -1) {
        throw new Error(`Room ${roomId} was not found in the local store.`);
      }

      snapshot.rooms.splice(roomIndex, 1);

      const assetIds = new Set(
        snapshot.assets.filter((asset) => asset.roomId === roomId).map((asset) => asset.id),
      );

      const deletedTaskIds = new Set(
        snapshot.tasks
          .filter(
            (task) =>
              (task.scope === 'asset' && assetIds.has(task.scopeId)) ||
              (task.scope === 'room' && task.scopeId === roomId),
          )
          .map((task) => task.id),
      );

      snapshot.tasks = snapshot.tasks.filter((task) => !deletedTaskIds.has(task.id));
      snapshot.taskCompletions = snapshot.taskCompletions.filter(
        (c) => !deletedTaskIds.has(c.taskId),
      );
      snapshot.repairEvents = snapshot.repairEvents.filter((r) => !assetIds.has(r.assetId));
      snapshot.parts = snapshot.parts.filter((p) => p.assetId == null || !assetIds.has(p.assetId));
      snapshot.accessItems = snapshot.accessItems.map((accessItem) =>
        accessItem.linkedAssetId && assetIds.has(accessItem.linkedAssetId)
          ? { ...accessItem, linkedAssetId: undefined }
          : accessItem,
      );
      snapshot.assets = snapshot.assets.filter((asset) => asset.roomId !== roomId);
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
    async deleteAsset(assetId) {
      const assetIndex = snapshot.assets.findIndex((asset) => asset.id === assetId);

      if (assetIndex === -1) {
        throw new Error(`Asset ${assetId} was not found in the local store.`);
      }

      snapshot.assets.splice(assetIndex, 1);

      const deletedTaskIds = new Set(
        snapshot.tasks
          .filter((task) => task.scope === 'asset' && task.scopeId === assetId)
          .map((task) => task.id),
      );
      snapshot.tasks = snapshot.tasks.filter((task) => !deletedTaskIds.has(task.id));
      snapshot.taskCompletions = snapshot.taskCompletions.filter(
        (c) => !deletedTaskIds.has(c.taskId),
      );
      snapshot.repairEvents = snapshot.repairEvents.filter((r) => r.assetId !== assetId);
      snapshot.parts = snapshot.parts.filter((p) => p.assetId !== assetId);
      snapshot.accessItems = snapshot.accessItems.map((accessItem) =>
        accessItem.linkedAssetId === assetId
          ? { ...accessItem, linkedAssetId: undefined }
          : accessItem,
      );
    },
    async createDocument(input) {
      const document: DocumentRecord = {
        ...input,
        id: input.id ?? createEntityId('document'),
        attachment: input.attachment ? { ...input.attachment } : undefined,
        linkedRecordIds: [...input.linkedRecordIds],
      };

      snapshot.documents.push(document);

      return cloneDocument(document);
    },
    async updateDocument(input) {
      const documentIndex = snapshot.documents.findIndex((document) => document.id === input.id);

      if (documentIndex === -1) {
        throw new Error(`Document ${input.id} was not found in the local store.`);
      }

      snapshot.documents[documentIndex] = {
        ...input,
        attachment: input.attachment ? { ...input.attachment } : undefined,
        linkedRecordIds: [...input.linkedRecordIds],
      };

      return cloneDocument(input);
    },
    async deleteDocument(documentId) {
      const documentIndex = snapshot.documents.findIndex((document) => document.id === documentId);

      if (documentIndex === -1) {
        throw new Error(`Document ${documentId} was not found in the local store.`);
      }

      snapshot.documents.splice(documentIndex, 1);
    },
    async createAccessItem(input) {
      const accessItem: AccessItem = {
        ...input,
        id: input.id ?? createEntityId('access'),
        linkedDocumentIds: [...input.linkedDocumentIds],
      };

      snapshot.accessItems.push(accessItem);

      return cloneAccessItem(accessItem);
    },
    async updateAccessItem(input) {
      const accessItemIndex = snapshot.accessItems.findIndex(
        (accessItem) => accessItem.id === input.id,
      );

      if (accessItemIndex === -1) {
        throw new Error(`Access item ${input.id} was not found in the local store.`);
      }

      snapshot.accessItems[accessItemIndex] = {
        ...input,
        linkedDocumentIds: [...input.linkedDocumentIds],
      };

      return cloneAccessItem(input);
    },
    async deleteAccessItem(accessItemId) {
      const accessItemIndex = snapshot.accessItems.findIndex(
        (accessItem) => accessItem.id === accessItemId,
      );

      if (accessItemIndex === -1) {
        throw new Error(`Access item ${accessItemId} was not found in the local store.`);
      }

      snapshot.accessItems.splice(accessItemIndex, 1);
    },
    async createEmergencyContact(input) {
      const contact: EmergencyContact = {
        ...input,
        id: input.id ?? createEntityId('contact'),
      };

      snapshot.emergencyContacts.push(contact);

      return { ...contact };
    },
    async updateEmergencyContact(input) {
      const contactIndex = snapshot.emergencyContacts.findIndex((contact) => contact.id === input.id);

      if (contactIndex === -1) {
        throw new Error(`Emergency contact ${input.id} was not found in the local store.`);
      }

      snapshot.emergencyContacts[contactIndex] = { ...input };

      return { ...input };
    },
    async deleteEmergencyContact(contactId) {
      const contactIndex = snapshot.emergencyContacts.findIndex((contact) => contact.id === contactId);

      if (contactIndex === -1) {
        throw new Error(`Emergency contact ${contactId} was not found in the local store.`);
      }

      snapshot.emergencyContacts.splice(contactIndex, 1);
    },
    async createImportantAccount(input) {
      const account: ImportantAccount = {
        ...input,
        id: input.id ?? createEntityId('account'),
        linkedDocumentIds: [...input.linkedDocumentIds],
      };

      snapshot.importantAccounts.push(account);

      return cloneImportantAccount(account);
    },
    async updateImportantAccount(input) {
      const accountIndex = snapshot.importantAccounts.findIndex((account) => account.id === input.id);

      if (accountIndex === -1) {
        throw new Error(`Important account ${input.id} was not found in the local store.`);
      }

      snapshot.importantAccounts[accountIndex] = {
        ...input,
        linkedDocumentIds: [...input.linkedDocumentIds],
      };

      return cloneImportantAccount(input);
    },
    async deleteImportantAccount(accountId) {
      const accountIndex = snapshot.importantAccounts.findIndex((account) => account.id === accountId);

      if (accountIndex === -1) {
        throw new Error(`Important account ${accountId} was not found in the local store.`);
      }

      snapshot.importantAccounts.splice(accountIndex, 1);
    },
    async createContinuityPlaybook(input) {
      const playbook: ContinuityPlaybook = {
        ...input,
        id: input.id ?? createEntityId('playbook'),
        steps: input.steps.map((step) => ({ ...step })),
        linkedRecordIds: [...input.linkedRecordIds],
      };

      snapshot.continuityPlaybooks.push(playbook);

      return cloneContinuityPlaybook(playbook);
    },
    async updateContinuityPlaybook(input) {
      const playbookIndex = snapshot.continuityPlaybooks.findIndex(
        (playbook) => playbook.id === input.id,
      );

      if (playbookIndex === -1) {
        throw new Error(`Continuity playbook ${input.id} was not found in the local store.`);
      }

      snapshot.continuityPlaybooks[playbookIndex] = {
        ...input,
        steps: input.steps.map((step) => ({ ...step })),
        linkedRecordIds: [...input.linkedRecordIds],
      };

      return cloneContinuityPlaybook(input);
    },
    async deleteContinuityPlaybook(playbookId) {
      const playbookIndex = snapshot.continuityPlaybooks.findIndex(
        (playbook) => playbook.id === playbookId,
      );

      if (playbookIndex === -1) {
        throw new Error(`Continuity playbook ${playbookId} was not found in the local store.`);
      }

      snapshot.continuityPlaybooks.splice(playbookIndex, 1);
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
    async updateRepairEvent(input) {
      const index = snapshot.repairEvents.findIndex((r) => r.id === input.id);

      if (index === -1) {
        throw new Error(`Repair event ${input.id} was not found in the local store.`);
      }

      const updated: RepairEvent = { ...input, documentIds: [...input.documentIds] };
      snapshot.repairEvents[index] = updated;

      return { ...updated, documentIds: [...updated.documentIds] };
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
        kind: input.kind,
      };

      snapshot.taskCompletions.push(completion);
      if (input.kind !== 'skipped') {
        task.state = 'completed';
      }

      return { ...completion };
    },
    async updateTaskCompletion(input) {
      const index = snapshot.taskCompletions.findIndex((c) => c.id === input.id);

      if (index === -1) {
        throw new Error(`Task completion ${input.id} was not found in the local store.`);
      }

      snapshot.taskCompletions[index] = { ...input };

      return { ...input };
    },
    async deleteTaskCompletion(completionId) {
      const index = snapshot.taskCompletions.findIndex((c) => c.id === completionId);

      if (index === -1) {
        throw new Error(`Task completion ${completionId} was not found in the local store.`);
      }

      snapshot.taskCompletions.splice(index, 1);
    },
    async getParts(propertyId) {
      return snapshot.parts.filter((p) => p.propertyId === propertyId);
    },
    async createPart(input) {
      const part: PartSupply = { ...input, id: input.id ?? createEntityId('part') };
      snapshot.parts.push(part);
      return part;
    },
    async updatePart(input) {
      const index = snapshot.parts.findIndex((p) => p.id === input.id);
      if (index === -1) throw new Error(`Part ${input.id} was not found in the local store.`);
      snapshot.parts[index] = { ...input };
      return snapshot.parts[index]!;
    },
    async deletePart(partId) {
      const index = snapshot.parts.findIndex((p) => p.id === partId);
      if (index === -1) throw new Error(`Part ${partId} was not found in the local store.`);
      snapshot.parts.splice(index, 1);
    },
    async resetDemoData() {
      const freshSnapshot = cloneSnapshot(initialSnapshot);

      snapshot.properties = freshSnapshot.properties;
      snapshot.rooms = freshSnapshot.rooms;
      snapshot.assets = freshSnapshot.assets;
      snapshot.documents = freshSnapshot.documents;
      snapshot.accessItems = freshSnapshot.accessItems;
      snapshot.emergencyContacts = freshSnapshot.emergencyContacts;
      snapshot.importantAccounts = freshSnapshot.importantAccounts;
      snapshot.continuityPlaybooks = freshSnapshot.continuityPlaybooks;
      snapshot.tasks = freshSnapshot.tasks;
      snapshot.taskCompletions = freshSnapshot.taskCompletions;
      snapshot.repairEvents = freshSnapshot.repairEvents;
      snapshot.parts = freshSnapshot.parts;
    },
    async clearAllData() {
      snapshot.properties = [];
      snapshot.rooms = [];
      snapshot.assets = [];
      snapshot.documents = [];
      snapshot.accessItems = [];
      snapshot.emergencyContacts = [];
      snapshot.importantAccounts = [];
      snapshot.continuityPlaybooks = [];
      snapshot.tasks = [];
      snapshot.taskCompletions = [];
      snapshot.repairEvents = [];
      snapshot.parts = [];
    },
    async restoreSnapshot(nextSnapshot) {
      const freshSnapshot = cloneSnapshot(nextSnapshot);

      snapshot.properties = freshSnapshot.properties;
      snapshot.rooms = freshSnapshot.rooms;
      snapshot.assets = freshSnapshot.assets;
      snapshot.documents = freshSnapshot.documents;
      snapshot.accessItems = freshSnapshot.accessItems;
      snapshot.emergencyContacts = freshSnapshot.emergencyContacts;
      snapshot.importantAccounts = freshSnapshot.importantAccounts;
      snapshot.continuityPlaybooks = freshSnapshot.continuityPlaybooks;
      snapshot.tasks = freshSnapshot.tasks;
      snapshot.taskCompletions = freshSnapshot.taskCompletions;
      snapshot.repairEvents = freshSnapshot.repairEvents;
      snapshot.parts = freshSnapshot.parts;
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
      attachment: document.attachment ? { ...document.attachment } : undefined,
      linkedRecordIds: [...document.linkedRecordIds],
    })),
    accessItems: snapshot.accessItems.map((accessItem) => cloneAccessItem(accessItem)),
    emergencyContacts: snapshot.emergencyContacts.map((contact) => ({ ...contact })),
    importantAccounts: snapshot.importantAccounts.map((account) => cloneImportantAccount(account)),
    continuityPlaybooks: snapshot.continuityPlaybooks.map((playbook) =>
      cloneContinuityPlaybook(playbook),
    ),
    tasks: snapshot.tasks.map((task) => ({ ...task })),
    taskCompletions: snapshot.taskCompletions.map((completion) => ({ ...completion })),
    repairEvents: snapshot.repairEvents.map((repairEvent) => ({
      ...repairEvent,
      documentIds: [...repairEvent.documentIds],
    })),
    parts: (snapshot.parts ?? []).map((part) => ({ ...part })),
  };
}

function cloneDocument(document: DocumentRecord): DocumentRecord {
  return {
    ...document,
    attachment: document.attachment ? { ...document.attachment } : undefined,
    linkedRecordIds: [...document.linkedRecordIds],
  };
}

function cloneAccessItem(accessItem: AccessItem): AccessItem {
  return {
    ...accessItem,
    linkedDocumentIds: [...accessItem.linkedDocumentIds],
  };
}

function cloneImportantAccount(account: ImportantAccount): ImportantAccount {
  return {
    ...account,
    linkedDocumentIds: [...account.linkedDocumentIds],
  };
}

function cloneContinuityPlaybook(playbook: ContinuityPlaybook): ContinuityPlaybook {
  return {
    ...playbook,
    steps: playbook.steps.map((step) => ({ ...step })),
    linkedRecordIds: [...playbook.linkedRecordIds],
  };
}
