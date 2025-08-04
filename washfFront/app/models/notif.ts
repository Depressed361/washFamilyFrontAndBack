export class Notifications {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  actions: any[] = [];
  read: boolean = false;
  data?: any; // <-- Ajoute cette ligne

  constructor(
    id: string,
    title: string,
    body: string,
    createdAt: string,
    actions?: any[],
    read?: boolean,
    data?: any // <-- Ajoute ce paramètre
  ) {
    this.id = id;
    this.title = title;
    this.body = body;
    this.createdAt = createdAt;
    this.actions = actions || [];
    this.read = read || false;
    this.data = data; // <-- Ajoute cette affectation
  }
}