export class User {
  
    id: string;
    email: string;
    password: string;
    username: string;
    name: string;
    lastname: string;
    phone: string;
    role: string;
    phoneNumber: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    profilePicture?: string;
    bornDate?: Date;
    sexe: string;
    washer: boolean; // Indique si l'utilisateur est un laveur

  
    constructor(
     
      id: string,
      email: string,
      password: string,
      username: string,
      name: string,
      lastname: string,
      phone: string,
      role: string,
      phoneNumber: string,
      address: string,
      city: string,
      zip: string,
      country: string,
      profilePicture?: string,
      bornDate?: Date,
      sexe: string = 'non renseigné', // Valeur par défaut pour sexe
      washer: boolean = false // Indique si l'utilisateur est un laveur
    ) {
      
      this.id = id;
      this.email = email;
      this.username = username;
      this.password = password;
      this.name = name;
      this.lastname = lastname;
      this.phone = phone;
      this.role = role;
      this.phoneNumber = phoneNumber;
      this.address = address;
      this.city = city;
      this.zip = zip;
      this.profilePicture = profilePicture;
      this.bornDate = bornDate;
      this.sexe = sexe;
      this.country = country;
      this.washer = washer; // Indique si l'utilisateur est un laveur
    }
  }