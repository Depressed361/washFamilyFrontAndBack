// app/models/washOrder.ts

// Représentation côté client de la commande de lavage, alignée sur washOrder.model.js

export type WashOrderStatus = 
    
   'pending'                // commande créée
  | 'accepted'             // acceptée par le laveur
  | 'refused_by_washer'     // refusée par le laveur
  | 'paid'                 // payée par le client
  | 'pickup_in_progress'   // une des deux parties est en route
  | 'awaiting_pickup_confirm' // attente confirmation de remise
  | 'picked_up'            // linge reçu
  | 'receipt_and_treatment'              // reçu et en traitement
  | 'completed'            // terminé, le laveur a rendu le linge
  | 'canceled'             // annulée
  | 'cancedled_by_client'  // annulée par le client (corrige la faute si besoin)
  | 'canceled_by_washer'   // annulée par le laveur
  | 'canceled_by_admin'    // annulée par l'administrateur
  | 'canceled_by_system';  // annulée par le systèmennulée par le système (par exemple, si le laveur ne répond pas dans un délai raisonnable)

export class WashOrder {
  id: string;
  userId: string;
  washerId: string;
  status: WashOrderStatus;
  price: number;
  
  washingType: 'soie' | 'blanc' | 'cachemire' | 'synthetique' | 'mixte' | 'coton';
  washingRecommendation:
    | 'lavage à la main'
    | 'lavage machine'
    | 'nettoyage à sec'
    | 'lavage machine basse température';
  dryingType: 'air' | 'machine' | 'mixte';
  dryingRecommendation:
    | 'séchage à l’air libre'
    | 'séchage en machine'
    | 'séchage à l’air libre et en machine';
  ironing: boolean;
  deplacementClient: boolean;
  addressPickup?: string;
  recommendation?: string;
  dateStart: Date;
  dateEnd: Date;
  createdAt: Date;
  updatedAt: Date;
  isLate: boolean;
  orderNumber?: string; // Numéro de commande pour le suivi

  User?: {
    id: string;
    profilePicture?: string | null;
    email: string;
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
  };

  Washer?: {
    id: string;
    profilePicture?: string | null;
    email: string;
    firstName?: string;
    lastName?: string;
  };


  constructor(data: Partial<WashOrder>) {
    this.id = data.id ?? '';
    this.userId = data.userId ?? '';
    this.washerId = data.washerId ?? '';
    this.status = data.status ?? 'pending';
    this.price = data.price ?? 0;

    this.washingType = data.washingType ?? 'mixte';
    this.washingRecommendation =
      data.washingRecommendation ?? 'lavage machine';
    this.dryingType = data.dryingType ?? 'air';
    this.dryingRecommendation =
      data.dryingRecommendation ?? 'séchage à l’air libre';
    this.ironing = data.ironing ?? false;

    this.deplacementClient = data.deplacementClient ?? false;
    this.addressPickup = data.addressPickup;
    this.recommendation = data.recommendation;
    this.orderNumber = data.orderNumber;

    // Dates
    this.dateStart = data.dateStart ? new Date(data.dateStart) : new Date();
    this.dateEnd = data.dateEnd ? new Date(data.dateEnd) : new Date();
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

    // Late
    this.isLate = data.isLate ?? (this.dateEnd < new Date() && this.status !== 'completed');

    // User
    this.User = data.User ?? {
      id: '',
      email: '',
      phoneNumber: undefined,
      firstName: undefined,
      lastName: undefined,
    };

    // Washer
    this.Washer = data.Washer ?? {
      id: '',
      email: '',
      firstName: undefined,
      lastName: undefined,
      profilePicture: null,
    };
  }

  get displayStatus(): string {
    switch (this.status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Accepté';

      case 'refused_by_washer':
        return 'Refusé par le laveur';

      case 'paid':
        return 'Payé';
      
      case 'pickup_in_progress':
        return 'Ramassage en cours';
        
        case 'awaiting_pickup_confirm':
        return 'En attente de confirmation de ramassage';
      case 'receipt_and_treatment':
        return 'Reçu';
      case 'completed':
        return 'Terminé';
      case 'canceled':
        return 'Annulé';
      default:
        return this.status;
    }
  }

  /**
   * Statuts simplifiés pour l'affichage
   */
  get isAccepted(): boolean {
    return this.status === 'accepted';
  }
  get isRefused(): boolean {
    return this.status === 'refused_by_washer';
  }

  get isPending(): boolean {
    return this.status === 'pending';
  }

  get isPaid(): boolean {
    return this.status === 'paid';
  }
  get isInProgress(): boolean {
    return this.status === 'pickup_in_progress' ;
  }
  get isAwaitingPickupConfirm(): boolean {
    return this.status === 'awaiting_pickup_confirm';
  }

  get isUpcoming(): boolean {
    return this.status === 'accepted' || this.status === 'paid';
  }

  get isPast(): boolean {
    return this.status === 'completed';
  }

  /**
   * Formattage lisible des dates
   */
  formatDateStart(locale = 'fr-FR'): string {
    return this.dateStart
      ? this.dateStart.toLocaleDateString(locale, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Date inconnue';
  }
    
  formatDateEnd(locale = 'fr-FR'): string {
    return this.dateEnd
      ? this.dateEnd.toLocaleDateString(locale, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Date inconnue';
  }

  /**
   * Affiche le prix avec le symbole €
   */
  get formattedPrice(): string {
    return `${this.price.toFixed(2)} €`;
  }
}

