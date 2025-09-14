export type CardSize = 'small' | 'medium' | 'large';

export type CardField =
  | 'name'
  | 'description'
  | 'status'
  | 'priority'
  | 'assignees'
  | 'dateCreated'
  | 'dateUpdated'
  | 'dueDate'
  | 'dateClosed'
  | 'tags'
  | 'taskId'
  | 'taskType'
  | 'progress'
  | 'location'
  | 'estimateTime'
  | 'attachments'
  | 'checklist'
  | 'comments'
  | 'mandatory'
  | 'category';

export interface FieldGroups {
  shown: CardField[];
  popular: CardField[];
  hidden: CardField[];
}
